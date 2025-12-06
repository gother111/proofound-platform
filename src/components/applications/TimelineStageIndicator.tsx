'use client';

import { cn } from '@/lib/utils';

interface TimelineStageIndicatorProps {
  label: string;
  status: 'completed' | 'current' | 'upcoming';
  description?: string | null;
  expectedDays?: number | null;
}

export function TimelineStageIndicator({
  label,
  status,
  description,
  expectedDays,
}: TimelineStageIndicatorProps) {
  const colors =
    status === 'completed'
      ? 'bg-emerald-500 border-emerald-600 text-white'
      : status === 'current'
        ? 'bg-white border-emerald-500 text-emerald-700 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
        : 'bg-white border-slate-200 text-slate-500';

  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          'h-9 w-9 flex items-center justify-center rounded-full border font-semibold text-sm transition-colors',
          colors
        )}
        aria-label={`${label} ${status}`}
      >
        {status === 'completed' ? '✓' : status === 'current' ? '•' : ''}
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {expectedDays ? (
          <p className="text-xs text-muted-foreground">{expectedDays} days expected</p>
        ) : null}
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  );
}
