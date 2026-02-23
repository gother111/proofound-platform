'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Briefcase, TrendingUp, AlertTriangle } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { MomentumSummary } from '@/lib/momentum/types';
import {
  getIndividualRecoveryActions,
  getOrganizationRecoveryActions,
} from '@/lib/ui/recovery-actions';

interface ExploreCardProps {
  persona?: 'individual' | 'organization';
  orgRef?: string;
}

export function ExploreCard({ persona = 'individual', orgRef }: ExploreCardProps) {
  const [summary, setSummary] = useState<MomentumSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams({ persona });
        if (orgRef) params.set('org', orgRef);

        const response = await fetch(`/api/momentum/summary?${params.toString()}`, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to load momentum summary');

        const data = (await response.json()) as MomentumSummary;
        setSummary(data);
      } catch (error) {
        console.error('ExploreCard load failed', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [persona, orgRef]);

  const actions = useMemo(() => summary?.topActions?.slice(0, 3) || [], [summary]);

  if (loading) {
    return (
      <Card
        className="p-4 border lg:col-span-3"
        style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
      >
        <p className="text-sm text-[#6B6760]">Loading actionable insights...</p>
      </Card>
    );
  }

  const fallbackActions =
    persona === 'organization'
      ? getOrganizationRecoveryActions('org-matching-empty', orgRef)
      : getIndividualRecoveryActions('dashboard-empty');

  return (
    <Card className="p-4 border lg:col-span-3" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-semibold" style={{ color: '#2D3330' }}>
          Explore
        </h5>
        {summary?.marketActivityLow ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-[#8A5A2B]">
            <AlertTriangle className="w-3 h-3" /> Market activity low
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-[#1C4D3A]">
            <TrendingUp className="w-3 h-3" /> Active market
          </span>
        )}
      </div>

      <p className="text-xs mb-4" style={{ color: '#6B6760' }}>
        {summary?.summary || 'Keep momentum with the most useful next actions.'}
      </p>

      {actions.length === 0 ? (
        <div className="text-center py-4">
          <Briefcase className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
          <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
            No immediate actions yet. Use these steps to restore momentum.
          </p>
          <div className="space-y-2 text-left">
            {fallbackActions.map((action) => (
              <Link
                key={action.id}
                href={action.actionUrl}
                className="block rounded-lg border border-[#E8E6DD] px-3 py-2 hover:border-[#1C4D3A] hover:bg-[#F7F6F1]"
              >
                <p className="text-sm font-medium text-[#2D3330]">{action.title}</p>
                <p className="text-xs text-[#6B6760] mt-1">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.actionUrl}
              className="block rounded-lg border border-[#E8E6DD] px-3 py-2 hover:border-[#1C4D3A] hover:bg-[#F7F6F1]"
            >
              <p className="text-sm font-medium text-[#2D3330]">{action.title}</p>
              <p className="text-xs text-[#6B6760] mt-1">{action.description}</p>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
