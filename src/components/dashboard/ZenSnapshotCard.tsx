'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/fetch';
import { HeartPulse, Shield } from 'lucide-react';
import Link from 'next/link';

type ZenSnapshotCardProps = {
  useMockData?: boolean;
};

type MilestonesResponse = {
  milestones?: { type: string; occurredAt: string; sourceEvent: string }[];
};

export function ZenSnapshotCard({ useMockData }: ZenSnapshotCardProps) {
  const [milestoneCount, setMilestoneCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useMockData) {
      setMilestoneCount(1);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const response = await apiFetch('/api/wellbeing/milestones');
        if (!response.ok) throw new Error('Failed to fetch wellbeing milestones');
        const json = (await response.json()) as MilestonesResponse;
        setMilestoneCount(json.milestones?.length ?? 0);
      } catch (error) {
        console.error(error);
        setMilestoneCount(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [useMockData]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-proofound-forest" />
            Zen Snapshot
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Optional private check-ins and milestone reflections.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-proofound-stone p-3">
          <p className="text-sm text-foreground">Private entry point</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {loading
              ? 'Checking for private milestone prompts...'
              : milestoneCount && milestoneCount > 0
                ? `${milestoneCount} private milestone prompt${milestoneCount === 1 ? '' : 's'} available`
                : 'No private milestone prompts right now'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Stored privately and excluded from matching, ranking, and org analytics.
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-proofound-forest text-proofound-forest hover:bg-proofound-forest/5"
            asChild
          >
            <Link href="/app/i/zen">Open Zen Hub</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
