'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Copy, ExternalLink, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DASHBOARD_STATUS_CHIP_CLASS } from '@/components/dashboard/chipStyles';
import { apiFetch } from '@/lib/api/fetch';
import type { IndividualReadiness } from '@/lib/momentum/types';
import { getLaunchReadinessDisplayLabel } from '@/lib/readiness/launch-display';

type ProfileActivationCardProps = {
  useMockData?: boolean;
  initialData?: unknown;
};

function milestoneTone(readiness: IndividualReadiness | null) {
  return getLaunchReadinessDisplayLabel(readiness?.flags || {});
}

export function ProfileActivationCard({ useMockData }: ProfileActivationCardProps) {
  const [data, setData] = useState<IndividualReadiness | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (useMockData) {
      setData({
        readinessScore: 78,
        scoreBreakdown: [],
        topActions: [],
        states: ['portfolio_ready', 'browse_ready'],
        highestState: 'browse_ready',
        publicPortfolioUrl: 'https://proofound.io/portfolio/demo-user',
        missingByState: {
          portfolio_ready: [],
          browse_ready: [],
          qualified_intro_ready: [
            {
              id: 'trusted_signal',
              label: 'Verified trust signal',
              detail: 'Add one verified trust signal before qualified introductions unlock.',
              met: false,
              actionUrl: '/app/i/verifications',
            },
          ],
        },
        legacyTier: 'lite',
        trustLevel: 'match_visible',
        flags: {
          portfolioReady: true,
          browseReady: true,
          qualifiedIntroReady: false,
          discoverable: true,
          matchVisible: true,
          introEligible: false,
          stronglyTrusted: false,
        },
        proofProgress: {
          totalProofs: 1,
          verifiedProofs: 0,
          pendingVerificationRequests: 0,
          completionRate: 0,
          nextStep: 'Add one verified signal',
        },
        skillToOpportunityBridge: [],
        marketActivityLow: false,
        metrics: {
          totalMatches: 0,
          highQualityMatches: 0,
          pendingVerifications: 0,
          skillsCount: 4,
        },
      } as IndividualReadiness);
      return;
    }

    apiFetch('/api/individual/readiness', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load readiness');
        return (await response.json()) as IndividualReadiness;
      })
      .then(setData)
      .catch((error) => {
        console.error(error);
      });
  }, [useMockData]);

  const missingPortfolioItems = useMemo(
    () => data?.missingByState.portfolio_ready ?? [],
    [data?.missingByState]
  );

  async function handleCopyLink() {
    if (!data?.publicPortfolioUrl) return;

    await navigator.clipboard.writeText(data.publicPortfolioUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'portfolio_share_link_copied',
        entityType: 'profile',
        properties: { source: 'dashboard_portfolio_card' },
      }),
    });
  }

  return (
    <Card variant="bento" className="h-full">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">Public portfolio</CardTitle>
            <p className="text-sm text-muted-foreground">
              Publish proof first. Search engines stay off by default, and browsing plus
              introductions build on top of that once trust is strong enough.
            </p>
          </div>
          <Badge variant="outline" className={DASHBOARD_STATUS_CHIP_CLASS}>
            {milestoneTone(data)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-2xl border border-black/[0.04] bg-card p-5 shadow-sm dark:bg-card/50 dark:border-white/5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Launch states</p>
            <p className="text-xs text-muted-foreground">Portfolio to intro</p>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Portfolio ready', met: Boolean(data?.flags.portfolioReady) },
              { label: 'Match visible', met: Boolean(data?.flags.matchVisible) },
              {
                label: 'Intro eligible',
                met: Boolean(data?.flags.introEligible),
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                {item.met ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-proofound-forest text-white hover:bg-proofound-forest/90">
            <Link href="/app/i/profile?profileView=full&tab=visibility">
              <ExternalLink className="mr-2 h-4 w-4" />
              Preview portfolio
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyLink}
            disabled={!data?.publicPortfolioUrl}
          >
            <Copy className="mr-2 h-4 w-4" />
            {copied ? 'Copied' : 'Copy portfolio link'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/app/i/settings">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Manage sharing & privacy
            </Link>
          </Button>
        </div>

        {missingPortfolioItems.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">What to add next</p>
            {missingPortfolioItems.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={item.actionUrl}
                className="block rounded-xl border border-black/[0.04] px-4 py-3 text-sm transition-colors hover:border-black/[0.08] hover:bg-black/[0.02] dark:border-white/5 dark:hover:border-white/10 dark:hover:bg-white/5"
              >
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your public portfolio is live and shareable by link. It remains useful even while
            introductions stay protected until stronger proof and trust signals are in place.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
