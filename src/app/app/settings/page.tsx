import { redirect } from 'next/navigation';
import { Settings, Globe, Bell } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { updateUserSettings } from './actions';

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/config-required');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, preferred_language')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account preferences, display name, and preferred language."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile & Language</CardTitle>
          <CardDescription>
            Choose your preferred display name and language for the PRAPTI interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateUserSettings} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="email" className="text-xs font-medium text-foreground">
                Email Address
              </label>
              <input
                id="email"
                type="text"
                disabled
                value={user.email ?? ''}
                className="mt-1 w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Managed by your authentication account.
              </p>
            </div>

            <div>
              <label htmlFor="fullName" className="text-xs font-medium text-foreground">
                Display Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                defaultValue={profile?.full_name ?? ''}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="language" className="text-xs font-medium text-foreground">
                Preferred Interface Language
              </label>
              <select
                id="language"
                name="language"
                defaultValue={profile?.preferred_language ?? 'en'}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                <option value="en">English</option>
                <option value="bn">বাংলা (Bengali)</option>
              </select>
            </div>

            <div className="pt-2">
              <Button type="submit" size="sm">
                Save Preferences
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

