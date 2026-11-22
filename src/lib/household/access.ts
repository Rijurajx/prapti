export type AccessAction = 'read' | 'edit';
export type SensitivityTier = 'standard' | 'sensitive';

export type ProfileAccessGrant = {
  granteeUserId: string;
  citizenProfileId: string;
  accessLevel: 'read' | 'edit';
  sensitivityTier: SensitivityTier;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

export type ProfileOwnership = {
  citizenProfileId: string;
  ownerUserId: string;
};

function grantCoversAction(grant: ProfileAccessGrant, action: AccessAction): boolean {
  if (action === 'read') return true;
  return grant.accessLevel === 'edit';
}

function grantCoversTier(grant: ProfileAccessGrant, tier: SensitivityTier): boolean {
  if (tier === 'standard') return true;
  return grant.sensitivityTier === 'sensitive';
}

/**
 * Pure access check. The caller loads the grants and ownership facts.
 * Rules: owner always has access; otherwise an active, unrevoked, unexpired
 * grant on this exact profile is required. Household membership or creation
 * never grants access to another adult's profile.
 */
export function canActOnProfile(input: {
  actorUserId: string;
  profile: ProfileOwnership;
  action: AccessAction;
  sensitivityTier: SensitivityTier;
  grants: ProfileAccessGrant[];
  now: Date;
}): boolean {
  const { actorUserId, profile, action, sensitivityTier, grants, now } = input;

  if (profile.ownerUserId === actorUserId) {
    return true;
  }

  return grants.some(
    (grant) =>
      grant.granteeUserId === actorUserId &&
      grant.citizenProfileId === profile.citizenProfileId &&
      grant.revokedAt === null &&
      (grant.expiresAt === null || now.getTime() < grant.expiresAt.getTime()) &&
      grantCoversAction(grant, action) &&
      grantCoversTier(grant, sensitivityTier),
  );
}

/**
 * Returns true when the actor created the household.
 * This is deliberately NOT an access grant: creating a household does not
 * give the creator any access to other adults' profiles. Do not use this
 * as a substitute for canActOnProfile.
 */
export function isCreatorOfHousehold(
  actorUserId: string,
  household: { createdByUserId: string },
): boolean {
  return actorUserId === household.createdByUserId;
}
