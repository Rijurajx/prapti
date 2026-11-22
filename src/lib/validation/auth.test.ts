import { describe, it, expect } from 'vitest';
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
} from './auth';

describe('signInSchema', () => {
  it('accepts a valid email and password', () => {
    const result = signInSchema.safeParse({
      email: 'citizen@example.com',
      password: 'correct-horse-1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a 4-character password', () => {
    const result = signInSchema.safeParse({
      email: 'citizen@example.com',
      password: 'abcd',
    });
    expect(result.success).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('rejects a password without a digit', () => {
    const result = signUpSchema.safeParse({
      fullName: 'Asha Devi',
      email: 'asha@example.com',
      password: 'onlyletters',
      confirmPassword: 'onlyletters',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched confirmPassword', () => {
    const result = signUpSchema.safeParse({
      fullName: 'Asha Devi',
      email: 'asha@example.com',
      password: 'password123',
      confirmPassword: 'password124',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword']);
    }
  });
});

describe('forgotPasswordSchema', () => {
  it('rejects a non-email value', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});
