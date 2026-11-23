'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  CheckCircle2,
  HelpCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowRight,
  FileText,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { toggleSaveScheme, startApplicationClaim } from '@/app/schemes/actions';
import type { MatchedSchemeOpportunity } from '@/services/matching';

interface OpportunityCardProps {
  opportunity: MatchedSchemeOpportunity;
}

export function OpportunityCard({ opportunity: opp }: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(opp.isSaved ?? false);
  const [isPending, startTransition] = useTransition();
  const [claimStarted, setClaimStarted] = useState(false);

  const handleToggleSave = () => {
    startTransition(async () => {
      const res = await toggleSaveScheme(opp.schemeId);
      if (res.ok && res.isSaved !== undefined) {
        setIsSaved(res.isSaved);
      }
    });
  };

  const handleStartClaim = () => {
    startTransition(async () => {
      const res = await startApplicationClaim(opp.schemeId, opp.versionId);
      if (res.ok) {
        setClaimStarted(true);
      }
    });
  };

  const outcomeTone =
    opp.assessment.outcome === 'likely_eligible'
      ? 'success'
      : opp.assessment.outcome === 'needs_more_info'
      ? 'warning'
      : 'neutral';

  const outcomeLabel =
    opp.assessment.outcome === 'likely_eligible'
      ? 'Likely Eligible'
      : opp.assessment.outcome === 'needs_more_info'
      ? 'Needs More Information'
      : opp.assessment.outcome === 'likely_ineligible'
      ? 'Likely Ineligible'
      : 'Cannot Assess';

  const docReadiness = opp.documentReadiness;

  return (
    <Card className="transition-shadow duration-150 hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={outcomeTone}>{outcomeLabel}</Badge>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {opp.jurisdiction === 'central'
                  ? 'Central Scheme'
                  : opp.state
                  ? `${opp.state} Scheme`
                  : 'State Scheme'}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs capitalize text-muted-foreground">{opp.category}</span>
            </div>
            <CardTitle className="mt-2 text-lg sm:text-xl">
              <Link href={`/schemes/${opp.schemeId}`} className="hover:underline">
                {opp.schemeName}
              </Link>
            </CardTitle>
            {opp.schemeNameBn && (
              <p className="mt-0.5 font-bengali text-sm text-muted-foreground">
                {opp.schemeNameBn}
              </p>
            )}
            {opp.ministryLabel && (
              <CardDescription className="mt-1 text-xs">{opp.ministryLabel}</CardDescription>
            )}
            {opp.tags && opp.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {opp.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded px-1.5 py-0.5 text-[10px] font-mono font-bold bg-muted/80 text-foreground uppercase tracking-tight"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleSave}
              disabled={isPending}
              aria-label={isSaved ? 'Remove bookmark' : 'Bookmark scheme'}
              className={isSaved ? 'text-primary' : 'text-muted-foreground'}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {opp.benefitSummary && (
          <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
            <span className="font-medium text-foreground">Benefit: </span>
            <span className="text-muted-foreground">{opp.benefitSummary}</span>
          </div>
        )}

        {/* Document Readiness Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>
              Document readiness:{' '}
              <strong className="font-semibold text-foreground">
                {docReadiness.mandatoryReady} of {docReadiness.mandatoryTotal}
              </strong>{' '}
              required documents ready
            </span>
          </div>
          {docReadiness.isFullyReady ? (
            <Badge tone="success">Documents ready</Badge>
          ) : (
            <Badge tone="neutral">
              {docReadiness.mandatoryTotal - docReadiness.mandatoryReady} missing
            </Badge>
          )}
        </div>

        {/* Action Prompt for Eligible Citizens Missing Documents */}
        {opp.assessment.outcome === 'likely_eligible' && !docReadiness.isFullyReady && (
          <div className="rounded-md border border-amber-300 bg-amber-50/80 p-3 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <p className="font-bold uppercase tracking-tight">
                  You satisfy all eligibility criteria!
                </p>
                <p className="text-muted-foreground">
                  To complete your application, you only need to obtain or verify the following required document(s):
                </p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 font-medium">
                  {docReadiness.missingMandatoryDocuments.map((item) => (
                    <li key={item.requirement.documentCode}>
                      {item.requirement.documentName}
                      {item.requirement.notesEn ? ` (${item.requirement.notesEn})` : ''}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 pt-1">
                  <Link
                    href="/profile/documents"
                    className="inline-flex items-center gap-1 font-bold underline hover:text-amber-900"
                  >
                    Add to your Document Inventory in Profile <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Missing fields notification */}
        {opp.assessment.missingFields.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-medium">Information needed to verify: </span>
                <span>
                  Adding details for{' '}
                  <strong>{opp.assessment.missingFields.join(', ')}</strong> will help verify your
                  eligibility.
                </span>
                <div className="mt-2">
                  <Link
                    href="/profile/personal"
                    className="inline-flex items-center gap-1 font-medium underline hover:text-amber-950 dark:hover:text-amber-100"
                  >
                    Update your profile details <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expandable Evidence Trace */}
        <div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> Hide rule evaluation trace
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" /> View rule evaluation trace (
                {opp.assessment.traces.length} rules checked)
              </>
            )}
          </button>

          {expanded && (
            <div className="mt-3 space-y-2 rounded-md border border-border bg-card p-3 text-xs">
              <p className="font-medium text-foreground">Evaluation Trace (Kleene 3-Valued Logic):</p>
              <div className="divide-y divide-border/60">
                {opp.assessment.traces.map((trace, idx) => (
                  <div key={idx} className="flex items-start justify-between py-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        {trace.result === 'PASS' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : trace.result === 'FAIL' ? (
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        ) : (
                          <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                        )}
                        <span className="font-medium text-foreground">{trace.field}</span>
                        <span className="text-muted-foreground font-mono">
                          ({trace.op} {trace.expectedValue !== undefined ? JSON.stringify(trace.expectedValue) : ''})
                        </span>
                      </div>
                      <p className="text-muted-foreground">{trace.explanation}</p>
                      {trace.clauseReference && (
                        <p className="text-[11px] text-muted-foreground/80">
                          Official Citation: {trace.clauseReference}
                        </p>
                      )}
                    </div>
                    <Badge
                      tone={
                        trace.result === 'PASS'
                          ? 'success'
                          : trace.result === 'FAIL'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {trace.result}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <LinkButton variant="secondary" size="sm" href={`/schemes/${opp.schemeId}`}>
              View details & rules
            </LinkButton>
            {opp.portalUrl && (
              <a
                href={opp.portalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono uppercase bg-foreground text-background hover:bg-black rounded-[3px] transition-colors shadow-sm"
              >
                Apply on Official Portal <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <div>
            {claimStarted ? (
              <LinkButton variant="ghost" size="sm" href="/applications">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" /> Tracking in My Applications
              </LinkButton>
            ) : (
              <Button size="sm" onClick={handleStartClaim} disabled={isPending}>
                <Clock className="mr-1.5 h-3.5 w-3.5" /> Track in My Applications
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

