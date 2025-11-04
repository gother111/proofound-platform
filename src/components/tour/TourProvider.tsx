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
import { FirstRunTour } from './FirstRunTour';
import { completeTour, getTourStatus } from '@/actions/tour';
import { usePathname } from 'next/navigation';

export function TourProvider() {
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [basePath, setBasePath] = useState('/app/i');
  const pathname = usePathname();

  useEffect(() => {
    // Determine base path from current pathname
    if (pathname?.startsWith('/app/o/')) {
      const match = pathname.match(/\/app\/o\/([^/]+)/);
      if (match) {
        setBasePath(`/app/o/${match[1]}`);
      }
    } else {
      setBasePath('/app/i');
    }

    // Check if user should see tour
    async function checkTourStatus() {
      try {
        const status = await getTourStatus();
        if (status.success && !status.tourCompleted) {
          // Small delay to let the layout render first
          setTimeout(() => {
            setShowTour(true);
          }, 500);
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

  if (isLoading || !showTour) {
    return null;
  }

  return <FirstRunTour basePath={basePath} onComplete={handleComplete} onSkip={handleSkip} />;
}
