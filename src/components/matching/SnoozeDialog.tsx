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
import { Button } from '@/components/ui/button';
import { BellOff, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

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

  const handleSnooze = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/match/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          weeks: selectedWeeks,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to snooze match');
      }

      const snoozeUntil = new Date();
      snoozeUntil.setDate(snoozeUntil.getDate() + selectedWeeks * 7);

      toast.success(
        `Match snoozed until ${snoozeUntil.toLocaleDateString()}`,
        {
          description: `"${assignmentTitle}" will reappear in ${selectedWeeks} ${selectedWeeks === 1 ? 'week' : 'weeks'}`,
        }
      );

      onOpenChange(false);
      if (onSnoozed) onSnoozed();
    } catch (error) {
      console.error('Failed to snooze match:', error);
      toast.error('Failed to snooze match. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5 text-[#6B6760]" />
            Snooze This Match
          </DialogTitle>
          <DialogDescription>
            Temporarily hide "{assignmentTitle}" from your matches. It will reappear after the
            selected time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {snoozeDurations.map((duration) => (
            <button
              key={duration.weeks}
              onClick={() => setSelectedWeeks(duration.weeks)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedWeeks === duration.weeks
                  ? 'border-[#1C4D3A] bg-[#E8F5E1]'
                  : 'border-[#E8E6DD] bg-white hover:border-[#1C4D3A]/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {duration.weeks === 1 ? (
                      <Clock className="w-4 h-4 text-[#1C4D3A]" />
                    ) : (
                      <Calendar className="w-4 h-4 text-[#1C4D3A]" />
                    )}
                    <span className="font-medium text-[#2D3330]">{duration.label}</span>
                  </div>
                  <p className="text-sm text-[#6B6760]">{duration.description}</p>
                  <p className="text-xs text-[#6B6760] mt-1">
                    Returns:{' '}
                    {new Date(Date.now() + duration.weeks * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
                {selectedWeeks === duration.weeks && (
                  <div className="w-5 h-5 rounded-full bg-[#1C4D3A] flex items-center justify-center flex-shrink-0">
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

        <div className="bg-[#F7F6F1] rounded-lg p-3 border border-[#E8E6DD]">
          <p className="text-xs leading-relaxed text-[#2D3330]">
            <strong className="font-semibold">Note:</strong> You can view and manage snoozed
            matches from your Matching preferences. Snoozed matches won't affect your overall match
            score.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSnooze}
            disabled={isSubmitting}
            className="bg-[#1C4D3A] text-white"
          >
            {isSubmitting ? 'Snoozing...' : `Snooze for ${selectedWeeks} ${selectedWeeks === 1 ? 'week' : 'weeks'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
