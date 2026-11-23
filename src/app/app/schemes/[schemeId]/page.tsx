import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/link-button';
import { getSchemeDetail } from '@/services/matching';
import { SchemeDetailActions } from './scheme-detail-actions';
import { resolveActiveCitizenId } from '@/app/app/profile/active-citizen';

export default async function SchemeDetailPage({
  params,
}: {
  params: Promise<{ schemeId: string }>;
}) {
  const { schemeId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/config-required');

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let citizenId: string | null = null;
  if (user) {
    citizenId = await resolveActiveCitizenId(supabase, user.id);
  }

  const result = await getSchemeDetail(supabase, schemeId, citizenId);
  if (!result || !result.scheme) {
    notFound();
  }

  const { scheme, version, assessment, documentReadiness, isSaved } = result;
  const sources = version?.scheme_sources ?? [];
  const rules = version?.scheme_rules ?? [];
  const documents = version?.scheme_documents ?? [];
  const steps = (version?.scheme_application_steps ?? []).sort(
    (a: any, b: any) => a.step_order - b.step_order,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/app/dashboard?tab=schemes"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-bold uppercase tracking-wider"
        >
          ← Return to Dashboard Schemes
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">
              {scheme.jurisdiction === 'central' ? 'Central Scheme' : scheme.state ?? 'West Bengal'}
            </Badge>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs capitalize text-muted-foreground">{scheme.category}</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {scheme.name}
          </h1>

          {scheme.name_bn && (
            <p className="mt-1 font-bengali text-lg text-muted-foreground">{scheme.name_bn}</p>
          )}

          {scheme.ministry_label && (
            <p className="mt-1 text-xs text-muted-foreground">{scheme.ministry_label}</p>
          )}
        </div>

        {citizenId && version && (
          <SchemeDetailActions
            schemeId={scheme.id}
            versionId={version.id}
            initialSaved={isSaved}
          />
        )}
      </div>

      {/* Personalized Evaluation Status Banner (if logged in) */}
      {assessment && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {assessment.outcome === 'likely_eligible' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : assessment.outcome === 'needs_more_info' ? (
                  <HelpCircle className="h-5 w-5 text-amber-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      Personalized Status:{' '}
                      {assessment.outcome === 'likely_eligible'
                        ? 'Likely Eligible'
                        : assessment.outcome === 'needs_more_info'
                        ? 'Needs More Information'
                        : 'Likely Ineligible'}
                    </span>
                    <Badge
                      tone={
                        assessment.outcome === 'likely_eligible'
                          ? 'success'
                          : assessment.outcome === 'needs_more_info'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {assessment.outcome}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{assessment.summary}</p>
                </div>
              </div>

              {assessment.missingFields.length > 0 && (
                <LinkButton variant="secondary" size="sm" href="/app/profile/personal">
                  Complete Missing Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </LinkButton>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefit Highlights */}
      {version?.benefit_summary_en && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Benefit Details
          </h2>
          <p className="mt-2 text-base font-medium text-foreground">{version.benefit_summary_en}</p>
          {version.benefit_summary_bn && (
            <p className="mt-1 font-bengali text-sm text-muted-foreground">
              {version.benefit_summary_bn}
            </p>
          )}
        </div>
      )}

      {/* Official Sources & Authority Banner */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 text-xs text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-1">
            <p className="font-semibold">Verified Official Government Information</p>
            <p>
              This scheme was verified against published government notifications. PRAPTI never
              invents eligibility criteria or deadlines.
            </p>
            {sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {sources.map((s: any) => (
                  <a
                    key={s.id}
                    href={s.url ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium underline hover:text-emerald-800"
                  >
                    {s.title} <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid: Rules + Documents */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Eligibility Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eligibility Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rules.length === 0 ? (
              <p className="text-xs text-muted-foreground">No specific rules published.</p>
            ) : (
              <ul className="space-y-3 text-xs">
                {rules.map((rule: any) => (
                  <li key={rule.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold capitalize text-foreground">
                        {rule.rule_kind} condition
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Clause: {rule.clause_reference}
                      </span>
                    </div>
                    <pre className="mt-2 overflow-x-auto rounded bg-muted/60 p-2 font-mono text-[11px] text-muted-foreground">
                      {JSON.stringify(rule.rule_json, null, 2)}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Required Documents Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Required Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No documents specified.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {documents.map((doc: any) => {
                  const docType = doc.document_types;
                  // Look up user status if documentReadiness is available
                  const userItem = documentReadiness?.items.find(
                    (i) => i.requirement.documentCode === docType?.code,
                  );
                  const isAvailable = userItem?.isReady;
                  const isApplied = userItem?.isInProgress;

                  return (
                    <div key={doc.id} className="flex items-start justify-between py-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {docType?.name ?? 'Document'}
                          </span>
                          {doc.is_mandatory && (
                            <span className="text-[10px] uppercase font-semibold text-rose-600">
                              Mandatory
                            </span>
                          )}
                        </div>
                        {doc.notes_en && (
                          <p className="mt-0.5 text-muted-foreground">{doc.notes_en}</p>
                        )}
                      </div>

                      {userItem ? (
                        <Badge tone={isAvailable ? 'success' : isApplied ? 'warning' : 'neutral'}>
                          {isAvailable ? 'Ready' : isApplied ? 'Applied' : 'Missing'}
                        </Badge>
                      ) : (
                        <Badge tone="neutral">Availability not recorded</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="pt-2">
              <LinkButton variant="ghost" size="sm" href="/app/profile/documents">
                <FileText className="mr-1.5 h-3.5 w-3.5" /> Update Document Inventory
              </LinkButton>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Official Step-by-Step Application Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Official Application Steps</CardTitle>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Official application steps have not yet been indexed for this scheme.
            </p>
          ) : (
            <ol className="relative border-l border-border pl-6 space-y-6 text-xs">
              {steps.map((step: any) => (
                <li key={step.id} className="relative">
                  <div className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card font-semibold text-primary">
                    {step.step_order}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{step.title_en}</h3>
                    {step.title_bn && (
                      <p className="font-bengali text-xs text-muted-foreground">{step.title_bn}</p>
                    )}
                    <p className="mt-1 text-muted-foreground leading-relaxed">{step.body_en}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {scheme.portal_url && (
            <div className="mt-6 border-t border-border pt-4">
              <a
                href={scheme.portal_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Apply on Official Government Portal <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                You will be redirected to the official government website ({scheme.portal_url}).
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

