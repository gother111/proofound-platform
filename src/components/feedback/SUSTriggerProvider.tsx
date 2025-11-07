/**
 * SUS Survey Trigger Provider
 *
 * Manages when to show SUS surveys based on user milestones:
 * - Post-activation (after profile activation)
 * - Post-match (after first match acceptance)
 * - Post-contract (after contract signing)
 *
 * PRD References:
 * - Part 2: SUS target ≥75
 * - Part 7: Survey timing and triggers
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SUSSurvey } from './SUSSurvey';
import { toast } from 'sonner';
import type { SUSResponse } from '@/lib/feedback/sus-scoring';

interface SUSTriggerContextValue {
  checkForTrigger: (event: 'activation' | 'match' | 'contract') => Promise<void>;
  dismissSurvey: () => void;
}

const SUSTriggerContext = createContext<SUSTriggerContextValue | null>(null);

export function useSUSTrigger() {
  const context = useContext(SUSTriggerContext);
  if (!context) {
    throw new Error('useSUSTrigger must be used within SUSTriggerProvider');
  }
  return context;
}

interface SUSTriggerProviderProps {
  children: React.ReactNode;
  userId: string;
}

type TriggerPoint = 'post_activation' | 'post_match' | 'post_contract' | 'periodic';

export function SUSTriggerProvider({ children, userId }: SUSTriggerProviderProps) {
  const [showSurvey, setShowSurvey] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState<TriggerPoint | null>(null);
  const [currentTask, setCurrentTask] = useState<string>('');

  // Check for pending surveys on mount
  useEffect(() => {
    checkPendingSurveys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const checkPendingSurveys = async () => {
    try {
      const response = await fetch('/api/feedback/sus/check-trigger');
      if (response.ok) {
        const data = await response.json();
        if (data.shouldShow && data.triggerPoint) {
          // Delay showing survey by 2 seconds for better UX
          setTimeout(() => {
            setCurrentTrigger(data.triggerPoint);
            setCurrentTask(getTriggerTaskName(data.triggerPoint));
            setShowSurvey(true);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Failed to check for pending surveys:', error);
    }
  };

  const checkForTrigger = useCallback(async (event: 'activation' | 'match' | 'contract') => {
    try {
      const triggerPointMap: Record<typeof event, TriggerPoint> = {
        activation: 'post_activation',
        match: 'post_match',
        contract: 'post_contract',
      };

      const triggerPoint = triggerPointMap[event];

      const response = await fetch('/api/feedback/sus/check-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: triggerPoint }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.shouldShow) {
          // Delay showing survey by 2 seconds
          setTimeout(() => {
            setCurrentTrigger(triggerPoint);
            setCurrentTask(getTriggerTaskName(triggerPoint));
            setShowSurvey(true);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Failed to check SUS trigger:', error);
    }
  }, []);

  const handleComplete = async (responses: SUSResponse[]) => {
    try {
      const response = await fetch('/api/feedback/sus/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          triggerPoint: currentTrigger,
          task: currentTask,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }

      toast.success('Thank you for your feedback!');
      setShowSurvey(false);
      setCurrentTrigger(null);
    } catch (error) {
      console.error('Failed to submit SUS survey:', error);
      throw error;
    }
  };

  const dismissSurvey = () => {
    // Log dismissal but don't prevent showing again
    fetch('/api/feedback/sus/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triggerPoint: currentTrigger }),
    }).catch(console.error);

    setShowSurvey(false);
    setCurrentTrigger(null);
  };

  const getTriggerTaskName = (trigger: TriggerPoint): string => {
    const taskNames: Record<TriggerPoint, string> = {
      post_activation: 'profile_activation',
      post_match: 'first_match_acceptance',
      post_contract: 'contract_signing',
      periodic: 'general_usage',
    };
    return taskNames[trigger];
  };

  return (
    <SUSTriggerContext.Provider value={{ checkForTrigger, dismissSurvey }}>
      {children}
      <SUSSurvey
        open={showSurvey}
        onClose={() => setShowSurvey(false)}
        task={currentTask}
        onComplete={handleComplete}
        onDismiss={dismissSurvey}
      />
    </SUSTriggerContext.Provider>
  );
}
