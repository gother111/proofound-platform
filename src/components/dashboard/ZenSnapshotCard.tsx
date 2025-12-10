/**
 * Zen Hub Snapshot
 *
 * Quick view of latest wellbeing check-ins and assessments (private path).
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/fetch';
import { HeartPulse, SmilePlus, Activity, Shield } from 'lucide-react';
import Link from 'next/link';

type ZenSnapshotCardProps = {
  useMockData?: boolean;
};

type MilestonesResponse = {
  milestones?: { id: string; label: string; value: number; created_at: string }[];
};

export function ZenSnapshotCard({ useMockData }: ZenSnapshotCardProps) {
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useMockData) {
      setLastScore(76);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const response = await apiFetch('/api/wellbeing/milestones');
        if (!response.ok) throw new Error('Failed to fetch wellbeing milestones');
        const json = (await response.json()) as MilestonesResponse;
        const latest = json.milestones?.[0];
        setLastScore(typeof latest?.value === 'number' ? latest.value : null);
      } catch (error) {
        console.error(error);
        setLastScore(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [useMockData]);

  const badge = (() => {
    if (lastScore === null) return { text: 'Start', tone: 'bg-slate-100 text-slate-700' };
    if (lastScore >= 80) return { text: 'Balanced', tone: 'bg-emerald-50 text-emerald-700' };
    if (lastScore >= 60) return { text: 'Watch', tone: 'bg-amber-50 text-amber-700' };
    return { text: 'Support', tone: 'bg-rose-50 text-rose-700' };
  })();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-[#1C4D3A]" />
            Zen Snapshot
          </CardTitle>
          <p className="text-sm text-muted-foreground">Private wellbeing check-ins; never shared.</p>
        </div>
        <Badge className={`text-xs ${badge.tone}`}>{badge.text}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-[#E8E6DD] p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#1C4D3A]" />
            <p className="text-sm text-[#2D3330]">Latest check-in</p>
          </div>
          <p className="text-xl font-semibold text-[#2D3330]">{loading ? '—' : lastScore ?? '—'}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-4 w-4 text-[#9B9891]" />
          Stored privately; not used in matching or visibility.
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-[#1C4D3A] text-[#1C4D3A] hover:bg-[#EEF1EA]"
            asChild
          >
            <Link href="/app/i/zen">Open Zen Hub</Link>
          </Button>
          <Button size="sm" className="bg-[#1C4D3A] hover:bg-[#163D2E] text-white" asChild>
            <Link href="/app/i/zen?tab=assessments">
              <SmilePlus className="h-4 w-4 mr-2" />
              Take check-in
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
