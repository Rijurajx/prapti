'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { triggerPageLoading } from '@/components/route-progress-bar';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DemoPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loginDemo() {
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) {
          setErrorMsg('Supabase is not configured.');
          setStatus('error');
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'demo@prapti.app',
          password: 'DemoUser2025!',
        });

        if (error) {
          if (!cancelled) {
            setErrorMsg(error.message);
            setStatus('error');
          }
          return;
        }

        if (!cancelled && data.session) {
          setStatus('success');
          triggerPageLoading();
          router.push('/dashboard');
          router.refresh();
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err?.message || 'Failed to authenticate demo account.');
          setStatus('error');
        }
      }
    }

    loginDemo();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-background text-foreground font-mono flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md border border-border bg-card p-6 sm:p-8 space-y-6 text-center shadow-lg">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted text-[11px] font-bold uppercase tracking-wider text-muted-foreground border border-border">
            <span>{'//'} JUDGES EVALUATION ENVIRONMENT</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Entering Demo Family Workspace
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Loaded with 3 family members: <strong>Demo Daughter</strong> (24, Unemployed), <strong>Demo Father</strong> (61, Retired &amp; Pensioner with Assets), and <strong>Demo Mother</strong> (54, Housewife).
          </p>
        </div>

        {status === 'loading' && (
          <div className="py-6 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground animate-pulse">
              Authenticating credentials &amp; mounting live eligibility rules...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 flex flex-col items-center justify-center space-y-2 text-emerald-600 dark:text-emerald-400">
            <p className="text-sm font-bold">✓ Authenticated Successfully</p>
            <p className="text-xs text-muted-foreground">Redirecting to Dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs rounded text-left">
              <strong>Authentication Error:</strong> {errorMsg}
            </div>
            <div className="text-xs text-muted-foreground space-y-1 text-left bg-muted/40 p-3 rounded border border-border">
              <p className="font-bold text-foreground">Manual Credentials:</p>
              <p>Email: <code className="text-foreground">demo@prapti.app</code></p>
              <p>Password: <code className="text-foreground">DemoUser2025!</code></p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-2 text-xs font-bold uppercase bg-foreground text-background rounded hover:bg-foreground/90 transition-colors cursor-pointer"
              >
                Retry 1-Click Login
              </button>
              <Link
                href="/sign-in"
                className="py-2 px-3 text-xs font-bold border border-border rounded hover:bg-muted text-foreground transition-colors"
              >
                Sign In Page
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
