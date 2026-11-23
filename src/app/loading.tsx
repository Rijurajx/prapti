import { PraptiLogo } from '@/components/prapti-logo';

export default function GlobalLoading() {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center p-6 font-mono text-foreground">
      <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
        {/* Animated Brand Mark */}
        <div className="h-12 w-12 border-2 border-foreground bg-card flex items-center justify-center rounded-[3px] shadow-sm">
          <PraptiLogo className="h-7 w-7 animate-pulse text-foreground" />
        </div>

        {/* Telemetry text */}
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground">
            {'//'} PRAPTI_WORKSPACE_SYNC
          </p>
          <p className="text-[11px] text-muted-foreground">
            Loading verified benefit records & citizen profile telemetry...
          </p>
        </div>

        {/* Monospace progress bar line */}
        <div className="w-48 h-1 bg-muted overflow-hidden rounded-full border border-border">
          <div className="h-full w-24 bg-foreground animate-[pulse_1s_infinite_ease-in-out]" />
        </div>
      </div>
    </div>
  );
}
