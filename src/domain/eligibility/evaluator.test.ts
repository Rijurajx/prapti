import { describe, it, expect } from 'vitest';
import {
  evaluateComparison,
  evaluateRuleNode,
  evaluateScheme,
} from './evaluator';
import { calculateAge, normalizeToAcres, compileCitizenFacts } from './facts';
import { evaluateDocumentReadiness } from './readiness';
import type { SchemeRuleWithSource } from './types';

describe('Facts Compiler & Utilities', () => {
  it('accurately calculates age from date of birth', () => {
    const ref = new Date('2026-11-22T00:00:00Z');
    expect(calculateAge('2000-01-01', ref)).toBe(26);
    expect(calculateAge('2000-11-23', ref)).toBe(25); // birthday tomorrow
    expect(calculateAge('2000-11-22', ref)).toBe(26); // birthday today
    expect(calculateAge('invalid-date', ref)).toBeNull();
  });

  it('normalizes agricultural land units to acres', () => {
    expect(normalizeToAcres(5, 'acre')).toBe(5);
    expect(normalizeToAcres(2, 'hectare')).toBeCloseTo(4.94, 1);
    expect(normalizeToAcres(6.05, 'bigha')).toBeCloseTo(2.0, 1);
  });

  it('compiles full citizen facts from raw inputs', () => {
    const compiled = compileCitizenFacts({
      personal: {
        dateOfBirth: '2004-05-10',
        gender: 'female',
        maritalStatus: 'never_married',
      },
      addresses: [
        {
          kind: 'current',
          state: 'West Bengal',
          district: 'Nadia',
          areaType: 'rural',
          pinCode: '741235',
          domicileConfirmed: true,
        },
      ],
      financial: {
        family_annual_income_inr: 120000,
      },
      employment: {
        employment_status: 'student',
      },
      education: [
        {
          level: 'class_10',
          is_pursuing: false,
          percentage: 82,
        },
        {
          level: 'class_12',
          is_pursuing: false,
          percentage: 85,
          stream: 'science',
        },
      ],
      documents: [
        { document_code: 'bank_passbook', status: 'available' },
        { document_code: 'aadhaar_card', status: 'available' },
      ],
    });

    expect(compiled.gender).toBe('female');
    expect(compiled.marital_status).toBe('never_married');
    expect(compiled.state).toBe('West Bengal');
    expect(compiled.district).toBe('Nadia');
    expect(compiled.family_annual_income_inr).toBe(120000);
    expect(compiled.is_student).toBe(true);
    expect(compiled.has_passed_class_12).toBe(true);
    expect(compiled.class_12_percentage).toBe(85);
    expect(compiled.has_bank_account).toBe(true);
  });
});

describe('Deterministic Rule Evaluator — Operators', () => {
  it('evaluates comparison operators correctly', () => {
    const facts = {
      age: 22,
      state: 'West Bengal',
      score: 75.5,
      isEnrolled: true,
      roles: ['student', 'researcher'],
    };

    // eq
    expect(evaluateComparison({ field: 'state', op: 'eq', value: 'West Bengal' }, facts, 'r').result).toBe('PASS');
    expect(evaluateComparison({ field: 'state', op: 'eq', value: 'Odisha' }, facts, 'r').result).toBe('FAIL');

    // lt, lte, gt, gte
    expect(evaluateComparison({ field: 'age', op: 'lt', value: 25 }, facts, 'r').result).toBe('PASS');
    expect(evaluateComparison({ field: 'age', op: 'gt', value: 25 }, facts, 'r').result).toBe('FAIL');
    expect(evaluateComparison({ field: 'score', op: 'gte', value: 75.5 }, facts, 'r').result).toBe('PASS');

    // in, not_in
    expect(evaluateComparison({ field: 'state', op: 'in', value: ['West Bengal', 'Bihar'] }, facts, 'r').result).toBe('PASS');
    expect(evaluateComparison({ field: 'state', op: 'not_in', value: ['Bihar', 'Jharkhand'] }, facts, 'r').result).toBe('PASS');

    // is_true, is_false
    expect(evaluateComparison({ field: 'isEnrolled', op: 'is_true' }, facts, 'r').result).toBe('PASS');
    expect(evaluateComparison({ field: 'isEnrolled', op: 'is_false' }, facts, 'r').result).toBe('FAIL');

    // contains
    expect(evaluateComparison({ field: 'roles', op: 'contains', value: 'student' } as any, facts, 'r').result).toBe('PASS');

    // exists
    expect(evaluateComparison({ field: 'age', op: 'exists' } as any, facts, 'r').result).toBe('PASS');
    expect(evaluateComparison({ field: 'non_existent', op: 'exists' } as any, facts, 'r').result).toBe('FAIL');
  });

  it('evaluates missing facts as UNKNOWN and never as PASS', () => {
    const facts = { state: 'West Bengal' }; // age is missing

    const result = evaluateComparison({ field: 'age', op: 'gte', value: 18 }, facts, 'r');
    expect(result.result).toBe('UNKNOWN');
    expect(result.missingFields).toContain('age');
  });
});

describe('Kleene 3-Valued Logic (Composite Nodes)', () => {
  const passNode = { field: 'state', op: 'eq' as const, value: 'West Bengal' };
  const failNode = { field: 'state', op: 'eq' as const, value: 'Karnataka' };
  const unknownNode = { field: 'missing_field', op: 'eq' as const, value: 'anything' };

  const facts = { state: 'West Bengal' };

  describe('ALL (Kleene AND)', () => {
    it('PASS + PASS = PASS', () => {
      const res = evaluateRuleNode({ all: [passNode, passNode] }, facts);
      expect(res.result).toBe('PASS');
    });

    it('PASS + FAIL = FAIL', () => {
      const res = evaluateRuleNode({ all: [passNode, failNode] }, facts);
      expect(res.result).toBe('FAIL');
    });

    it('PASS + UNKNOWN = UNKNOWN', () => {
      const res = evaluateRuleNode({ all: [passNode, unknownNode] }, facts);
      expect(res.result).toBe('UNKNOWN');
      expect(res.missingFields).toContain('missing_field');
    });

    it('FAIL + UNKNOWN = FAIL', () => {
      // In Kleene logic, false AND unknown is false
      const res = evaluateRuleNode({ all: [failNode, unknownNode] }, facts);
      expect(res.result).toBe('FAIL');
    });
  });

  describe('ANY (Kleene OR)', () => {
    it('PASS + FAIL = PASS', () => {
      const res = evaluateRuleNode({ any: [passNode, failNode] }, facts);
      expect(res.result).toBe('PASS');
    });

    it('FAIL + FAIL = FAIL', () => {
      const res = evaluateRuleNode({ any: [failNode, failNode] }, facts);
      expect(res.result).toBe('FAIL');
    });

    it('FAIL + UNKNOWN = UNKNOWN', () => {
      const res = evaluateRuleNode({ any: [failNode, unknownNode] }, facts);
      expect(res.result).toBe('UNKNOWN');
    });

    it('PASS + UNKNOWN = PASS', () => {
      // In Kleene logic, true OR unknown is true
      const res = evaluateRuleNode({ any: [passNode, unknownNode] }, facts);
      expect(res.result).toBe('PASS');
    });
  });

  describe('NOT (Kleene NOT)', () => {
    it('NOT PASS = FAIL', () => {
      expect(evaluateRuleNode({ not: passNode }, facts).result).toBe('FAIL');
    });

    it('NOT FAIL = PASS', () => {
      expect(evaluateRuleNode({ not: failNode }, facts).result).toBe('PASS');
    });

    it('NOT UNKNOWN = UNKNOWN', () => {
      expect(evaluateRuleNode({ not: unknownNode }, facts).result).toBe('UNKNOWN');
    });
  });
});

describe('Scheme Assessment Outcome Calculation', () => {
  const dummyRules: SchemeRuleWithSource[] = [
    {
      id: 'rule-1',
      ruleKind: 'eligibility',
      clauseReference: 'Section 4(1)',
      sourceId: 'src-1',
      ruleJson: {
        all: [
          { field: 'state', op: 'eq', value: 'West Bengal' },
          { field: 'age', op: 'gte', value: 18 },
        ],
      },
    },
    {
      id: 'rule-2',
      ruleKind: 'exclusion',
      clauseReference: 'Section 4(3) Exclusions',
      sourceId: 'src-1',
      ruleJson: {
        field: 'is_government_employee',
        op: 'is_true',
      },
    },
  ];

  it('returns likely_eligible when all criteria are satisfied', () => {
    const facts = {
      state: 'West Bengal',
      age: 20,
      is_government_employee: false,
    };
    const outcome = evaluateScheme(dummyRules, facts);
    expect(outcome.outcome).toBe('likely_eligible');
    expect(outcome.passedRuleCount).toBeGreaterThan(0);
  });

  it('returns needs_more_info when mandatory fields are missing', () => {
    const facts = {
      state: 'West Bengal',
      // age is missing
    };
    const outcome = evaluateScheme(dummyRules, facts);
    expect(outcome.outcome).toBe('needs_more_info');
    expect(outcome.missingFields).toContain('age');
  });

  it('returns likely_ineligible when criteria fails or exclusion passes', () => {
    // 1. Age criteria failed
    const underAgeFacts = {
      state: 'West Bengal',
      age: 16,
      is_government_employee: false,
    };
    expect(evaluateScheme(dummyRules, underAgeFacts).outcome).toBe('likely_ineligible');

    // 2. Exclusion met
    const govtEmployeeFacts = {
      state: 'West Bengal',
      age: 25,
      is_government_employee: true,
    };
    expect(evaluateScheme(dummyRules, govtEmployeeFacts).outcome).toBe('likely_ineligible');
  });
});

describe('Document Readiness Engine', () => {
  it('correctly categorizes document availability', () => {
    const requirements = [
      {
        id: 'req-1',
        documentTypeId: 'dt-1',
        documentCode: 'aadhaar_card',
        documentName: 'Aadhaar Card',
        category: 'identity',
        isMandatory: true,
      },
      {
        id: 'req-2',
        documentTypeId: 'dt-2',
        documentCode: 'income_certificate',
        documentName: 'Income Certificate',
        category: 'financial',
        isMandatory: true,
      },
      {
        id: 'req-3',
        documentTypeId: 'dt-3',
        documentCode: 'domicile_certificate',
        documentName: 'Domicile Certificate',
        category: 'general',
        isMandatory: false,
      },
    ];

    const inventory = [
      { documentTypeId: 'dt-1', documentCode: 'aadhaar_card', status: 'available' as const },
      { documentTypeId: 'dt-2', documentCode: 'income_certificate', status: 'applied_for' as const },
    ];

    const readiness = evaluateDocumentReadiness(requirements, inventory);
    expect(readiness.isFullyReady).toBe(false);
    expect(readiness.mandatoryTotal).toBe(2);
    expect(readiness.mandatoryReady).toBe(1);
    expect(readiness.inProgressDocuments.length).toBe(1);
    expect(readiness.inProgressDocuments[0]?.requirement.documentCode).toBe('income_certificate');
  });
});

