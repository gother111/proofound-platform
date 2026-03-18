/**
 * First-Run Guided Tour (Flow I-03)
 *
 * PRD Requirement: First-run guided tour that progressively reveals UI
 * Steps: Navigation → Overview → Profile → Public Portfolio → Matching → Settings
 *
 * Features:
 * - Progressive reveal with styled background
 * - Skippable and repeatable
 * - Keyboard accessible (ESC to skip, Arrow keys to navigate)
 * - Persists completion state
 * - Mobile responsive
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Home,
  User,
  Compass,
  Link2,
  Target,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { computeTooltipPosition, type TooltipPlacement } from '@/lib/tour/tooltip-position';

interface FirstRunTourProps {
  onComplete: () => void;
  onSkip: () => void;
  basePath?: string; // '/app/i' or '/app/o/[slug]'
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  target?: string; // CSS selector for highlighting
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  revealDelay?: number; // Milliseconds before revealing next element
}

const individualTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Proofound! ✨',
    description:
      "Your first win is simple: publish a clean, proof-based portfolio link and share it today. Let's take a quick tour.",
    icon: Home,
    placement: 'center',
  },
  {
    id: 'navigation',
    title: 'Your Navigation',
    description:
      'This sidebar is your command center. Access your overview, profile, public portfolio link, matching, and more from here.',
    icon: Compass,
    target: '[data-tour="left-nav"]',
    placement: 'right',
    revealDelay: 300,
  },
  {
    id: 'dashboard',
    title: 'Overview',
    description:
      'Your overview gives you a snapshot of portfolio readiness, proof strength, and the next calm step to take.',
    icon: Home,
    target: '[data-tour="home-link"]',
    placement: 'right',
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description:
      'Build your profile to showcase your skills, experience, mission, and values. A complete profile helps organizations understand who you are and what drives you.',
    icon: User,
    target: '[data-tour="profile-link"]',
    placement: 'right',
  },
  {
    id: 'portfolio',
    title: 'Public Portfolio',
    description:
      'This is your share-ready public link. Publish once, then copy and send it to collaborators, partners, or hiring teams immediately.',
    icon: Link2,
    target: '[data-tour="portfolio-link"]',
    placement: 'right',
  },
  {
    id: 'matching',
    title: 'Matching',
    description:
      'Matching stays secondary to your portfolio. Once your portfolio is published, review aligned assignments and qualified introductions.',
    icon: Target,
    target: '[data-tour="matching-link"]',
    placement: 'right',
  },
  {
    id: 'settings',
    title: 'Settings & Privacy',
    description:
      'Control your privacy, visibility, notifications, and data. Export your data anytime, delete your account instantly—your data, your control.',
    icon: Settings,
    target: '[data-tour="settings-link"]',
    placement: 'right',
  },
  {
    id: 'complete',
    title: "You're All Set! 🎉",
    description:
      "You can restart this tour anytime from Settings → Help. Start by sharing your public portfolio link, then use matching when you're ready.",
    icon: Home,
    placement: 'center',
  },
];

export function FirstRunTour({ onComplete, onSkip, basePath = '/app/i' }: FirstRunTourProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [highlightPosition, setHighlightPosition] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
    placement: TooltipPlacement;
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const steps = individualTourSteps; // Can be extended for org tours
  const step = steps[currentStep];

  // Handler functions wrapped in useCallback for stable references
  const handleComplete = useCallback(async () => {
    setIsVisible(false);
    await onComplete();
  }, [onComplete]);

  const handleSkip = useCallback(async () => {
    setIsVisible(false);
    await onSkip();
  }, [onSkip]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length, handleComplete]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'Escape':
          handleSkip();
          break;
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleBack();
          break;
      }
    },
    [isVisible, handleSkip, handleNext, handleBack]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Calculate highlight position for target element
  useEffect(() => {
    if (!step.target) {
      setHighlightPosition(null);
      setTooltipPosition(null);
      return;
    }

    setTooltipPosition(null);

    // Small delay to let DOM elements render
    const timer = setTimeout(() => {
      const targetElement = document.querySelector(step.target!);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setHighlightPosition(rect);

        // Scroll element into view if needed
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      } else {
        setHighlightPosition(null);
      }
    }, step.revealDelay || 100);

    return () => clearTimeout(timer);
  }, [currentStep, step.target, step.revealDelay]);

  useEffect(() => {
    if (!step.target || step.placement === 'center') {
      return;
    }

    const updateHighlightPosition = () => {
      const targetElement = document.querySelector(step.target!);
      if (!targetElement) {
        setHighlightPosition(null);
        return;
      }

      setHighlightPosition(targetElement.getBoundingClientRect());
    };

    window.addEventListener('resize', updateHighlightPosition);
    window.addEventListener('scroll', updateHighlightPosition, true);

    return () => {
      window.removeEventListener('resize', updateHighlightPosition);
      window.removeEventListener('scroll', updateHighlightPosition, true);
    };
  }, [step.target, step.placement]);

  const updateTooltipPosition = useCallback(() => {
    if (!highlightPosition || !tooltipRef.current) {
      setTooltipPosition(null);
      return;
    }

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    if (tooltipRect.width <= 0 || tooltipRect.height <= 0) {
      return;
    }

    const preferredPlacement: TooltipPlacement =
      step.placement && step.placement !== 'center' ? step.placement : 'right';

    const nextPosition = computeTooltipPosition({
      targetRect: highlightPosition,
      tooltipSize: {
        width: tooltipRect.width,
        height: tooltipRect.height,
      },
      preferredPlacement,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    });

    setTooltipPosition(nextPosition);
  }, [highlightPosition, step.placement]);

  useEffect(() => {
    if (!highlightPosition || !step.target || step.placement === 'center') {
      setTooltipPosition(null);
      return;
    }

    const frame = window.requestAnimationFrame(updateTooltipPosition);
    return () => window.cancelAnimationFrame(frame);
  }, [highlightPosition, step.target, step.placement, updateTooltipPosition, currentStep]);

  const handleActionButton = () => {
    // For "complete" step, suggest going to public portfolio
    if (step.id === 'complete') {
      router.push(`${basePath}/portfolio`);
      handleComplete();
    } else {
      handleNext();
    }
  };

  if (!isVisible) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const StepIcon = step.icon;

  // Center modal for welcome/complete steps
  if (!step.target || step.placement === 'center') {
    return (
      <>
        {/* Overlay with network pattern background */}
        <div className="fixed inset-0 bg-gradient-to-br from-[#1C4D3A]/95 via-[#2D3330]/95 to-[#1C4D3A]/95 z-[9998] backdrop-blur-sm">
          {/* Subtle pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Modal */}
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-proofound-success-tint flex items-center justify-center">
                <StepIcon className="w-8 h-8 text-proofound-forest" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-['Crimson_Pro'] font-semibold text-foreground">
                {step.title}
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">{step.description}</p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 pt-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className="h-2 flex-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: index <= currentStep ? '#1C4D3A' : '#E8E6DD',
                  }}
                />
              ))}
            </div>

            {/* Step counter */}
            <div className="text-center text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip tour
              </button>

              <div className="flex items-center gap-3">
                {!isFirstStep && (
                  <Button variant="outline" size="default" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button
                  size="default"
                  onClick={handleActionButton}
                  className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
                >
                  {isLastStep ? 'Get Started' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Keyboard hints */}
            <div className="text-xs text-center text-muted-foreground pt-2 space-x-4">
              <span>← → Navigate</span>
              <span>ESC Skip</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Positioned tooltip for element-specific steps
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[9998]" />

      {/* Spotlight effect on target */}
      {highlightPosition && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-lg transition-all duration-300"
          style={{
            top: highlightPosition.top - 8,
            left: highlightPosition.left - 8,
            width: highlightPosition.width + 16,
            height: highlightPosition.height + 16,
            boxShadow: `
              0 0 0 4px rgba(28, 77, 58, 0.6),
              0 0 0 9999px rgba(0, 0, 0, 0.6),
              0 0 40px rgba(28, 77, 58, 0.4)
            `,
          }}
        />
      )}

      {/* Tooltip - positioned based on placement */}
      {highlightPosition && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] bg-white rounded-lg shadow-2xl p-6 max-w-sm w-[min(calc(100vw-2rem),24rem)] max-h-[calc(100vh-2rem)] overflow-y-auto animate-in fade-in slide-in-from-left-4 duration-300"
          style={{
            top: tooltipPosition?.top ?? -9999,
            left: tooltipPosition?.left ?? -9999,
            visibility: tooltipPosition ? 'visible' : 'hidden',
          }}
        >
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close tour"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="space-y-4 pr-6">
            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-proofound-success-tint flex items-center justify-center">
              <StepIcon className="w-6 h-6 text-proofound-forest" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="font-['Crimson_Pro'] font-semibold text-lg text-foreground">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: index === currentStep ? '#1C4D3A' : '#E8E6DD',
                  }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              {!isFirstStep && (
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}

              <div className="flex-1" />

              <Button
                size="sm"
                onClick={handleNext}
                className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              >
                {isLastStep ? 'Done' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Step counter */}
            <div className="text-xs text-center text-muted-foreground pt-1">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
