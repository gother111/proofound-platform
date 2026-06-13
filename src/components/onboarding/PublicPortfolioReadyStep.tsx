'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

type PersonaType = 'individual' | 'organization';

interface PublicPortfolioReadyStepProps {
  persona: PersonaType;
  publicPortfolioUrl: string;
  onContinue: () => void;
  continueLabel?: string;
}

type CopyFeedback = {
  kind: 'success' | 'error';
  message: string;
};

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
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback | null>(null);
  const resolvedUrl = useMemo(
    () => normalizePortfolioUrl(publicPortfolioUrl),
    [publicPortfolioUrl]
  );

  const heading =
    persona === 'organization' ? 'Your organization portfolio is live' : 'Your Public Page is live';

  const description =
    persona === 'organization'
      ? 'Day 1 proof link ready. Your public organization link is shareable now, and search engines stay off until you opt in.'
      : 'Day 1 proof link ready. Preview it, copy it, and share it by direct link. Search engines stay off until you opt in.';

  async function handleCopy() {
    try {
      setCopyFeedback(null);
      await navigator.clipboard.writeText(resolvedUrl);
      setCopied(true);
      setCopyFeedback({ kind: 'success', message: 'Portfolio link copied.' });
      window.setTimeout(() => {
        setCopied(false);
        setCopyFeedback(null);
      }, 1600);
    } catch (error) {
      dispatchClientErrorDiagnostic('onboarding.public_portfolio_ready.copy_failed', error);
      setCopied(false);
      setCopyFeedback({
        kind: 'error',
        message: 'Portfolio link could not be copied. Try again.',
      });
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
            {persona === 'organization' ? 'Public portfolio URL' : 'Public Page URL'}
          </p>
          <p className="break-all font-mono text-sm">{resolvedUrl}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-start">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="w-full justify-center gap-2 sm:w-auto"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            {copyFeedback ? (
              <div className="max-w-64 space-y-1.5">
                <p
                  className={
                    copyFeedback.kind === 'error'
                      ? 'text-xs leading-5 text-[#8A3F21]'
                      : 'text-xs leading-5 text-proofound-forest'
                  }
                  role={copyFeedback.kind === 'error' ? 'alert' : 'status'}
                  aria-live={copyFeedback.kind === 'error' ? 'assertive' : 'polite'}
                >
                  {copyFeedback.message}
                </p>
                {copyFeedback.kind === 'error' ? (
                  <input
                    aria-label="Portfolio link for manual copy"
                    className="min-h-10 w-full rounded-md border border-proofound-stone bg-white px-2 text-xs text-proofound-charcoal dark:border-border dark:bg-background dark:text-foreground"
                    onFocus={(event) => event.currentTarget.select()}
                    readOnly
                    value={resolvedUrl}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            asChild
            className="w-full justify-center gap-2 sm:w-auto"
          >
            <Link href={resolvedUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {persona === 'organization' ? 'Preview portfolio' : 'Preview Public Page'}
            </Link>
          </Button>
          <Button
            type="button"
            onClick={onContinue}
            className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90 sm:w-auto"
          >
            {continueLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
