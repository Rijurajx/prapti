import { describe, it, expect, afterEach, vi } from 'vitest';

describe('isSupabaseConfigured', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns false when Supabase env vars are unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    vi.resetModules();
    const { isSupabaseConfigured } = await import('./env');
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('returns true when both env vars are set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key-value');
    vi.resetModules();
    const { isSupabaseConfigured } = await import('./env');
    expect(isSupabaseConfigured()).toBe(true);
  });
});
