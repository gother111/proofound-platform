'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Award } from 'lucide-react';

interface OrganizationGoal {
  id: string;
  goalType: 'sustainability' | 'diversity' | 'innovation' | 'growth' | 'impact' | 'other';
  title: string;
  description: string;
  targetDate?: string;
  currentProgress?: number;
  metrics?: string;
  status: 'not_started' | 'in_progress' | 'achieved' | 'abandoned';
  createdAt: string;
  updatedAt: string;
}

interface GoalProgressChartProps {
  goals: OrganizationGoal[];
}

export function GoalProgressChart({ goals }: GoalProgressChartProps) {
  const totalGoals = goals.length;
  const achievedGoals = goals.filter((g) => g.status === 'achieved').length;
  const inProgressGoals = goals.filter((g) => g.status === 'in_progress').length;
  const notStartedGoals = goals.filter((g) => g.status === 'not_started').length;

  // Calculate average progress of in-progress goals
  const progressGoals = goals.filter((g) => g.status === 'in_progress' && g.currentProgress);
  const avgProgress = progressGoals.length > 0
    ? progressGoals.reduce((sum, g) => sum + Number(g.currentProgress || 0), 0) / progressGoals.length
    : 0;

  if (totalGoals === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-proofound-stone dark:border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{achievedGoals}</p>
                <p className="text-sm text-muted-foreground">Achieved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-proofound-stone dark:border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressGoals}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-proofound-stone dark:border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900/20">
                <Target className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notStartedGoals}</p>
                <p className="text-sm text-muted-foreground">Not Started</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Average Progress */}
      {inProgressGoals > 0 && (
        <Card className="border-proofound-stone dark:border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium">Average Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Across {inProgressGoals} active {inProgressGoals === 1 ? 'goal' : 'goals'}
                </span>
                <span className="font-semibold">{avgProgress.toFixed(0)}%</span>
              </div>
              <Progress value={avgProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals by Type */}
      <Card className="border-proofound-stone dark:border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium">Goals by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(['sustainability', 'diversity', 'innovation', 'growth', 'impact', 'other'] as const).map((type) => {
              const count = goals.filter((g) => g.goalType === type).length;
              if (count === 0) return null;
              
              const typeLabels = {
                sustainability: 'Sustainability',
                diversity: 'Diversity',
                innovation: 'Innovation',
                growth: 'Growth',
                impact: 'Impact',
                other: 'Other',
              };

              return (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{typeLabels[type]}</span>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

