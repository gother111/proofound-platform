/**
 * Decision Dialog Component
 *
 * UI for organizations to make hiring decisions after interviews
 * Displays 48-hour SLA countdown and decision options
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, ArrowRight, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DecisionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  interviewId: string;
  candidateName: string;
  role: string;
  onDecisionMade?: () => void;
}

type DecisionType = 'hire' | 'advance' | 'hold' | 'reject' | 'withdraw';

interface DecisionWindow {
  hoursRemaining: number;
  isOverdue: boolean;
  deadline: string;
}

export function DecisionDialog({
  isOpen,
  onClose,
  interviewId,
  candidateName,
  role,
  onDecisionMade,
}: DecisionDialogProps) {
  const [decision, setDecision] = useState<DecisionType | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decisionWindow, setDecisionWindow] = useState<DecisionWindow | null>(null);
  const [isLoadingWindow, setIsLoadingWindow] = useState(true);
  const { toast } = useToast();

  // Fetch decision window status
  useEffect(() => {
    if (isOpen && interviewId) {
      fetchDecisionWindow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, interviewId]);

  const fetchDecisionWindow = async () => {
    try {
      setIsLoadingWindow(true);
      const response = await fetch(`/api/decisions/window/${interviewId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch decision window');
      }

      const data = await response.json();
      setDecisionWindow({
        hoursRemaining: data.hoursRemaining,
        isOverdue: data.isOverdue,
        deadline: data.deadline,
      });
    } catch (error) {
      console.error('decision.window.fetch.failed', {
        interviewId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast({
        title: 'Failed to load decision window',
        description: 'Could not fetch decision deadline information',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingWindow(false);
    }
  };

  const handleSubmit = async () => {
    if (!decision) {
      toast({
        title: 'Please select a decision',
        description: 'You must choose one of the decision options',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/decisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId,
          decision,
          feedback: feedback.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record decision');
      }

      const data = await response.json();

      toast({
        title: 'Decision recorded',
        description: `Your ${decision} decision has been recorded${
          data.decision.withinSLA ? ' within the 48-hour SLA' : ' (past SLA)'
        }`,
      });

      console.log('decision.submitted', {
        interviewId,
        decision,
        withinSLA: data.decision.withinSLA,
      });

      // Close dialog and notify parent
      onClose();
      if (onDecisionMade) {
        onDecisionMade();
      }

      // Reset state
      setDecision(null);
      setFeedback('');
    } catch (error) {
      console.error('decision.submit.failed', {
        interviewId,
        decision,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast({
        title: 'Failed to record decision',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeDisplay = () => {
    if (!decisionWindow) return null;

    const hours = Math.abs(decisionWindow.hoursRemaining);
    const displayHours = Math.floor(hours);
    const displayMinutes = Math.floor((hours % 1) * 60);

    if (decisionWindow.isOverdue) {
      return (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-semibold">
            Overdue by {displayHours}h {displayMinutes}m
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
        <Clock className="h-4 w-4" />
        <span className="font-semibold">
          {displayHours}h {displayMinutes}m remaining
        </span>
      </div>
    );
  };

  const decisionOptions = [
    {
      value: 'hire' as DecisionType,
      label: 'Hire',
      description: 'Extend an offer to this candidate',
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      value: 'advance' as DecisionType,
      label: 'Advance',
      description: 'Move to next interview round',
      icon: ArrowRight,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      value: 'hold' as DecisionType,
      label: 'Hold',
      description: 'Keep for future consideration',
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      value: 'reject' as DecisionType,
      label: 'Reject',
      description: 'Not a fit for this role',
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    {
      value: 'withdraw' as DecisionType,
      label: 'Withdraw',
      description: 'Close the corridor without a hiring outcome',
      icon: AlertTriangle,
      color: 'text-stone-700 dark:text-stone-300',
      bgColor: 'bg-stone-50 dark:bg-stone-900/20',
      borderColor: 'border-stone-200 dark:border-stone-700',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Make Hiring Decision</DialogTitle>
          <DialogDescription>
            Interview with {candidateName} for {role}
          </DialogDescription>
        </DialogHeader>

        {/* Decision Window Timer */}
        {!isLoadingWindow && decisionWindow && (
          <div
            className={`rounded-lg border p-4 ${
              decisionWindow.isOverdue
                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                : 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Decision Deadline (48-hour SLA)
                </p>
                {getTimeDisplay()}
              </div>
              {decisionWindow.isOverdue && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Please make a decision as soon as possible
                </p>
              )}
            </div>
          </div>
        )}

        {/* Decision Options */}
        <div className="space-y-2">
          <Label>Select Decision</Label>
          <div className="grid grid-cols-2 gap-3">
            {decisionOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = decision === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDecision(option.value)}
                  className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 transition-all ${
                    isSelected
                      ? `${option.bgColor} ${option.borderColor} ring-2 ring-offset-2`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${option.color}`} />
                    <span className="font-semibold">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="feedback">
            Feedback <span className="text-gray-500">(Optional)</span>
          </Label>
          <Textarea
            id="feedback"
            placeholder="Add any notes about your decision (internal only, not shared with candidate)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">
            This feedback is for internal tracking and will not be shared with the candidate
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!decision || isSubmitting} className="min-w-32">
            {isSubmitting ? 'Recording...' : 'Confirm Decision'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
