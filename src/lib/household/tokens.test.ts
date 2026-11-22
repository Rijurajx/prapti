import { describe, it, expect } from 'vitest';
import {
  generateInviteToken,
  hashInviteToken,
  inviteExpiresAt,
  isInviteUsable,
  INVITE_TTL_MS,
} from './tokens';

describe('generateInviteToken / hashInviteToken', () => {
  it('returns a token whose hash matches tokenHash', () => {
    const { token, tokenHash } = generateInviteToken();
    expect(hashInviteToken(token)).toBe(tokenHash);
  });

  it('produces different tokens on each call', () => {
    const a = generateInviteToken();
    const b = generateInviteToken();
    expect(a.token).not.toBe(b.token);
  });

  it('produces a base64url token of length 43 (32 bytes)', () => {
    const { token } = generateInviteToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token).toHaveLength(43);
  });

  it('hashes to 64 hex chars deterministically', () => {
    const h1 = hashInviteToken('some-token');
    const h2 = hashInviteToken('some-token');
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    expect(h1).toBe(h2);
  });
});

describe('inviteExpiresAt', () => {
  it('is INVITE_TTL_MS after now', () => {
    const now = new Date('2025-06-01T00:00:00.000Z');
    expect(inviteExpiresAt(now).getTime() - now.getTime()).toBe(INVITE_TTL_MS);
  });
});

describe('isInviteUsable', () => {
  const now = new Date('2025-06-01T00:00:00.000Z');
  const expiresAt = new Date('2025-06-08T00:00:00.000Z');

  it('is true for pending and before expiry', () => {
    expect(isInviteUsable({ status: 'pending', expiresAt }, now)).toBe(true);
  });

  it('is false for accepted', () => {
    expect(isInviteUsable({ status: 'accepted', expiresAt }, now)).toBe(false);
  });

  it('is false for declined', () => {
    expect(isInviteUsable({ status: 'declined', expiresAt }, now)).toBe(false);
  });

  it('is false at exactly expiresAt', () => {
    expect(isInviteUsable({ status: 'pending', expiresAt }, expiresAt)).toBe(false);
  });

  it('is false after expiry', () => {
    const later = new Date(expiresAt.getTime() + 1);
    expect(isInviteUsable({ status: 'pending', expiresAt }, later)).toBe(false);
  });
});
