'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clipboard, ClipboardCheck, Loader2 } from 'lucide-react';

export function CopyTextButton() {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/portfolio/text-pack');
      if (!res.ok) throw new Error('Failed to fetch text pack');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
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
      {loading ? 'Preparing...' : copied ? 'Copied' : 'Copy text pack'}
    </Button>
  );
}
