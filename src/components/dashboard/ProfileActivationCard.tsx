/**
 * Profile Activation Tile
 *
 * Shows readiness against activation gate (≥10 L4 skills with recency, ≥1 proof, purpose block).
 * Uses mock data when the tour is running to align with PRD first-run guidance.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { apiFetch } from '@/lib/api/fetch';
import { CheckCircle2, AlertCircle, Lock, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type ProfileCompletenessResponse = {
  percentage: number;
  missing: string[];
  actions: { id: string; title: string; actionUrl: string }[];
  skillCount?: number;
  proofCount?: number;
  valuesCount?: number;
};

type ExpertiseStatsResponse = {
  skillsWithRecency: number;
  activationThresholds: {
    lite: { skillsWithRecency: number; proofCount: number };
    strong: { skillsWithRecency: number; proofCount: number };
  };
  progressByTier: {
    lite: { skillsWithRecencyProgress: number; proofProgress: number };
    strong: { skillsWithRecencyProgress: number; proofProgress: number };
  };
  eligibility?: {
    tier: 'none' | 'lite' | 'strong';
    nextTierTarget: null | {
      tier: 'lite' | 'strong';
      message: string;
      remaining: {
        skillsWithRecency: number;
        proofCount: number;
        purpose: number;
        constraints: number;
      };
    };
  };
  featureFlags?: {
    activationTiering?: boolean;
  };
};

type ProfileActivationCardProps = {
  useMockData?: boolean;
};

export function ProfileActivationCard({ useMockData }: ProfileActivationCardProps) {
  const [data, setData] = useState<ProfileCompletenessResponse | null>(null);
  const [stats, setStats] = useState<ExpertiseStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useMockData) {
      setData({
        percentage: 68,
        missing: ['proof', 'values'],
        actions: [
          { id: 'add-proof', title: 'Upload a proof', actionUrl: '/app/i/profile?tab=proofs' },
          { id: 'add-values', title: 'Pick your values', actionUrl: '/app/i/profile' },
        ],
        skillCount: 8,
        proofCount: 0,
        valuesCount: 1,
      });
      setStats({
        skillsWithRecency: 8,
        activationThresholds: {
          lite: { skillsWithRecency: 3, proofCount: 1 },
          strong: { skillsWithRecency: 10, proofCount: 1 },
        },
        progressByTier: {
          lite: { skillsWithRecencyProgress: 100, proofProgress: 0 },
          strong: { skillsWithRecencyProgress: 80, proofProgress: 0 },
        },
        eligibility: {
          tier: 'lite',
          nextTierTarget: {
            tier: 'strong',
            message: 'Add more skills to reach Strong activation and improve ranking precision.',
            remaining: {
              skillsWithRecency: 2,
              proofCount: 0,
              purpose: 0,
              constraints: 0,
            },
          },
        },
        featureFlags: {
          activationTiering: true,
        },
      });
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [completenessResponse, statsResponse] = await Promise.all([
          apiFetch('/api/profile/completeness'),
          apiFetch('/api/expertise/stats'),
        ]);

        if (!completenessResponse.ok) throw new Error('Failed to fetch completeness');
        const completenessJson = (await completenessResponse.json()) as ProfileCompletenessResponse;
        setData(completenessJson);

        if (statsResponse.ok) {
          const statsJson = (await statsResponse.json()) as ExpertiseStatsResponse;
          setStats(statsJson);
        }
      } catch (error) {
        console.error(error);
        // Graceful fallback
        setData({
          percentage: 42,
          missing: ['skills', 'proof'],
          actions: [
            { id: 'add-skills', title: 'Add skills', actionUrl: '/app/i/expertise' },
            { id: 'add-proof', title: 'Upload a proof', actionUrl: '/app/i/profile?tab=proofs' },
          ],
          skillCount: 3,
          proofCount: 0,
          valuesCount: 0,
        });
        setStats({
          skillsWithRecency: 3,
          activationThresholds: {
            lite: { skillsWithRecency: 3, proofCount: 1 },
            strong: { skillsWithRecency: 10, proofCount: 1 },
          },
          progressByTier: {
            lite: { skillsWithRecencyProgress: 100, proofProgress: 0 },
            strong: { skillsWithRecencyProgress: 30, proofProgress: 0 },
          },
          featureFlags: {
            activationTiering: true,
          },
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [useMockData]);

  const status = useMemo(() => {
    const tier = stats?.eligibility?.tier || 'none';
    if (tier === 'strong') {
      return { label: 'Strong tier activated', tone: 'text-green-700', badge: 'Strong' };
    }
    if (tier === 'lite') {
      return { label: 'Lite tier activated', tone: 'text-amber-700', badge: 'Lite' };
    }
    return { label: 'Needs setup', tone: 'text-rose-700', badge: 'Not active' };
  }, [stats]);

  const activationChecks = useMemo(() => {
    const activationTieringEnabled = stats?.featureFlags?.activationTiering !== false;
    const liteSkillsThreshold = stats?.activationThresholds.lite.skillsWithRecency ?? 3;
    const strongSkillsThreshold = stats?.activationThresholds.strong.skillsWithRecency ?? 10;
    const skillsWithRecency = stats?.skillsWithRecency ?? data?.skillCount ?? 0;
    const skillsLite = skillsWithRecency >= liteSkillsThreshold;
    const skillsStrong = skillsWithRecency >= strongSkillsThreshold;
    const proofs = (data?.proofCount ?? 0) >= 1;
    const values = (data?.valuesCount ?? 0) >= 1;
    return [
      ...(activationTieringEnabled
        ? [{ label: `${liteSkillsThreshold}+ recent skills (Lite)`, pass: skillsLite }]
        : []),
      { label: `${strongSkillsThreshold}+ recent skills (Strong)`, pass: skillsStrong },
      { label: '≥1 proof', pass: proofs },
      { label: 'Purpose/values set', pass: values },
    ];
  }, [data, stats]);

  const nextTierActions = useMemo(() => {
    const remaining = stats?.eligibility?.nextTierTarget?.remaining;
    if (!remaining) return [];
    const actions: Array<{ id: string; title: string; actionUrl: string }> = [];
    if (remaining.skillsWithRecency > 0 || remaining.proofCount > 0) {
      actions.push({
        id: 'expertise',
        title: 'Add skills and proofs in Expertise Atlas',
        actionUrl: '/app/i/expertise',
      });
    }
    if (remaining.purpose > 0) {
      actions.push({
        id: 'purpose',
        title: 'Complete mission, values, or causes',
        actionUrl: '/app/i/profile',
      });
    }
    if (remaining.constraints > 0) {
      actions.push({
        id: 'constraints',
        title: 'Set work and compensation preferences',
        actionUrl: '/app/i/matching/preferences',
      });
    }
    return actions.slice(0, 3);
  }, [stats]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-[#1C4D3A]" />
            Profile Activation
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Hit the activation gate to unlock matches.
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {status.badge}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Readiness</span>
            <span className={`font-semibold ${status.tone}`}>{data?.percentage ?? 0}%</span>
          </div>
          <Progress value={data?.percentage ?? 0} className="h-2" />
          <p className="text-xs text-muted-foreground">{status.label}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-[#2D3330]">Tier progress</p>
          {stats?.featureFlags?.activationTiering !== false ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Lite</span>
                <span>{stats?.progressByTier?.lite.skillsWithRecencyProgress ?? 0}%</span>
              </div>
              <Progress
                value={stats?.progressByTier?.lite.skillsWithRecencyProgress ?? 0}
                className="h-1.5"
              />
            </div>
          ) : null}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Strong</span>
              <span>{stats?.progressByTier?.strong.skillsWithRecencyProgress ?? 0}%</span>
            </div>
            <Progress
              value={stats?.progressByTier?.strong.skillsWithRecencyProgress ?? 0}
              className="h-1.5"
            />
          </div>
        </div>

        <div className="space-y-2">
          {activationChecks.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              {item.pass ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-[#2D3330]">Next steps</p>
          {(nextTierActions.length > 0 ? nextTierActions : (data?.actions || []).slice(0, 3)).map(
            (action) => (
              <Link
                key={action.id}
                href={action.actionUrl}
                className="flex items-center justify-between rounded-lg border border-[#E8E6DD] px-3 py-2 hover:border-[#1C4D3A] hover:bg-[#F7F6F1] text-sm"
              >
                <span className="text-[#2D3330]">{action.title}</span>
                <ArrowRight className="h-4 w-4 text-[#9B9891]" />
              </Link>
            )
          )}
          {loading && (
            <div className="space-y-2">
              <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Private by default; shared only when you opt in.
        </div>

        <Button className="w-full bg-[#1C4D3A] hover:bg-[#1A4634]" size="sm" asChild>
          <Link href="/app/i/profile">Open profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
