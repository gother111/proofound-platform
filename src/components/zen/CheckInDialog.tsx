'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Heart, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';
import { zenCheckInConfig, zenPractices, type RiskState } from '@/data/zen';

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultMilestone?: 'rejection' | 'interview' | 'offer';
}

export function CheckInDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultMilestone,
}: CheckInDialogProps) {
  const [stressLevel, setStressLevel] = useState(3);
  const [controlLevel, setControlLevel] = useState(3);
  const [milestone, setMilestone] = useState<string | undefined>(defaultMilestone);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stressLabel = zenCheckInConfig.stressScale.find((s) => s.score === stressLevel);
  const controlLabel = zenCheckInConfig.controlScale.find((c) => c.score === controlLevel);

  const derivedMood: RiskState =
    stressLevel >= 4 ? 'support' : stressLevel === 3 ? 'focus' : ('calm' as RiskState);

  const microPractice =
    zenPractices.find(
      (p) => p.isMicro && p.recommendedFor?.includes(derivedMood)
    ) || zenPractices.find((p) => p.isMicro);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await apiFetch('/api/wellbeing/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stressLevel,
          controlLevel,
          milestoneTriggerId: milestone || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save check-in');
      }

      toast.success('Check-in recorded', {
        description: 'Your well-being check-in has been saved.',
      });

      // Reset form
      setStressLevel(3);
      setControlLevel(3);
      setMilestone(undefined);

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to save check-in', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#7A9278]" />
            Well-Being Check-In
          </DialogTitle>
          <DialogDescription>
            Take a moment to check in with yourself. This is private and just for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stress Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="stress" className="text-base font-medium">
                Current Stress Level
              </Label>
              <span className="text-sm font-semibold text-[#7A9278]">
                {stressLabel?.label || 'Moderate'}
              </span>
            </div>
            <Slider
              id="stress"
              min={1}
              max={5}
              step={1}
              value={[stressLevel]}
              onValueChange={(values) => setStressLevel(values[0])}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very Low</span>
              <span>Very High</span>
            </div>
            {stressLabel?.description && (
              <p className="text-xs text-muted-foreground">{stressLabel.description}</p>
            )}
          </div>

          {/* Sense of Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="control" className="text-base font-medium">
                Sense of Control
              </Label>
              <span className="text-sm font-semibold text-[#7A9278]">
                {controlLabel?.label || 'Moderate'}
              </span>
            </div>
            <Slider
              id="control"
              min={1}
              max={5}
              step={1}
              value={[controlLevel]}
              onValueChange={(values) => setControlLevel(values[0])}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very Low</span>
              <span>Very High</span>
            </div>
            {controlLabel?.description && (
              <p className="text-xs text-muted-foreground">{controlLabel.description}</p>
            )}
          </div>

          {/* Milestone Trigger (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="milestone" className="text-base font-medium">
              Related to a Career Event? <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Select value={milestone} onValueChange={setMilestone}>
              <SelectTrigger id="milestone">
                <SelectValue placeholder="Select if related to an event..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific event</SelectItem>
                <SelectItem value="rejection">Application Rejection</SelectItem>
                <SelectItem value="interview">Interview Scheduled/Completed</SelectItem>
                <SelectItem value="offer">Job Offer Received</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Well-Being Score Preview */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-[#7A9278] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Your Well-Being Score</p>
                <p className="text-2xl font-semibold text-[#7A9278]">
                  {5 - stressLevel + controlLevel}{' '}
                  <span className="text-sm text-muted-foreground">/ 8</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Calculated from: (5 - stress) + control. Higher is better.
                </p>
              </div>
            </div>
          </div>

          {/* Quick practice nudge */}
          {microPractice && (
            <div className="bg-muted/20 rounded-lg p-4 text-sm">
              <p className="font-medium mb-1">Try a 1-minute reset</p>
              <p className="text-muted-foreground mb-2">
                {zenCheckInConfig.quickPracticePrompt}
              </p>
              <p className="text-muted-foreground">
                Suggested: {microPractice.title} · {microPractice.duration}
              </p>
            </div>
          )}

          {/* Privacy Reminder */}
          <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
            <p>
              <strong>Privacy:</strong> This check-in is completely private and will never affect
              your matching, ranking, or visibility to organizations.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#7A9278] hover:bg-[#7A9278]/90 text-white"
          >
            {isSubmitting ? 'Saving...' : 'Save Check-In'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
