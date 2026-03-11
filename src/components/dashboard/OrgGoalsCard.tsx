'use client';

/**
 * OrgGoalsCard Widget
 *
 * Displays organization's goals with progress tracking
 * Part of the org dashboard (PRD O8)
 *
 * Features:
 * - Shows organization goals with status and progress
 * - Goal type badges
 * - Quick stats summary
 */

import {
  Target,
  Plus,
  CheckCircle,
  Clock,
  TrendingUp,
  Loader2,
  AlertCircle,
  Leaf,
  Users,
  Lightbulb,
  BarChart3,
  Heart,
  MoreHorizontal,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/fetch';
import Link from 'next/link';

interface OrgGoalsCardProps {
  orgSlug: string;
  orgId: string;
  canManageSettings?: boolean;
  initialData?: any;
  onVisibilityChange?: (visible: boolean) => void;
}

// Type definitions for organization goal data
interface OrgGoal {
  id: string;
  goal_type: 'sustainability' | 'diversity' | 'innovation' | 'growth' | 'impact' | 'other';
  title: string;
  description: string;
  target_date?: string | null;
  current_progress?: number | null;
  metrics?: string | null;
  status: 'not_started' | 'in_progress' | 'achieved' | 'abandoned';
  created_at: string;
  updated_at: string;
}

// Goal type configuration
const goalTypeConfig = {
  sustainability: { label: 'Sustainability', icon: Leaf, color: '#166534', bg: '#DCFCE7' },
  diversity: { label: 'Diversity', icon: Users, color: '#9333EA', bg: '#F3E8FF' },
  innovation: { label: 'Innovation', icon: Lightbulb, color: '#F59E0B', bg: '#FEF3C7' },
  growth: { label: 'Growth', icon: BarChart3, color: '#3B82F6', bg: '#DBEAFE' },
  impact: { label: 'Impact', icon: Heart, color: '#DC2626', bg: '#FEE2E2' },
  other: { label: 'Other', icon: MoreHorizontal, color: '#6B6760', bg: '#E8E6DD' },
};

// Status configuration
const statusConfig = {
  not_started: { label: 'Not Started', icon: Clock, color: '#6B6760', bg: '#E8E6DD' },
  in_progress: { label: 'In Progress', icon: TrendingUp, color: '#1C4D3A', bg: '#D8EDE4' },
  achieved: { label: 'Achieved', icon: CheckCircle, color: '#166534', bg: '#DCFCE7' },
  abandoned: { label: 'Abandoned', icon: AlertCircle, color: '#DC2626', bg: '#FEE2E2' },
};

export function OrgGoalsCard({
  orgSlug,
  orgId,
  canManageSettings = false,
  initialData,
  onVisibilityChange,
}: OrgGoalsCardProps) {
  const [goals, setGoals] = useState<OrgGoal[]>(() => {
    if (initialData) {
      return (initialData || []).filter((g: OrgGoal) => g.status !== 'abandoned').slice(0, 3);
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch org goals from API
  useEffect(() => {
    if (initialData) {
      const activeGoals = (initialData || []).filter((g: OrgGoal) => g.status !== 'abandoned');
      setGoals(activeGoals.slice(0, 3));
      setIsLoading(false);
      return;
    }

    async function fetchGoals() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiFetch(`/api/organizations/${orgId}/goals`);

        if (!response.ok) {
          throw new Error('Failed to fetch goals');
        }

        const data = await response.json();
        // Filter out abandoned goals and show active ones
        const activeGoals = (data.goals || []).filter((g: OrgGoal) => g.status !== 'abandoned');
        setGoals(activeGoals.slice(0, 3)); // Show top 3
      } catch (err) {
        console.error('Error fetching org goals:', err);
        setError(err instanceof Error ? err.message : 'Failed to load goals');
      } finally {
        setIsLoading(false);
      }
    }

    if (orgId) {
      fetchGoals();
    }
  }, [orgId, initialData]);

  useEffect(() => {
    if (isLoading) return;
    const hasVisibleContent = error ? true : goals.length > 0;
    onVisibilityChange?.(hasVisibleContent);
  }, [error, goals.length, isLoading, onVisibilityChange]);

  // Calculate stats
  const stats = {
    total: goals.length,
    inProgress: goals.filter((g) => g.status === 'in_progress').length,
    achieved: goals.filter((g) => g.status === 'achieved').length,
  };

  // Loading state
  if (isLoading) {
    return (
      <Card variant="bento" className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-base font-semibold text-foreground">Organization Goals</h5>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card variant="bento" className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-base font-semibold text-foreground">Organization Goals</h5>
        </div>
        <div className="text-center py-6">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </Card>
    );
  }

  // Empty state
  if (goals.length === 0) {
    return (
      <Card variant="bento" className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-base font-semibold text-foreground">Organization Goals</h5>
        </div>
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-sm mb-4 text-muted-foreground">
            Set organizational goals to track your progress and showcase your commitment.
          </p>
          {canManageSettings ? (
            <Link href={`/app/o/${orgSlug}/settings/goals`}>
              <Button size="sm" variant="secondary" className="rounded-full">
                <Plus className="w-4 h-4 mr-1" />
                Add Goal
              </Button>
            </Link>
          ) : (
            <Link href={`/app/o/${orgSlug}/profile`}>
              <Button size="sm" variant="outline" className="rounded-full">
                View Profile
              </Button>
            </Link>
          )}
        </div>
      </Card>
    );
  }

  // Goals list view
  return (
    <Card variant="bento" className="p-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h5 className="text-base font-semibold text-foreground">Organization Goals</h5>
          {stats.inProgress > 0 && (
            <Badge variant="secondary" className="px-2 py-0 rounded-full">
              {stats.inProgress} active
            </Badge>
          )}
        </div>
        <Link
          href={
            canManageSettings ? `/app/o/${orgSlug}/settings/goals` : `/app/o/${orgSlug}/profile`
          }
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {canManageSettings ? 'Manage' : 'View'}
        </Link>
      </div>

      {/* Goals list */}
      <div className="space-y-4">
        {goals.map((goal) => {
          const typeConfig = goalTypeConfig[goal.goal_type];
          const TypeIcon = typeConfig.icon;
          const status = statusConfig[goal.status];
          const progress = goal.current_progress ? Number(goal.current_progress) : 0;

          return (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <TypeIcon
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: typeConfig.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-foreground">{goal.title}</p>
                    {goal.target_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Target:{' '}
                        {new Date(goal.target_date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 flex-shrink-0"
                  style={{ backgroundColor: status.bg, color: status.color }}
                >
                  {status.label}
                </Badge>
              </div>
              {/* Progress bar */}
              {progress > 0 && (
                <div className="flex items-center gap-2">
                  <Progress
                    value={progress}
                    className="h-1.5 flex-1"
                    style={{ backgroundColor: '#E8E6DD' }}
                  />
                  <span className="text-[10px]" style={{ color: '#6B6760' }}>
                    {progress}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick stats footer */}
      <div className="mt-6 pt-4 border-t border-black/[0.04] dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {stats.achieved} achieved
          </span>
        </div>
        {canManageSettings && (
          <Link href={`/app/o/${orgSlug}/settings/goals`}>
            <Button size="sm" variant="ghost" className="rounded-full shrink-0">
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
