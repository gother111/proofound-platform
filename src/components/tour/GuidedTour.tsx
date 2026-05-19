/**
 * Guided Tour Component
 *
 * Implements PRD Part 4, Flow I-03: First-time user tour
 * Uses react-joyride for progressive UI disclosure
 *
 * Features:
 * - 10-step tour for individuals
 * - 7-step tour for organizations
 * - Skippable at any time (ESC key)
 * - Keyboard accessible (arrows for navigation)
 * - Marks as complete in database
 * - Can be replayed from settings
 *
 * PRD References:
 * - Part 4: User Flows - I-03 (First Login)
 * - Part 8: Accessibility (WCAG 2.1 AA)
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { individualTourSteps, organizationTourSteps, tourStyles } from './tourSteps';
import { toast } from 'sonner';

interface GuidedTourProps {
  userId: string;
  persona: 'individual' | 'organization';
  shouldRun: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function GuidedTour({ persona, shouldRun, onComplete, onSkip }: GuidedTourProps) {
  const [run, setRun] = useState(false);

  const steps = persona === 'individual' ? individualTourSteps : organizationTourSteps;

  // Helper function to check if tour target elements exist
  const checkElementsAvailable = useCallback((): boolean => {
    // Check if at least the first few critical elements exist
    // We check the first step and a few key navigation elements
    const criticalSelectors = [
      steps[0]?.target, // First step (usually 'body', always exists)
      '[data-tour="left-nav"]', // Navigation sidebar
    ];

    // For individual tours, also check dashboard
    if (persona === 'individual' && steps.length > 2) {
      criticalSelectors.push('[data-tour="dashboard"]');
    }

    // Check if elements exist in DOM
    const allExist = criticalSelectors.every((selector) => {
      if (!selector) return true; // Skip undefined selectors
      if (typeof selector !== 'string') return true; // HTMLElement targets are already resolved
      try {
        const element = document.querySelector(selector);
        return element !== null;
      } catch (error) {
        console.warn(`Invalid selector for tour: ${selector}`, error);
        return true; // Assume exists if selector is invalid
      }
    });

    return allExist;
  }, [steps, persona]);

  // Reset run state when shouldRun becomes false
  useEffect(() => {
    if (!shouldRun) {
      setRun(false);
    }
  }, [shouldRun]);

  // Start tour after ensuring elements are available
  useEffect(() => {
    if (!shouldRun) {
      return;
    }

    let attemptCount = 0;
    const maxAttempts = 5;
    const baseDelay = 300;
    const maxDelay = 2000;

    const tryStartTour = () => {
      attemptCount++;

      // Check if elements are available
      if (checkElementsAvailable()) {
        // Elements are ready, start the tour
        setRun(true);
        return;
      }

      // Elements not ready yet, retry with exponential backoff
      if (attemptCount < maxAttempts) {
        const delay = Math.min(baseDelay * Math.pow(2, attemptCount - 1), maxDelay);
        setTimeout(tryStartTour, delay);
      } else {
        // Max attempts reached, log warning but start anyway
        console.warn(
          'Tour: Some target elements may not be available, but starting tour anyway.',
          'This may cause some steps to not highlight correctly.'
        );
        setRun(true);
      }
    };

    // Initial delay to allow page to start rendering
    const initialTimer = setTimeout(() => {
      tryStartTour();
    }, 500);

    return () => {
      clearTimeout(initialTimer);
    };
  }, [shouldRun, checkElementsAvailable]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, action } = data;

      // Handle tour completion
      if (status === STATUS.FINISHED) {
        setRun(false);
        onComplete();
        toast.success('Tour completed! You can replay it anytime from Settings.');
      }

      // Handle tour being skipped
      if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
        setRun(false);
        onSkip();
        toast.info('Tour skipped. You can restart it anytime from Settings.');
      }

      // Log errors
      if (type === EVENTS.ERROR) {
        console.error('Tour error:', data);
      }
    },
    [onComplete, onSkip]
  );

  return (
    <Joyride
      steps={steps as any}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      disableOverlayClose
      spotlightClicks
      styles={tourStyles}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip tour',
      }}
      callback={handleJoyrideCallback}
      // Accessibility
      spotlightPadding={8}
      disableScrollParentFix
    />
  );
}
