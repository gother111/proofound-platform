/**
 * Matching Readiness Tile
 *
 * Combines gap count and next action to become matchable.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { apiFetch } from '@/lib/api/fetch';
import { ArrowRight, Sparkles, Target } from 'lucide-react';
import Link from 'next/link';
import { DASHBOARD_STATUS_CHIP_CLASS } from '@/components/dashboard/chipStyles';

type MatchingReadinessCardProps = {
  useMockData?: boolean;
  onActionClick?: (actionId: string) => void;
};

type GapResponse = {
  gaps?: { skillCode: string; gap: number }[];
};

export function MatchingReadinessCard({ useMockData, onActionClick }: MatchingReadinessCardProps) {
  const [gapCount, setGapCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useMockData) {
      setGapCount(3);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const response = await apiFetch('/api/skill-gaps');
        if (!response.ok) throw new Error('Failed to fetch gaps');
        const json = (await response.json()) as GapResponse;
        setGapCount(json.gaps?.length ?? 0);
      } catch (error) {
        console.error(error);
        setGapCount(4);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [useMockData]);

  const status = (() => {
    if (gapCount === null) return { label: 'Loading', tone: 'text-muted-foreground' };
    if (gapCount === 0) return { label: 'Ready', tone: 'text-green-700' };
    if (gapCount <= 3) return { label: 'Actionable', tone: 'text-amber-700' };
    return { label: 'Needs focus', tone: 'text-rose-700' };
  })();

  const progressValue = gapCount === null ? 0 : Math.max(0, 100 - gapCount * 10);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#1C4D3A]" />
            Matching Readiness
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Fix the top gaps to unlock better matches.
          </p>
        </div>
        <Badge variant="outline" className={DASHBOARD_STATUS_CHIP_CLASS}>
          {status.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Gaps remaining</span>
            <span className={`font-semibold ${status.tone}`}>{gapCount ?? '—'}</span>
          </div>
          <Progress value={progressValue} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Aim for zero critical gaps; each gap closed improves PAC fit.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-[#2D3330]">Next best action</p>
          <Link
            href="/app/i/expertise?tab=gap-analysis"
            className="flex items-center justify-between rounded-lg border border-[#E8E6DD] px-3 py-2 hover:border-[#1C4D3A] hover:bg-[#F7F6F1] text-sm"
            onClick={() => onActionClick?.('gap-analysis')}
          >
            <span className="text-[#2D3330]">Review top gaps</span>
            <ArrowRight className="h-4 w-4 text-[#9B9891]" />
          </Link>
          <Link
            href="/app/i/matching"
            className="flex items-center justify-between rounded-lg border border-[#E8E6DD] px-3 py-2 hover:border-[#1C4D3A] hover:bg-[#F7F6F1] text-sm"
            onClick={() => onActionClick?.('open-matching')}
          >
            <span className="text-[#2D3330]">Check current matches</span>
            <Target className="h-4 w-4 text-[#9B9891]" />
          </Link>
          {loading && (
            <div className="space-y-2">
              <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-1 text-xs text-muted-foreground">
          <span>Targets PAC lift</span>
          <span>TTFQI ≤ 72h</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full border-[#1C4D3A] text-[#1C4D3A] hover:bg-[#EEF1EA]"
          asChild
          onClick={() => onActionClick?.('next-actions')}
        >
          <Link href="/app/i/home">See recommended actions</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
