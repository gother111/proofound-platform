'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { cn } from '@/lib/utils';

type ShareLinkButtonProps = {
  url: string;
  className?: string;
};

type ShareFeedback = {
  kind: 'success' | 'error';
  message: string;
};

export function ShareLinkButton({ url, className }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<ShareFeedback | null>(null);

  async function handleCopy() {
    try {
      setFeedback(null);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setFeedback({ kind: 'success', message: 'Public page link copied.' });
      setTimeout(() => {
        setCopied(false);
        setFeedback(null);
      }, 1600);
    } catch (error) {
      dispatchClientErrorDiagnostic('portfolio.public_share_link.copy_failed', error);
      setCopied(false);
      setFeedback({
        kind: 'error',
        message: 'Public page link could not be copied. Try again.',
      });
    }
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-start">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className={cn('w-full justify-center gap-2 sm:w-auto', className)}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy share link'}
      </Button>
      {feedback ? (
        <p
          className={
            feedback.kind === 'error'
              ? 'max-w-64 text-xs leading-5 text-[#8A3F21]'
              : 'max-w-64 text-xs leading-5 text-proofound-forest'
          }
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          aria-live={feedback.kind === 'error' ? 'assertive' : 'polite'}
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
