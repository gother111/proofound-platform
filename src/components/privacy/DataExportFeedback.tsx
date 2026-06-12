'use client';

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataExportFeedbackProps {
  kind: 'success' | 'error';
  title: string;
  children: ReactNode;
  className?: string;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
}

export function DataExportFeedback({
  kind,
  title,
  children,
  className,
  actionLabel,
  actionDisabled,
  onAction,
}: DataExportFeedbackProps) {
  const Icon = kind === 'error' ? AlertCircle : CheckCircle2;

  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      aria-live={kind === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'rounded-lg border p-3 text-sm',
        kind === 'error'
          ? 'border-[#F0D2B8] bg-[#FFF8F1] text-[#7A3A18]'
          : 'border-[#d8e6d2] bg-[#f5faf1] text-proofound-forest',
        className
      )}
    >
      <div className="flex gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-medium">{title}</p>
          <p className="mt-1 leading-5">{children}</p>
          {onAction && actionLabel ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAction}
              disabled={actionDisabled}
              className={cn(
                'mt-3 h-8 rounded-full bg-white px-3 text-xs font-semibold',
                kind === 'error'
                  ? 'border-[#F0D2B8] text-[#7A3A18] hover:bg-[#FFF1E3]'
                  : 'border-[#d8e6d2] text-proofound-forest hover:bg-[#edf7e8]'
              )}
            >
              {actionDisabled ? 'Trying again...' : actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
