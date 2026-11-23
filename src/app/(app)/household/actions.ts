'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canActOnProfile, isCreatorOfHousehold, type ProfileAccessGrant } from '@/lib/household/access';
import { generateInviteToken, hashInviteToken, inviteExpiresAt } from '@/lib/household/tokens';
import {
  consentSchema,
  createHouseholdSchema,
  inviteMemberSchema,
  removeMemberSchema,
  revokeConsentSchema,
  switchProfileSchema,
  tokenSchema,
  type ConsentInput,
  type CreateHouseholdInput,
  type InviteMemberInput,
  type RemoveMemberInput,
  type RevokeConsentInput,
  type SwitchProfileInput,
  type TokenInput,
} from '@/lib/validation/household';

export type ActionResult = { ok: true } | { ok: false; error: string };
export type InviteResult = { ok: true; inviteToken: string } | { ok: false; error: string };
export type SwitchResult = { ok: true; citizenProfileId: string } | { ok: false; error: string };

type ServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

type SessionContext =
  | { ok: true; supabase: ServerClient; userId: string; citizenId: string }
  | { ok: false; error: string };

type GrantRow = {
  citizen_profile_id: string;
  grantee_user_id: string;
  access_level: 'read' | 'edit';
  sensitivity_tier: 'standard' | 'sensitive';
  expires_at: string | null;
  revoked_at: string | null;
};

const GENERIC_ERROR = 'Something went wrong. Please try again.';
const CHECK_INPUT_ERROR = 'Check the details and try again';
const INVITATION_NOT_VALID = 'This invitation is not valid or has expired';
const HOUSEHOLD_PATH = '/household';

const uuidSchema = z.string().uuid();

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? CHECK_INPUT_ERROR;
}

/** Resolves the signed-in user and their own citizen id. Never trusts the client. */
async function resolveSession(): Promise<SessionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, error: 'Supabase is not configured' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Please sign in again' };
  }

  const { data, error } = await supabase
    .from('citizen_profiles')
    .select('id')
    .eq('owner_user_id', user.id)
    .eq('relationship_to_owner', 'self')
    .maybeSingle();

  if (error) {
    console.error('resolveSession failed', error.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  const citizenId = (data as { id: string } | null)?.id;
  if (!citizenId) {
    return { ok: false, error: 'Your profile could not be found. Try signing out and in again.' };
  }

  return { ok: true, supabase, userId: user.id, citizenId };
}

/**
 * True when the grantee is an active member of a household the owner's profile is an active member of.
 * The owner reads their own membership rows; the grantee check goes through the SECURITY DEFINER RPC.
 */
async function shareSameHousehold(
  supabase: ServerClient,
  ownerCitizenId: string,
  granteeUserId: string,
): Promise<boolean> {
  const { data: granteeProfile, error: profileError } = await supabase
    .from('citizen_profiles')
    .select('id')
    .eq('owner_user_id', granteeUserId)
    .eq('relationship_to_owner', 'self')
    .maybeSingle();

  if (profileError) {
    console.error('shareSameHousehold failed', profileError.code);
    return false;
  }
  const granteeCitizenId = (granteeProfile as { id: string } | null)?.id;
  if (!granteeCitizenId) {
    return false;
  }

  const { data: ownerRows, error: ownerError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('citizen_profile_id', ownerCitizenId)
    .eq('status', 'active');

  if (ownerError) {
    console.error('shareSameHousehold failed', ownerError.code);
    return false;
  }

  const householdIds = ((ownerRows ?? []) as { household_id: string }[]).map((r) => r.household_id);
  for (const householdId of householdIds) {
    const { data, error } = await supabase.rpc('is_active_member_profile', {
      p_household: householdId,
      p_citizen: granteeCitizenId,
    });
    if (error) {
      console.error('shareSameHousehold failed', error.code);
      return false;
    }
    if (data === true) {
      return true;
    }
  }
  return false;
}

export async function createHousehold(input: CreateHouseholdInput): Promise<ActionResult> {
  const parsed = createHouseholdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const { data: household, error: householdError } = await session.supabase
    .from('households')
    .insert({ name: parsed.data.name, created_by_user_id: session.userId })
    .select('id')
    .single();

  if (householdError || !household) {
    console.error('createHousehold failed', householdError?.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  const householdId = (household as { id: string }).id;

  // The creator's own profile is their own; this is not another adult's data.
  const { error: memberError } = await session.supabase.from('household_members').insert({
    household_id: householdId,
    citizen_profile_id: session.citizenId,
    relationship: 'self',
  });

  if (memberError) {
    console.error('createHousehold failed', memberError.code);
    await session.supabase.from('households').delete().eq('id', householdId);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath(HOUSEHOLD_PATH);
  return { ok: true };
}

export async function inviteMember(householdId: string, input: InviteMemberInput): Promise<InviteResult> {
  if (!uuidSchema.safeParse(householdId).success) {
    return { ok: false, error: 'Unknown household' };
  }
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const { data: household, error: householdError } = await session.supabase
    .from('households')
    .select('id, created_by_user_id')
    .eq('id', householdId)
    .maybeSingle();

  if (householdError) {
    console.error('inviteMember failed', householdError.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  const row = household as { id: string; created_by_user_id: string } | null;
  if (!row || !isCreatorOfHousehold(session.userId, { createdByUserId: row.created_by_user_id })) {
    return { ok: false, error: 'Only the household creator can invite members' };
  }

  const { token, tokenHash } = generateInviteToken();
  // Relationship is validated but not stored: household_invitations has no relationship column.
  const { error: insertError } = await session.supabase.from('household_invitations').insert({
    household_id: householdId,
    invited_by_user_id: session.userId,
    invitee_email: parsed.data.inviteeEmail,
    token_hash: tokenHash,
    expires_at: inviteExpiresAt(new Date()).toISOString(),
    status: 'pending',
  });

  if (insertError) {
    console.error('inviteMember failed', insertError.code);
    return { ok: false, error: GENERIC_ERROR };
  }

  // The raw token is returned once so the UI can show the link; it is never stored or logged.
  return { ok: true, inviteToken: token };
}

/** Invitee accepts via the accept_household_invitation RPC; the raw token is hashed before it leaves the server. */
export async function acceptInvitation(input: TokenInput): Promise<ActionResult> {
  const parsed = tokenSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const tokenHash = hashInviteToken(parsed.data.token);
  const { error } = await session.supabase.rpc('accept_household_invitation', { p_token_hash: tokenHash });
  if (error) {
    console.error('acceptInvitation failed', error.code);
    return { ok: false, error: INVITATION_NOT_VALID };
  }

  revalidatePath(HOUSEHOLD_PATH);
  return { ok: true };
}

/** Invitee declines via the decline_household_invitation RPC; the raw token is hashed before it leaves the server. */
export async function declineInvitation(input: TokenInput): Promise<ActionResult> {
  const parsed = tokenSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const tokenHash = hashInviteToken(parsed.data.token);
  const { error } = await session.supabase.rpc('decline_household_invitation', { p_token_hash: tokenHash });
  if (error) {
    console.error('declineInvitation failed', error.code);
    return { ok: false, error: INVITATION_NOT_VALID };
  }

  revalidatePath(HOUSEHOLD_PATH);
  return { ok: true };
}

export async function recordConsent(input: ConsentInput): Promise<ActionResult> {
  const parsed = consentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const { granteeUserId, scope, accessLevel, sensitivityTier, expiresAt } = parsed.data;
  if (granteeUserId === session.userId) {
    return { ok: false, error: 'You cannot share your profile with yourself' };
  }

  const sameHousehold = await shareSameHousehold(session.supabase, session.citizenId, granteeUserId);
  if (!sameHousehold) {
    return { ok: false, error: 'That person is not an active member of your household' };
  }

  const { data: consent, error: consentError } = await session.supabase
    .from('consent_records')
    .insert({
      citizen_profile_id: session.citizenId,
      grantee_user_id: granteeUserId,
      scope,
      consent_text_version: 'v1',
    })
    .select('id')
    .single();

  if (consentError || !consent) {
    console.error('recordConsent failed', consentError?.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  const consentId = (consent as { id: string }).id;

  const { error: grantError } = await session.supabase.from('profile_access_grants').insert({
    citizen_profile_id: session.citizenId,
    grantee_user_id: granteeUserId,
    access_level: accessLevel,
    sensitivity_tier: sensitivityTier,
    source_consent_id: consentId,
    expires_at: expiresAt,
  });

  if (grantError) {
    console.error('recordConsent failed', grantError.code);
    await session.supabase.from('consent_records').delete().eq('id', consentId);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath(HOUSEHOLD_PATH);
  return { ok: true };
}

export async function revokeConsent(input: RevokeConsentInput): Promise<ActionResult> {
  const parsed = revokeConsentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const now = new Date().toISOString();
  const consentId = parsed.data.consentId;

  const { data: revoked, error: consentError } = await session.supabase
    .from('consent_records')
    .update({ revoked_at: now })
    .eq('id', consentId)
    .eq('citizen_profile_id', session.citizenId)
    .select('id');

  if (consentError) {
    console.error('revokeConsent failed', consentError.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  if (!revoked || revoked.length === 0) {
    return { ok: false, error: 'Consent not found' };
  }

  const { error: grantError } = await session.supabase
    .from('profile_access_grants')
    .update({ revoked_at: now })
    .eq('source_consent_id', consentId)
    .eq('citizen_profile_id', session.citizenId);

  if (grantError) {
    console.error('revokeConsent failed', grantError.code);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath(HOUSEHOLD_PATH);
  return { ok: true };
}

export async function removeMember(input: RemoveMemberInput): Promise<ActionResult> {
  const parsed = removeMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const { data: membership, error: membershipError } = await session.supabase
    .from('household_members')
    .select('id, household_id, citizen_profile_id')
    .eq('id', parsed.data.membershipId)
    .maybeSingle();

  if (membershipError) {
    console.error('removeMember failed', membershipError.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  const member = membership as { id: string; household_id: string; citizen_profile_id: string } | null;
  if (!member) {
    return { ok: false, error: 'Member not found' };
  }

  const { data: household, error: householdError } = await session.supabase
    .from('households')
    .select('created_by_user_id')
    .eq('id', member.household_id)
    .maybeSingle();

  if (householdError) {
    console.error('removeMember failed', householdError.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  const creatorId = (household as { created_by_user_id: string } | null)?.created_by_user_id;
  if (!creatorId || !isCreatorOfHousehold(session.userId, { createdByUserId: creatorId })) {
    return { ok: false, error: 'Only the household creator can remove members' };
  }
  if (member.citizen_profile_id === session.citizenId) {
    return { ok: false, error: 'You cannot remove your own profile from the household' };
  }

  const { error: revokeError } = await session.supabase.rpc('revoke_membership_grants', {
    p_membership: member.id,
  });

  if (revokeError) {
    console.error('removeMember failed', revokeError.code);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath(HOUSEHOLD_PATH);
  return { ok: true };
}

export async function switchActiveProfile(input: SwitchProfileInput): Promise<SwitchResult> {
  const parsed = switchProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const denied: SwitchResult = { ok: false, error: 'You do not have access to that profile' };
  const citizenProfileId = parsed.data.citizenProfileId;

  const { data: profile, error: profileError } = await session.supabase
    .from('citizen_profiles')
    .select('id, owner_user_id')
    .eq('id', citizenProfileId)
    .maybeSingle();

  if (profileError) {
    console.error('switchActiveProfile failed', profileError.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  const owner = profile as { id: string; owner_user_id: string } | null;
  if (!owner) {
    return denied;
  }

  const { data: grantRows, error: grantError } = await session.supabase
    .from('profile_access_grants')
    .select('citizen_profile_id, grantee_user_id, access_level, sensitivity_tier, expires_at, revoked_at')
    .eq('citizen_profile_id', citizenProfileId)
    .eq('grantee_user_id', session.userId);

  if (grantError) {
    console.error('switchActiveProfile failed', grantError.code);
    return { ok: false, error: GENERIC_ERROR };
  }

  const grants: ProfileAccessGrant[] = ((grantRows ?? []) as GrantRow[]).map((row) => ({
    granteeUserId: row.grantee_user_id,
    citizenProfileId: row.citizen_profile_id,
    accessLevel: row.access_level,
    sensitivityTier: row.sensitivity_tier,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
  }));

  const allowed = canActOnProfile({
    actorUserId: session.userId,
    profile: { citizenProfileId: owner.id, ownerUserId: owner.owner_user_id },
    action: 'read',
    sensitivityTier: 'standard',
    grants,
    now: new Date(),
  });

  return allowed ? { ok: true, citizenProfileId: owner.id } : denied;
}
