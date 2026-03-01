'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type AnalyzeProgressStatus = 'idle' | 'running' | 'completed' | 'failed';
export type AnalyzeProgressPhase =
  | 'preparing'
  | 'submitting'
  | 'extracting'
  | 'mapping'
  | 'finalizing';

export interface AnalyzeProgressState {
  status: AnalyzeProgressStatus;
  phase: AnalyzeProgressPhase;
  percent: number;
  message: string;
  startedAt?: number;
  completedAt?: number;
}

export const ANALYZE_PROGRESS_AUTO_COLLAPSE_MS = 4000;

const PHASE_LABELS: Record<AnalyzeProgressPhase, string> = {
  preparing: 'Preparing',
  submitting: 'Submitting',
  extracting: 'Extracting',
  mapping: 'Matching to taxonomy',
  finalizing: 'Finalizing',
};

export function createIdleAnalyzeProgressState(): AnalyzeProgressState {
  return {
    status: 'idle',
    phase: 'preparing',
    percent: 0,
    message: '',
  };
}

interface AnalyzeProgressPanelProps {
  progress: AnalyzeProgressState;
  className?: string;
}

function getPhaseLabel(progress: AnalyzeProgressState): string {
  if (progress.status === 'completed') {
    return 'Completed';
  }

  if (progress.status === 'failed') {
    return 'Failed';
  }

  return PHASE_LABELS[progress.phase];
}

export function AnalyzeProgressPanel({ progress, className }: AnalyzeProgressPanelProps) {
  if (progress.status === 'idle') {
    return null;
  }

  const roundedPercent = Math.max(0, Math.min(100, Math.round(progress.percent)));
  const isFailed = progress.status === 'failed';
  const isCompleted = progress.status === 'completed';

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        isCompleted && 'border-emerald-200 bg-emerald-50/60',
        isFailed && 'border-red-200 bg-red-50/60',
        !isCompleted && !isFailed && 'border-muted-foreground/20',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="inline-flex items-center gap-2 font-medium text-foreground">
          <span
            aria-hidden="true"
            className={cn(
              'inline-block h-2 w-2 rounded-full',
              isCompleted && 'bg-emerald-600',
              isFailed && 'bg-red-600',
              !isCompleted && !isFailed && 'bg-proofound-forest'
            )}
          />
          {getPhaseLabel(progress)}
        </span>
        <span className="font-medium tabular-nums">{roundedPercent}%</span>
      </div>

      <Progress
        value={roundedPercent}
        className="mt-2"
        indicatorClassName={cn(
          isCompleted && 'bg-emerald-600',
          isFailed && 'bg-red-600',
          !isCompleted && !isFailed && 'bg-proofound-forest'
        )}
      />

      <p
        role="status"
        aria-live="polite"
        className={cn(
          'mt-2 text-sm',
          isCompleted && 'text-emerald-700',
          isFailed && 'text-red-700',
          !isCompleted && !isFailed && 'text-muted-foreground'
        )}
      >
        {progress.message}
      </p>
    </div>
  );
}
