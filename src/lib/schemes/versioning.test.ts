import { describe, it, expect } from 'vitest';
import {
  assertImmutable,
  canEditVersion,
  canPublishVersion,
  canRetireVersion,
  nextVersionNumber,
  type VersionSnapshot,
} from './versioning';

const publishedAt = new Date('2025-01-01T00:00:00.000Z');

function snapshot(overrides: Partial<VersionSnapshot> = {}): VersionSnapshot {
  return {
    status: 'draft',
    versionNumber: 2,
    schemeId: '11111111-1111-4111-8111-111111111111',
    publishedAt: null,
    ...overrides,
  };
}

describe('canEditVersion', () => {
  it('allows draft and in_review', () => {
    expect(canEditVersion(snapshot({ status: 'draft' }))).toBe(true);
    expect(canEditVersion(snapshot({ status: 'in_review' }))).toBe(true);
  });

  it('rejects published and retired', () => {
    expect(canEditVersion(snapshot({ status: 'published', publishedAt }))).toBe(false);
    expect(canEditVersion(snapshot({ status: 'retired', publishedAt }))).toBe(false);
  });
});

describe('canPublishVersion', () => {
  const complete = { status: 'in_review' as const, sourceCount: 2, unverifiedSourceCount: 0, ruleCount: 3 };

  it('is ok for a complete in_review version', () => {
    expect(canPublishVersion(complete)).toEqual({ ok: true });
  });

  it('reports draft status first', () => {
    expect(canPublishVersion({ ...complete, status: 'draft', sourceCount: 0, ruleCount: 0 })).toEqual({
      ok: false,
      reason: 'Only a version in review can be published',
    });
  });

  it('reports zero sources before unverified sources and rules', () => {
    expect(canPublishVersion({ ...complete, sourceCount: 0, unverifiedSourceCount: 1, ruleCount: 0 })).toEqual({
      ok: false,
      reason: 'Attach at least one source',
    });
  });

  it('reports an unverified source before missing rules', () => {
    expect(canPublishVersion({ ...complete, unverifiedSourceCount: 1, ruleCount: 0 })).toEqual({
      ok: false,
      reason: 'Every source must be verified before publication',
    });
  });

  it('reports zero rules last', () => {
    expect(canPublishVersion({ ...complete, ruleCount: 0 })).toEqual({
      ok: false,
      reason: 'Add at least one rule',
    });
  });
});

describe('nextVersionNumber', () => {
  it('returns 1 when there are no versions', () => {
    expect(nextVersionNumber([])).toBe(1);
  });

  it('returns one above the highest existing number', () => {
    expect(nextVersionNumber([1, 3])).toBe(4);
  });
});

describe('canRetireVersion', () => {
  it('is true only for published', () => {
    expect(canRetireVersion(snapshot({ status: 'published', publishedAt }))).toBe(true);
    expect(canRetireVersion(snapshot({ status: 'draft' }))).toBe(false);
    expect(canRetireVersion(snapshot({ status: 'in_review' }))).toBe(false);
    expect(canRetireVersion(snapshot({ status: 'retired', publishedAt }))).toBe(false);
  });
});

describe('assertImmutable', () => {
  const before = snapshot({ status: 'published', publishedAt });

  it('allows published to retired with other fields unchanged', () => {
    expect(
      assertImmutable(before, {
        status: 'retired',
        versionNumber: 2,
        schemeId: before.schemeId,
        publishedAt,
      }),
    ).toEqual({ ok: true });
  });

  it('rejects a published edit that changes versionNumber', () => {
    expect(assertImmutable(before, { status: 'retired', versionNumber: 5 })).toEqual({
      ok: false,
      reason: 'Published versions are immutable',
    });
  });

  it('rejects published to draft', () => {
    expect(assertImmutable(before, { status: 'draft' })).toEqual({
      ok: false,
      reason: 'Published versions are immutable',
    });
  });

  it('allows any change to a draft', () => {
    const draft = snapshot({ status: 'draft' });
    expect(
      assertImmutable(draft, { status: 'published', versionNumber: 9, publishedAt }),
    ).toEqual({ ok: true });
  });
});
