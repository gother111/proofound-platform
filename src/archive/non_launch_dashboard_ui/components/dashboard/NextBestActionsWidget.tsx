/**
 * Next Best Actions Widget
 *
 * Shows personalized proof-readiness recommendations and launch checklist state.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/fetch';
import { DASHBOARD_STATUS_CHIP_CLASS } from '@/components/dashboard/chipStyles';
import { NextStepsHelper } from '@/components/dashboard/NextStepsHelper';
import type { ReadinessAction } from '@/lib/momentum/types';

type ProofReadinessState = 'portfolio_ready' | 'browse_ready' | 'qualified_intro_ready';

type ProofReadinessData = {
  actions?: ReadinessAction[];
  topActions?: ReadinessAction[];
  states?: ProofReadinessState[];
  highestState?: ProofReadinessState | null;
  flags?: {
    portfolioReady?: boolean;
    matchVisible?: boolean;
    introEligible?: boolean;
  };
};

type NextBestActionsWidgetProps = {
  useMockData?: boolean;
  initialData?: ProofReadinessData | null;
  onActionClick?: (actionId: string) => void;
};

export function NextBestActionsWidget({
  useMockData,
  initialData,
  onActionClick,
}: NextBestActionsWidgetProps) {
  const [readiness, setReadiness] = useState<ProofReadinessData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData && !useMockData);
  const router = useRouter();

  useEffect(() => {
    if (useMockData) {
      setReadiness({
        states: ['portfolio_ready'],
        highestState: 'portfolio_ready',
        flags: {
          portfolioReady: true,
          matchVisible: false,
          introEligible: false,
        },
        topActions: [
          {
            id: 'add-proof',
            title: 'Structure first Proof Pack',
            description: 'Turn one real artifact into a clean Proof Pack with context and outcome.',
            priority: 'high',
            category: 'verification',
            actionUrl: '/app/i/profile?profileView=full&tab=proof_packs',
          },
          {
            id: 'set-preferences',
            title: 'Save matching preferences',
            description: 'Add focus, work mode, and engagement preferences before browsing.',
            priority: 'medium',
            category: 'matching',
            actionUrl: '/app/i/matching/preferences',
          },
        ],
      });
      setLoading(false);
      return;
    }

    if (initialData || useMockData) return;

    async function fetchNextBestActions() {
      try {
        const response = await apiFetch('/api/individual/readiness');
        if (response.ok) {
          const data = await response.json();
          setReadiness(data);
        }
      } catch (error) {
        console.error('Failed to fetch next best actions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNextBestActions();
  }, [useMockData, initialData]);

  if (loading) {
    return (
      <Card variant="bento">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-proofound-forest" />
            Next Best Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2 mb-6">
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-full text-left p-3 rounded-lg border border-proofound-stone flex items-start gap-3"
                >
                  <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                    <Skeleton className="h-3 w-5/6 rounded-md" />
                  </div>
                  <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const actions = readiness?.topActions ?? readiness?.actions ?? [];
  const topActions = actions.slice(0, 5); // Show top 5 actions

  const getReadinessStatus = () => {
    if (readiness?.highestState === 'qualified_intro_ready') {
      return { text: 'Intro eligible', color: 'text-green-700' };
    }
    if (readiness?.highestState === 'browse_ready' || readiness?.flags?.matchVisible) {
      return { text: 'Match visible', color: 'text-blue-700' };
    }
    if (readiness?.highestState === 'portfolio_ready' || readiness?.flags?.portfolioReady) {
      return { text: 'Portfolio ready', color: 'text-proofound-forest' };
    }
    return { text: 'Proof setup', color: 'text-gray-600' };
  };

  const status = getReadinessStatus();
  const checklist = [
    {
      label: 'First Proof Pack created',
      met: Boolean(
        readiness?.states?.includes('portfolio_ready') || readiness?.flags?.portfolioReady
      ),
    },
    {
      label: 'Public Page ready',
      met: Boolean(
        readiness?.states?.includes('portfolio_ready') || readiness?.flags?.portfolioReady
      ),
    },
    {
      label: 'Matching preferences saved',
      met: Boolean(readiness?.states?.includes('browse_ready') || readiness?.flags?.matchVisible),
    },
    {
      label: 'Non-self verification added',
      met: Boolean(
        readiness?.states?.includes('qualified_intro_ready') || readiness?.flags?.introEligible
      ),
    },
  ];

  return (
    <Card variant="bento">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="min-w-0 flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-proofound-forest" />
            Proof Readiness Checklist
          </CardTitle>
          <Badge variant="outline" className={`${DASHBOARD_STATUS_CHIP_CLASS} ${status.color}`}>
            {status.text}
          </Badge>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
              {item.met ? (
                <CheckCircle2 className="h-4 w-4 text-proofound-forest" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {topActions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Core milestones covered</p>
            <p className="text-xs text-muted-foreground">
              Your portfolio is live and your next actions are now about keeping proof fresh.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-proofound-stone/70 bg-[#fbf8f1]/55 p-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Keep suggested follow-up work available without making it the main dashboard surface.
            </p>
            <NextStepsHelper
              actions={topActions.map((action) => ({
                id: action.id,
                title: action.title,
                description: action.description,
                actionUrl: action.actionUrl,
              }))}
              description="Open personalized proof-readiness next steps."
              onActionSelect={(actionId) => onActionClick?.(actionId)}
            />

            {actions.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/app/i/profile')}
                className="w-full text-proofound-forest hover:bg-proofound-forest/5"
              >
                View All {actions.length} Actions
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
