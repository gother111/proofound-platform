'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TimelineStageIndicator } from './TimelineStageIndicator';
import { apiFetch } from '@/lib/api/fetch';

type StageInfo = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  displayOrder: number;
  defaultDaysToComplete: number | null;
  color: string | null;
  icon: string | null;
};

type StageHistoryEntry = {
  stage: string;
  entered_at: string;
  exited_at?: string;
  notes?: string;
};

type TimelineResponse = {
  timeline: {
    id: string;
    assignmentId: string;
    currentStageCode: string;
    stageHistory: StageHistoryEntry[];
    expectedDecisionDate?: string | null;
    outcome?: string | null;
  };
  stages: StageInfo[];
};

interface ApplicationTimelineProps {
  timelineId: string;
  assignmentRole?: string;
}

export function ApplicationTimeline({ timelineId, assignmentRole }: ApplicationTimelineProps) {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/applications/${timelineId}`);
        if (!res.ok) {
          throw new Error('Failed to load application timeline');
        }
        const json = (await res.json()) as TimelineResponse;
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load timeline');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [timelineId]);

  const stagesWithStatus = useMemo(() => {
    if (!data) return [];
    return data.stages.map((stage) => {
      const current = data.timeline.currentStageCode;
      let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
      if (stage.code === current) status = 'current';
      else if (stage.displayOrder < data.stages.find((s) => s.code === current)?.displayOrder!) {
        status = 'completed';
      }
      return { ...stage, status };
    });
  }, [data]);

  if (isLoading) {
    return (
      <Card className="p-4 space-y-2 border-dashed border">
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

  if (!data) return null;

  const expectedDate = data.timeline.expectedDecisionDate
    ? new Date(data.timeline.expectedDecisionDate).toLocaleDateString()
    : null;

  const lastHistory = data.timeline.stageHistory.at(-1);

  return (
    <Card className="p-4 space-y-4 border">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {assignmentRole ? `Application for ${assignmentRole}` : 'Application Timeline'}
        </p>
        {expectedDate ? (
          <p className="text-xs text-muted-foreground">Expected decision by {expectedDate}</p>
        ) : null}
      </div>

      <div className="space-y-4">
        {stagesWithStatus.map((stage, idx) => (
          <div key={stage.id || stage.code}>
            <TimelineStageIndicator
              label={stage.label}
              description={stage.description}
              status={stage.status as 'completed' | 'current' | 'upcoming'}
              expectedDays={stage.defaultDaysToComplete}
            />
            {idx < stagesWithStatus.length - 1 && (
              <div className="ml-4 my-2">
                <Separator className="bg-muted h-6 w-0.5" />
              </div>
            )}
          </div>
        ))}
      </div>

      {lastHistory ? (
        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <p>
            Last update: {new Date(lastHistory.entered_at).toLocaleString()}
            {lastHistory.notes ? ` — ${lastHistory.notes}` : ''}
          </p>
        </div>
      ) : null}
    </Card>
  );
}
