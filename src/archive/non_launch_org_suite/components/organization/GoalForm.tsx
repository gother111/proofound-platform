'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OrganizationGoal {
  id?: string;
  goalType: 'sustainability' | 'diversity' | 'innovation' | 'growth' | 'impact' | 'other';
  title: string;
  description: string;
  targetDate?: string;
  currentProgress?: number;
  metrics?: string;
  status: 'not_started' | 'in_progress' | 'achieved' | 'abandoned';
}

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: OrganizationGoal | null;
  onSave: (goal: OrganizationGoal) => Promise<void>;
}

const GOAL_TYPE_OPTIONS = [
  { value: 'sustainability', label: 'Sustainability' },
  { value: 'diversity', label: 'Diversity & Inclusion' },
  { value: 'innovation', label: 'Innovation' },
  { value: 'growth', label: 'Growth' },
  { value: 'impact', label: 'Impact' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'achieved', label: 'Achieved' },
  { value: 'abandoned', label: 'Abandoned' },
];

export function GoalForm({ open, onOpenChange, goal, onSave }: GoalFormProps) {
  const [formData, setFormData] = useState<OrganizationGoal>({
    goalType: 'impact',
    title: '',
    description: '',
    targetDate: '',
    currentProgress: 0,
    metrics: '',
    status: 'in_progress',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (goal) {
        setFormData(goal);
      } else {
        setFormData({
          goalType: 'impact',
          title: '',
          description: '',
          targetDate: '',
          currentProgress: 0,
          metrics: '',
          status: 'in_progress',
        });
      }
      setError(null);
    }
  }, [open, goal]);

  const handleSave = async () => {
    // Validate required fields
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
          <DialogDescription>
            Define an organizational goal and track progress toward achieving it
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Goal Type */}
          <div className="space-y-2">
            <Label htmlFor="goalType">Goal Type *</Label>
            <Select
              value={formData.goalType}
              onValueChange={(value: any) => setFormData({ ...formData, goalType: value })}
            >
              <SelectTrigger id="goalType">
                <SelectValue placeholder="Select goal type" />
              </SelectTrigger>
              <SelectContent>
                {GOAL_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Achieve Carbon Neutrality"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the goal, why it matters, and what success looks like"
              rows={3}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Progress */}
          {formData.status === 'in_progress' && (
            <div className="space-y-3">
              <Label htmlFor="progress">
                Current Progress{' '}
                <span className="text-xs text-muted-foreground ml-2">
                  ({formData.currentProgress || 0}%)
                </span>
              </Label>
              <Slider
                id="progress"
                value={[formData.currentProgress || 0]}
                onValueChange={([value]) => setFormData({ ...formData, currentProgress: value })}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          )}

          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Date (Optional)</Label>
            <Input
              id="targetDate"
              type="date"
              value={formData.targetDate || ''}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            />
          </div>

          {/* Success Metrics */}
          <div className="space-y-2">
            <Label htmlFor="metrics">Success Metrics (Optional)</Label>
            <Textarea
              id="metrics"
              value={formData.metrics || ''}
              onChange={(e) => setFormData({ ...formData, metrics: e.target.value })}
              placeholder="How will you measure success? e.g., Reduce CO2 emissions by 50%, Increase team diversity to 40%"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Define specific, measurable indicators that show progress
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : goal ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
