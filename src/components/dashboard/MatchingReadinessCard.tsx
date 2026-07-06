'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Compass, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DASHBOARD_STATUS_CHIP_CLASS } from '@/components/dashboard/chipStyles';
import { NextStepsHelper } from '@/components/dashboard/NextStepsHelper';
import { apiFetch } from '@/lib/api/fetch';
import { FALLBACK_COPY, type OperationalFallbackMode } from '@/lib/contracts/launch-operations';
import type { IndividualReadiness } from '@/lib/momentum/types';
import { getLaunchReadinessDisplayLabel } from '@/lib/readiness/launch-display';

type MatchingReadinessCardProps = {
  useMockData?: boolean;
  initialData?: unknown;
  onActionClick?: (actionId: string) => void;
};

export function MatchingReadinessCard({ useMockData, onActionClick }: MatchingReadinessCardProps) {
  const [data, setData] = useState<IndividualReadiness | null>(null);

  useEffect(() => {
    if (useMockData) {
      setData({
        readinessScore: 78,
        scoreBreakdown: [],
        topActions: [],
        states: ['portfolio_ready'],
        highestState: 'portfolio_ready',
        missingByState: {
          portfolio_ready: [],
          browse_ready: [
            {
              id: 'skills_with_recency',
              label: 'Three recent skills',
              detail: 'Add at least 3 skills with last-used dates.',
              met: false,
              actionUrl: '/app/i/profile?profileView=full&tab=proof_packs',
            },
          ],
          qualified_intro_ready: [],
        },
        legacyTier: 'none',
        trustLevel: 'discoverable',
        flags: {
          portfolioReady: true,
          browseReady: false,
          qualifiedIntroReady: false,
          discoverable: true,
          matchVisible: false,
          introEligible: false,
          stronglyTrusted: false,
        },
        proofProgress: {
          totalProofs: 1,
          verifiedProofs: 0,
          pendingVerificationRequests: 0,
          completionRate: 0,
          nextStep: 'Add recent skills',
        },
        skillToOpportunityBridge: [],
        marketActivityLow: false,
        metrics: {
          totalMatches: 0,
          highQualityMatches: 0,
          pendingVerifications: 0,
          skillsCount: 2,
          skillsWithRecency: 2,
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

  const missingBrowse = data?.missingByState.browse_ready ?? [];
  const missingIntro = data?.missingByState.qualified_intro_ready ?? [];
  const fallbackMode: OperationalFallbackMode | null = !data
    ? null
    : data.flags.qualifiedIntroReady
      ? null
      : data.metrics.pendingVerifications > 0
        ? 'trust_pending_verification'
        : (data.metrics.proofBackedSkillCount ?? 0) < 2
          ? 'proof_building_weak_coverage'
          : data.marketActivityLow
            ? 'browse_only_low_assignment_supply'
            : 'intro_hold_insufficient_qualified_intros';
  const fallbackCopy = fallbackMode ? FALLBACK_COPY[fallbackMode].individual : null;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Compass className="h-5 w-5 text-proofound-forest" />
            Match visibility
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Matching can move before introductions. Add the lightest useful signal, then strengthen
            trust later.
          </p>
        </div>
        <Badge variant="outline" className={DASHBOARD_STATUS_CHIP_CLASS}>
          {getLaunchReadinessDisplayLabel(data?.flags || {})}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {missingBrowse.length > 0 ? (
            missingBrowse.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={item.actionUrl}
                className="flex items-center justify-between rounded-lg border border-proofound-stone px-3 py-2 text-sm hover:border-proofound-forest hover:bg-japandi-bg"
                onClick={() => onActionClick?.(item.id)}
              >
                <span>{item.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))
          ) : (
            <div className="rounded-lg border border-proofound-stone bg-white/70 p-3 text-sm text-muted-foreground">
              Personalized browsing is active. Keep introductions separate and complete the stronger
              trust requirements when you are ready.
            </div>
          )}
        </div>

        <div className="rounded-lg border border-proofound-stone bg-white/70 p-3">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <ShieldCheck className="h-4 w-4 text-proofound-forest" />
            Qualified introductions
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data?.flags.introEligible
              ? data?.flags.stronglyTrusted
                ? 'Introductions are unlocked and the profile carries a higher-trust label.'
                : 'Introductions are unlocked.'
              : (fallbackCopy?.detail ??
                'This profile can keep browsing and appear in matching once visible, but introductions stay paused until stronger relevant proof is in place.')}
          </p>
          {!data?.flags.introEligible && missingIntro.length > 0 ? (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-foreground">{missingIntro[0]?.detail}</p>
              {fallbackCopy ? (
                <NextStepsHelper
                  actions={fallbackCopy.nextActions.map((action) => ({ title: action }))}
                  description="Open introduction readiness next steps."
                />
              ) : null}
            </div>
          ) : null}
        </div>

        <Link
          href="/app/i/matching"
          className="inline-flex items-center gap-2 text-sm font-medium text-proofound-forest hover:text-proofound-forest/80"
          onClick={() => onActionClick?.('open-matching')}
        >
          Open matching
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
