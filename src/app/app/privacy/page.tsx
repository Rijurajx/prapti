import { redirect } from 'next/navigation';
import { ShieldCheck, Download, Trash2, EyeOff, Lock } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ExportDataButton } from './export-data-button';

export default async function PrivacyPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/config-required');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: citizen } = await supabase
    .from('citizen_profiles')
    .select('id, full_name, is_minor')
    .eq('owner_user_id', user.id)
    .eq('relationship_to_owner', 'self')
    .maybeSingle();

  let exportData: Record<string, unknown> = { exported_at: new Date().toISOString() };

  if (citizen) {
    const [personal, address, finance, employment, education, agriculture, documents, claims] =
      await Promise.all([
        supabase.from('citizen_personal_details').select('*').eq('citizen_id', citizen.id).maybeSingle(),
        supabase.from('citizen_addresses').select('*').eq('citizen_id', citizen.id),
        supabase.from('citizen_financial_profiles').select('*').eq('citizen_id', citizen.id).maybeSingle(),
        supabase.from('citizen_employment_profiles').select('*').eq('citizen_id', citizen.id).maybeSingle(),
        supabase.from('education_records').select('*').eq('citizen_id', citizen.id),
        supabase.from('citizen_agricultural_profiles').select('*').eq('citizen_id', citizen.id).maybeSingle(),
        supabase.from('citizen_document_inventory').select('*').eq('citizen_id', citizen.id),
        supabase.from('claims').select('*').eq('citizen_id', citizen.id),
      ]);

    exportData = {
      user: { id: user.id, email: user.email },
      citizen: citizen,
      personal_details: personal.data,
      addresses: address.data,
      financial_profile: finance.data,
      employment_profile: employment.data,
      education_records: education.data,
      agricultural_profile: agriculture.data,
      document_inventory: documents.data,
      applications_tracked: claims.data,
      exported_at: new Date().toISOString(),
    };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Privacy & Data Protection"
        description="PRAPTI is built on Privacy by Design. You control your information, your family relationships, and your data."
      />

      {/* Privacy Guarantees */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <EyeOff className="mb-1 h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Zero Identity Numbers</CardTitle>
            <CardDescription className="text-xs">
              We never collect or store Aadhaar numbers, PAN, or voter IDs. Only document availability is recorded.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Lock className="mb-1 h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Row Level Security</CardTitle>
            <CardDescription className="text-xs">
              Every database table enforces PostgreSQL Row Level Security. No other user can access your data without explicit consent.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <ShieldCheck className="mb-1 h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Individual Consent</CardTitle>
            <CardDescription className="text-xs">
              Creating a household does not give the creator access to another adult&apos;s details without a signed consent record.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Data Export Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" /> Export Your Personal Data
          </CardTitle>
          <CardDescription className="text-xs">
            Download a complete machine-readable JSON copy of all details, records, and claims stored in your PRAPTI profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExportDataButton exportData={exportData} />
        </CardContent>
      </Card>
    </div>
  );
}

