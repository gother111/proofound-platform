'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

type PersonaType = 'individual' | 'organization';
type PublishResult = void | { success?: boolean; error?: string };

interface PublicPortfolioReadyStepProps {
  persona: PersonaType;
  publicPortfolioUrl: string;
  onContinue: () => void;
  continueLabel?: string;
  onDecline?: () => void;
  declineLabel?: string;
  onPublish?: () => Promise<PublishResult> | PublishResult;
  initiallyPublished?: boolean;
  previewTitle?: string;
  previewDescription?: string;
  notice?: string | null;
}

type CopyFeedback = {
  kind: 'success' | 'error';
  message: string;
};

const COPY_FAILURE_MESSAGES: Record<PersonaType, string> = {
  individual: 'Portfolio link could not be copied. Select the link below or try again.',
  organization:
    'Organization trust page link could not be copied. Select the link below or try again.',
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
  continueLabel,
  onDecline,
  declineLabel = 'Not now, go to home',
  onPublish,
  initiallyPublished,
  previewTitle,
  previewDescription,
  notice,
}: PublicPortfolioReadyStepProps) {
  const [isPublished, setIsPublished] = useState(initiallyPublished ?? !onPublish);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback | null>(null);
  const resolvedUrl = useMemo(
    () => normalizePortfolioUrl(publicPortfolioUrl),
    [publicPortfolioUrl]
  );

  const heading =
    persona === 'organization'
      ? isPublished
        ? 'Your organization trust page is live'
        : 'Your organization trust page is ready'
      : isPublished
        ? 'Your Public Page is live'
        : 'Your Public Page is ready';

  const description =
    persona === 'organization'
      ? 'Public Page link ready. Publish by direct link, preview it, copy it, and share it. Search engines stay off until you opt in.'
      : 'Public Page link ready. Publish by direct link, preview it, copy it, and share it. Verification upgrades the trust badge later.';

  async function handlePublish(checked: boolean) {
    if (!checked || isPublished || isPublishing) return;

    setIsPublishing(true);
    setPublishError(null);

    try {
      const result = await onPublish?.();
      if (result && 'error' in result && result.error) {
        throw new Error(result.error);
      }
      setIsPublished(true);
    } catch (error) {
      setPublishError(
        error instanceof Error
          ? error.message
          : 'Could not publish your Public Page. Try again from the profile visibility tab.'
      );
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleCopy() {
    if (!isPublished || !resolvedUrl) return;

    try {
      setCopyFeedback(null);
      await navigator.clipboard.writeText(resolvedUrl);
      setCopied(true);
      setCopyFeedback({
        kind: 'success',
        message:
          persona === 'organization'
            ? 'Organization trust page link copied.'
            : 'Portfolio link copied.',
      });
      window.setTimeout(() => {
        setCopied(false);
        setCopyFeedback(null);
      }, 1600);
    } catch (error) {
      dispatchClientErrorDiagnostic('onboarding.public_portfolio_ready.copy_failed', error);
      setCopied(false);
      setCopyFeedback({
        kind: 'error',
        message: COPY_FAILURE_MESSAGES[persona],
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
        <div
          className="rounded-xl border border-proofound-stone bg-white p-4 text-sm text-proofound-charcoal dark:border-border dark:bg-background dark:text-foreground"
          aria-label="Portfolio preview"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-proofound-charcoal/60 dark:text-muted-foreground">
                Portfolio preview
              </p>
              <h2 className="mt-1 font-['Crimson_Pro'] text-xl font-semibold">
                {previewTitle ||
                  (persona === 'organization'
                    ? 'Organization trust page'
                    : 'First proof record')}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-proofound-stone bg-proofound-parchment px-3 py-1 text-xs font-medium text-proofound-charcoal dark:border-border dark:bg-muted dark:text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-proofound-forest" aria-hidden="true" />
              Self-reported
            </span>
          </div>
          <p className="mt-3 text-proofound-charcoal/70 dark:text-muted-foreground">
            {previewDescription ||
              'Your first structured proof can be shared with a Self-reported badge. Accepted verification upgrades the badge to Verified ✓ without blocking publication.'}
          </p>
        </div>

        {notice ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
            {notice}
          </div>
        ) : null}

        <div className="rounded-xl border border-proofound-stone bg-proofound-parchment/40 p-4 dark:border-border dark:bg-muted/40">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label
                htmlFor="publish-public-portfolio"
                className="text-sm font-semibold text-proofound-charcoal dark:text-foreground"
              >
                {isPublished
                  ? persona === 'organization'
                    ? 'Organization trust page published by direct link'
                    : 'Public Page published by direct link'
                  : persona === 'organization'
                    ? 'Publish organization trust page by direct link'
                    : 'Publish my Public Page by direct link'}
              </Label>
              <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                This is the consent action. It publishes only the public-safe portfolio snapshot;
                search indexing stays off.
              </p>
            </div>
            <Switch
              id="publish-public-portfolio"
              checked={isPublished}
              disabled={isPublished || isPublishing || !resolvedUrl}
              onCheckedChange={(checked) => void handlePublish(checked)}
              aria-label={
                persona === 'organization'
                  ? 'Publish organization trust page by direct link'
                  : 'Publish my Public Page by direct link'
              }
            />
          </div>
          {publishError ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {publishError}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-proofound-stone bg-proofound-parchment/60 p-4 text-sm text-proofound-charcoal dark:border-border dark:bg-muted dark:text-foreground">
          <p className="mb-2 text-xs uppercase tracking-wide text-proofound-charcoal/60 dark:text-muted-foreground">
            {persona === 'organization' ? 'Organization trust page URL' : 'Public Page URL'}
          </p>
          <p className="break-all font-mono text-sm">{resolvedUrl}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            disabled={!isPublished || !resolvedUrl}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          {isPublished ? (
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
                {persona === 'organization' ? 'Preview portfolio' : 'Preview Public Page'}
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Preview after publishing
            </Button>
          )}
          {isPublished ? (
            <Button
              type="button"
              onClick={onContinue}
              className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
            >
              {continueLabel || 'Continue to app'}
            </Button>
          ) : onDecline ? (
            <Button type="button" variant="ghost" onClick={onDecline}>
              {declineLabel}
            </Button>
          ) : null}
        </div>

        {copyFeedback ? (
          <div className="space-y-3">
            <p
              className={
                copyFeedback.kind === 'error'
                  ? 'text-sm text-red-600'
                  : 'text-sm text-proofound-forest dark:text-emerald-300'
              }
              role={copyFeedback.kind === 'error' ? 'alert' : 'status'}
            >
              {copyFeedback.message}
            </p>
            {copyFeedback.kind === 'error' ? (
              <div className="space-y-2">
                <Label htmlFor="manual-public-portfolio-copy" className="text-sm">
                  {persona === 'organization'
                    ? 'Organization trust page link for manual copy'
                    : 'Portfolio link for manual copy'}
                </Label>
                <Input
                  id="manual-public-portfolio-copy"
                  readOnly
                  value={resolvedUrl}
                  aria-label={
                    persona === 'organization'
                      ? 'Organization trust page link for manual copy'
                      : 'Portfolio link for manual copy'
                  }
                  className="min-h-[44px]"
                  onFocus={(event) => event.currentTarget.select()}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
          Share the link with a hiring team, collaborator, or on a profile post when you are ready.
        </p>
      </CardContent>
    </Card>
  );
}
