'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clipboard, ClipboardCheck, Loader2 } from 'lucide-react';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

type CopyTextButtonProps = {
  endpoint?: string;
};

export function CopyTextButton({ endpoint = '/api/portfolio/text-pack' }: CopyTextButtonProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      setLoading(true);
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch text pack');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      dispatchClientErrorDiagnostic('portfolio.public_text_pack.copy_failed', e);
      alert('Could not copy text pack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}
