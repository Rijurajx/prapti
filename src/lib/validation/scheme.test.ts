import { describe, it, expect } from 'vitest';
import {
  ruleJsonWithDepthSchema,
  schemeDraftSchema,
  sourceSchema,
} from './scheme';

function nestNot(depth: number): unknown {
  let node: unknown = { field: 'annualIncome', op: 'is_true' };
  for (let i = 1; i < depth; i += 1) {
    node = { not: node };
  }
  return node;
}

describe('ruleJsonWithDepthSchema', () => {
  it('accepts a valid all/any/not tree with a comparison', () => {
    const rule = {
      all: [
        { field: 'annualIncome', op: 'lte', value: 250000 },
        {
          any: [
            { field: 'residency', op: 'in', value: ['SG', 'PR'] },
            { not: { field: 'isStudent', op: 'is_true' } },
          ],
        },
      ],
    };
    expect(ruleJsonWithDepthSchema.safeParse(rule).success).toBe(true);
  });

  it('rejects an unknown op', () => {
    const rule = { field: 'annualIncome', op: 'approx', value: 1 };
    expect(ruleJsonWithDepthSchema.safeParse(rule).success).toBe(false);
  });

  it('rejects is_true with a value', () => {
    const rule = { field: 'isResident', op: 'is_true', value: true };
    expect(ruleJsonWithDepthSchema.safeParse(rule).success).toBe(false);
  });

  it('rejects in with a non-array value', () => {
    const rule = { field: 'residency', op: 'in', value: 'SG' };
    expect(ruleJsonWithDepthSchema.safeParse(rule).success).toBe(false);
  });

  it('rejects a field starting with an uppercase letter', () => {
    const rule = { field: 'AnnualIncome', op: 'lte', value: 1 };
    expect(ruleJsonWithDepthSchema.safeParse(rule).success).toBe(false);
  });

  it('rejects an object with an extra key', () => {
    const rule = { field: 'annualIncome', op: 'lte', value: 1, extra: true };
    expect(ruleJsonWithDepthSchema.safeParse(rule).success).toBe(false);
  });

  it('accepts nesting of exactly 6 levels', () => {
    expect(ruleJsonWithDepthSchema.safeParse(nestNot(6)).success).toBe(true);
  });

  it('rejects nesting deeper than 6 levels', () => {
    expect(ruleJsonWithDepthSchema.safeParse(nestNot(7)).success).toBe(false);
  });

  it('rejects an empty all array', () => {
    expect(ruleJsonWithDepthSchema.safeParse({ all: [] }).success).toBe(false);
  });
});

describe('schemeDraftSchema', () => {
  it('rejects an uppercase slug', () => {
    expect(schemeDraftSchema.safeParse({ slug: 'Housing-Aid', name: 'Housing aid' }).success).toBe(false);
  });

  it('accepts a valid slug', () => {
    expect(schemeDraftSchema.safeParse({ slug: 'housing-aid-2025', name: 'Housing aid' }).success).toBe(true);
  });
});

describe('sourceSchema', () => {
  const base = { sourceType: 'official_website', title: 'Guide', publishedOn: '' } as const;

  it('rejects a url not starting with https://', () => {
    expect(sourceSchema.safeParse({ ...base, url: 'http://example.gov.sg/guide' }).success).toBe(false);
  });

  it('turns an empty url into null', () => {
    const result = sourceSchema.safeParse({ ...base, url: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.url).toBeNull();
    }
  });
});
