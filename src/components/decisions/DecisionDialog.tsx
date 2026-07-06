/**
 * Decision Dialog Component
 *
 * UI for organizations to record workflow decisions after interviews
 * Displays 48-hour SLA countdown and decision options
 */

'use client';

import React, { useState, useEffect, useId } from 'react';
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
import { CheckCircle2, ArrowRight, Clock, XCircle, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientDiagnostic } from '@/lib/client-diagnostics';

interface DecisionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  interviewId: string;
  candidateName: string;
  assignmentTitle: string;
  onDecisionMade?: () => void;
}

type DecisionType = 'hire' | 'advance' | 'hold' | 'reject' | 'withdraw';

const DECISION_SUBMIT_RETRY_MESSAGE =
  'Decision could not be recorded. Your selected outcome and notes are still here; please try again.';

interface DecisionWindow {
  hoursRemaining: number;
  isOverdue: boolean;
  deadline: string;
}

function clientErrorName(error: unknown) {
  if (error instanceof Error && error.name.trim()) {
    return error.name;
  }

  return 'UnknownError';
}

function getReturnedError(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  if ('error' in payload && typeof payload.error === 'string') {
    return payload.error.trim();
  }

  return '';
}

export function DecisionDialog({
  isOpen,
  onClose,
  interviewId,
  candidateName,
  assignmentTitle,
  onDecisionMade,
}: DecisionDialogProps) {
  const [decision, setDecision] = useState<DecisionType | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decisionWindow, setDecisionWindow] = useState<DecisionWindow | null>(null);
  const [isLoadingWindow, setIsLoadingWindow] = useState(true);
  const [decisionWindowError, setDecisionWindowError] = useState<string | null>(null);
  const optionDescriptionIdBase = useId();
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
      setDecisionWindowError(null);
      setDecisionWindow(null);
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
      dispatchClientDiagnostic('decision.window.fetch_failed', {
        errorName: clientErrorName(error),
        hasError: true,
      });
      setDecisionWindowError(
        'The decision can still be recorded, but the 48-hour SLA countdown could not load. Retry before confirming if you need the current deadline.'
      );
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

      const response = await apiFetch('/api/decisions', {
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
        const error = await response.json().catch(() => null);
        const returnedError = getReturnedError(error);
        dispatchClientDiagnostic('decision.submit_returned_error', {
          decision,
          status: response.status,
          hasReturnedError: returnedError.length > 0,
        });
        throw new Error('decision_submit_request_failed');
      }

      const data = await response.json();

      toast({
        title: 'Decision recorded',
        description: `Your workflow decision has been recorded${
          data.decision.withinSLA ? ' within the 48-hour SLA' : ' (past SLA)'
        }`,
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
      dispatchClientDiagnostic('decision.submit_failed', {
        decision,
        errorName: clientErrorName(error),
        hasError: true,
      });
      toast({
        title: 'Decision not recorded',
        description: DECISION_SUBMIT_RETRY_MESSAGE,
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
      description: 'Move to engagement confirmation; decision and verification stay distinct',
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      value: 'advance' as DecisionType,
      label: 'Advance',
      description: 'Move this workflow to the next approved interview step',
      icon: ArrowRight,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      value: 'hold' as DecisionType,
      label: 'Hold',
      description: 'Pause this workflow with a reason and follow-up window',
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      value: 'reject' as DecisionType,
      label: 'Reject',
      description: 'Close this assignment workflow without a broader profile judgment',
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    {
      value: 'withdraw' as DecisionType,
      label: 'Withdraw',
      description: 'Close this assignment workflow without an engagement outcome',
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
          <DialogTitle>Record Workflow Decision</DialogTitle>
          <DialogDescription>
            Interview workflow for {candidateName} and {assignmentTitle}
          </DialogDescription>
        </DialogHeader>

        {/* Decision Window Timer */}
        {isLoadingWindow ? (
          <div
            className="flex items-center gap-2 rounded-lg border border-proofound-stone/70 bg-muted/30 p-4 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <RefreshCcw className="h-4 w-4 animate-spin" />
            Loading decision deadline...
          </div>
        ) : null}

        {!isLoadingWindow && decisionWindowError ? (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-amber-950"
            role="alert"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  Decision deadline unavailable
                </p>
                <p className="text-sm leading-5">{decisionWindowError}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 bg-white"
                onClick={fetchDecisionWindow}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry deadline
              </Button>
            </div>
          </div>
        ) : null}

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
          <Label id="decision-options-label">Select Decision</Label>
          <div
            role="group"
            aria-labelledby="decision-options-label"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {decisionOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = decision === option.value;
              const descriptionId = `${optionDescriptionIdBase}-${option.value}-description`;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-label={option.label}
                  aria-describedby={descriptionId}
                  aria-pressed={isSelected}
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
                  <p
                    id={descriptionId}
                    className="text-left text-xs text-gray-600 dark:text-gray-400"
                  >
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
            placeholder="Add private team notes about your decision"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">
            These notes stay with your team and are not sent through workflow notifications.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!decision || isSubmitting} className="min-w-32">
            {isSubmitting ? 'Recording...' : 'Confirm Workflow Decision'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
