'use client';

import { useState, useTransition } from 'react';
import { Bookmark, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { toggleSaveScheme, startApplicationClaim } from '@/app/app/schemes/actions';

interface SchemeDetailActionsProps {
  schemeId: string;
  versionId: string;
  initialSaved: boolean;
}

export function SchemeDetailActions({
  schemeId,
  versionId,
  initialSaved,
}: SchemeDetailActionsProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();
  const [hasStartedClaim, setHasStartedClaim] = useState(false);

  const handleToggleSave = () => {
    startTransition(async () => {
      const res = await toggleSaveScheme(schemeId);
      if (res.ok && res.isSaved !== undefined) {
        setIsSaved(res.isSaved);
      }
    });
  };

  const handleStartClaim = () => {
    startTransition(async () => {
      const res = await startApplicationClaim(schemeId, versionId);
      if (res.ok) {
        setHasStartedClaim(true);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleToggleSave}
        disabled={isPending}
        className={isSaved ? 'text-primary' : ''}
      >
        <Bookmark className={`mr-1.5 h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
        {isSaved ? 'Saved' : 'Save Scheme'}
      </Button>

      {hasStartedClaim ? (
        <LinkButton variant="ghost" size="sm" href="/app/applications">
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> View in Applications
        </LinkButton>
      ) : (
        <Button size="sm" onClick={handleStartClaim} disabled={isPending}>
          <Clock className="mr-1.5 h-3.5 w-3.5" /> Track Application
        </Button>
      )}
    </div>
  );
}

