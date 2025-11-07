/**
 * Guided Tour Component
 *
 * Implements PRD Part 4, Flow I-03: First-time user tour
 * Uses react-joyride for progressive UI disclosure
 *
 * Features:
 * - 8-step tour for individuals
 * - 6-step tour for organizations
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
import { individualTourSteps, organizationTourSteps, tourStyles } from './tourSteps.tsx';
import { toast } from 'sonner';

interface GuidedTourProps {
  userId: string;
  persona: 'individual' | 'organization';
  shouldRun: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function GuidedTour({ userId, persona, shouldRun, onComplete, onSkip }: GuidedTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Emit tour started event when tour begins
  useEffect(() => {
    if (shouldRun && run) {
      // Emit analytics event via API to avoid Node.js imports in client component
      fetch('/api/analytics/tour-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, event: 'started' }),
      }).catch(console.error);
    }
  }, [shouldRun, run, userId]);

  // Start tour after a short delay for better UX
  useEffect(() => {
    if (shouldRun) {
      const timer = setTimeout(() => {
        setRun(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldRun]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, index, action } = data;

      // Update step index for analytics
      if (type === EVENTS.STEP_AFTER) {
        setStepIndex(index + 1);
      }

      // Handle tour completion
      if (status === STATUS.FINISHED) {
        setRun(false);
        fetch('/api/analytics/tour-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, event: 'completed' }),
        }).catch(console.error);
        onComplete();
        toast.success('Tour completed! You can replay it anytime from Settings.');
      }

      // Handle tour being skipped
      if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
        setRun(false);
        fetch('/api/analytics/tour-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, event: 'skipped', stepIndex }),
        }).catch(console.error);
        onSkip();
        toast.info('Tour skipped. You can restart it anytime from Settings.');
      }

      // Log errors
      if (type === EVENTS.ERROR) {
        console.error('Tour error:', data);
      }
    },
    [userId, onComplete, onSkip, stepIndex]
  );

  const steps = persona === 'individual' ? individualTourSteps : organizationTourSteps;

  return (
    <Joyride
      steps={steps}
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
      // Performance
      floaterProps={{
        disableAnimation: false,
      }}
    />
  );
}
