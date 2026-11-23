'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, type SignInInput } from '@/lib/validation/auth';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { t } from '@/lib/i18n/messages';
import { ThemeToggle } from '@/components/theme-toggle';

export default function SignInPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  const onSubmit = async (values: SignInInput) => {
    setServerError(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setServerError(t('en', 'notConfigured'));
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-mono flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md border border-border bg-card p-6 sm:p-8 space-y-6">
        {/* Brand header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 bg-foreground" />
              <Link href="/" className="font-mono text-lg font-bold tracking-tight text-foreground">
                PRAPTI
              </Link>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {'//'} Citizen Benefits Workspace Access
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div>
          <h1 className="font-pixel text-xl sm:text-2xl text-foreground">
            {t('en', 'signIn')}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sign in to access your eligibility assessments and claim tracking.
          </p>
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              {t('en', 'email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`w-full border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none ${
                errors.email
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-border focus:border-foreground'
              }`}
              placeholder="citizen@example.in"
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                {t('en', 'password')}
              </label>
              <Link href="/forgot-password" className="text-[11px] text-muted-foreground hover:text-foreground hover:underline">
                {t('en', 'forgotPassword')}
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={`w-full border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none ${
                errors.password
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-border focus:border-foreground'
              }`}
              {...register('password')}
            />
            {errors.password && (
              <p id="password-error" role="alert" className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <div
              role="alert"
              className="border-2 border-red-500 bg-red-50 dark:bg-red-950/60 p-3 text-xs text-red-700 dark:text-red-300 font-semibold rounded-[3px] flex items-start gap-2 shadow-sm"
            >
              <span className="font-bold shrink-0">⚠️ ERROR:</span>
              <span>{serverError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-foreground text-background py-2.5 px-4 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Authenticating...' : t('en', 'signIn')}
          </button>
        </form>

        <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="font-bold text-foreground hover:underline">
            {t('en', 'signUp')}
          </Link>
        </div>
      </div>
    </main>
  );
}
