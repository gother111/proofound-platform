'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Step {
  id: string; // The ID of the DOM element to highlight
  title: string;
  description: string;
}

interface SpotlightContextProps {
  startTour: (t: Step[]) => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  isActive: boolean;
  currentStepIndex: number;
}

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
      console.warn(
        'useSpotlight called outside SpotlightProvider. Falling back to no-op behavior.'
      );
    }
    return FALLBACK_SPOTLIGHT_CONTEXT;
  }
  return ctx;
}

export function SpotlightProvider({ children }: { children: React.ReactNode }) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  const isActive = currentStepIndex >= 0 && currentStepIndex < steps.length;

  useEffect(() => {
    setMounted(true);
  }, []);

  const startTour = useCallback((t: Step[]) => {
    if (!t.length) return;
    setSteps(t);
    setCurrentStepIndex(0);
  }, []);

  const stopTour = useCallback(() => {
    setCurrentStepIndex(-1);
    setSteps([]);
    setTargetRect(null);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((i) => i + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((i) => Math.max(0, i - 1));
  }, []);

  // Track scroll and resize
  useEffect(() => {
    if (!isActive) return;

    let isMounted = true;

    const updateRect = () => {
      const currentStep = steps[currentStepIndex];
      const el = document.getElementById(currentStep.id);

      if (el) {
        // Only scroll if element is completely out of view
        const rect = el.getBoundingClientRect();
        const isInView =
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth);

        if (!isInView) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Apply rect slightly after scroll frames settle
        setTimeout(
          () => {
            if (!isMounted) return;
            const newRect = el.getBoundingClientRect();
            setTargetRect(newRect);
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

  const SpotlightOverlay = () => {
    if (!isActive || !mounted) return null;
    const currentStep = steps[currentStepIndex];

    // Position tooltip logic
    let topPos = 0;
    let leftPos = 0;

    if (targetRect) {
      topPos = targetRect.bottom + 20;
      // if too close to bottom, show above instead
      if (topPos + 200 > window.innerHeight) {
        topPos = targetRect.top - 20 - 200; // rough estimation
      }
      leftPos = Math.max(
        16,
        Math.min(window.innerWidth - 320 - 16, targetRect.left + targetRect.width / 2 - 160)
      );
    }

    return createPortal(
      <AnimatePresence>
        {isActive && (
          <div className="fixed inset-0 z-[100]">
            {/* Fully opaque mask layer, SVG punch-out is visual only */}
            <div
              className="absolute inset-0 z-[-1] pointer-events-auto"
              style={{ backdropFilter: 'blur(2px)' }}
            />

            {/* Cutout Mask using SVG */}
            <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none z-0">
              <defs>
                <mask id="spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {targetRect && (
                    <motion.rect
                      fill="black"
                      rx={16} // smooth rounded corners
                      initial={false}
                      animate={{
                        x: targetRect.left - 12,
                        y: targetRect.top - 12,
                        width: targetRect.width + 24,
                        height: targetRect.height + 24,
                      }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                  )}
                </mask>
              </defs>

              <rect
                width="100%"
                height="100%"
                fill="black"
                fillOpacity="0.55"
                mask="url(#spotlight-mask)"
              />
            </svg>

            {/* Tooltip Card */}
            {targetRect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 25 }}
                style={{
                  position: 'absolute',
                  top: topPos,
                  left: leftPos,
                  width: Math.min(320, window.innerWidth - 32),
                }}
                className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-2xl border border-black/10 dark:border-white/10 flex flex-col gap-3 pointer-events-auto z-10"
              >
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-semibold text-lg text-proofound-charcoal dark:text-foreground leading-tight">
                    {currentStep.title}
                  </h3>
                  <button
                    onClick={stopTour}
                    className="text-muted-foreground hover:text-foreground p-1 -mr-2 -mt-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentStep.description}
                </p>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {currentStepIndex + 1} of {steps.length}
                  </span>
                  <div className="flex gap-2">
                    {currentStepIndex > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={prevStep}
                        className="h-8 text-xs font-medium px-3"
                      >
                        Back
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={currentStepIndex === steps.length - 1 ? stopTour : nextStep}
                      className="bg-proofound-forest hover:bg-proofound-forest/90 text-white h-8 text-xs font-medium px-4"
                    >
                      {currentStepIndex === steps.length - 1 ? 'Get Started' : 'Next'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <SpotlightContext.Provider
      value={{ startTour, stopTour, nextStep, prevStep, isActive, currentStepIndex }}
    >
      {children}
      <SpotlightOverlay />
    </SpotlightContext.Provider>
  );
}
