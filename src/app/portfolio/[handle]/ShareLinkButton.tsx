'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { cn } from '@/lib/utils';

type ShareLinkButtonProps = {
  url: string;
  className?: string;
  surface?: 'public-page' | 'organization-trust-page';
};

type ShareFeedback = {
  kind: 'success' | 'error';
  message: string;
};

const SHARE_LINK_COPY = {
  'public-page': {
    copied: 'Public page link copied.',
    failed: 'Public page link could not be copied. Select the link below or try again.',
    manualLabel: 'Share link for manual copy',
  },
  'organization-trust-page': {
    copied: 'Organization trust page link copied.',
    failed: 'Organization trust page link could not be copied. Select the link below or try again.',
    manualLabel: 'Organization trust page link for manual copy',
  },
} as const;

export function ShareLinkButton({ url, className, surface = 'public-page' }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<ShareFeedback | null>(null);
  const copy = SHARE_LINK_COPY[surface];

  async function handleCopy() {
    try {
      setFeedback(null);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setFeedback({ kind: 'success', message: copy.copied });
      setTimeout(() => {
        setCopied(false);
        setFeedback(null);
      }, 1600);
    } catch (error) {
      dispatchClientErrorDiagnostic('portfolio.public_share_link.copy_failed', error);
      setCopied(false);
      setFeedback({
        kind: 'error',
        message: copy.failed,
      });
    }
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-start">
      <Button
        variant="outline"
        size="touch"
        onClick={handleCopy}
        className={cn(
          'w-full justify-center gap-2 border-proofound-stone/85 bg-white/60 text-proofound-charcoal shadow-none hover:border-proofound-forest/70 hover:bg-proofound-forest/5 hover:text-proofound-forest sm:w-auto',
          className
        )}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy share link'}
      </Button>
      {feedback ? (
        <div className="max-w-64 space-y-1.5">
          <p
            className={
              feedback.kind === 'error'
                ? 'text-xs leading-5 text-[#8A3F21]'
                : 'text-xs leading-5 text-proofound-forest'
            }
            role={feedback.kind === 'error' ? 'alert' : 'status'}
            aria-live={feedback.kind === 'error' ? 'assertive' : 'polite'}
          >
            {feedback.message}
          </p>
          {feedback.kind === 'error' ? (
            <input
              aria-label={copy.manualLabel}
              className="min-h-[44px] w-full rounded-md border border-[#D9D5CC] bg-white px-2 text-xs text-foreground"
              onFocus={(event) => event.currentTarget.select()}
              readOnly
              value={url}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
