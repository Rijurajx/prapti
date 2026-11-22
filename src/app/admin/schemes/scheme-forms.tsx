'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  addRule,
  addSource,
  createNewVersion,
  createSchemeDraft,
  publishVersion,
  retireScheme,
  reviewVersion,
  submitForReview,
  verifySource,
  type ActionResult,
} from '@/app/admin/schemes/actions';
import {
  REVIEW_DECISION_VALUES,
  RULE_KIND_VALUES,
  SOURCE_TYPE_VALUES,
  reviewSchema,
  schemeDraftSchema,
  sourceSchema,
  type SchemeDraftInput,
  type SourceInput,
} from '@/lib/validation/scheme';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusNotice } from '@/components/ui/status-notice';

type Message = { tone: 'success' | 'error'; text: string } | null;

const INPUT_CLASS =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

const SOURCE_TYPE_LABELS: Record<(typeof SOURCE_TYPE_VALUES)[number], string> = {
  official_document: 'Official document',
  official_website: 'Official website',
  gazette: 'Gazette notification',
  other: 'Other',
};

const RULE_KIND_LABELS: Record<(typeof RULE_KIND_VALUES)[number], string> = {
  eligibility: 'Eligibility (who qualifies)',
  exclusion: 'Exclusion (who does not qualify)',
};

const DECISION_LABELS: Record<(typeof REVIEW_DECISION_VALUES)[number], string> = {
  approved: 'Approve',
  changes_requested: 'Request changes',
  rejected: 'Reject',
};

const reviewFormSchema = reviewSchema.omit({ schemeVersionId: true });
const ruleFormSchema = z.object({
  ruleKind: z.enum(RULE_KIND_VALUES),
  sourceId: z.string().uuid('Choose a source'),
  clauseReference: z.string().trim().min(1, 'Enter the clause reference').max(200),
  ruleJsonText: z.string().trim().min(2, 'Enter the rule as JSON').max(20000),
});
type RuleFormInput = z.input<typeof ruleFormSchema>;
type ReviewFormInput = z.input<typeof reviewFormSchema>;

function FormCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Feedback({ message }: { message: Message }) {
  if (!message) return null;
  if (message.tone === 'error') {
    return (
      <StatusNotice tone="danger" title="That did not work">
        {message.text}
      </StatusNotice>
    );
  }
  return (
    <p role="status" className="text-sm text-muted-foreground">
      {message.text}
    </p>
  );
}

/** A button that runs one server action with no fields, then refreshes the page. */
function RunButton({
  label,
  run,
  variant = 'secondary',
}: {
  label: string;
  run: () => Promise<ActionResult>;
  variant?: 'primary' | 'secondary' | 'destructive';
}) {
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    setMessage(null);
    const result = await run();
    setPending(false);
    if (result.ok) {
      setMessage({ tone: 'success', text: 'Saved.' });
      router.refresh();
    } else {
      setMessage({ tone: 'error', text: result.error });
    }
  }

  return (
    <div className="space-y-2">
      <Button variant={variant} disabled={pending} onClick={handleClick}>
        {pending ? 'Working...' : label}
      </Button>
      <Feedback message={message} />
    </div>
  );
}

export function NewVersionButton({ schemeId }: { schemeId: string }) {
  return <RunButton label="Start a new version" run={() => createNewVersion(schemeId)} />;
}

export function VerifySourceButton({ sourceId }: { sourceId: string }) {
  return <RunButton label="Mark as verified" run={() => verifySource({ id: sourceId })} />;
}

export function SubmitReviewButton({ schemeVersionId }: { schemeVersionId: string }) {
  return (
    <RunButton
      label="Submit for review"
      variant="primary"
      run={() => submitForReview(schemeVersionId)}
    />
  );
}

export function PublishButton({ schemeVersionId }: { schemeVersionId: string }) {
  return (
    <RunButton
      label="Publish this version"
      variant="primary"
      run={() => publishVersion({ schemeVersionId })}
    />
  );
}

export function RetireButton({ schemeId }: { schemeId: string }) {
  return (
    <RunButton
      label="Retire this scheme"
      variant="destructive"
      run={() => retireScheme({ id: schemeId })}
    />
  );
}

export function CreateSchemeForm() {
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SchemeDraftInput>({
    resolver: zodResolver(schemeDraftSchema, undefined, { raw: true }),
    defaultValues: { slug: '', name: '' },
  });

  async function onSubmit(values: SchemeDraftInput) {
    setMessage(null);
    const result = await createSchemeDraft(values);
    if (result.ok) {
      router.push(`/admin/schemes/${result.id}`);
    } else {
      setMessage({ tone: 'error', text: result.error });
    }
  }

  return (
    <FormCard title="Create a scheme draft">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="scheme-name" className="text-sm font-medium">
            Scheme name
          </label>
          <input id="scheme-name" type="text" className={INPUT_CLASS} {...register('name')} />
          {errors.name && (
            <p role="alert" className="text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="scheme-slug" className="text-sm font-medium">
            Short name for links
          </label>
          <input id="scheme-slug" type="text" className={INPUT_CLASS} {...register('slug')} />
          <p className="text-xs text-muted-foreground">Lowercase letters, digits and hyphens.</p>
          {errors.slug && (
            <p role="alert" className="text-sm text-destructive">
              {errors.slug.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create draft'}
        </Button>
        <Feedback message={message} />
      </form>
    </FormCard>
  );
}

export function AddSourceForm({ schemeVersionId }: { schemeVersionId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SourceInput>({
    resolver: zodResolver(sourceSchema, undefined, { raw: true }),
    defaultValues: { sourceType: 'official_document', title: '', url: '', publishedOn: '' },
  });

  async function onSubmit(values: SourceInput) {
    setMessage(null);
    const result = await addSource({ schemeVersionId, source: values });
    if (result.ok) {
      reset();
      setMessage({ tone: 'success', text: 'Source added.' });
      router.refresh();
    } else {
      setMessage({ tone: 'error', text: result.error });
    }
  }

  return (
    <FormCard title="Add a source">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="source-type" className="text-sm font-medium">
            Type of source
          </label>
          <select id="source-type" className={INPUT_CLASS} {...register('sourceType')}>
            {SOURCE_TYPE_VALUES.map((value) => (
              <option key={value} value={value}>
                {SOURCE_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
          {errors.sourceType && (
            <p role="alert" className="text-sm text-destructive">
              {errors.sourceType.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="source-title" className="text-sm font-medium">
            Title
          </label>
          <input id="source-title" type="text" className={INPUT_CLASS} {...register('title')} />
          {errors.title && (
            <p role="alert" className="text-sm text-destructive">
              {errors.title.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="source-url" className="text-sm font-medium">
            Link (optional)
          </label>
          <input id="source-url" type="url" className={INPUT_CLASS} {...register('url')} />
          {errors.url && (
            <p role="alert" className="text-sm text-destructive">
              {errors.url.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="source-published" className="text-sm font-medium">
            Date published (optional)
          </label>
          <input id="source-published" type="date" className={INPUT_CLASS} {...register('publishedOn')} />
          {errors.publishedOn && (
            <p role="alert" className="text-sm text-destructive">
              {errors.publishedOn.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add source'}
        </Button>
        <Feedback message={message} />
      </form>
    </FormCard>
  );
}

export function AddRuleForm({
  schemeVersionId,
  sources,
}: {
  schemeVersionId: string;
  sources: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RuleFormInput>({
    resolver: zodResolver(ruleFormSchema, undefined, { raw: true }),
    defaultValues: { ruleKind: 'eligibility', sourceId: '', clauseReference: '', ruleJsonText: '' },
  });

  async function onSubmit(values: RuleFormInput) {
    setMessage(null);
    let ruleJson: unknown;
    try {
      ruleJson = JSON.parse(values.ruleJsonText);
    } catch {
      setMessage({ tone: 'error', text: 'The rule must be valid JSON' });
      return;
    }
    if (typeof ruleJson !== 'object' || ruleJson === null || Array.isArray(ruleJson)) {
      setMessage({ tone: 'error', text: 'The rule must be a JSON object' });
      return;
    }
    const result = await addRule({
      schemeVersionId,
      ruleKind: values.ruleKind,
      ruleJson,
      sourceId: values.sourceId,
      clauseReference: values.clauseReference,
    });
    if (result.ok) {
      reset();
      setMessage({ tone: 'success', text: 'Rule added.' });
      router.refresh();
    } else {
      setMessage({ tone: 'error', text: result.error });
    }
  }

  return (
    <FormCard title="Add a rule">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="rule-kind" className="text-sm font-medium">
            Kind of rule
          </label>
          <select id="rule-kind" className={INPUT_CLASS} {...register('ruleKind')}>
            {RULE_KIND_VALUES.map((value) => (
              <option key={value} value={value}>
                {RULE_KIND_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="rule-source" className="text-sm font-medium">
            Source this rule comes from
          </label>
          <select id="rule-source" className={INPUT_CLASS} {...register('sourceId')}>
            <option value="">Choose a source</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          {errors.sourceId && (
            <p role="alert" className="text-sm text-destructive">
              {errors.sourceId.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="rule-clause" className="text-sm font-medium">
            Clause reference
          </label>
          <input id="rule-clause" type="text" className={INPUT_CLASS} {...register('clauseReference')} />
          {errors.clauseReference && (
            <p role="alert" className="text-sm text-destructive">
              {errors.clauseReference.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="rule-json" className="text-sm font-medium">
            Rule (JSON object)
          </label>
          <textarea id="rule-json" rows={5} className={INPUT_CLASS} {...register('ruleJsonText')} />
          {errors.ruleJsonText && (
            <p role="alert" className="text-sm text-destructive">
              {errors.ruleJsonText.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add rule'}
        </Button>
        <Feedback message={message} />
      </form>
    </FormCard>
  );
}

export function ReviewForm({ schemeVersionId }: { schemeVersionId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormInput>({
    resolver: zodResolver(reviewFormSchema, undefined, { raw: true }),
    defaultValues: { decision: 'approved', comment: '' },
  });

  async function onSubmit(values: ReviewFormInput) {
    setMessage(null);
    const result = await reviewVersion({
      schemeVersionId,
      decision: values.decision,
      comment: values.comment,
    });
    if (result.ok) {
      setMessage({ tone: 'success', text: 'Review recorded.' });
      router.refresh();
    } else {
      setMessage({ tone: 'error', text: result.error });
    }
  }

  return (
    <FormCard title="Record a review">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="review-decision" className="text-sm font-medium">
            Decision
          </label>
          <select id="review-decision" className={INPUT_CLASS} {...register('decision')}>
            {REVIEW_DECISION_VALUES.map((value) => (
              <option key={value} value={value}>
                {DECISION_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="review-comment" className="text-sm font-medium">
            Comment (optional)
          </label>
          <textarea id="review-comment" rows={3} className={INPUT_CLASS} {...register('comment')} />
          {errors.comment && (
            <p role="alert" className="text-sm text-destructive">
              {errors.comment.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Record review'}
        </Button>
        <Feedback message={message} />
      </form>
    </FormCard>
  );
}
