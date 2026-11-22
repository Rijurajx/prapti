import type { ReactNode } from 'react';
import { Info, TriangleAlert, OctagonAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NoticeTone = 'info' | 'warning' | 'danger';

const toneClasses: Record<NoticeTone, string> = {
  info: 'border-primary/30 bg-primary/5',
  warning: 'border-warning/40 bg-warning/10',
  danger: 'border-destructive/40 bg-destructive/10',
};

const toneIcons = {
  info: Info,
  warning: TriangleAlert,
  danger: OctagonAlert,
} as const;

export function StatusNotice({
  tone = 'info',
  title,
  children,
}: {
  tone?: NoticeTone;
  title: string;
  children: ReactNode;
}) {
  const Icon = toneIcons[tone];

  return (
    <div role="status" className={cn('flex gap-3 rounded-lg border p-4 text-sm', toneClasses[tone])}>
      <Icon size={18} aria-hidden className="mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="font-medium text-foreground">{title}</p>
        <div className="mt-1 text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
