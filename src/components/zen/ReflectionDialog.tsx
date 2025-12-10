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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';
import { reflectionPrompts } from '@/data/zen';

interface ReflectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultMilestone?: 'rejection' | 'interview' | 'offer';
  linkedCheckinId?: string;
}

const MAX_CHARS = 5000;

export function ReflectionDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultMilestone,
  linkedCheckinId,
}: ReflectionDialogProps) {
  const [reflectionText, setReflectionText] = useState('');
  const [milestoneType, setMilestoneType] = useState<string | undefined>(defaultMilestone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const relevantPrompts =
    reflectionPrompts.filter((p) => p.trigger === milestoneType) || reflectionPrompts;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setReflectionText('');
      setMilestoneType(defaultMilestone);
    }
  }, [open, defaultMilestone]);

  const charsLeft = MAX_CHARS - reflectionText.length;
  const isOverLimit = charsLeft < 0;

  const handleSubmit = async () => {
    if (reflectionText.trim().length === 0) {
      toast.error('Reflection cannot be empty', {
        description: 'Please write something before saving.',
      });
      return;
    }

    if (isOverLimit) {
      toast.error('Reflection is too long', {
        description: `Please keep your reflection under ${MAX_CHARS} characters.`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiFetch('/api/wellbeing/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflectionText: reflectionText.trim(),
          milestoneType: milestoneType && milestoneType !== 'none' ? milestoneType : undefined,
          linkedCheckinId: linkedCheckinId || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save reflection');
      }

      toast.success('Reflection saved', {
        description: 'Your reflection has been recorded privately.',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Reflection error:', error);
      toast.error('Failed to save reflection', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#7A9278]" />
            Write a Reflection
          </DialogTitle>
          <DialogDescription>
            Capture your thoughts, feelings, or insights. This is your private space.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reflection Text Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reflection" className="text-base font-medium">
                Your Reflection
              </Label>
              <span
                className={`text-sm font-medium ${
                  isOverLimit
                    ? 'text-red-500'
                    : charsLeft < 500
                      ? 'text-yellow-600'
                      : 'text-muted-foreground'
                }`}
              >
                {charsLeft.toLocaleString()} characters left
              </span>
            </div>
            <textarea
              id="reflection"
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="What's on your mind? How are you feeling about your career journey? What did you learn from a recent experience?

Take your time—this is just for you."
              className={`flex min-h-[250px] w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                isOverLimit ? 'border-red-500 focus-visible:ring-red-500' : 'border-input'
              }`}
              maxLength={MAX_CHARS + 100} // Allow typing a bit over to show error
            />
            {isOverLimit && (
              <p className="text-xs text-red-500">
                Your reflection is {Math.abs(charsLeft)} characters too long. Please shorten it.
              </p>
            )}
          </div>

          {/* Milestone Type (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="milestone-reflection" className="text-base font-medium">
              Related to a Career Event? <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Select value={milestoneType} onValueChange={setMilestoneType}>
              <SelectTrigger id="milestone-reflection">
                <SelectValue placeholder="Select if related to an event..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific event</SelectItem>
                <SelectItem value="rejection">Application Rejection</SelectItem>
                <SelectItem value="interview">Interview Experience</SelectItem>
                <SelectItem value="offer">Job Offer</SelectItem>
              </SelectContent>
            </Select>
            {milestoneType && milestoneType !== 'none' && (
              <p className="text-xs text-muted-foreground">
                This reflection will be tagged with this milestone for future reference.
              </p>
            )}
          </div>

          {/* Tips */}
          <div className="bg-muted/30 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">💡 Reflection Prompts:</p>
            <div className="space-y-2">
              {(relevantPrompts.length > 0 ? relevantPrompts : reflectionPrompts).map((prompt) => (
                <div
                  key={prompt.prompt}
                  className="flex items-start justify-between gap-3 rounded-md bg-background/60 px-3 py-2"
                >
                  <p className="text-muted-foreground text-sm leading-snug">{prompt.prompt}</p>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setReflectionText(prompt.prompt)}
                    className="text-[12px]"
                  >
                    Use
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Reminder */}
          <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
            <p>
              <strong>Privacy:</strong> Your reflections are completely private and encrypted. They
              will never be shared with anyone or used for matching purposes.
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
            disabled={isSubmitting || reflectionText.trim().length === 0 || isOverLimit}
            className="bg-[#7A9278] hover:bg-[#7A9278]/90 text-white"
          >
            {isSubmitting ? 'Saving...' : 'Save Reflection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
