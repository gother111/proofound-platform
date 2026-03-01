/**
 * Profile Activation Tile
 *
 * Shows readiness for Lite/Strong activation with a simple match-ready checklist.
 * Uses mock data when the tour is running to align with PRD first-run guidance.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, Lock, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getIndividualRecoveryActions } from '@/lib/ui/recovery-actions';
import { DASHBOARD_STATUS_CHIP_CLASS } from '@/components/dashboard/chipStyles';
import {
  getProfileCompleteness,
  getExpertiseStats,
  type ProfileCompletenessData,
  type ExpertiseStatsData,
} from '@/app/actions/dashboard';

type ProfileActivationCardProps = {
  useMockData?: boolean;
  initialData?: {
    completenessJson: ProfileCompletenessData;
    statsJson: ExpertiseStatsData;
  } | null;
};

export function ProfileActivationCard({ useMockData, initialData }: ProfileActivationCardProps) {
  const [data, setData] = useState<ProfileCompletenessData | null>(
    initialData?.completenessJson || null
  );
  const [stats, setStats] = useState<ExpertiseStatsData | null>(initialData?.statsJson || null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (useMockData) {
      setData({
        percentage: 68,
        missing: ['proof', 'values'],
        actions: [
          {
            id: 'add-proof',
            title: 'Upload a proof',
            description: '',
            priority: 'medium',
            category: 'expertise',
            actionUrl: '/app/i/profile?tab=proofs',
            completed: false,
          },
          {
            id: 'add-values',
            title: 'Pick your values',
            description: '',
            priority: 'medium',
            category: 'profile',
            actionUrl: '/app/i/profile',
            completed: false,
          },
        ],
        skillCount: 8,
        proofCount: 0,
        valuesCount: 1,
      });
      setStats({
        totalL4Skills: 8,
        skillsWithRecency: 8,
        skillsWithProofs: 0,
        skillsWithVerifications: 0,
        progressPercentage: 80,
        activationThreshold: 10,
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
      if (initialData) {
        setLoading(false);
        return;
      }
      try {
        const [completenessJson, statsJson] = await Promise.all([
          getProfileCompleteness(),
          getExpertiseStats(),
        ]);

        setData(completenessJson);
        setStats(statsJson);
      } catch (error) {
        console.error(error);
        // Graceful fallback
        setData({
          percentage: 42,
          missing: ['skills', 'proof'],
          actions: [
            {
              id: 'add-skills',
              title: 'Add skills',
              description: '',
              priority: 'high',
              category: 'expertise',
              actionUrl: '/app/i/expertise',
              completed: false,
            },
            {
              id: 'add-proof',
              title: 'Upload a proof',
              description: '',
              priority: 'medium',
              category: 'expertise',
              actionUrl: '/app/i/profile?tab=proofs',
              completed: false,
            },
          ],
          skillCount: 3,
          proofCount: 0,
          valuesCount: 0,
        });
        setStats({
          totalL4Skills: 3,
          skillsWithRecency: 3,
          skillsWithProofs: 0,
          skillsWithVerifications: 0,
          progressPercentage: 30,
          activationThreshold: 10,
          activationThresholds: {
            lite: { skillsWithRecency: 3, proofCount: 1 },
            strong: { skillsWithRecency: 10, proofCount: 1 },
          },
          progressByTier: {
            lite: { skillsWithRecencyProgress: 100, proofProgress: 0 },
            strong: { skillsWithRecencyProgress: 30, proofProgress: 0 },
          },
          eligibility: {
            tier: 'none',
            nextTierTarget: null,
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
  }, [useMockData, initialData]);

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
    const liteSkillsThreshold = stats?.activationThresholds?.lite?.skillsWithRecency ?? 3;
    const skillsWithRecency = stats?.skillsWithRecency ?? data?.skillCount ?? 0;
    const hasLiteSkills = skillsWithRecency >= liteSkillsThreshold;
    const hasProof = (data?.proofCount ?? 0) >= 1;
    const eligibilityTier = stats?.eligibility?.tier || 'none';
    const remaining = stats?.eligibility?.nextTierTarget?.remaining;
    const hasPurpose = remaining ? remaining.purpose === 0 : eligibilityTier !== 'none';
    const hasConstraints = remaining ? remaining.constraints === 0 : eligibilityTier !== 'none';

    return [
      { label: `${liteSkillsThreshold} key skills with recency`, pass: hasLiteSkills },
      { label: '1 proof artifact', pass: hasProof },
      { label: 'Basic preferences saved', pass: hasConstraints },
      { label: 'Mission, values, or causes', pass: hasPurpose },
    ];
  }, [data, stats]);

  const nextTierActions = useMemo(() => {
    const remaining = stats?.eligibility?.nextTierTarget?.remaining;
    if (!remaining) return [];
    const actions: Array<{ id: string; title: string; description: string; actionUrl: string }> =
      [];
    if (remaining.skillsWithRecency > 0 || remaining.proofCount > 0) {
      actions.push({
        id: 'expertise',
        title: 'Add skills and proofs in Expertise Atlas',
        description: 'Increase skill coverage and attach proof to improve trust and ranking.',
        actionUrl: '/app/i/expertise',
      });
    }
    if (remaining.purpose > 0) {
      actions.push({
        id: 'purpose',
        title: 'Complete mission, values, or causes',
        description: 'Purpose signals improve alignment and candidate fit quality.',
        actionUrl: '/app/i/profile',
      });
    }
    if (remaining.constraints > 0) {
      actions.push({
        id: 'constraints',
        title: 'Set work and compensation preferences',
        description: 'Preferences are required before matching can activate fully.',
        actionUrl: '/app/i/matching/preferences',
      });
    }
    return actions.slice(0, 3);
  }, [stats]);

  const nextStepActions = useMemo(() => {
    const hints =
      nextTierActions.length > 0
        ? nextTierActions
        : (data?.actions || []).map((action: any) => ({
            id: action.id,
            title: action.title,
            description: 'Complete this action to improve activation readiness.',
            actionUrl: action.actionUrl,
          }));

    return getIndividualRecoveryActions('profile-incomplete', hints);
  }, [data?.actions, nextTierActions]);

  return (
    <Card variant="bento" className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-proofound-forest" />
            Get match-ready in 4 quick steps
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            You are active now. Completing these steps improves match quality.
          </p>
        </div>
        <Badge variant="outline" className={DASHBOARD_STATUS_CHIP_CLASS}>
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
          <p className="text-xs font-medium text-foreground">Tier progress</p>
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
          <p className="text-xs font-medium text-foreground">Next steps</p>
          {nextStepActions.map((action) => (
            <Link
              key={action.id}
              href={action.actionUrl}
              className="flex items-center justify-between rounded-lg border border-proofound-stone px-3 py-2 hover:border-proofound-forest hover:bg-japandi-bg text-sm"
            >
              <span className="text-foreground">{action.title}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
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

        <Button
          className="w-full bg-proofound-forest hover:bg-proofound-forest/90"
          size="sm"
          asChild
        >
          <Link href="/app/i/profile">Open profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
