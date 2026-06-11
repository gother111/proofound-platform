'use client';

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface DataExportFeedbackProps {
  kind: 'success' | 'error';
  title: string;
  children: ReactNode;
  className?: string;
}

export function DataExportFeedback({ kind, title, children, className }: DataExportFeedbackProps) {
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
        </div>
      </div>
    </div>
  );
}
