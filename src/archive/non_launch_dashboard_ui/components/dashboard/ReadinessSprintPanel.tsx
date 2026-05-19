'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DASHBOARD_STATUS_CHIP_CLASS } from '@/components/dashboard/chipStyles';
import { NextStepsHelper } from '@/components/dashboard/NextStepsHelper';
import { FALLBACK_COPY, type OperationalFallbackMode } from '@/lib/contracts/launch-operations';
import type { IndividualReadiness } from '@/lib/momentum/types';
import {
  getLaunchPrimaryAction,
  getLaunchReadinessBlockers,
  getLaunchReadinessDisplayLabel,
  getLaunchReadinessSummary,
} from '@/lib/readiness/launch-display';

export function ReadinessSprintPanel() {
  const [data, setData] = useState<IndividualReadiness | null>(null);

  useEffect(() => {
    fetch('/api/individual/readiness', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load readiness');
        return (await response.json()) as IndividualReadiness;
      })
      .then(setData)
      .catch((error) => {
        console.error(error);
      });
  }, []);

  if (!data) {
    return (
      <Card className="border-proofound-stone/70 bg-white/80 p-6">
        <p className="text-sm text-muted-foreground">Loading next actions...</p>
      </Card>
    );
  }

  const primaryAction = getLaunchPrimaryAction(data.topActions);
  const blockers = getLaunchReadinessBlockers(data);
  const stateLabel = getLaunchReadinessDisplayLabel(data.flags);
  const stateSummary = getLaunchReadinessSummary(data.flags);
  const fallbackMode: OperationalFallbackMode | null = data.flags.introEligible
    ? null
    : data.metrics.pendingVerifications > 0
      ? 'trust_pending_verification'
      : (data.metrics.proofBackedSkillCount ?? 0) < 2
        ? 'proof_building_weak_coverage'
        : data.marketActivityLow
          ? 'browse_only_low_assignment_supply'
          : 'intro_hold_insufficient_qualified_intros';
  const fallbackCopy = fallbackMode ? FALLBACK_COPY[fallbackMode].individual : null;
  const fallbackActionUrl =
    primaryAction?.actionUrl === '/app/i/portfolio'
      ? '/app/i/profile?profileView=full&tab=proof_packs'
      : primaryAction?.actionUrl || '/app/i/profile?profileView=full&tab=proof_packs';
  const fallbackActionTitle = primaryAction?.title || 'Review Proof Packs';

  return (
    <Card className="overflow-hidden border-proofound-stone/70 bg-white/85">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="border-b border-proofound-stone/70 bg-[#fbf8f1] p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-proofound-forest">
                <Sparkles className="h-4 w-4" />
                Readiness sprint
              </p>
              <h2 className="mt-3 text-2xl font-medium leading-tight text-proofound-charcoal md:text-3xl">
                What should I add next?
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{stateSummary}</p>
            </div>
            <Badge variant="outline" className={`w-fit ${DASHBOARD_STATUS_CHIP_CLASS}`}>
              {stateLabel}
            </Badge>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-proofound-stone/70 bg-white p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-proofound-charcoal">
                <Sparkles className="h-4 w-4 text-proofound-forest" />
                One next action
              </p>
              <p className="mt-3 text-xl font-semibold text-proofound-charcoal">
                {fallbackActionTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {primaryAction?.description ||
                  'Keep your Proof Packs current, public-safe, and easy to share.'}
              </p>
              <div className="mt-5">
                <Button
                  asChild
                  className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                >
                  <Link href={fallbackActionUrl}>
                    {fallbackActionTitle}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-proofound-stone/70 bg-[#f7f2ea] p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-proofound-charcoal">
                <ShieldCheck className="h-4 w-4 text-proofound-forest" />
                Short blocker list
              </p>
              {blockers.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {blockers.map((item) => (
                    <li key={item.id} className="text-sm leading-6 text-proofound-charcoal">
                      <span className="font-medium">{item.label}:</span> {item.detail}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  No launch blockers are active right now.
                </p>
              )}
            </div>
          </div>

          {!data.flags.introEligible && fallbackCopy ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-proofound-stone/60 bg-white p-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Suggested follow-up work is available when needed without staying pinned open.
              </p>
              <NextStepsHelper
                actions={fallbackCopy.nextActions.map((action) => ({ title: action }))}
                description="Open readiness sprint next steps."
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>
              {data.proofProgress.totalProofs} proof item
              {data.proofProgress.totalProofs === 1 ? '' : 's'} added,{' '}
              {data.proofProgress.verifiedProofs} verified, {data.metrics.pendingVerifications}{' '}
              pending verification
              {data.metrics.pendingVerifications === 1 ? '' : 's'}.
            </p>
            <Link
              href="/app/i/profile?profileView=full&tab=proof_packs"
              className="inline-flex items-center gap-2 text-sm font-medium text-proofound-forest hover:text-proofound-forest/80"
            >
              Review Proof Packs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
