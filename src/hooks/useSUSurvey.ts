/**
 * useSUSSurvey Hook
 *
 * Manages SUS survey triggers and display logic.
 * Shows survey max once per 14 days per user.
 *
 * Trigger points:
 * - After profile activation
 * - After creating first assignment
 * - After first match action
 * - After interview scheduling
 * - Every 30 days of active use
 */

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import type { SUSResponse } from '@/lib/feedback/sus-scoring';

const MIN_DAYS_BETWEEN_SURVEYS = 14;
const SURVEY_STORAGE_KEY = 'sus_last_shown';

export interface SurveyShouldShow {
  shouldShow: boolean;
  task?: string;
}

export function useSUSSurvey(task?: string) {
  const { user } = useUser();
  const [showSurvey, setShowSurvey] = useState(false);
  const [currentTask, setCurrentTask] = useState<string | undefined>(task);

  useEffect(() => {
    if (!user) return;

    // Check if survey should be shown
    const lastShown = localStorage.getItem(SURVEY_STORAGE_KEY);
    const now = Date.now();

    if (lastShown) {
      const daysSinceLastShown = (now - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      if (daysSinceLastShown < MIN_DAYS_BETWEEN_SURVEYS) {
        return; // Too soon to show again
      }
    }

    // Random sampling: show to 20% of users
    if (Math.random() > 0.2) {
      return;
    }

    // Show the survey
    setShowSurvey(true);
    localStorage.setItem(SURVEY_STORAGE_KEY, now.toString());
  }, [user]);

  const handleComplete = async (responses: SUSResponse[]) => {
    try {
      const response = await fetch('/api/feedback/sus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          task: currentTask,
          dismissed: false,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit survey');
      }

      setShowSurvey(false);
    } catch (error) {
      console.error('Error submitting SUS survey:', error);
      throw error;
    }
  };

  const handleDismiss = async () => {
    try {
      // Record dismissal
      await fetch('/api/feedback/sus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dismissed: true,
          task: currentTask,
        }),
      });

      setShowSurvey(false);
    } catch (error) {
      console.error('Error recording survey dismissal:', error);
      setShowSurvey(false);
    }
  };

  return {
    showSurvey,
    setShowSurvey,
    task: currentTask,
    handleComplete,
    handleDismiss,
  };
}

/**
 * Trigger survey after a specific task
 * Call this when a user completes a significant action
 */
export function triggerSUSurvey(task: string): void {
  // Set a flag that the survey should be shown
  // The next page load will check this flag
  sessionStorage.setItem('sus_trigger_task', task);
}
