'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  createHouseholdSchema,
  inviteMemberSchema,
  consentSchema,
  INVITE_RELATIONSHIP_VALUES,
  type CreateHouseholdInput,
  type InviteMemberInput,
  type ConsentInput,
} from '@/lib/validation/household';
import {
  createHousehold,
  inviteMember,
  removeMember,
  recordConsent,
  revokeConsent,
  acceptInvitation,
  declineInvitation,
} from '@/app/app/household/actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusNotice } from '@/components/ui/status-notice';

const INPUT_CLASS =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

const RELATIONSHIP_LABELS: Record<(typeof INVITE_RELATIONSHIP_VALUES)[number], string> = {
  spouse: 'Spouse or partner',
  child: 'Child',
  parent: 'Parent',
  sibling: 'Sibling',
  other: 'Other family member',
};

type Message = { tone: 'success' | 'error'; text: string } | null;

function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function CreateHouseholdForm() {
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateHouseholdInput>({
    resolver: zodResolver(createHouseholdSchema, undefined, { raw: true }),
    defaultValues: { name: '' },
  });

  async function onSubmit(values: CreateHouseholdInput) {
    setMessage(null);
    const result = await createHousehold(values);
    if (result.ok) {
      setMessage({ tone: 'success', text: 'Your household is created.' });
      router.refresh();
    } else {
      setMessage({ tone: 'error', text: result.error });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a household</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-1">
            <label htmlFor="household-name" className="text-sm font-medium">
              Household name
            </label>
            <input id="household-name" type="text" className={INPUT_CLASS} {...register('name')} />
            <p className="text-xs text-muted-foreground">For example: The Sharma family.</p>
            <FieldError message={errors.name?.message} />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create household'}
          </Button>

          {message?.tone === 'error' && (
            <StatusNotice tone="danger" title="The household was not created">
              {message.text}
            </StatusNotice>
          )}
          {message?.tone === 'success' && (
            <p role="status" className="text-sm text-muted-foreground">
              {message.text}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export function InviteMemberForm({ householdId }: { householdId: string }) {
  const [message, setMessage] = useState<Message>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema, undefined, { raw: true }),
    defaultValues: { inviteeEmail: '', relationship: INVITE_RELATIONSHIP_VALUES[0] },
  });

  async function onSubmit(values: InviteMemberInput) {
    setMessage(null);
    setInviteLink(null);
    const result = await inviteMember(householdId, values);
    if (result.ok) {
      // The raw token is shown once here and is not stored anywhere on the page.
      setInviteLink(`${window.location.origin}/app/household/invite?token=${result.inviteToken}`);
      setMessage({ tone: 'success', text: 'Invitation created. Share this link once with the person you invited.' });
      reset({ inviteeEmail: '', relationship: values.relationship });
    } else {
      setMessage({ tone: 'error', text: result.error });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite a member</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-1">
            <label htmlFor="invitee-email" className="text-sm font-medium">
              Their email address
            </label>
            <input id="invitee-email" type="email" className={INPUT_CLASS} {...register('inviteeEmail')} />
            <FieldError message={errors.inviteeEmail?.message} />
          </div>

          <div className="space-y-1">
            <label htmlFor="invitee-relationship" className="text-sm font-medium">
              How are they related to you?
            </label>
            <select id="invitee-relationship" className={INPUT_CLASS} {...register('relationship')}>
              {INVITE_RELATIONSHIP_VALUES.map((value) => (
                <option key={value} value={value}>
                  {RELATIONSHIP_LABELS[value]}
                </option>
              ))}
            </select>
            <FieldError message={errors.relationship?.message} />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating invitation...' : 'Create invitation'}
          </Button>

          {message?.tone === 'error' && (
            <StatusNotice tone="danger" title="The invitation was not created">
              {message.text}
            </StatusNotice>
          )}
          {message?.tone === 'success' && inviteLink && (
            <div className="space-y-2">
              <p role="status" className="text-sm text-muted-foreground">
                {message.text}
              </p>
              <p className="break-all rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs">
                {inviteLink}
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export function RemoveMemberButton({ membershipId }: { membershipId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setError(null);
    setPending(true);
    const result = await removeMember({ membershipId });
    setPending(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="space-y-1">
      <Button type="button" variant="destructive" onClick={onClick} disabled={pending}>
        {pending ? 'Removing...' : 'Remove from household'}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function ConsentForm() {
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConsentInput>({
    resolver: zodResolver(consentSchema, undefined, { raw: true }),
    defaultValues: {
      granteeUserId: '',
      scope: 'profile_read',
      accessLevel: 'read',
      sensitivityTier: 'standard',
      expiresAt: '',
    },
  });

  // Keeps accessLevel in step with scope so the two always match.
  const scopeField = register('scope', {
    onChange: (e) => setValue('accessLevel', e.target.value === 'profile_edit' ? 'edit' : 'read'),
  });

  async function onSubmit(values: ConsentInput) {
    setMessage(null);
    const result = await recordConsent(values);
    if (result.ok) {
      setMessage({ tone: 'success', text: 'Your sharing choice is saved.' });
      router.refresh();
    } else {
      setMessage({ tone: 'error', text: result.error });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share your profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-1">
            <label htmlFor="grantee-user-id" className="text-sm font-medium">
              Member&apos;s account ID
            </label>
            <input id="grantee-user-id" type="text" className={INPUT_CLASS} {...register('granteeUserId')} />
            <FieldError message={errors.granteeUserId?.message} />
          </div>

          <div className="space-y-1">
            <label htmlFor="consent-scope" className="text-sm font-medium">
              What can they do?
            </label>
            <select id="consent-scope" className={INPUT_CLASS} {...scopeField}>
              <option value="profile_read">View my profile</option>
              <option value="profile_edit">View and change my profile</option>
            </select>
            <FieldError message={errors.scope?.message} />
          </div>

          <div className="space-y-1">
            <label htmlFor="consent-expires" className="text-sm font-medium">
              Ends on (optional)
            </label>
            <input id="consent-expires" type="date" className={INPUT_CLASS} {...register('expiresAt')} />
            <FieldError message={errors.expiresAt?.message} />
            <FieldError message={errors.accessLevel?.message} />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save sharing choice'}
          </Button>

          {message?.tone === 'error' && (
            <StatusNotice tone="danger" title="Your choice was not saved">
              {message.text}
            </StatusNotice>
          )}
          {message?.tone === 'success' && (
            <p role="status" className="text-sm text-muted-foreground">
              {message.text}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export function RevokeConsentButton({ consentId }: { consentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setError(null);
    setPending(true);
    const result = await revokeConsent({ consentId });
    setPending(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="space-y-1">
      <Button type="button" variant="destructive" onClick={onClick} disabled={pending}>
        {pending ? 'Stopping...' : 'Stop sharing'}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function InviteDecisionButtons({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  const [pending, setPending] = useState(false);

  async function onAccept() {
    setError(null);
    setPending(true);
    const result = await acceptInvitation({ token });
    setPending(false);
    if (result.ok) {
      router.push('/app/household');
    } else {
      setError(result.error);
    }
  }

  async function onDecline() {
    setError(null);
    setPending(true);
    const result = await declineInvitation({ token });
    setPending(false);
    if (result.ok) {
      setDeclined(true);
    } else {
      setError(result.error);
    }
  }

  if (declined) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        You have declined this invitation.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Button type="button" onClick={onAccept} disabled={pending}>
          {pending ? 'Please wait...' : 'Accept invitation'}
        </Button>
        <Button type="button" variant="secondary" onClick={onDecline} disabled={pending}>
          Decline
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
