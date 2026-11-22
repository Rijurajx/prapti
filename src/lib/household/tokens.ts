import { createHash, randomBytes } from 'node:crypto';

export const INVITE_TOKEN_BYTES = 32;
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(INVITE_TOKEN_BYTES).toString('base64url');
  const tokenHash = hashInviteToken(token);
  return { token, tokenHash };
}

export function inviteExpiresAt(now: Date): Date {
  return new Date(now.getTime() + INVITE_TTL_MS);
}

export function isInviteUsable(
  invite: { status: string; expiresAt: Date },
  now: Date,
): boolean {
  return invite.status === 'pending' && now.getTime() < invite.expiresAt.getTime();
}
