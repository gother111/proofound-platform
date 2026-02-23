/**
 * useInterviewScheduling Hook
 *
 * Custom hook for managing interview scheduling state and operations
 * Provides schedule management, validation, and API interactions
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface InterviewScheduleData {
  matchId: string;
  scheduledAt: Date;
  platform: 'zoom' | 'google_meet';
  participantUserIds: string[];
  timezone?: string;
  durationMinutes?: number;
}

export interface Interview {
  id: string;
  match_id: string;
  scheduled_at: string;
  duration_minutes: number;
  platform: 'zoom' | 'google_meet';
  meeting_link: string;
  meeting_id: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  host_user_id: string;
  participant_user_ids: string[];
  can_reschedule: boolean;
  rescheduled_count: number;
}

export interface UseInterviewSchedulingOptions {
  onScheduled?: (interview: Interview) => void;
  onError?: (error: Error) => void;
  policyPreset?: 'startup' | 'enterprise' | 'volunteer' | 'advanced';
}

const INTERVIEW_POLICY_PRESETS = {
  startup: {
    scheduleWithinDays: 7,
    maxDurationMinutes: 30,
  },
  enterprise: {
    scheduleWithinDays: 14,
    maxDurationMinutes: 45,
  },
  volunteer: {
    scheduleWithinDays: 21,
    maxDurationMinutes: 30,
  },
  advanced: {
    scheduleWithinDays: 7,
    maxDurationMinutes: 30,
  },
} as const;

export function useInterviewScheduling(options: UseInterviewSchedulingOptions = {}) {
  const [isScheduling, setIsScheduling] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const activePolicy = INTERVIEW_POLICY_PRESETS[options.policyPreset || 'startup'];

  /**
   * Schedule a new interview
   */
  const scheduleInterview = useCallback(
    async (data: InterviewScheduleData): Promise<Interview | null> => {
      setIsScheduling(true);
      setError(null);

      try {
        const response = await fetch('/api/interviews/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: data.matchId,
            scheduledAt: data.scheduledAt.toISOString(),
            platform: data.platform,
            participantUserIds: data.participantUserIds,
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            policyPreset: options.policyPreset || 'startup',
            durationMinutes: data.durationMinutes ?? 30,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to schedule interview');
        }

        const interview = result.interview as Interview;

        toast.success('Interview scheduled successfully!');

        if (options.onScheduled) {
          options.onScheduled(interview);
        }

        return interview;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);

        if (options.onError) {
          options.onError(error);
        } else {
          toast.error(error.message);
        }

        return null;
      } finally {
        setIsScheduling(false);
      }
    },
    [options]
  );

  /**
   * Reschedule an existing interview
   */
  const rescheduleInterview = useCallback(
    async (interviewId: string, newScheduledAt: Date): Promise<boolean> => {
      setIsRescheduling(true);
      setError(null);

      try {
        const response = await fetch(`/api/interviews/${interviewId}/reschedule`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledAt: newScheduledAt.toISOString(),
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to reschedule interview');
        }

        toast.success('Interview rescheduled successfully!');

        if (options.onScheduled) {
          options.onScheduled(result.interview);
        }

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);

        if (options.onError) {
          options.onError(error);
        } else {
          toast.error(error.message);
        }

        return false;
      } finally {
        setIsRescheduling(false);
      }
    },
    [options]
  );

  /**
   * Cancel an interview
   */
  const cancelInterview = useCallback(
    async (interviewId: string, reason?: string): Promise<boolean> => {
      setIsCancelling(true);
      setError(null);

      try {
        const response = await fetch(`/api/interviews/${interviewId}/cancel`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to cancel interview');
        }

        toast.success('Interview cancelled');

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);

        if (options.onError) {
          options.onError(error);
        } else {
          toast.error(error.message);
        }

        return false;
      } finally {
        setIsCancelling(false);
      }
    },
    [options]
  );

  /**
   * Validate scheduling window (7 days from match acceptance)
   */
  const validateSchedulingWindow = useCallback(
    (scheduledAt: Date, matchAcceptedAt: Date): { valid: boolean; error?: string } => {
      const now = new Date();
      const maxScheduleDate = new Date(matchAcceptedAt);
      maxScheduleDate.setDate(maxScheduleDate.getDate() + activePolicy.scheduleWithinDays);

      if (scheduledAt < now) {
        return {
          valid: false,
          error: 'Interview cannot be scheduled in the past',
        };
      }

      if (scheduledAt > maxScheduleDate) {
        return {
          valid: false,
          error: `Interview must be scheduled within ${activePolicy.scheduleWithinDays} days of match acceptance`,
        };
      }

      return { valid: true };
    },
    [activePolicy.scheduleWithinDays]
  );

  /**
   * Validate interview duration (max 30 minutes)
   */
  const validateDuration = useCallback(
    (durationMinutes: number): { valid: boolean; error?: string } => {
      if (durationMinutes <= 0) {
        return {
          valid: false,
          error: 'Duration must be greater than 0',
        };
      }

      if (durationMinutes > activePolicy.maxDurationMinutes) {
        return {
          valid: false,
          error: `Interview duration cannot exceed ${activePolicy.maxDurationMinutes} minutes`,
        };
      }

      return { valid: true };
    },
    [activePolicy.maxDurationMinutes]
  );

  /**
   * Check if interview can be rescheduled
   */
  const canReschedule = useCallback((interview: Interview): boolean => {
    return interview.can_reschedule && interview.rescheduled_count < 1;
  }, []);

  return {
    // State
    isScheduling,
    isRescheduling,
    isCancelling,
    error,

    // Actions
    scheduleInterview,
    rescheduleInterview,
    cancelInterview,

    // Validation
    validateSchedulingWindow,
    validateDuration,
    canReschedule,
    activePolicy,
  };
}
