/**
 * Well-Being Delta Widget
 *
 * Displays stress and control level changes over time.
 * Shows improvement/decline with visual indicators.
 */

'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WellBeingDeltaWidgetProps {
  stressDelta: number; // Positive = less stress (improvement)
  controlDelta: number; // Positive = more control (improvement)
  period: 14 | 30;
  checkinsCount: number;
  hasBaseline: boolean;
}

export function WellBeingDeltaWidget({
  stressDelta,
  controlDelta,
  period,
  checkinsCount,
  hasBaseline,
}: WellBeingDeltaWidgetProps) {
  const getDeltaState = (delta: number) => {
    if (delta > 0.5) return 'positive' as const;
    if (delta < -0.5) return 'negative' as const;
    return 'neutral' as const;
  };

  const getDeltaClasses = (delta: number) => {
    const state = getDeltaState(delta);
    if (state === 'positive') {
      return {
        icon: 'text-success',
        value: 'text-success',
        bar: 'bg-success',
      };
    }
    if (state === 'negative') {
      return {
        icon: 'text-destructive',
        value: 'text-destructive',
        bar: 'bg-destructive',
      };
    }
    return {
      icon: 'text-muted-foreground',
      value: 'text-muted-foreground',
      bar: 'bg-muted-foreground/50',
    };
  };

  if (!hasBaseline) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-3 font-semibold text-foreground">Well-Being Delta</h3>
        <p className="text-sm text-muted-foreground">
          Complete at least 2 check-ins in your first week to establish a baseline. Then we can show
          you how your well-being is trending.
        </p>
      </div>
    );
  }

  const getDeltaIcon = (delta: number) => {
    const classes = getDeltaClasses(delta);
    if (delta > 0.5) return <TrendingUp className={cn('h-5 w-5', classes.icon)} />;
    if (delta < -0.5) return <TrendingDown className={cn('h-5 w-5', classes.icon)} />;
    return <Minus className={cn('h-5 w-5', classes.icon)} />;
  };

  const getDeltaText = (delta: number) => {
    if (Math.abs(delta) < 0.5) return 'Stable';
    return delta > 0 ? 'Improving' : 'Declining';
  };

  const formatDelta = (delta: number) => {
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)}`;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="mb-1 font-semibold text-foreground">Well-Being Delta</h3>
        <p className="text-xs text-muted-foreground">
          {period}-day change compared to baseline ({checkinsCount} check-ins)
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Stress Delta */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Stress</span>
            {getDeltaIcon(stressDelta)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn('text-2xl font-semibold', getDeltaClasses(stressDelta).value)}>
              {formatDelta(stressDelta)}
            </span>
            <span className="text-xs text-muted-foreground">{getDeltaText(stressDelta)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full transition-all duration-500', getDeltaClasses(stressDelta).bar)}
              style={{
                width: `${Math.min(Math.abs(stressDelta) * 10, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Control Delta */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Control</span>
            {getDeltaIcon(controlDelta)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn('text-2xl font-semibold', getDeltaClasses(controlDelta).value)}>
              {formatDelta(controlDelta)}
            </span>
            <span className="text-xs text-muted-foreground">{getDeltaText(controlDelta)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full transition-all duration-500',
                getDeltaClasses(controlDelta).bar
              )}
              style={{
                width: `${Math.min(Math.abs(controlDelta) * 10, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Interpretation Help */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          <strong>Positive values</strong> indicate improvement from your baseline (first week).
          Lower stress and higher control are better.
        </p>
      </div>
    </div>
  );
}
