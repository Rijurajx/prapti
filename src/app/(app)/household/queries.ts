import { createSupabaseServerClient } from '@/lib/supabase/server';
import type {
  AccessLevel,
  ConsentScope,
  Relationship,
  SensitivityTier,
} from '@/lib/validation/household';

// Read-only getters for the household pages. No personal details are selected here.

type ServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

type Session = { supabase: ServerClient; userId: string; citizenId: string };

export type HouseholdSummary = { id: string; name: string; createdByMe: boolean };

export type HouseholdMember = {
  id: string;
  citizenProfileId: string;
  relationship: Relationship;
  status: 'active' | 'removed';
};

export type HouseholdDetail = {
  id: string;
  name: string;
  createdByUserId: string;
  members: HouseholdMember[];
};

export type ConsentRecordView = {
  id: string;
  scope: ConsentScope;
  grantedAt: string;
  revokedAt: string | null;
  granteeUserId: string;
};

export type AccessGrantView = {
  id: string;
  sourceConsentId: string | null;
  accessLevel: AccessLevel;
  sensitivityTier: SensitivityTier;
  expiresAt: string | null;
  revokedAt: string | null;
};

export type MyConsents = { consents: ConsentRecordView[]; grants: AccessGrantView[] };

type HouseholdRow = { id: string; name: string; created_by_user_id: string };
type MemberRow = {
  id: string;
  citizen_profile_id: string;
  relationship: Relationship;
  status: 'active' | 'removed';
};
type ConsentRow = {
  id: string;
  scope: ConsentScope;
  granted_at: string;
  revoked_at: string | null;
  grantee_user_id: string;
};
type GrantRow = {
  id: string;
  source_consent_id: string | null;
  access_level: AccessLevel;
  sensitivity_tier: SensitivityTier;
  expires_at: string | null;
  revoked_at: string | null;
};

/** Resolves the signed-in user and their own citizen id. Returns null when either is missing. */
async function resolveSession(): Promise<Session | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('citizen_profiles')
    .select('id')
    .eq('owner_user_id', user.id)
    .eq('relationship_to_owner', 'self')
    .maybeSingle();

  if (error) {
    console.error('household session lookup failed', error.code);
    return null;
  }
  const citizenId = (data as { id: string } | null)?.id;
  if (!citizenId) {
    return null;
  }

  return { supabase, userId: user.id, citizenId };
}

/** True when the signed-in citizen is an active member of the household. Null means the lookup failed. */
async function isActiveMember(
  supabase: ServerClient,
  householdId: string,
  citizenId: string,
): Promise<boolean | null> {
  const { data, error } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', householdId)
    .eq('citizen_profile_id', citizenId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('household membership lookup failed', error.code);
    return null;
  }
  return data !== null;
}

/** Households the signed-in user created or is an active member of, sorted by name. */
export async function getMyHouseholds(): Promise<HouseholdSummary[]> {
  const session = await resolveSession();
  if (!session) {
    return [];
  }
  const { supabase, userId, citizenId } = session;

  const { data: memberRows, error: memberError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('citizen_profile_id', citizenId)
    .eq('status', 'active');

  if (memberError) {
    console.error('getMyHouseholds failed', memberError.code);
    return [];
  }
  const memberIds = ((memberRows ?? []) as { household_id: string }[]).map((r) => r.household_id);

  const { data: createdRows, error: createdError } = await supabase
    .from('households')
    .select('id, name, created_by_user_id')
    .eq('created_by_user_id', userId);

  if (createdError) {
    console.error('getMyHouseholds failed', createdError.code);
    return [];
  }

  let joinedRows: HouseholdRow[] = [];
  if (memberIds.length > 0) {
    const { data, error } = await supabase
      .from('households')
      .select('id, name, created_by_user_id')
      .in('id', memberIds);
    if (error) {
      console.error('getMyHouseholds failed', error.code);
      return [];
    }
    joinedRows = (data ?? []) as HouseholdRow[];
  }

  const byId = new Map<string, HouseholdRow>();
  for (const row of [...((createdRows ?? []) as HouseholdRow[]), ...joinedRows]) {
    byId.set(row.id, row);
  }

  return [...byId.values()]
    .map((row) => ({ id: row.id, name: row.name, createdByMe: row.created_by_user_id === userId }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** One household with its members. Null when it does not exist or the signed-in user cannot see it. */
export async function getHousehold(householdId: string): Promise<HouseholdDetail | null> {
  const session = await resolveSession();
  if (!session) {
    return null;
  }
  const { supabase, userId, citizenId } = session;

  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('id, name, created_by_user_id')
    .eq('id', householdId)
    .maybeSingle();

  if (householdError) {
    console.error('getHousehold failed', householdError.code);
    return null;
  }
  const row = household as HouseholdRow | null;
  if (!row) {
    return null;
  }

  if (row.created_by_user_id !== userId) {
    const member = await isActiveMember(supabase, householdId, citizenId);
    if (member !== true) {
      return null;
    }
  }

  const { data: memberRows, error: memberError } = await supabase
    .from('household_members')
    .select('id, citizen_profile_id, relationship, status')
    .eq('household_id', householdId);

  if (memberError) {
    console.error('getHousehold failed', memberError.code);
    return null;
  }

  const members = ((memberRows ?? []) as MemberRow[]).map((m) => ({
    id: m.id,
    citizenProfileId: m.citizen_profile_id,
    relationship: m.relationship,
    status: m.status,
  }));

  return {
    id: row.id,
    name: row.name,
    createdByUserId: row.created_by_user_id,
    members,
  };
}

/**
 * The signed-in citizen's own consent records and access grants, for a household they belong to.
 * Null when the lookup fails or the user is not an active member of that household.
 */
export async function getMyConsents(householdId: string): Promise<MyConsents | null> {
  const session = await resolveSession();
  if (!session) {
    return null;
  }
  const { supabase, citizenId } = session;

  const member = await isActiveMember(supabase, householdId, citizenId);
  if (member !== true) {
    return null;
  }

  const { data: consentRows, error: consentError } = await supabase
    .from('consent_records')
    .select('id, scope, granted_at, revoked_at, grantee_user_id')
    .eq('citizen_profile_id', citizenId)
    .order('granted_at', { ascending: false });

  if (consentError) {
    console.error('getMyConsents failed', consentError.code);
    return null;
  }

  const { data: grantRows, error: grantError } = await supabase
    .from('profile_access_grants')
    .select('id, source_consent_id, access_level, sensitivity_tier, expires_at, revoked_at')
    .eq('citizen_profile_id', citizenId);

  if (grantError) {
    console.error('getMyConsents failed', grantError.code);
    return null;
  }

  return {
    consents: ((consentRows ?? []) as ConsentRow[]).map((c) => ({
      id: c.id,
      scope: c.scope,
      grantedAt: c.granted_at,
      revokedAt: c.revoked_at,
      granteeUserId: c.grantee_user_id,
    })),
    grants: ((grantRows ?? []) as GrantRow[]).map((g) => ({
      id: g.id,
      sourceConsentId: g.source_consent_id,
      accessLevel: g.access_level,
      sensitivityTier: g.sensitivity_tier,
      expiresAt: g.expires_at,
      revokedAt: g.revoked_at,
    })),
  };
}
