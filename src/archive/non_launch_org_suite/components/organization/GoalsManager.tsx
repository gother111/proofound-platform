'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import { GoalProgressChart } from './GoalProgressChart';
import { Plus, Target, BarChart3, AlertCircle, List } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

interface GoalsManagerProps {
  orgId: string;
  canEdit?: boolean;
}

export function GoalsManager({ orgId, canEdit = true }: GoalsManagerProps) {
  const [goals, setGoals] = useState<OrganizationGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<OrganizationGoal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchGoals = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/organizations/${orgId}/goals`);
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      const data = await response.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleSaveGoal = async (
    goal: Omit<OrganizationGoal, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    try {
      const url = goal.id
        ? `/api/organizations/${orgId}/goals/${goal.id}`
        : `/api/organizations/${orgId}/goals`;

      const method = goal.id ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      });

      if (!response.ok) {
        throw new Error('Failed to save goal');
      }

      toast.success(goal.id ? 'Goal updated' : 'Goal created');
      await fetchGoals();
      setShowGoalForm(false);
      setEditingGoal(null);
    } catch (error) {
      toast.error('Failed to save goal');
      throw error;
    }
  };

  const handleEdit = (goal: OrganizationGoal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiFetch(`/api/organizations/${orgId}/goals/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      toast.success('Goal deleted');
      await fetchGoals();
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete goal');
    }
  };

  // Filter goals by status and type
  const filteredGoals = goals.filter((g) => {
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    const matchesType = typeFilter === 'all' || g.goalType === typeFilter;
    return matchesStatus && matchesType;
  });

  const isEmpty = goals.length === 0;

  if (isLoading) {
    return (
      <Card className="border-black/5 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-12">
          <div className="text-center">
            <p className="text-muted-foreground">Loading goals...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-black/5 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goals
              </CardTitle>
              <CardDescription className="mt-1">
                Define and track progress toward organizational objectives
              </CardDescription>
            </div>
            {canEdit && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingGoal(null);
                  setShowGoalForm(true);
                }}
                className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isEmpty && canEdit ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-proofound-forest/10 to-proofound-sage/10 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-proofound-forest/60" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Set organizational goals to guide your mission and track progress toward meaningful
                outcomes.
              </p>
              <Button
                onClick={() => setShowGoalForm(true)}
                className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Goal
              </Button>
            </div>
          ) : isEmpty && !canEdit ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No goals available</p>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                <TabsTrigger value="overview">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="goals">
                  <List className="h-4 w-4 mr-2" />
                  All Goals
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <GoalProgressChart goals={goals} />
              </TabsContent>

              <TabsContent value="goals" className="mt-0 space-y-6">
                {/* Filters */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label htmlFor="status-filter" className="text-sm font-medium">
                      Status:
                    </label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="status-filter" className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="achieved">Achieved</SelectItem>
                        <SelectItem value="abandoned">Abandoned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="type-filter" className="text-sm font-medium">
                      Type:
                    </label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger id="type-filter" className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="sustainability">Sustainability</SelectItem>
                        <SelectItem value="diversity">Diversity</SelectItem>
                        <SelectItem value="innovation">Innovation</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="impact">Impact</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredGoals.length} of {goals.length} goals
                  </div>
                </div>

                {/* Goals Grid */}
                {filteredGoals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No goals match the selected filters
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        canEdit={canEdit}
                        onEdit={handleEdit}
                        onDelete={(id) => setDeleteConfirm(id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Info Banner */}
          {goals.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-300">
                <p className="font-medium mb-1">Goal visibility</p>
                <p className="text-blue-700 dark:text-blue-400">
                  Goals demonstrate your organization&apos;s commitment to growth and improvement,
                  helping candidates understand your direction and values.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Form Dialog */}
      <GoalForm
        open={showGoalForm}
        onOpenChange={(open) => {
          setShowGoalForm(open);
          if (!open) setEditingGoal(null);
        }}
        goal={editingGoal}
        onSave={handleSaveGoal}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The goal will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
