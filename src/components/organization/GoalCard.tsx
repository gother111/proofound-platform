'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit2, Trash2, Calendar, Target, TrendingUp } from 'lucide-react';

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

interface GoalCardProps {
  goal: OrganizationGoal;
  canEdit: boolean;
  onEdit: (goal: OrganizationGoal) => void;
  onDelete: (id: string) => void;
}

const GOAL_TYPE_COLORS = {
  sustainability: 'bg-green-100 text-green-700 border-green-300',
  diversity: 'bg-purple-100 text-purple-700 border-purple-300',
  innovation: 'bg-blue-100 text-blue-700 border-blue-300',
  growth: 'bg-orange-100 text-orange-700 border-orange-300',
  impact: 'bg-pink-100 text-pink-700 border-pink-300',
  other: 'bg-gray-100 text-gray-700 border-gray-300',
};

const GOAL_TYPE_LABELS = {
  sustainability: 'Sustainability',
  diversity: 'Diversity',
  innovation: 'Innovation',
  growth: 'Growth',
  impact: 'Impact',
  other: 'Other',
};

const STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-700 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
  achieved: 'bg-green-100 text-green-700 border-green-300',
  abandoned: 'bg-red-100 text-red-700 border-red-300',
};

const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  achieved: 'Achieved',
  abandoned: 'Abandoned',
};

export function GoalCard({ goal, canEdit, onEdit, onDelete }: GoalCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const progress = goal.currentProgress ? Number(goal.currentProgress) : 0;

  return (
    <Card className="border-proofound-stone dark:border-border hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 rounded-lg bg-proofound-forest/10">
                <Target className="h-5 w-5 text-proofound-forest" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg">{goal.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className={GOAL_TYPE_COLORS[goal.goalType]}>
                    {GOAL_TYPE_LABELS[goal.goalType]}
                  </Badge>
                  <Badge variant="outline" className={STATUS_COLORS[goal.status]}>
                    {STATUS_LABELS[goal.status]}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(goal)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(goal.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {goal.status === 'in_progress' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Progress
              </span>
              <span className="font-semibold">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Target Date */}
        {goal.targetDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Target: {formatDate(goal.targetDate)}</span>
          </div>
        )}

        {/* Description */}
        <div className="p-3 rounded-lg bg-muted/30 border border-muted-foreground/10">
          <p className="text-sm">{goal.description}</p>
        </div>

        {/* Metrics */}
        {goal.metrics && (
          <div className="p-3 rounded-lg bg-proofound-forest/5 border border-proofound-forest/20">
            <p className="text-xs font-medium text-proofound-forest mb-1">Success Metrics</p>
            <p className="text-sm">{goal.metrics}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

