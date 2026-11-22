import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canEditVersion, canRetireVersion, type VersionStatus } from '@/lib/schemes/versioning';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusNotice } from '@/components/ui/status-notice';
import {
  AddRuleForm,
  AddSourceForm,
  NewVersionButton,
  PublishButton,
  ReviewForm,
  RetireButton,
  SubmitReviewButton,
  VerifySourceButton,
} from '../scheme-forms';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_LABELS: Record<VersionStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  published: 'Published',
  retired: 'Retired',
};

type SchemeRow = { id: string; slug: string; name: string; status: VersionStatus };
type VersionRow = {
  id: string;
  version_number: number;
  status: VersionStatus;
  published_at: string | null;
};
type SourceRow = { id: string; title: string; verified_at: string | null };
type RuleRow = { id: string; clause_reference: string };

export default async function SchemeDetailPage({ params }: { params: Promise<{ schemeId: string }> }) {
  const { schemeId } = await params;
  if (!UUID_PATTERN.test(schemeId)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <StatusNotice tone="warning" title="We could not load this scheme">
        <p>Supabase is not configured.</p>
      </StatusNotice>
    );
  }

  const { data: schemeData, error: schemeError } = await supabase
    .from('schemes')
    .select('id, slug, name, status')
    .eq('id', schemeId)
    .maybeSingle();
  if (schemeError) {
    console.error('admin scheme load failed', schemeError.code);
    return (
      <StatusNotice tone="warning" title="We could not load this scheme">
        <p>Try again in a moment.</p>
      </StatusNotice>
    );
  }
  const scheme = schemeData as SchemeRow | null;
  if (!scheme) {
    notFound();
  }

  const { data: versionData, error: versionError } = await supabase
    .from('scheme_versions')
    .select('id, version_number, status, published_at')
    .eq('scheme_id', schemeId)
    .order('version_number', { ascending: false });
  if (versionError) {
    console.error('admin versions load failed', versionError.code);
  }
  const versions = (versionData ?? []) as VersionRow[];
  const latest = versions[0];

  let sources: SourceRow[] = [];
  let rules: RuleRow[] = [];
  if (latest) {
    const { data: sourceData, error: sourceError } = await supabase
      .from('scheme_sources')
      .select('id, title, verified_at')
      .eq('scheme_version_id', latest.id)
      .order('created_at', { ascending: true });
    const { data: ruleData, error: ruleError } = await supabase
      .from('scheme_rules')
      .select('id, clause_reference')
      .eq('scheme_version_id', latest.id)
      .order('created_at', { ascending: true });
    if (sourceError || ruleError) {
      console.error('admin version contents load failed', sourceError?.code ?? ruleError?.code);
    }
    sources = (sourceData ?? []) as SourceRow[];
    rules = (ruleData ?? []) as RuleRow[];
  }

  const editable =
    latest !== undefined &&
    canEditVersion({
      status: latest.status,
      versionNumber: latest.version_number,
      schemeId,
      publishedAt: latest.published_at ? new Date(latest.published_at) : null,
    });
  const retirable = latest !== undefined && canRetireVersion({
    status: latest.status,
    versionNumber: latest.version_number,
    schemeId,
    publishedAt: null,
  });

  return (
    <div>
      <PageHeader title={scheme.name} description={`${scheme.slug} · ${STATUS_LABELS[scheme.status]}`} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Versions</CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">This scheme has no versions yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {versions.map((v) => (
                <li key={v.id}>
                  Version {v.version_number}: {STATUS_LABELS[v.status]}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {latest ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sources for version {latest.version_number}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sources.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sources yet.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {sources.map((s) => (
                    <li key={s.id} className="space-y-1">
                      <span>{s.title}</span>
                      <span className="text-muted-foreground">
                        {' · '}
                        {s.verified_at ? 'Verified' : 'Not verified yet'}
                      </span>
                      {!s.verified_at && editable ? <VerifySourceButton sourceId={s.id} /> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {rules.length} {rules.length === 1 ? 'rule' : 'rules'}
              </p>
              {rules.length > 0 ? (
                <ul className="mt-2 list-inside list-disc text-sm">
                  {rules.map((r) => (
                    <li key={r.id}>{r.clause_reference}</li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>

          {editable ? (
            <>
              <AddSourceForm schemeVersionId={latest.id} />
              <AddRuleForm schemeVersionId={latest.id} sources={sources.map((s) => ({ id: s.id, title: s.title }))} />
              {latest.status === 'draft' ? <SubmitReviewButton schemeVersionId={latest.id} /> : null}
              {latest.status === 'in_review' ? (
                <>
                  <ReviewForm schemeVersionId={latest.id} />
                  <PublishButton schemeVersionId={latest.id} />
                </>
              ) : null}
            </>
          ) : (
            <NewVersionButton schemeId={schemeId} />
          )}

          {retirable ? <RetireButton schemeId={schemeId} /> : null}
        </div>
      ) : null}
    </div>
  );
}
