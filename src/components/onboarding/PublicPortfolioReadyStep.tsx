'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Copy, ExternalLink } from 'lucide-react';

type PersonaType = 'individual' | 'organization';

interface PublicPortfolioReadyStepProps {
  persona: PersonaType;
  publicPortfolioUrl: string;
  onContinue: () => void;
  continueLabel?: string;
}

function normalizePortfolioUrl(input: string): string {
  const trimmed = input.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    if (typeof window === 'undefined') return trimmed;
    return new URL(trimmed, window.location.origin).toString();
  }

  return trimmed;
}

export function PublicPortfolioReadyStep({
  persona,
  publicPortfolioUrl,
  onContinue,
  continueLabel = 'Continue to app',
}: PublicPortfolioReadyStepProps) {
  const [copied, setCopied] = useState(false);
  const resolvedUrl = useMemo(
    () => normalizePortfolioUrl(publicPortfolioUrl),
    [publicPortfolioUrl]
  );

  const heading =
    persona === 'organization'
      ? 'Your organization portfolio is live'
      : 'Your public portfolio is live';

  const description =
    persona === 'organization'
      ? 'Day 1 win unlocked. Your public organization link is shareable now, and search engines stay off until you opt in.'
      : 'Day 1 win unlocked. Preview it, copy it, and share it right away. Search engines stay off until you opt in.';

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'portfolio_share_link_copied',
          entityType: 'profile',
          properties: {
            source: 'onboarding_success',
            persona,
          },
        }),
      });
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl rounded-2xl border-proofound-stone dark:border-border">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
          <CheckCircle2 className="h-7 w-7 text-proofound-forest" />
        </div>
        <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
          {heading}
        </CardTitle>
        <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl border border-proofound-stone bg-proofound-parchment/60 p-4 text-sm text-proofound-charcoal dark:border-border dark:bg-muted dark:text-foreground">
          <p className="mb-2 text-xs uppercase tracking-wide text-proofound-charcoal/60 dark:text-muted-foreground">
            Public portfolio URL
          </p>
          <p className="break-all font-mono text-sm">{resolvedUrl}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          <Button type="button" variant="outline" asChild className="gap-2">
            <Link
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                void fetch('/api/analytics/track', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    eventType: 'portfolio_preview_opened',
                    entityType: 'profile',
                    properties: {
                      source: 'onboarding_success',
                      persona,
                    },
                  }),
                });
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Preview portfolio
            </Link>
          </Button>
          <Button
            type="button"
            onClick={onContinue}
            className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
          >
            {continueLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
