/**
 * Tour Provider Component
 *
 * Automatically shows the first-run guided tour on first login.
 * Checks tour status and displays tour if not completed.
 *
 * Implements PRD Flow I-03: First-run guided tour
 */

'use client';

import { useEffect, useState } from 'react';
import { GuidedTour } from './GuidedTour';
import { completeTour, getTourStatus } from '@/actions/tour';
import { usePathname } from 'next/navigation';

export function TourProvider() {
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [persona, setPersona] = useState<'individual' | 'organization'>('individual');
  const [userId, setUserId] = useState<string>('');
  const pathname = usePathname();

  useEffect(() => {
    // Determine persona from current pathname
    const isOrg = pathname?.startsWith('/app/o/');
    setPersona(isOrg ? 'organization' : 'individual');

    // Check if user should see tour
    async function checkTourStatus() {
      try {
        const status = await getTourStatus();
        if (status.success && !status.tourCompleted && status.userId) {
          setUserId(status.userId);
          setShowTour(true);
        }
      } catch (error) {
        console.error('Failed to check tour status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkTourStatus();
  }, [pathname]);

  const handleComplete = async () => {
    setShowTour(false);
    await completeTour();
  };

  const handleSkip = async () => {
    setShowTour(false);
    await completeTour();
  };

  if (isLoading || !showTour || !userId) {
    return null;
  }

  return (
    <GuidedTour
      userId={userId}
      persona={persona}
      shouldRun={showTour}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
