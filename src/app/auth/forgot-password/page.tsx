'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/lib/validation/auth';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { t } from '@/lib/i18n/messages';

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    setServerError(null);
    setNotice(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setServerError(t('en', 'notConfigured'));
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    setNotice('If an account exists for this email, password recovery instructions have been dispatched.');
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
            {'//'} Account Access Recovery
          </p>
        </div>

        <div>
          <h1 className="font-pixel text-xl sm:text-2xl text-foreground">
            {t('en', 'forgotPassword')}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Enter your registered email to receive a secure password recovery link.
          </p>
        </div>

        {notice ? (
          <div className="space-y-4 border border-emerald-500/50 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300">
            <p className="font-bold">{'//'} Instructions Dispatched</p>
            <p>{notice}</p>
            <div className="pt-2">
              <Link
                href="/auth/sign-in"
                className="inline-block bg-foreground text-background px-4 py-2 text-xs font-bold uppercase tracking-wider"
              >
                Return to Sign In →
              </Link>
            </div>
          </div>
        ) : (
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
              {isSubmitting ? 'Sending Request...' : 'Send Recovery Link'}
            </button>
          </form>
        )}

        <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
          Remember your password?{' '}
          <Link href="/auth/sign-in" className="font-bold text-foreground hover:underline">
            {t('en', 'signIn')}
          </Link>
        </div>
      </div>
    </main>
  );
}
