import { describe, it, expect } from 'vitest';
import {
  canActOnProfile,
  isCreatorOfHousehold,
  type ProfileAccessGrant,
  type ProfileOwnership,
} from './access';

const NOW = new Date('2025-06-01T12:00:00.000Z');
const FUTURE = new Date('2025-12-01T00:00:00.000Z');
const PAST = new Date('2025-01-01T00:00:00.000Z');

const OWNER = 'user-owner';
const OTHER = 'user-other';
const PROFILE: ProfileOwnership = { citizenProfileId: 'profile-1', ownerUserId: OWNER };

function grant(overrides: Partial<ProfileAccessGrant> = {}): ProfileAccessGrant {
  return {
    granteeUserId: OTHER,
    citizenProfileId: 'profile-1',
    accessLevel: 'read',
    sensitivityTier: 'standard',
    expiresAt: null,
    revokedAt: null,
    ...overrides,
  };
}

function check(
  actorUserId: string,
  action: 'read' | 'edit',
  grants: ProfileAccessGrant[],
  sensitivityTier: 'standard' | 'sensitive' = 'standard',
  profile: ProfileOwnership = PROFILE,
): boolean {
  return canActOnProfile({
    actorUserId,
    profile,
    action,
    sensitivityTier,
    grants,
    now: NOW,
  });
}

describe('canActOnProfile', () => {
  it('lets the owner read and edit their own profile with no grants', () => {
    expect(check(OWNER, 'read', [])).toBe(true);
    expect(check(OWNER, 'edit', [])).toBe(true);
  });

  it('denies a non-owner with no grant both read and edit', () => {
    expect(check(OTHER, 'read', [])).toBe(false);
    expect(check(OTHER, 'edit', [])).toBe(false);
  });

  it('denies a household creator read access to an adult member profile without a grant', () => {
    const household = { createdByUserId: 'user-creator' };
    const memberProfile: ProfileOwnership = {
      citizenProfileId: 'profile-member',
      ownerUserId: 'user-member',
    };
    expect(isCreatorOfHousehold('user-creator', household)).toBe(true);
    expect(check('user-creator', 'read', [], 'standard', memberProfile)).toBe(false);
  });

  it('allows read but denies edit with a read grant', () => {
    const grants = [grant({ accessLevel: 'read' })];
    expect(check(OTHER, 'read', grants)).toBe(true);
    expect(check(OTHER, 'edit', grants)).toBe(false);
  });

  it('allows read and edit with an edit grant', () => {
    const grants = [grant({ accessLevel: 'edit' })];
    expect(check(OTHER, 'read', grants)).toBe(true);
    expect(check(OTHER, 'edit', grants)).toBe(true);
  });

  it('denies when the grant has been revoked', () => {
    const grants = [grant({ accessLevel: 'edit', revokedAt: PAST })];
    expect(check(OTHER, 'read', grants)).toBe(false);
    expect(check(OTHER, 'edit', grants)).toBe(false);
  });

  it('denies when the grant has expired', () => {
    const grants = [grant({ accessLevel: 'edit', expiresAt: PAST })];
    expect(check(OTHER, 'read', grants)).toBe(false);
  });

  it('allows when the grant has not yet expired', () => {
    const grants = [grant({ accessLevel: 'read', expiresAt: FUTURE })];
    expect(check(OTHER, 'read', grants)).toBe(true);
  });

  it('ignores a grant for a different citizenProfileId', () => {
    const grants = [grant({ accessLevel: 'edit', citizenProfileId: 'profile-2' })];
    expect(check(OTHER, 'read', grants)).toBe(false);
  });

  it('denies a sensitive-tier request when the grant is standard tier', () => {
    const grants = [grant({ accessLevel: 'edit', sensitivityTier: 'standard' })];
    expect(check(OTHER, 'read', grants, 'sensitive')).toBe(false);
    expect(check(OTHER, 'edit', grants, 'sensitive')).toBe(false);
  });

  it('allows a sensitive-tier request when the grant is sensitive tier', () => {
    const grants = [grant({ accessLevel: 'edit', sensitivityTier: 'sensitive' })];
    expect(check(OTHER, 'read', grants, 'sensitive')).toBe(true);
    expect(check(OTHER, 'edit', grants, 'sensitive')).toBe(true);
  });

  it('allows a standard-tier request with a sensitive-tier grant', () => {
    const grants = [grant({ accessLevel: 'read', sensitivityTier: 'sensitive' })];
    expect(check(OTHER, 'read', grants, 'standard')).toBe(true);
  });
});

describe('isCreatorOfHousehold', () => {
  it('is true only when the ids match', () => {
    expect(isCreatorOfHousehold('a', { createdByUserId: 'a' })).toBe(true);
    expect(isCreatorOfHousehold('b', { createdByUserId: 'a' })).toBe(false);
  });
});
