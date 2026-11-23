import { PraptiLogo } from '@/components/prapti-logo';

export default function AppLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 font-mono text-foreground">
      <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
        {/* Animated Brand Mark */}
        <div className="h-12 w-12 border-2 border-foreground bg-card flex items-center justify-center rounded-[3px] shadow-sm">
          <PraptiLogo className="h-7 w-7 animate-pulse text-foreground" />
        </div>

        {/* Telemetry text */}
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground">
            {'//'} BENEFICIARY_WORKSPACE_LOADING
          </p>
          <p className="text-[11px] text-muted-foreground">
            Evaluating scheme eligibility rules and documents...
          </p>
        </div>

        {/* Monospace progress bar line */}
        <div className="w-52 h-1.5 bg-muted overflow-hidden rounded-full border border-border">
          <div className="h-full w-28 bg-foreground animate-[pulse_1s_infinite_ease-in-out]" />
        </div>
      </div>
    </div>
  );
}
