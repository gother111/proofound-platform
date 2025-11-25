'use client';

/**
 * GoalsCard Widget
 *
 * Displays user's growth plans / career goals with progress tracking
 * Part of the customizable dashboard (PRD F2)
 *
 * Features:
 * - Shows current active goals with progress bars
 * - Quick actions to create new goals
 * - Stats summary (in progress, completed)
 */

import { Target, Plus, CheckCircle, Clock, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Type definitions for goal data
interface Goal {
  id: string;
  title: string;
  goal?: string | null;
  targetLevel?: number | null;
  targetDate?: string | null;
  status: 'planned' | 'in_progress' | 'blocked' | 'completed' | 'archived';
  progress: number;
  completedMilestones: number;
  totalMilestones: number;
  createdAt: string;
  updatedAt: string;
}

interface GoalsStats {
  total: number;
  planned: number;
  inProgress: number;
  completed: number;
  blocked: number;
}

interface GoalsApiResponse {
  goals: Goal[];
  stats: GoalsStats;
}

// Status color mapping
const statusConfig = {
  planned: { label: 'Planned', icon: Clock, color: '#6B6760', bg: '#E8E6DD' },
  in_progress: { label: 'In Progress', icon: TrendingUp, color: '#1C4D3A', bg: '#D8EDE4' },
  blocked: { label: 'Blocked', icon: AlertCircle, color: '#DC2626', bg: '#FEE2E2' },
  completed: { label: 'Completed', icon: CheckCircle, color: '#166534', bg: '#DCFCE7' },
  archived: { label: 'Archived', icon: Clock, color: '#9CA3AF', bg: '#F3F4F6' },
};

export function GoalsCard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch goals from API
  useEffect(() => {
    async function fetchGoals() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch active goals (exclude archived)
        const response = await fetch('/api/goals?limit=5');

        if (!response.ok) {
          throw new Error('Failed to fetch goals');
        }

        const data: GoalsApiResponse = await response.json();
        // Filter out archived goals for display
        const activeGoals = data.goals.filter((g) => g.status !== 'archived');
        setGoals(activeGoals.slice(0, 3)); // Show top 3 most recent active goals
        setStats(data.stats);
      } catch (err) {
        console.error('Error fetching goals:', err);
        setError(err instanceof Error ? err.message : 'Failed to load goals');
      } finally {
        setIsLoading(false);
      }
    }

    fetchGoals();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Goals
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
            Goals
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

  // Empty state - no goals yet
  if (goals.length === 0) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Goals
          </h5>
        </div>
        <div className="text-center py-6">
          <Target className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
          <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
            Set your career goals and track your progress. Create milestones and watch yourself
            grow.
          </p>
          <Link href="/app/i/growth/goals">
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
              Create Goal
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
            Goals
          </h5>
          {stats && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: '#D8EDE4', color: '#1C4D3A' }}
            >
              {stats.inProgress} active
            </span>
          )}
        </div>
        <Link
          href="/app/i/growth/goals"
          className="text-xs hover:underline"
          style={{ color: '#1C4D3A' }}
        >
          View all
        </Link>
      </div>

      {/* Goals list */}
      <div className="space-y-3">
        {goals.map((goal) => {
          const config = statusConfig[goal.status];
          const StatusIcon = config.icon;

          return (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <StatusIcon
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: config.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: '#2D3330' }}>
                      {goal.title}
                    </p>
                    {goal.totalMilestones > 0 && (
                      <p className="text-xs" style={{ color: '#6B6760' }}>
                        {goal.completedMilestones}/{goal.totalMilestones} milestones
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 flex-shrink-0"
                  style={{ backgroundColor: config.bg, color: config.color }}
                >
                  {config.label}
                </Badge>
              </div>
              {/* Progress bar */}
              {goal.totalMilestones > 0 && (
                <Progress
                  value={goal.progress}
                  className="h-1.5"
                  style={{ backgroundColor: '#E8E6DD' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Quick stats footer */}
      {stats && (
        <div
          className="mt-4 pt-3 border-t flex items-center justify-between"
          style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
        >
          <div className="flex items-center gap-3 text-xs" style={{ color: '#6B6760' }}>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" style={{ color: '#166534' }} />
              {stats.completed} done
            </span>
            {stats.blocked > 0 && (
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" style={{ color: '#DC2626' }} />
                {stats.blocked} blocked
              </span>
            )}
          </div>
          <Link href="/app/i/growth/goals/new">
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
      )}
    </Card>
  );
}
