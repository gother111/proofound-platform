'use client';

import { AlertTriangle, ArrowLeft, RefreshCcw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

type MessageThreadLoadFailureProps = {
  description: string;
  title?: string;
  isRetrying?: boolean;
  onBack?: () => void;
  onRetry: () => void;
};

export function MessageThreadLoadFailure({
  description,
  title = 'Thread messages could not load',
  isRetrying = false,
  onBack,
  onRetry,
}: MessageThreadLoadFailureProps) {
  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center bg-japandi-bg p-4">
      <div
        role="alert"
        className="w-full max-w-md rounded-2xl border border-proofound-stone/80 bg-white/80 p-6 shadow-sm"
      >
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="-ml-2 mb-4 md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        ) : null}

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1d6] text-[#8a5b00]">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="font-display text-xl font-semibold text-proofound-charcoal">{title}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-proofound-charcoal/70">
          <ShieldCheck className="h-3.5 w-3.5" />
          Privacy and reveal state were not changed.
        </p>
        <Button
          type="button"
          onClick={onRetry}
          loading={isRetrying}
          variant="outline"
          className="mt-5 w-full"
        >
          <RefreshCcw className="h-4 w-4" />
          Retry thread messages
        </Button>
      </div>
    </div>
  );
}
