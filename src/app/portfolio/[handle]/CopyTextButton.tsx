'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clipboard, ClipboardCheck, Loader2 } from 'lucide-react';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { cn } from '@/lib/utils';

type CopyTextButtonProps = {
  endpoint?: string;
  className?: string;
};

type CopyFeedback = {
  kind: 'success' | 'error';
  message: string;
};

const PROOF_SUMMARY_FETCH_RETRY_MESSAGE =
  'Proof summary could not be prepared. Refresh this page or try again.';
const PROOF_SUMMARY_MANUAL_COPY_MESSAGE =
  'Proof summary could not be copied. Select the summary below or try again.';

export function CopyTextButton({
  endpoint = '/api/portfolio/text-pack',
  className,
}: CopyTextButtonProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<CopyFeedback | null>(null);
  const [manualCopyText, setManualCopyText] = useState('');

  const handleCopy = async () => {
    let fetchedText = '';

    try {
      setLoading(true);
      setFeedback(null);
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch text pack');
      fetchedText = await res.text();
      await navigator.clipboard.writeText(fetchedText);
      setCopied(true);
      setManualCopyText('');
      setFeedback({ kind: 'success', message: 'Proof summary copied to clipboard.' });
      setTimeout(() => {
        setCopied(false);
        setFeedback(null);
      }, 1500);
    } catch (e) {
      dispatchClientErrorDiagnostic('portfolio.public_text_pack.copy_failed', e);
      setCopied(false);
      setManualCopyText(fetchedText);
      setFeedback({
        kind: 'error',
        message: fetchedText
          ? PROOF_SUMMARY_MANUAL_COPY_MESSAGE
          : PROOF_SUMMARY_FETCH_RETRY_MESSAGE,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-start">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        disabled={loading}
        className={cn('w-full justify-center gap-2 sm:w-auto', className)}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : copied ? (
          <ClipboardCheck className="h-4 w-4" />
        ) : (
          <Clipboard className="h-4 w-4" />
        )}
        {loading ? 'Preparing...' : copied ? 'Copied' : 'Copy proof summary'}
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
          {feedback.kind === 'error' && manualCopyText ? (
            <textarea
              aria-label="Proof summary for manual copy"
              className="min-h-24 w-full resize-y rounded-md border border-[#D9D5CC] bg-white px-2 py-2 text-xs leading-5 text-foreground"
              onFocus={(event) => event.currentTarget.select()}
              readOnly
              value={manualCopyText}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
