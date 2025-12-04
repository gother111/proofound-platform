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

export function OrgGoalsCard({ orgSlug, orgId }: OrgGoalsCardProps) {
  const [goals, setGoals] = useState<OrgGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch org goals from API
  useEffect(() => {
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
  }, [orgId]);

  // Calculate stats
  const stats = {
    total: goals.length,
    inProgress: goals.filter((g) => g.status === 'in_progress').length,
    achieved: goals.filter((g) => g.status === 'achieved').length,
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Organization Goals
          </h5>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1C4D3A' }} />
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Organization Goals
          </h5>
        </div>
        <div className="text-center py-4">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#DC2626' }} />
          <p className="text-xs" style={{ color: '#6B6760' }}>
            {error}
          </p>
        </div>
      </Card>
    );
  }

  // Empty state
  if (goals.length === 0) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Organization Goals
          </h5>
        </div>
        <div className="text-center py-6">
          <Target className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
          <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
            Set organizational goals to track your progress and showcase your commitment.
          </p>
          <Link href={`/app/o/${orgSlug}/settings/goals`}>
            <Button
              size="sm"
              className="h-7 text-xs"
              style={{
                backgroundColor: isHovered ? '#2D5F4A' : '#1C4D3A',
                color: '#F7F6F1',
                transition: 'background-color 200ms',
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Goal
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Goals list view
  return (
    <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Organization Goals
          </h5>
          {stats.inProgress > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: '#D8EDE4', color: '#1C4D3A' }}
            >
              {stats.inProgress} active
            </span>
          )}
        </div>
        <Link
          href={`/app/o/${orgSlug}/settings/goals`}
          className="text-xs hover:underline"
          style={{ color: '#1C4D3A' }}
        >
          View all
        </Link>
      </div>

      {/* Goals list */}
      <div className="space-y-3">
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
                    <p className="text-sm font-medium truncate" style={{ color: '#2D3330' }}>
                      {goal.title}
                    </p>
                    {goal.target_date && (
                      <p className="text-xs" style={{ color: '#6B6760' }}>
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
      <div
        className="mt-4 pt-3 border-t flex items-center justify-between"
        style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
      >
        <div className="flex items-center gap-3 text-xs" style={{ color: '#6B6760' }}>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" style={{ color: '#166534' }} />
            {stats.achieved} achieved
          </span>
        </div>
        <Link href={`/app/o/${orgSlug}/settings/goals/new`}>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            style={{ color: '#1C4D3A' }}
          >
            <Plus className="w-3 h-3 mr-1" />
            New
          </Button>
        </Link>
      </div>
    </Card>
  );
}
