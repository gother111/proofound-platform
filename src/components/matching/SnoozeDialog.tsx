/**
 * Snooze Dialog Component
 *
 * Allows users to temporarily hide matches for 1, 2, or 4 weeks
 * Implements PRD requirement for match management actions
 */

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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useResponsiveModalMode } from '@/hooks/use-responsive-modal-mode';
import { Button } from '@/components/ui/button';
import { BellOff, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';

interface SnoozeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string;
  assignmentTitle: string;
  onSnoozed?: () => void;
}

const snoozeDurations = [
  { weeks: 1, label: '1 week', description: 'Hide until next week' },
  { weeks: 2, label: '2 weeks', description: 'Hide for two weeks' },
  { weeks: 4, label: '4 weeks', description: 'Hide for a month' },
];

export function SnoozeDialog({
  open,
  onOpenChange,
  matchId,
  assignmentTitle,
  onSnoozed,
}: SnoozeDialogProps) {
  const [selectedWeeks, setSelectedWeeks] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDesktop = useResponsiveModalMode(open);

  const handleSnooze = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/matches/${matchId}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: selectedWeeks * 7, // Convert weeks to days
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to snooze match');
      }

      const data = await response.json();
      const snoozeUntil = new Date(data.snoozeUntil);

      toast.success(`Match snoozed until ${snoozeUntil.toLocaleDateString()}`, {
        description: `"${assignmentTitle}" will reappear in ${selectedWeeks} ${selectedWeeks === 1 ? 'week' : 'weeks'}`,
      });

      onOpenChange(false);
      if (onSnoozed) onSnoozed();
    } catch (error) {
      console.error('Failed to snooze match:', error);
      toast.error('Failed to snooze match. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderModalContentBody = () => (
    <>
      <div className="px-4 md:px-0">
        <DialogHeader className="md:px-0 text-left">
          <DialogTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5 text-muted-foreground" />
            Snooze This Match
          </DialogTitle>
          <DialogDescription>
            Temporarily hide "{assignmentTitle}" from your matches. It will reappear after the
            selected time.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="space-y-3 py-4 px-4 md:px-0">
        {snoozeDurations.map((duration) => (
          <button
            key={duration.weeks}
            onClick={() => setSelectedWeeks(duration.weeks)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedWeeks === duration.weeks
                ? 'border-proofound-forest bg-proofound-success-tint'
                : 'border-proofound-stone bg-white hover:border-proofound-forest/30'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {duration.weeks === 1 ? (
                    <Clock className="w-4 h-4 text-proofound-forest" />
                  ) : (
                    <Calendar className="w-4 h-4 text-proofound-forest" />
                  )}
                  <span className="font-medium text-foreground">{duration.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{duration.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Returns:{' '}
                  {new Date(
                    Date.now() + duration.weeks * 7 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString()}
                </p>
              </div>
              {selectedWeeks === duration.weeks && (
                <div className="w-5 h-5 rounded-full bg-proofound-forest flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="px-4 md:px-0 pb-4 md:pb-0">
        <div className="bg-japandi-bg rounded-lg p-3 border border-proofound-stone mb-4">
          <p className="text-xs leading-relaxed text-foreground">
            <strong className="font-semibold">Note:</strong> You can view and manage snoozed matches
            from your Matching preferences. Snoozed matches won't affect your overall match score.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSnooze}
            disabled={isSubmitting}
            className="bg-proofound-forest text-white w-full sm:w-auto"
          >
            {isSubmitting
              ? 'Snoozing...'
              : `Snooze for ${selectedWeeks} ${selectedWeeks === 1 ? 'week' : 'weeks'}`}
          </Button>
        </DialogFooter>
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">{renderModalContentBody()}</DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm overflow-y-auto pb-6">
          {renderModalContentBody()}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
