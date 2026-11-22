import { z } from 'zod';

export const RELATIONSHIP_VALUES = ['self', 'spouse', 'child', 'parent', 'sibling', 'other'] as const;
export type Relationship = (typeof RELATIONSHIP_VALUES)[number];

// Relationship 'self' is implicit for the household owner, so it cannot be invited.
export const INVITE_RELATIONSHIP_VALUES = ['spouse', 'child', 'parent', 'sibling', 'other'] as const;
export type InviteRelationship = (typeof INVITE_RELATIONSHIP_VALUES)[number];

export const CONSENT_SCOPE_VALUES = ['household_membership', 'profile_read', 'profile_edit'] as const;
export type ConsentScope = (typeof CONSENT_SCOPE_VALUES)[number];

export const ACCESS_LEVEL_VALUES = ['read', 'edit'] as const;
export type AccessLevel = (typeof ACCESS_LEVEL_VALUES)[number];

export const SENSITIVITY_TIER_VALUES = ['standard', 'sensitive'] as const;
export type SensitivityTier = (typeof SENSITIVITY_TIER_VALUES)[number];

export const createHouseholdSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a household name')
    .max(120, 'Keep the name under 120 characters'),
});
export type CreateHouseholdInput = z.input<typeof createHouseholdSchema>;
export type CreateHousehold = z.output<typeof createHouseholdSchema>;

export const inviteMemberSchema = z.object({
  inviteeEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address')
    .max(254),
  relationship: z.enum(INVITE_RELATIONSHIP_VALUES),
});
export type InviteMemberInput = z.input<typeof inviteMemberSchema>;
export type InviteMember = z.output<typeof inviteMemberSchema>;

export const tokenSchema = z.object({
  // 32 random bytes encoded as base64url is exactly 43 characters.
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'This invitation link is not valid'),
});
export type TokenInput = z.input<typeof tokenSchema>;
export type Token = z.output<typeof tokenSchema>;

/** Today's date as YYYY-MM-DD (UTC), used for string comparison. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const consentSchema = z
  .object({
    granteeUserId: z.string().uuid(),
    scope: z.enum(['profile_read', 'profile_edit']),
    accessLevel: z.enum(ACCESS_LEVEL_VALUES),
    sensitivityTier: z.enum(SENSITIVITY_TIER_VALUES),
    expiresAt: z
      .union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')])
      .transform((v) => (v === '' ? null : v)),
  })
  .refine(
    (v) =>
      (v.scope === 'profile_edit' && v.accessLevel === 'edit') ||
      (v.scope === 'profile_read' && v.accessLevel === 'read'),
    { message: 'Scope and access level must match', path: ['accessLevel'] },
  )
  .refine((v) => v.expiresAt === null || v.expiresAt >= todayIso(), {
    message: 'Expiry must be a future date',
    path: ['expiresAt'],
  });
export type ConsentInput = z.input<typeof consentSchema>;
export type Consent = z.output<typeof consentSchema>;

export const revokeConsentSchema = z.object({
  consentId: z.string().uuid(),
});
export type RevokeConsentInput = z.input<typeof revokeConsentSchema>;
export type RevokeConsent = z.output<typeof revokeConsentSchema>;

export const removeMemberSchema = z.object({
  membershipId: z.string().uuid(),
});
export type RemoveMemberInput = z.input<typeof removeMemberSchema>;
export type RemoveMember = z.output<typeof removeMemberSchema>;

export const switchProfileSchema = z.object({
  citizenProfileId: z.string().uuid(),
});
export type SwitchProfileInput = z.input<typeof switchProfileSchema>;
export type SwitchProfile = z.output<typeof switchProfileSchema>;
