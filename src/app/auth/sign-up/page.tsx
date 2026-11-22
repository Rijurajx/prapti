'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpInput } from '@/lib/validation/auth';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { t } from '@/lib/i18n/messages';

export default function SignUpPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  const onSubmit = async (values: SignUpInput) => {
    setServerError(null);
    setNotice(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setServerError(t('en', 'notConfigured'));
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    if (!data.session) {
      setNotice('Confirmation link sent! Please check your email to verify your citizen account, then sign in.');
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-mono flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md border border-border bg-card p-6 sm:p-8 space-y-6">
        {/* Brand header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 bg-foreground" />
            <Link href="/" className="font-pixel text-lg font-bold tracking-tight text-foreground">
              PRAPTI
            </Link>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {'//'} Register New Citizen Profile
          </p>
        </div>

        <div>
          <h1 className="font-pixel text-xl sm:text-2xl text-foreground">
            {t('en', 'signUp')}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create your account to discover benefits and evaluate verified government schemes.
          </p>
        </div>

        {notice ? (
          <div className="space-y-4 border border-emerald-500/50 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300">
            <p className="font-bold">{'//'} Verification Email Sent</p>
            <p>{notice}</p>
            <div className="pt-2">
              <Link
                href="/auth/sign-in"
                className="inline-block bg-foreground text-background px-4 py-2 text-xs font-bold uppercase tracking-wider"
              >
                Go to Sign In →
              </Link>
            </div>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                {t('en', 'fullName')}
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                aria-invalid={errors.fullName ? 'true' : 'false'}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                className="w-full border border-border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
                placeholder="Full Legal Name"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p id="fullName-error" role="alert" className="text-xs text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

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
                className="w-full border border-border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
                placeholder="citizen@example.in"
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                {t('en', 'password')}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className="w-full border border-border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
                {...register('password')}
              />
              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {serverError && (
              <div className="border border-destructive/50 bg-destructive/10 p-2.5 text-xs text-destructive">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-foreground text-background py-2.5 px-4 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Creating Profile...' : t('en', 'signUp')}
            </button>
          </form>
        )}

        <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
          Already registered?{' '}
          <Link href="/auth/sign-in" className="font-bold text-foreground hover:underline">
            {t('en', 'signIn')}
          </Link>
        </div>
      </div>
    </main>
  );
}
