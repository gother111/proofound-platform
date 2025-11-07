/**
 * useSUSSurvey Hook
 *
 * Manages SUS survey trigger logic
 * Shows survey at appropriate moments in user journey
 *
 * Trigger points:
 * - After profile activation
 * - After first match acceptance
 * - After 7 days of usage
 * - Monthly for active users
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface SUSurveyTrigger {
  shouldShow: boolean;
  triggerPoint: string;
  delay?: number; // Delay in ms before showing
}

export function useSUSSurvey() {
  const [shouldShowSurvey, setShouldShowSurvey] = useState(false);
  const [triggerPoint, setTriggerPoint] = useState('');
  const router = useRouter();

  /**
   * Check if user should see survey
   */
  const checkSurveyEligibility = useCallback(async (): Promise<SUSurveyTrigger> => {
    try {
      const response = await fetch('/api/surveys/sus/eligibility');
      if (response.ok) {
        const data = await response.json();
        return {
          shouldShow: data.eligible,
          triggerPoint: data.trigger_point,
          delay: data.delay,
        };
      }
    } catch (error) {
      console.error('Failed to check SUS survey eligibility:', error);
    }

    return { shouldShow: false, triggerPoint: '' };
  }, []);

  /**
   * Trigger survey based on user action
   */
  const triggerSurvey = useCallback((point: string, delayMs = 0) => {
    setTimeout(() => {
      setTriggerPoint(point);
      setShouldShowSurvey(true);
    }, delayMs);
  }, []);

  /**
   * Dismiss survey
   */
  const dismissSurvey = useCallback(() => {
    setShouldShowSurvey(false);
    setTriggerPoint('');
  }, []);

  /**
   * Mark survey as completed
   */
  const completeSurvey = useCallback(() => {
    dismissSurvey();
    // Could add celebration or thank you message here
  }, [dismissSurvey]);

  return {
    shouldShowSurvey,
    triggerPoint,
    checkSurveyEligibility,
    triggerSurvey,
    dismissSurvey,
    completeSurvey,
  };
}
