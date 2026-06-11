'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clipboard, ClipboardCheck, Loader2 } from 'lucide-react';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

type CopyTextButtonProps = {
  endpoint?: string;
};

type CopyFeedback = {
  kind: 'success' | 'error';
  message: string;
};

export function CopyTextButton({ endpoint = '/api/portfolio/text-pack' }: CopyTextButtonProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<CopyFeedback | null>(null);

  const handleCopy = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch text pack');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFeedback({ kind: 'success', message: 'Proof summary copied to clipboard.' });
      setTimeout(() => {
        setCopied(false);
        setFeedback(null);
      }, 1500);
    } catch (e) {
      dispatchClientErrorDiagnostic('portfolio.public_text_pack.copy_failed', e);
      setCopied(false);
      setFeedback({ kind: 'error', message: 'Proof summary could not be copied. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <Button variant="outline" size="sm" onClick={handleCopy} disabled={loading} className="gap-2">
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
