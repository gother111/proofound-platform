'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

type ShareLinkButtonProps = {
  url: string;
};

export function ShareLinkButton({ url }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  function trackShareLinkCopied() {
    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'portfolio_share_link_copied',
        entityType: 'profile',
        properties: { source: 'portfolio_share_link_button' },
      }),
    }).catch(() => undefined);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      trackShareLinkCopied();
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied' : 'Copy share link'}
    </Button>
  );
}
