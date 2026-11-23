import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  answerWithDeterministicRAG,
  formatRAGKnowledgeBaseForPrompt,
  type CitizenRAGKnowledgeBase,
} from './rag';

const mockKnowledgeBase: CitizenRAGKnowledgeBase = {
  citizen: {
    id: 'cit-123',
    name: 'Rijuraj',
    relationship: 'self',
    age: 21,
    dob: '2005-04-12',
    gender: 'male',
    maritalStatus: 'never_married',
    categoryTags: ['Student'],
    state: 'West Bengal',
    district: 'Nadia',
    pinCode: '741235',
    familyIncomeInr: 120000,
    employmentStatus: 'student',
    highestEducation: 'Higher Secondary (Class 12)',
    class10Percentage: 80,
    class12Percentage: 55, // Note: below 60% requirement for SVMCM
    operatesLand: false,
  },
  documents: {
    ready: ['Aadhaar Card', 'Bank Passbook'],
    missing: ['Income Certificate', 'Marksheet'],
    inProgress: [],
  },
  schemes: {
    eligible: [
      {
        id: 'sch-1',
        name: 'Aikyashree Post-Matric Scholarship',
        nameBn: 'ঐক্যশ্রী স্কলারশিপ',
        slug: 'wb-aikyashree',
        jurisdiction: 'state',
        state: 'West Bengal',
        benefit: '₹3,300 to ₹16,500 / year',
        ministry: 'Minority Affairs, WB',
        portalUrl: 'https://wbmdfcscholarship.in',
        isFullyReady: false,
        missingDocuments: ['Income Certificate'],
        readyDocuments: ['Aadhaar Card', 'Bank Passbook'],
      },
    ],
    needsInfo: [],
    ineligible: [
      {
        id: 'sch-2',
        name: 'Swami Vivekananda Merit-cum-Means (SVMCM)',
        slug: 'wb-svmcm',
        jurisdiction: 'state',
        state: 'West Bengal',
        benefit: '₹12,000 to ₹60,000 / year',
        failedReasons: [
          'Criterion \'class_12_percentage\' failed: expected gte 60, but profile has 55.',
        ],
      },
      {
        id: 'sch-3',
        name: 'Majhi Ladki Bahin Yojana',
        slug: 'mh-ladki-bahin',
        jurisdiction: 'state',
        state: 'Maharashtra',
        benefit: '₹1,500 monthly',
        failedReasons: [
          'State jurisdiction requirement: Scheme is specific to Maharashtra, whereas citizen\'s registered state is West Bengal.',
          'Criterion \'gender\' failed: expected eq "female", but profile has "male".',
        ],
      },
    ],
  },
  otherFamilyMembers: [
    {
      id: 'cit-456',
      name: 'Father',
      relationship: 'father',
    },
  ],
};

describe('Deterministic RAG Engine', () => {
  it('answers "What schemes am I eligible for?" with personalized schemes and document status', () => {
    const res = answerWithDeterministicRAG('What schemes am I eligible for?', mockKnowledgeBase);
    expect(res.reply).toContain('Aikyashree Post-Matric Scholarship');
    expect(res.reply).toContain('Income Certificate');
    expect(res.referencedSchemes?.length).toBeGreaterThan(0);
    expect(res.suggestedFollowUps?.length).toBeGreaterThan(0);
  });

  it('answers "Why am I not eligible for SVMCM?" with exact academic percentage failure', () => {
    const res = answerWithDeterministicRAG(
      'Why am I not eligible for Swami Vivekananda Merit-cum-Means Scholarship?',
      mockKnowledgeBase,
    );
    expect(res.reply).toContain('Why Rijuraj is Currently Not Eligible');
    expect(res.reply).toContain('class_12_percentage');
    expect(res.reply).toContain('expected gte 60, but profile has 55');
  });

  it('answers "Why am I not eligible for Majhi Ladki Bahin?" with state and gender mismatch', () => {
    const res = answerWithDeterministicRAG(
      'Why am I ineligible for Majhi Ladki Bahin?',
      mockKnowledgeBase,
    );
    expect(res.reply).toContain('Why Rijuraj is Currently Not Eligible');
    expect(res.reply).toContain('Maharashtra');
    expect(res.reply).toContain('West Bengal');
  });

  it('answers queries about required documents', () => {
    const res = answerWithDeterministicRAG(
      'What documents do I need to prepare?',
      mockKnowledgeBase,
    );
    expect(res.reply).toContain('Documents Marked Available');
    expect(res.reply).toContain('Aadhaar Card');
    expect(res.reply).toContain('Income Certificate');
  });

  it('recognizes mentions of other family members and suggests switching context', () => {
    const res = answerWithDeterministicRAG(
      'What schemes can my Father apply for?',
      mockKnowledgeBase,
    );
    expect(res.reply).toContain('Father');
    expect(res.reply).toContain('FATHER');
    expect(res.reply).toContain('switch the active profile');
  });

  it('extracts newly mentioned facts into structured data for user confirmation', () => {
    const res = answerWithDeterministicRAG(
      'Actually my annual family income is 1.5 lakh and I scored 78% in Class 12',
      mockKnowledgeBase,
    );
    expect(res.facts).toBeDefined();
    expect(res.facts?.familyAnnualIncomeInr).toBe(150000);
    expect(res.facts?.class12Percentage).toBe(78);
  });

  it('formats knowledge base into clean Markdown prompt for LLM', () => {
    const prompt = formatRAGKnowledgeBaseForPrompt(mockKnowledgeBase);
    expect(prompt).toContain('ACTIVE CITIZEN PROFILE CONTEXT (BENEFICIARY)');
    expect(prompt).toContain('Rijuraj');
    expect(prompt).toContain('West Bengal');
    expect(prompt).toContain('Aikyashree Post-Matric Scholarship');
    expect(prompt).toContain('Swami Vivekananda Merit-cum-Means');
  });
});
