'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { dispatchClientDiagnostic } from '@/lib/client-diagnostics';

export interface SpotlightStep {
  id: string;
  title: string;
  description: string;
}

interface SpotlightContextProps {
  startTour: (steps: SpotlightStep[]) => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  isActive: boolean;
  currentStepIndex: number;
}

type SpotlightOverlayComponent = React.ComponentType<{
  isActive: boolean;
  mounted: boolean;
  steps: SpotlightStep[];
  currentStepIndex: number;
  targetRect: DOMRect | null;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
}>;

const SpotlightContext = createContext<SpotlightContextProps | null>(null);
let hasWarnedMissingSpotlightProvider = false;
const FALLBACK_SPOTLIGHT_CONTEXT: SpotlightContextProps = {
  startTour: () => undefined,
  stopTour: () => undefined,
  nextStep: () => undefined,
  prevStep: () => undefined,
  isActive: false,
  currentStepIndex: -1,
};

export function useSpotlight() {
  const ctx = useContext(SpotlightContext);
  if (!ctx) {
    if (process.env.NODE_ENV !== 'production' && !hasWarnedMissingSpotlightProvider) {
      hasWarnedMissingSpotlightProvider = true;
      dispatchClientDiagnostic('spotlight.provider_missing', {
        fallback: 'noop',
      });
    }
    return FALLBACK_SPOTLIGHT_CONTEXT;
  }
  return ctx;
}

export function SpotlightProvider({ children }: { children: React.ReactNode }) {
  const [steps, setSteps] = useState<SpotlightStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [Overlay, setOverlay] = useState<SpotlightOverlayComponent | null>(null);

  const isActive = currentStepIndex >= 0 && currentStepIndex < steps.length;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isActive || Overlay) {
      return;
    }

    let cancelled = false;

    void import('./spotlight-overlay').then((module) => {
      if (!cancelled) {
        setOverlay(() => module.SpotlightOverlay);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [Overlay, isActive]);

  const startTour = useCallback((tourSteps: SpotlightStep[]) => {
    if (!tourSteps.length) return;
    setSteps(tourSteps);
    setCurrentStepIndex(0);
  }, []);

  const stopTour = useCallback(() => {
    setCurrentStepIndex(-1);
    setSteps([]);
    setTargetRect(null);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((index) => index + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((index) => Math.max(0, index - 1));
  }, []);

  useEffect(() => {
    if (!isActive) return;

    let isMounted = true;

    const updateRect = () => {
      const currentStep = steps[currentStepIndex];
      const element = document.getElementById(currentStep.id);

      if (element) {
        const rect = element.getBoundingClientRect();
        const isInView =
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth);

        if (!isInView) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        window.setTimeout(
          () => {
            if (!isMounted) return;
            setTargetRect(element.getBoundingClientRect());
          },
          isInView ? 10 : 300
        );
      } else {
        setTargetRect(null);
      }
    };

    updateRect();

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, { passive: true });

    return () => {
      isMounted = false;
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isActive, currentStepIndex, steps]);

  return (
    <SpotlightContext.Provider
      value={{ startTour, stopTour, nextStep, prevStep, isActive, currentStepIndex }}
    >
      {children}
      {Overlay ? (
        <Overlay
          isActive={isActive}
          mounted={mounted}
          steps={steps}
          currentStepIndex={currentStepIndex}
          targetRect={targetRect}
          onStop={stopTour}
          onNext={nextStep}
          onPrev={prevStep}
        />
      ) : null}
    </SpotlightContext.Provider>
  );
}
