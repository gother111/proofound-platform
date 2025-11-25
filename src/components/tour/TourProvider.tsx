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

  // Check if current page is appropriate for showing the tour
  const isTourPage = (path: string | null): boolean => {
    if (!path) return false;

    // Individual: only show on home page
    if (path === '/app/i/home' || path.startsWith('/app/i/home?')) {
      return true;
    }

    // Organization: only show on home page (e.g., /app/o/org-slug/home)
    if (path.match(/^\/app\/o\/[^/]+\/home(\?.*)?$/)) {
      return true;
    }

    return false;
  };

  useEffect(() => {
    // Determine persona from current pathname
    const isOrg = pathname?.startsWith('/app/o/');
    setPersona(isOrg ? 'organization' : 'individual');

    // Only check tour status on appropriate pages (home/dashboard)
    if (!isTourPage(pathname)) {
      setIsLoading(false);
      setShowTour(false);
      return;
    }

    // Check if user should see tour
    async function checkTourStatus() {
      try {
        const status = await getTourStatus();
        if (status.success && !status.tourCompleted && status.userId) {
          setUserId(status.userId);
          setShowTour(true);
        } else if (!status.success) {
          console.warn('Tour status check failed:', status.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Failed to check tour status:', error);
        // Don't show tour if there's an error checking status
        setShowTour(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkTourStatus();
  }, [pathname]);

  const handleComplete = async () => {
    setShowTour(false);
    const result = await completeTour();
    if (!result.success) {
      console.error('Failed to mark tour as completed:', result.error);
      // Show error to user but don't re-show tour
      setShowTour(false);
    }
  };

  const handleSkip = async () => {
    setShowTour(false);
    // Mark tour as completed in database so it doesn't show again
    const result = await completeTour();
    if (!result.success) {
      console.error('Failed to mark tour as skipped:', result.error);
      // Even if save fails, don't show tour again to avoid annoying the user
      setShowTour(false);
    }
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
