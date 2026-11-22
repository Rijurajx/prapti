import type { RuleNode, Comparison } from '@/lib/validation/scheme';
import type {
  FactDictionary,
  KleeneValue,
  LeafRuleTrace,
  SchemeAssessmentResult,
  SchemeRuleWithSource,
} from './types';

export interface EvaluatedRuleNode {
  result: KleeneValue;
  missingFields: string[];
  traces: LeafRuleTrace[];
}

/**
 * Resolves a dotted field path (e.g. "age" or "address.state") in a fact dictionary.
 */
export function getFactValue(facts: FactDictionary, path: string): unknown {
  if (!path) return undefined;
  if (!path.includes('.')) {
    return facts[path];
  }
  const parts = path.split('.');
  let current: any = facts;
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

/**
 * Evaluates a single comparison leaf against facts.
 * An absent or null fact evaluates to UNKNOWN (except exists operator).
 */
export function evaluateComparison(
  cmp: Comparison,
  facts: FactDictionary,
  rulePath: string,
  sourceId?: string | null,
  clauseReference?: string | null,
): EvaluatedRuleNode {
  const actual = getFactValue(facts, cmp.field);
  const op = cmp.op as string;
  const expected = cmp.value;

  // If the fact is missing, null, or undefined:
  if (actual === undefined || actual === null) {
    if (op === 'exists') {
      const trace: LeafRuleTrace = {
        rulePath,
        field: cmp.field,
        op,
        expectedValue: true,
        actualValue: actual,
        result: 'FAIL',
        missingFields: [],
        sourceId,
        clauseReference,
        explanation: `${cmp.field} is not provided`,
      };
      return { result: 'FAIL', missingFields: [], traces: [trace] };
    }

    // Missing mandatory information evaluates to UNKNOWN!
    const trace: LeafRuleTrace = {
      rulePath,
      field: cmp.field,
      op,
      expectedValue: expected,
      actualValue: null,
      result: 'UNKNOWN',
      missingFields: [cmp.field],
      sourceId,
      clauseReference,
      explanation: `Information for "${cmp.field}" is missing or unverified`,
    };
    return { result: 'UNKNOWN', missingFields: [cmp.field], traces: [trace] };
  }

  let pass = false;

  switch (op) {
    case 'eq':
      if (typeof actual === 'string' && typeof expected === 'string') {
        pass = actual.trim().toLowerCase() === expected.trim().toLowerCase();
      } else {
        pass = actual === expected;
      }
      break;
    case 'neq':
      if (typeof actual === 'string' && typeof expected === 'string') {
        pass = actual.trim().toLowerCase() !== expected.trim().toLowerCase();
      } else {
        pass = actual !== expected;
      }
      break;
    case 'lt':
      pass = typeof actual === 'number' && typeof expected === 'number' && actual < expected;
      break;
    case 'lte':
      pass = typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
      break;
    case 'gt':
      pass = typeof actual === 'number' && typeof expected === 'number' && actual > expected;
      break;
    case 'gte':
      pass = typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
      break;
    case 'in':
      if (Array.isArray(expected)) {
        if (typeof actual === 'string') {
          pass = expected.some(
            (v) => typeof v === 'string' && v.trim().toLowerCase() === actual.trim().toLowerCase(),
          );
        } else {
          pass = expected.includes(actual as any);
        }
      }
      break;
    case 'not_in':
      if (Array.isArray(expected)) {
        if (typeof actual === 'string') {
          pass = !expected.some(
            (v) => typeof v === 'string' && v.trim().toLowerCase() === actual.trim().toLowerCase(),
          );
        } else {
          pass = !expected.includes(actual as any);
        }
      }
      break;
    case 'is_true':
      pass = actual === true;
      break;
    case 'is_false':
      pass = actual === false;
      break;
    case 'contains':
      if (Array.isArray(actual)) {
        pass = actual.includes(expected as any);
      }
      break;
    case 'exists':
      pass = true;
      break;
    default:
      pass = false;
  }

  const result: KleeneValue = pass ? 'PASS' : 'FAIL';
  const explanation = pass
    ? `Criteria met: ${cmp.field} (${String(actual)}) matches requirement`
    : `Criteria not met: ${cmp.field} is ${String(actual)}, expected ${op} ${expected !== undefined ? JSON.stringify(expected) : ''}`;

  const trace: LeafRuleTrace = {
    rulePath,
    field: cmp.field,
    op,
    expectedValue: expected,
    actualValue: actual,
    result,
    missingFields: [],
    sourceId,
    clauseReference,
    explanation,
  };

  return { result, missingFields: [], traces: [trace] };
}

/**
 * Evaluates an arbitrary rule node (comparison or composite all/any/not) recursively.
 */
export function evaluateRuleNode(
  node: RuleNode,
  facts: FactDictionary,
  path = 'root',
  sourceId?: string | null,
  clauseReference?: string | null,
): EvaluatedRuleNode {
  // Leaf comparison
  if ('field' in node) {
    return evaluateComparison(node as Comparison, facts, path, sourceId, clauseReference);
  }

  // ALL composite: Kleene AND
  if ('all' in node) {
    const childResults = (node.all as RuleNode[]).map((child, i) =>
      evaluateRuleNode(child, facts, `${path}.all[${i}]`, sourceId, clauseReference),
    );

    const allTraces = childResults.flatMap((c) => c.traces);
    const missing = Array.from(new Set(childResults.flatMap((c) => c.missingFields)));

    if (childResults.some((c) => c.result === 'FAIL')) {
      return { result: 'FAIL', missingFields: missing, traces: allTraces };
    }
    if (childResults.some((c) => c.result === 'UNKNOWN')) {
      return { result: 'UNKNOWN', missingFields: missing, traces: allTraces };
    }
    return { result: 'PASS', missingFields: missing, traces: allTraces };
  }

  // ANY composite: Kleene OR
  if ('any' in node) {
    const childResults = (node.any as RuleNode[]).map((child, i) =>
      evaluateRuleNode(child, facts, `${path}.any[${i}]`, sourceId, clauseReference),
    );

    const allTraces = childResults.flatMap((c) => c.traces);
    const missing = Array.from(new Set(childResults.flatMap((c) => c.missingFields)));

    if (childResults.some((c) => c.result === 'PASS')) {
      return { result: 'PASS', missingFields: missing, traces: allTraces };
    }
    if (childResults.some((c) => c.result === 'UNKNOWN')) {
      return { result: 'UNKNOWN', missingFields: missing, traces: allTraces };
    }
    return { result: 'FAIL', missingFields: missing, traces: allTraces };
  }

  // NOT composite: Kleene NOT
  if ('not' in node) {
    const child = evaluateRuleNode(node.not as RuleNode, facts, `${path}.not`, sourceId, clauseReference);
    let invResult: KleeneValue = 'UNKNOWN';
    if (child.result === 'PASS') invResult = 'FAIL';
    else if (child.result === 'FAIL') invResult = 'PASS';

    return { result: invResult, missingFields: child.missingFields, traces: child.traces };
  }

  return { result: 'UNKNOWN', missingFields: [], traces: [] };
}

/**
 * Evaluates all eligibility and exclusion rules of a scheme version against a citizen fact set.
 * Returns an evidence-grounded SchemeAssessmentResult.
 */
export function evaluateScheme(
  rules: SchemeRuleWithSource[],
  facts: FactDictionary,
): SchemeAssessmentResult {
  if (rules.length === 0) {
    return {
      outcome: 'cannot_assess',
      summary: 'This scheme does not currently have machine-verifiable rules published.',
      passedRuleCount: 0,
      failedRuleCount: 0,
      unknownRuleCount: 0,
      missingFields: [],
      traces: [],
    };
  }

  const eligibilityRules = rules.filter((r) => r.ruleKind === 'eligibility');
  const exclusionRules = rules.filter((r) => r.ruleKind === 'exclusion');

  const allTraces: LeafRuleTrace[] = [];
  const missingSet = new Set<string>();

  let hasFailedEligibility = false;
  let hasUnknownEligibility = false;
  let hasPassedEligibility = true;

  if (eligibilityRules.length > 0) {
    for (let i = 0; i < eligibilityRules.length; i++) {
      const rule = eligibilityRules[i]!;
      const evaluated = evaluateRuleNode(
        rule.ruleJson,
        facts,
        `eligibility[${i}]`,
        rule.sourceId,
        rule.clauseReference,
      );
      allTraces.push(...evaluated.traces);
      evaluated.missingFields.forEach((f) => missingSet.add(f));

      if (evaluated.result === 'FAIL') {
        hasFailedEligibility = true;
        hasPassedEligibility = false;
      } else if (evaluated.result === 'UNKNOWN') {
        hasUnknownEligibility = true;
        hasPassedEligibility = false;
      }
    }
  } else {
    // If no eligibility rule specified, cannot assess
    hasPassedEligibility = false;
    hasUnknownEligibility = true;
  }

  let hasPassedExclusion = false;
  let hasUnknownExclusion = false;

  for (let i = 0; i < exclusionRules.length; i++) {
    const rule = exclusionRules[i]!;
    const evaluated = evaluateRuleNode(
      rule.ruleJson,
      facts,
      `exclusion[${i}]`,
      rule.sourceId,
      rule.clauseReference,
    );
    allTraces.push(...evaluated.traces);
    evaluated.missingFields.forEach((f) => missingSet.add(f));

    if (evaluated.result === 'PASS') {
      // An exclusion rule passed -> citizen is excluded!
      hasPassedExclusion = true;
    } else if (evaluated.result === 'UNKNOWN') {
      hasUnknownExclusion = true;
    }
  }

  const passedCount = allTraces.filter((t) => t.result === 'PASS').length;
  const failedCount = allTraces.filter((t) => t.result === 'FAIL').length;
  const unknownCount = allTraces.filter((t) => t.result === 'UNKNOWN').length;
  const missingFields = Array.from(missingSet);

  // Determine overall outcome:
  // 1. If any exclusion rule passed, or eligibility strictly failed -> likely_ineligible
  if (hasPassedExclusion || hasFailedEligibility) {
    return {
      outcome: 'likely_ineligible',
      summary: hasPassedExclusion
        ? 'Excluded based on published scheme rules'
        : 'One or more required eligibility conditions were not met',
      passedRuleCount: passedCount,
      failedRuleCount: failedCount,
      unknownRuleCount: unknownCount,
      missingFields,
      traces: allTraces,
    };
  }

  // 2. If unknown conditions remain -> needs_more_info
  if (hasUnknownEligibility || hasUnknownExclusion) {
    return {
      outcome: 'needs_more_info',
      summary: `Additional information needed to assess eligibility (${missingFields.join(', ')})`,
      passedRuleCount: passedCount,
      failedRuleCount: failedCount,
      unknownRuleCount: unknownCount,
      missingFields,
      traces: allTraces,
    };
  }

  // 3. If all eligibility passed and no exclusion passed -> likely_eligible
  if (hasPassedEligibility && !hasPassedExclusion) {
    return {
      outcome: 'likely_eligible',
      summary: 'Meets all evaluated published eligibility criteria',
      passedRuleCount: passedCount,
      failedRuleCount: failedCount,
      unknownRuleCount: unknownCount,
      missingFields: [],
      traces: allTraces,
    };
  }

  return {
    outcome: 'cannot_assess',
    summary: 'Unable to reliably evaluate with current published scheme rules',
    passedRuleCount: passedCount,
    failedRuleCount: failedCount,
    unknownRuleCount: unknownCount,
    missingFields,
    traces: allTraces,
  };
}

