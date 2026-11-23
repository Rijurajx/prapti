'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  updateClaimStatus,
  toggleTaskDone,
  updateClaimNote,
  type ClaimStatus,
} from './actions';

interface ClaimTask {
  id: string;
  step_order: number;
  title: string;
  description: string | null;
  is_done: boolean;
}

interface ClaimStatusEvent {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  occurred_at: string;
}

interface ClaimCardProps {
  claim: {
    id: string;
    status: ClaimStatus;
    reference_note: string | null;
    submitted_on_user_report: string | null;
    created_at: string;
    schemes: {
      id: string;
      slug: string;
      name: string;
      name_bn: string | null;
      portal_url: string | null;
      category: string;
      jurisdiction: string;
    };
    claim_tasks: ClaimTask[];
    claim_status_events: ClaimStatusEvent[];
  };
}

const STATUS_LABELS: Record<ClaimStatus, string> = {
  not_started: 'Not Started',
  preparing_documents: 'Preparing Documents',
  ready_to_apply: 'Ready to Apply',
  submitted: 'Submitted (User-Reported)',
  under_verification: 'Under Verification',
  approved: 'Approved (User-Reported)',
  rejected: 'Rejected (User-Reported)',
  withdrawn: 'Withdrawn',
};

const STATUS_TONES: Record<ClaimStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  not_started: 'neutral',
  preparing_documents: 'warning',
  ready_to_apply: 'info',
  submitted: 'info',
  under_verification: 'warning',
  approved: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
};

export function ClaimCard({ claim }: ClaimCardProps) {
  const [tasks, setTasks] = useState(claim.claim_tasks);
  const [currentStatus, setCurrentStatus] = useState<ClaimStatus>(claim.status);
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(true);
  const [note, setNote] = useState(claim.reference_note ?? '');
  const [isEditingNote, setIsEditingNote] = useState(false);

  const doneCount = tasks.filter((t) => t.is_done).length;
  const totalCount = tasks.length;

  const handleStatusChange = (newStatus: ClaimStatus) => {
    startTransition(async () => {
      const res = await updateClaimStatus(claim.id, newStatus);
      if (res.ok) {
        setCurrentStatus(newStatus);
      }
    });
  };

  const handleTaskToggle = (taskId: string, currentDone: boolean) => {
    const nextDone = !currentDone;
    // optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, is_done: nextDone } : t)),
    );

    startTransition(async () => {
      await toggleTaskDone(taskId, nextDone);
    });
  };

  const handleSaveNote = () => {
    startTransition(async () => {
      await updateClaimNote(claim.id, note);
      setIsEditingNote(false);
    });
  };

  return (
    <Card className="transition-all">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone={STATUS_TONES[currentStatus]}>
                {STATUS_LABELS[currentStatus]}
              </Badge>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {claim.schemes.jurisdiction === 'central' ? 'Central' : 'West Bengal'}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs capitalize text-muted-foreground">
                {claim.schemes.category}
              </span>
            </div>
            <CardTitle className="mt-2 text-lg">
              <Link href={`/schemes/${claim.schemes.id}`} className="hover:underline">
                {claim.schemes.name}
              </Link>
            </CardTitle>
            {claim.schemes.name_bn && (
              <p className="font-bengali text-sm text-muted-foreground">
                {claim.schemes.name_bn}
              </p>
            )}
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2">
            <label htmlFor={`status-${claim.id}`} className="sr-only">
              Update Status
            </label>
            <select
              id={`status-${claim.id}`}
              value={currentStatus}
              disabled={isPending}
              onChange={(e) => handleStatusChange(e.target.value as ClaimStatus)}
              className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="preparing_documents">Preparing Documents</option>
              <option value="ready_to_apply">Ready to Apply</option>
              <option value="submitted">Submitted</option>
              <option value="under_verification">Under Verification</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Application Checklist</span>
              <span>
                {doneCount} of {totalCount} completed
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(doneCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Task Checklist accordion */}
        {totalCount > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" /> Hide checklist tasks
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" /> View checklist tasks ({totalCount})
                </>
              )}
            </button>

            {expanded && (
              <div className="mt-3 divide-y divide-border/60 rounded-md border border-border bg-card p-3 text-xs">
                {tasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex cursor-pointer items-start gap-2.5 py-2 hover:bg-muted/30"
                  >
                    <input
                      type="checkbox"
                      checked={task.is_done}
                      onChange={() => handleTaskToggle(task.id, task.is_done)}
                      disabled={isPending}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div className="space-y-0.5">
                      <p
                        className={`font-medium ${
                          task.is_done
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {task.step_order}. {task.title}
                      </p>
                      {task.description && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes section */}
        <div className="rounded-md border border-border bg-muted/20 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Application Notes / Tracking ID:</span>
            {!isEditingNote && (
              <button
                type="button"
                onClick={() => setIsEditingNote(true)}
                className="text-xs text-primary hover:underline"
              >
                {note ? 'Edit' : 'Add Note'}
              </button>
            )}
          </div>

          {isEditingNote ? (
            <div className="space-y-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Application ID: WB2026/8912, Submitted at BDO Office on 15 Nov"
                className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveNote} disabled={isPending}>
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingNote(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {note || 'No notes added yet. Record your government portal applicant ID or submission dates here.'}
            </p>
          )}
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
          <Link
            href={`/schemes/${claim.schemes.id}`}
            className="text-primary hover:underline font-medium"
          >
            View scheme details & rules
          </Link>
          {claim.schemes.portal_url && (
            <a
              href={claim.schemes.portal_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              Official Government Portal <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

