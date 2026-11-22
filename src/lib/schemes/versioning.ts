export type VersionStatus = 'draft' | 'in_review' | 'published' | 'retired';

export type VersionSnapshot = {
  status: VersionStatus;
  versionNumber: number;
  schemeId: string;
  publishedAt: Date | null;
};

type Result = { ok: true } | { ok: false; reason: string };

/** Only drafts and versions in review may be edited. Published and retired versions are fixed. */
export function canEditVersion(v: VersionSnapshot): boolean {
  return v.status === 'draft' || v.status === 'in_review';
}

/**
 * Pure publication gate. Checks run in a fixed order so the first failing
 * reason is the one reported to the reviewer.
 */
export function canPublishVersion(input: {
  status: VersionStatus;
  sourceCount: number;
  unverifiedSourceCount: number;
  ruleCount: number;
}): Result {
  if (input.status !== 'in_review') {
    return { ok: false, reason: 'Only a version in review can be published' };
  }
  if (input.sourceCount === 0) {
    return { ok: false, reason: 'Attach at least one source' };
  }
  if (input.unverifiedSourceCount > 0) {
    return { ok: false, reason: 'Every source must be verified before publication' };
  }
  if (input.ruleCount === 0) {
    return { ok: false, reason: 'Add at least one rule' };
  }
  return { ok: true };
}

/** Next version number for a scheme: one above the highest existing, or 1 when there are none. */
export function nextVersionNumber(existing: number[]): number {
  if (existing.length === 0) return 1;
  return Math.max(...existing) + 1;
}

export function canRetireVersion(v: VersionSnapshot): boolean {
  return v.status === 'published';
}

function sameInstant(a: Date | null, b: Date | null): boolean {
  if (a === null || b === null) return a === b;
  return a.getTime() === b.getTime();
}

/**
 * Guards a published version. The only allowed change is moving it to
 * 'retired', with versionNumber, schemeId and publishedAt left unchanged.
 * Fields that are absent from `after` are treated as unchanged.
 */
export function assertImmutable(before: VersionSnapshot, after: Partial<VersionSnapshot>): Result {
  if (before.status !== 'published') {
    return { ok: true };
  }

  const reject = { ok: false as const, reason: 'Published versions are immutable' };

  if (after.status !== 'retired') return reject;
  if (after.versionNumber !== undefined && after.versionNumber !== before.versionNumber) return reject;
  if (after.schemeId !== undefined && after.schemeId !== before.schemeId) return reject;
  if (after.publishedAt !== undefined && !sameInstant(after.publishedAt, before.publishedAt)) return reject;

  return { ok: true };
}
