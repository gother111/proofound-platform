/**
 * Tour Provider Component
 *
 * Automatically shows the first-run guided tour on first login.
 * Checks tour status and displays tour if not completed.
 *
 * Implements PRD Flow I-03: First-run guided tour
 */

'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { completeTour, getTourStatus } from '@/actions/tour';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { usePathname } from 'next/navigation';

type Persona = 'individual' | 'organization';

type IndividualTourComponent = ComponentType<{
  onComplete: () => void;
  onSkip: () => void;
  basePath?: string;
}>;

type OrganizationTourComponent = ComponentType<{
  userId: string;
  persona: Persona;
  shouldRun: boolean;
  onComplete: () => void;
  onSkip: () => void;
}>;

type LoadedTour =
  | { persona: 'individual'; Component: IndividualTourComponent }
  | { persona: 'organization'; Component: OrganizationTourComponent };

export function TourProvider() {
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [persona, setPersona] = useState<Persona>('individual');
  const [userId, setUserId] = useState<string>('');
  const [LoadedTourComponent, setLoadedTourComponent] = useState<LoadedTour | null>(null);
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
    const nextPersona: Persona = isOrg ? 'organization' : 'individual';
    setPersona(nextPersona);
    setLoadedTourComponent(null);

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
          dispatchClientDiagnostic('tour.status_check_failed', {
            error: status.error || 'Unknown error',
          });
        }
      } catch (error) {
        dispatchClientErrorDiagnostic('tour.status_check_unexpected_failed', error);
        // Don't show tour if there's an error checking status
        setShowTour(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkTourStatus();
  }, [pathname]);

  useEffect(() => {
    if (isLoading || !showTour || !userId) {
      return;
    }

    let cancelled = false;

    if (persona === 'individual') {
      void import('./FirstRunTour').then((module) => {
        if (!cancelled) {
          setLoadedTourComponent({ persona, Component: module.FirstRunTour });
        }
      });
    } else {
      void import('./GuidedTour').then((module) => {
        if (!cancelled) {
          setLoadedTourComponent({ persona, Component: module.GuidedTour });
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [isLoading, persona, showTour, userId]);

  const toggleMockMode = (enabled: boolean) => {
    try {
      window.dispatchEvent(
        new CustomEvent('dashboard-mock-mode', {
          detail: { enabled },
        })
      );
    } catch (error) {
      dispatchClientErrorDiagnostic('tour.mock_mode_toggle_failed', error);
    }
  };

  const handleComplete = async () => {
    setShowTour(false);
    toggleMockMode(false);
    const result = await completeTour();
    if (!result.success) {
      dispatchClientDiagnostic('tour.complete_failed', {
        error: result.error || 'Unknown error',
      });
      // Show error to user but don't re-show tour
      setShowTour(false);
    }
  };

  const handleSkip = async () => {
    setShowTour(false);
    toggleMockMode(false);
    // Mark tour as completed in database so it doesn't show again
    const result = await completeTour();
    if (!result.success) {
      dispatchClientDiagnostic('tour.skip_persist_failed', {
        error: result.error || 'Unknown error',
      });
      // Even if save fails, don't show tour again to avoid annoying the user
      setShowTour(false);
    }
  };

  if (isLoading || !showTour || !userId || !LoadedTourComponent) {
    return null;
  }

  if (LoadedTourComponent.persona === 'individual') {
    const FirstRunTour = LoadedTourComponent.Component;
    toggleMockMode(true);
    return <FirstRunTour onComplete={handleComplete} onSkip={handleSkip} basePath="/app/i" />;
  }

  const GuidedTour = LoadedTourComponent.Component;

  return (
    <GuidedTour
      userId={userId}
      persona={LoadedTourComponent.persona}
      shouldRun={showTour}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
