'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { SpotlightStep } from './spotlight-provider';

interface SpotlightOverlayProps {
  isActive: boolean;
  mounted: boolean;
  steps: SpotlightStep[];
  currentStepIndex: number;
  targetRect: DOMRect | null;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function SpotlightOverlay({
  isActive,
  mounted,
  steps,
  currentStepIndex,
  targetRect,
  onStop,
  onNext,
  onPrev,
}: SpotlightOverlayProps) {
  if (!isActive || !mounted) return null;

  const currentStep = steps[currentStepIndex];
  let topPos = 0;
  let leftPos = 0;

  if (targetRect) {
    topPos = targetRect.bottom + 20;
    if (topPos + 200 > window.innerHeight) {
      topPos = targetRect.top - 20 - 200;
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
          <div
            className="absolute inset-0 z-[-1] pointer-events-auto"
            style={{ backdropFilter: 'blur(2px)' }}
          />

          <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none z-0">
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                {targetRect && (
                  <motion.rect
                    fill="black"
                    rx={16}
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
                  onClick={onStop}
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
                      onClick={onPrev}
                      className="h-8 text-xs font-medium px-3"
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={currentStepIndex === steps.length - 1 ? onStop : onNext}
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
}
