'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { OrganizationReadiness } from '@/lib/momentum/types';

interface OrgReadinessCardProps {
  orgRef: string;
}

export function OrgReadinessCard({ orgRef }: OrgReadinessCardProps) {
  const [data, setData] = useState<OrganizationReadiness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/org/readiness?org=${encodeURIComponent(orgRef)}`, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to load org readiness');
        const payload = (await response.json()) as OrganizationReadiness;
        setData(payload);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orgRef]);

  if (loading || !data) {
    return (
      <Card className="p-4" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <p className="text-sm text-[#6B6760]">Loading readiness insights...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#2D3330] inline-flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1C4D3A]" />
            Assignment Readiness
          </h3>
          <p className="text-sm text-[#6B6760]">
            {data.marketActivityLow
              ? 'Candidate volume is currently low. Improve readiness to increase conversion as volume grows.'
              : 'Your pipeline has activity. Tighten readiness checks to improve shortlist quality.'}
          </p>
        </div>
        <Badge variant="outline">Score {data.readinessScore}/100</Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {data.scoreBreakdown.map((item) => (
          <div key={item.key} className="rounded-lg border border-[#E8E6DD] bg-white p-3">
            <p className="text-xs text-[#6B6760]">{item.label}</p>
            <p className="text-lg font-semibold text-[#2D3330]">
              {item.score}/{item.maxScore}
            </p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-sm font-semibold text-[#2D3330] mb-2">Talent Availability Insight</p>
        {data.talentAvailabilityInsights.length === 0 ? (
          <p className="text-xs text-[#6B6760]">No active assignment skill demand yet.</p>
        ) : (
          <div className="space-y-2">
            {data.talentAvailabilityInsights.slice(0, 4).map((item) => (
              <div key={item.skillCode} className="rounded-lg border border-[#E8E6DD] p-2 text-xs">
                <p className="text-[#2D3330] font-medium">{item.skillName}</p>
                <p className="text-[#6B6760]">
                  Required by {item.requiredByAssignments} assignment(s) • {item.availableProfiles}{' '}
                  profile(s) available • {item.signal}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-[#2D3330] mb-2">Next Best Org Actions</p>
        {data.topActions.length === 0 ? (
          <div className="text-xs text-[#6B6760] inline-flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1C4D3A]" />
            No urgent actions.
          </div>
        ) : (
          <div className="space-y-2">
            {data.topActions.map((action) => (
              <Link
                key={action.id}
                href={action.actionUrl}
                className="block rounded-lg border border-[#E8E6DD] p-2 hover:border-[#1C4D3A] hover:bg-[#F7F6F1]"
              >
                <p className="text-sm font-medium text-[#2D3330]">{action.title}</p>
                <p className="text-xs text-[#6B6760] mt-1">{action.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="pt-1">
        <Link
          href={`/app/o/${orgRef}/assignments`}
          className="inline-flex items-center gap-1 text-sm text-[#1C4D3A] hover:underline"
        >
          Open assignments <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </Card>
  );
}
