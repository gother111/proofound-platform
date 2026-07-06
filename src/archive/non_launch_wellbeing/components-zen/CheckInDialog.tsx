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
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultMilestone?: 'rejection' | 'interview' | 'offer' | 'withdrawal' | 'no_show';
}

const STRESS_SCALE = [
  { score: 1, label: 'Very low', description: 'Things feel steady right now.' },
  { score: 2, label: 'Low', description: 'There is some pressure, but it feels manageable.' },
  { score: 3, label: 'Moderate', description: 'There is noticeable friction today.' },
  { score: 4, label: 'High', description: 'The current work-search flow feels heavy.' },
  { score: 5, label: 'Very high', description: 'The current work-search flow feels intense.' },
] as const;

const CONTROL_SCALE = [
  { score: 1, label: 'Very low', description: 'The next step feels hard to see.' },
  { score: 2, label: 'Low', description: 'You have a little footing, but not much.' },
  { score: 3, label: 'Moderate', description: 'Some parts feel clear and some do not.' },
  { score: 4, label: 'High', description: 'You have a workable sense of the next step.' },
  { score: 5, label: 'Very high', description: 'You feel clear about what to do next.' },
] as const;

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

  const stressLabel = STRESS_SCALE.find((s) => s.score === stressLevel);
  const controlLabel = CONTROL_SCALE.find((c) => c.score === controlLevel);

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
        description: 'Your private check-in has been saved.',
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
            Private check-in
          </DialogTitle>
          <DialogDescription>
            Record a brief private check-in. It stays in your private reflection area and does not
            affect matching, ranking, or org visibility.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stress Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="stress" className="text-base font-medium">
                Current stress level
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
                Sense of control
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
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                <SelectItem value="no_show">No-show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Privacy Reminder */}
          <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
            <p>
              <strong>Privacy:</strong> This check-in stays private to you and is excluded from
              matching, fairness review, reveal, and org analytics.
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
