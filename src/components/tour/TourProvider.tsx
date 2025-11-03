/**
 * Tour Provider Component
 *
 * Automatically shows the guided tour on first login.
 * Checks tour status and displays tour if not completed.
 */

'use client';

import { useEffect, useState } from 'react';
import { GuidedTour } from './GuidedTour';
import { completeTour, getTourStatus } from '@/actions/tour';

export function TourProvider() {
  const [showTour, setShowTour] = useState(false);
  const [persona, setPersona] = useState<'individual' | 'org_member' | 'unknown'>('unknown');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user should see tour
    async function checkTourStatus() {
      try {
        const status = await getTourStatus();
        if (status.success && !status.tourCompleted) {
          setPersona(status.persona);
          setShowTour(true);
        }
      } catch (error) {
        console.error('Failed to check tour status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkTourStatus();
  }, []);

  const handleComplete = async () => {
    setShowTour(false);
    await completeTour();
  };

  const handleSkip = async () => {
    setShowTour(false);
    await completeTour();
  };

  if (isLoading || !showTour) {
    return null;
  }

  return <GuidedTour persona={persona} onComplete={handleComplete} onSkip={handleSkip} />;
}
