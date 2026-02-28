'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { IndividualReadiness } from '@/lib/momentum/types';
import { DASHBOARD_STATUS_CHIP_CLASS } from '@/components/dashboard/chipStyles';

export function ReadinessSprintPanel() {
  const [data, setData] = useState<IndividualReadiness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/individual/readiness', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load readiness');
        const json = (await response.json()) as IndividualReadiness;
        setData(json);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <p className="text-sm text-[#6B6760]">Loading readiness sprint...</p>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="p-4 border space-y-4" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[#2D3330]">Readiness Sprint</h2>
          <p className="text-sm text-[#6B6760]">
            {data.marketActivityLow
              ? 'Market activity is currently low. These actions keep your profile momentum strong.'
              : 'Keep momentum with your top readiness actions this week.'}
          </p>
        </div>
        <Badge variant="outline" className={`w-fit ${DASHBOARD_STATUS_CHIP_CLASS}`}>
          Score {data.readinessScore}/100
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {data.topActions.map((action) => (
          <Link
            key={action.id}
            href={action.actionUrl}
            className="rounded-lg border border-[#E8E6DD] bg-white p-3 hover:border-[#1C4D3A] hover:bg-[#F7F6F1]"
          >
            <p className="text-sm font-semibold text-[#2D3330]">{action.title}</p>
            <p className="text-xs text-[#6B6760] mt-1">{action.description}</p>
            <p className="text-xs text-[#1C4D3A] mt-2 inline-flex items-center gap-1">
              Open action <ArrowRight className="w-3 h-3" />
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-[#E8E6DD] bg-white p-3">
          <p className="text-sm font-semibold text-[#2D3330] inline-flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1C4D3A]" />
            Proof Progress Tracker
          </p>
          <p className="text-xs text-[#6B6760] mt-1">
            {data.proofProgress.verifiedProofs}/{data.proofProgress.totalProofs} proofs verified •{' '}
            {data.proofProgress.pendingVerificationRequests} pending requests
          </p>
          <p className="text-xs text-[#2D3330] mt-2">Next: {data.proofProgress.nextStep}</p>
        </div>

        <div className="rounded-lg border border-[#E8E6DD] bg-white p-3">
          <p className="text-sm font-semibold text-[#2D3330] inline-flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1C4D3A]" />
            Skill-to-Opportunity Bridge
          </p>
          <div className="mt-2 space-y-2">
            {data.skillToOpportunityBridge.slice(0, 2).map((item) => (
              <div key={item.skillCode} className="text-xs text-[#2D3330]">
                <p>
                  {item.skillName} to expected lift {item.expectedImpactMin}-
                  {item.expectedImpactMax}%
                </p>
                <p className="text-[#6B6760]">
                  Target role: {item.topRole || 'General'} • L{item.currentLevel} to L
                  {item.targetLevel}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button asChild size="sm" className="bg-[#1C4D3A] hover:bg-[#2D5F4A] text-white">
          <Link href="/app/i/expertise?tab=gap-analysis">Open Skill Gaps</Link>
        </Button>
      </div>
    </Card>
  );
}
