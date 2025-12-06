'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimelineStageIndicator } from './TimelineStageIndicator';
import { apiFetch } from '@/lib/api/fetch';

type TimelineListItem = {
  id: string;
  assignmentId: string;
  assignmentRole: string | null;
  currentStageCode: string;
  stageLabel: string | null;
  stageDescription: string | null;
  stageDefaultDays: number | null;
  expectedDecisionDate: string | null;
  outcome: string | null;
  updatedAt: string;
};

export function ApplicationTimelineCard() {
  const [items, setItems] = useState<TimelineListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiFetch('/api/applications/timeline');
        if (!res.ok) throw new Error('Failed to load application timelines');
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load application timelines');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const countsByStage = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      const key = item.currentStageCode;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [items]);

  if (isLoading) {
    return (
      <Card className="p-4 space-y-3 border">
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
        <div className="h-3 w-full bg-muted animate-pulse rounded" />
        <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border">
        <p className="text-sm text-destructive">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4 border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Application Timelines</p>
          <p className="text-xs text-muted-foreground">Keep track of every stage</p>
        </div>
        <Link href="/app/i/applications">
          <Button size="sm" variant="outline">
            View all
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {Object.entries(countsByStage).map(([stage, count]) => (
          <div
            key={stage}
            className="rounded-md border bg-muted/30 px-3 py-2 flex items-center justify-between"
          >
            <span className="capitalize text-muted-foreground">{stage.replace('_', ' ')}</span>
            <span className="font-semibold text-foreground">{count}</span>
          </div>
        ))}
        {items.length === 0 ? (
          <p className="col-span-2 text-xs text-muted-foreground">
            No applications yet. Express interest to see progress here.
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {items.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="rounded-lg border px-3 py-3 bg-background/50"
            aria-label={`Application for ${item.assignmentRole || 'assignment'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {item.assignmentRole || 'Assignment'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(item.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <Link href={`/app/i/applications?timeline=${item.id}`} className="text-xs underline">
                Details
              </Link>
            </div>
            <div className="mt-3">
              <TimelineStageIndicator
                label={item.stageLabel || item.currentStageCode}
                description={item.stageDescription}
                status="current"
                expectedDays={item.stageDefaultDays}
              />
              {item.expectedDecisionDate ? (
                <p className="text-xs text-muted-foreground mt-2">
                  Expected decision by {new Date(item.expectedDecisionDate).toLocaleDateString()}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
