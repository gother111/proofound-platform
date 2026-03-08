'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DASHBOARD_STATUS_CHIP_CLASS } from '@/components/dashboard/chipStyles';
import type { IndividualReadiness } from '@/lib/momentum/types';

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

  const missingIntro = data.missingByState.qualified_intro_ready ?? [];

  return (
    <Card className="space-y-4 border p-4" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">What should I add next?</h2>
          <p className="text-sm text-muted-foreground">
            Start with proof that improves your public portfolio, then move into browse setup and
            intro quality when you are ready.
          </p>
        </div>
        <Badge variant="outline" className={`w-fit ${DASHBOARD_STATUS_CHIP_CLASS}`}>
          {data.highestState === 'qualified_intro_ready'
            ? 'Ready for qualified introductions'
            : data.highestState === 'browse_ready'
              ? 'Ready to browse'
              : data.highestState === 'portfolio_ready'
                ? 'Portfolio live'
                : 'Portfolio draft'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {data.topActions.map((action) => (
          <Link
            key={action.id}
            href={action.actionUrl}
            className="rounded-lg border border-proofound-stone bg-white p-3 hover:border-proofound-forest hover:bg-japandi-bg"
          >
            <p className="text-sm font-semibold text-foreground">{action.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-proofound-forest">
              Open action <ArrowRight className="h-3 w-3" />
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-proofound-stone bg-white p-3">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-proofound-forest" />
            Proof progress
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.proofProgress.totalProofs} proof item
            {data.proofProgress.totalProofs === 1 ? '' : 's'} added •{' '}
            {data.proofProgress.verifiedProofs} verified
          </p>
          <p className="mt-2 text-xs text-foreground">Next: {data.proofProgress.nextStep}</p>
        </div>

        <div className="rounded-lg border border-proofound-stone bg-white p-3">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-proofound-forest" />
            Qualified introductions
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Protected until stronger proof, trust signals, and full constraints are complete.
          </p>
          {missingIntro.length > 0 ? (
            <div className="mt-2 space-y-1">
              {missingIntro.slice(0, 2).map((item) => (
                <p key={item.id} className="text-xs text-foreground">
                  {item.label}: {item.detail}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-foreground">Qualified introductions are unlocked.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          asChild
          size="sm"
          className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
        >
          <Link href="/app/i/expertise">Open Expertise Atlas</Link>
        </Button>
      </div>
    </Card>
  );
}
