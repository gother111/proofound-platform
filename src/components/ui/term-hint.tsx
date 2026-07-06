'use client';

import * as React from 'react';
import { HelpCircle } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type TermHintProps = {
  label: React.ReactNode;
  description: string;
  ariaLabel?: string;
  className?: string;
};

export function TermHint({ label, description, ariaLabel, className }: TermHintProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span>{label}</span>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
              aria-label={ariaLabel ?? 'Term explanation'}
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs leading-5">{description}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}
