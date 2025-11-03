/**
 * Guided Tour Component
 *
 * First-run guided tour to help users understand the platform.
 * Shows persona-specific steps and highlights relevant UI elements.
 *
 * Features:
 * - Step-by-step walkthrough
 * - Element highlighting
 * - Skip/Complete options
 * - Persists completion state
 */

'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTourSteps, type TourStep } from './tourSteps';
import { useRouter } from 'next/navigation';

interface GuidedTourProps {
  persona: 'individual' | 'org_member' | 'unknown';
  onComplete: () => void;
  onSkip: () => void;
}

export function GuidedTour({ persona, onComplete, onSkip }: GuidedTourProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const steps = getTourSteps(persona);
  const step = steps[currentStep];

  // Calculate position for the tooltip
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!step.target) {
      // Center placement - no target element
      setTooltipPosition(null);
      return;
    }

    // Find target element and position tooltip
    const targetElement = document.querySelector(step.target);
    if (!targetElement) {
      setTooltipPosition(null);
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const placement = step.placement || 'bottom';

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = rect.top - 20;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + 20;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - 20;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + 20;
        break;
    }

    setTooltipPosition({ top, left });

    // Highlight target element
    targetElement.classList.add('tour-highlight');
    return () => {
      targetElement.classList.remove('tour-highlight');
    };
  }, [currentStep, step.target, step.placement]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  const handleAction = () => {
    if (step.action?.href) {
      router.push(step.action.href);
      handleComplete();
    } else if (step.action?.onClick) {
      step.action.onClick();
      handleNext();
    }
  };

  if (!isVisible) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Center placement (for welcome/complete steps)
  if (!step.target || step.placement === 'center') {
    return (
      <>
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/50 z-[9998]" />

        {/* Modal */}
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
            style={{ borderColor: '#E8E6DD' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-semibold" style={{ color: '#2D3330' }}>
                {step.title}
              </h2>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close tour"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-base leading-relaxed" style={{ color: '#6B6760' }}>
              {step.description}
            </p>

            {/* Progress */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className="h-1.5 flex-1 rounded-full"
                  style={{
                    backgroundColor: index <= currentStep ? '#1C4D3A' : '#E8E6DD',
                  }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button onClick={handleSkip} className="text-sm" style={{ color: '#6B6760' }}>
                Skip tour
              </button>

              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <Button variant="outline" size="sm" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                  style={{ backgroundColor: '#1C4D3A', color: 'white' }}
                >
                  {isLastStep ? 'Get Started' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Positioned tooltip (for element-specific steps)
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-[9998]" />

      {/* Spotlight effect on target */}
      {step.target && (
        <style jsx global>{`
          .tour-highlight {
            position: relative;
            z-index: 9999;
            box-shadow:
              0 0 0 4px rgba(28, 77, 58, 0.5),
              0 0 0 9999px rgba(0, 0, 0, 0.3);
            border-radius: 4px;
          }
        `}</style>
      )}

      {/* Tooltip */}
      {tooltipPosition && (
        <div
          className="fixed z-[9999] bg-white rounded-lg shadow-xl p-4 max-w-sm"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform:
              step.placement === 'bottom'
                ? 'translate(-50%, 0)'
                : step.placement === 'top'
                  ? 'translate(-50%, -100%)'
                  : step.placement === 'right'
                    ? 'translate(0, -50%)'
                    : 'translate(-100%, -50%)',
            borderColor: '#E8E6DD',
          }}
        >
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            aria-label="Close tour"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="space-y-3 pr-6">
            <h3 className="font-semibold text-base" style={{ color: '#2D3330' }}>
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#6B6760' }}>
              {step.description}
            </p>

            {/* Progress dots */}
            <div className="flex items-center gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: index === currentStep ? '#1C4D3A' : '#E8E6DD',
                  }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              {!isFirstStep && (
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Back
                </Button>
              )}

              <div className="flex-1" />

              {step.action ? (
                <Button
                  size="sm"
                  onClick={handleAction}
                  style={{ backgroundColor: '#1C4D3A', color: 'white' }}
                >
                  {step.action.label}
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleNext}
                  style={{ backgroundColor: '#1C4D3A', color: 'white' }}
                >
                  {isLastStep ? 'Done' : 'Next'}
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
