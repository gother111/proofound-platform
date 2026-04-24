'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DASHBOARD_STATUS_CHIP_CLASS } from '@/components/dashboard/chipStyles';
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
      <Card variant="bento" className="p-4">
        <p className="text-sm text-muted-foreground">Loading next actions…</p>
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
    <Card className="space-y-4 border p-4" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">What should I add next?</h2>
          <p className="text-sm text-muted-foreground">{stateSummary}</p>
        </div>
        <Badge variant="outline" className={`w-fit ${DASHBOARD_STATUS_CHIP_CLASS}`}>
          {stateLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-proofound-stone bg-white p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-proofound-forest" />
            One next action
          </p>
          <p className="mt-2 text-base font-semibold text-foreground">{fallbackActionTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {primaryAction?.description ||
              'Keep your proof packs current, public-safe, and easy to share.'}
          </p>
          <div className="mt-4">
            <Button asChild className="bg-proofound-forest text-white hover:bg-proofound-forest/90">
              <Link href={fallbackActionUrl}>
                {fallbackActionTitle}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-proofound-stone bg-white p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-proofound-forest" />
            Short blocker list
          </p>
          {blockers.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {blockers.map((item) => (
                <li key={item.id} className="text-sm text-foreground">
                  <span className="font-medium">{item.label}:</span> {item.detail}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No launch blockers are active right now.
            </p>
          )}
          {!data.flags.introEligible && fallbackCopy ? (
            <div className="mt-3 rounded-md bg-japandi-bg/70 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Best next steps
              </p>
              <ul className="mt-1 space-y-1 text-xs text-foreground">
                {fallbackCopy.nextActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          {data.proofProgress.totalProofs} proof item
          {data.proofProgress.totalProofs === 1 ? '' : 's'} added,{' '}
          {data.proofProgress.verifiedProofs} verified, {data.metrics.pendingVerifications} pending
          verification
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
    </Card>
  );
}
