/**
 * First-Run Guided Tour (Flow I-03)
 *
 * PRD Requirement: First-run guided tour that progressively reveals UI
 * Steps: Navigation → Dashboard → Profile → Expertise Hub → Matching → Zen Hub → Settings
 *
 * Features:
 * - Progressive reveal with styled background
 * - Skippable and repeatable
 * - Keyboard accessible (ESC to skip, Arrow keys to navigate)
 * - Persists completion state
 * - Mobile responsive
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Home,
  User,
  Compass,
  Target,
  Heart,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

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
      "We're here to help you find opportunities that align with your skills, values, and purpose. Let's take a quick tour to show you around.",
    icon: Home,
    placement: 'center',
  },
  {
    id: 'navigation',
    title: 'Your Navigation',
    description:
      'This sidebar is your command center. Access your dashboard, profile, matches, and more from here.',
    icon: Compass,
    target: '[data-tour="left-nav"]',
    placement: 'right',
    revealDelay: 300,
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description:
      'Your dashboard gives you a snapshot of your journey: active matches, tasks, projects, and impact. Everything you need to see at a glance.',
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
    id: 'expertise',
    title: 'Expertise Hub',
    description:
      'Map your skills using our comprehensive taxonomy of 20,000+ skills. Add evidence and verification to stand out. This is your credibility engine.',
    icon: Target,
    target: '[data-tour="expertise-link"]',
    placement: 'right',
  },
  {
    id: 'matching',
    title: 'Find Opportunities',
    description:
      'Discover assignments and roles that match your skills AND values. Our algorithm prioritizes Purpose-Alignment-Contribution (PAC) to find meaningful work.',
    icon: Target,
    target: '[data-tour="matching-link"]',
    placement: 'right',
  },
  {
    id: 'zen',
    title: 'Zen Hub',
    description:
      'Your private well-being space. Track stress, reflect on milestones, and access resources. Completely optional and never shared or used in matching.',
    icon: Heart,
    target: '[data-tour="zen-link"]',
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
      "You can restart this tour anytime from Settings → Help. Now, let's build your profile and find opportunities that align with your purpose!",
    icon: Home,
    placement: 'center',
  },
];

export function FirstRunTour({ onComplete, onSkip, basePath = '/app/i' }: FirstRunTourProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [highlightPosition, setHighlightPosition] = useState<DOMRect | null>(null);

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
      return;
    }

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
      }
    }, step.revealDelay || 100);

    return () => clearTimeout(timer);
  }, [currentStep, step.target, step.revealDelay]);

  const handleActionButton = () => {
    // For "complete" step, suggest going to profile
    if (step.id === 'complete') {
      router.push(`${basePath}/profile`);
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
              <div className="w-16 h-16 rounded-full bg-[#E8F5E1] flex items-center justify-center">
                <StepIcon className="w-8 h-8 text-[#1C4D3A]" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-['Crimson_Pro'] font-semibold text-[#2D3330]">
                {step.title}
              </h2>
              <p className="text-base leading-relaxed text-[#6B6760]">{step.description}</p>
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
            <div className="text-center text-sm text-[#6B6760]">
              Step {currentStep + 1} of {steps.length}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={handleSkip}
                className="text-sm text-[#6B6760] hover:text-[#2D3330] transition-colors"
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
                  className="bg-[#1C4D3A] hover:bg-[#163D2E] text-white"
                >
                  {isLastStep ? 'Get Started' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Keyboard hints */}
            <div className="text-xs text-center text-[#6B6760] pt-2 space-x-4">
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
          className="fixed z-[9999] bg-white rounded-lg shadow-2xl p-6 max-w-sm animate-in fade-in slide-in-from-left-4 duration-300"
          style={{
            top:
              step.placement === 'bottom'
                ? highlightPosition.bottom + 20
                : step.placement === 'top'
                  ? highlightPosition.top - 20
                  : highlightPosition.top + highlightPosition.height / 2,
            left:
              step.placement === 'right'
                ? highlightPosition.right + 20
                : step.placement === 'left'
                  ? highlightPosition.left - 20
                  : highlightPosition.left + highlightPosition.width / 2,
            transform:
              step.placement === 'bottom'
                ? 'translateX(-50%)'
                : step.placement === 'top'
                  ? 'translate(-50%, -100%)'
                  : step.placement === 'right'
                    ? 'translateY(-50%)'
                    : 'translate(-100%, -50%)',
          }}
        >
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 text-[#6B6760] hover:text-[#2D3330] transition-colors"
            aria-label="Close tour"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="space-y-4 pr-6">
            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-[#E8F5E1] flex items-center justify-center">
              <StepIcon className="w-6 h-6 text-[#1C4D3A]" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="font-['Crimson_Pro'] font-semibold text-lg text-[#2D3330]">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#6B6760]">{step.description}</p>
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
                className="bg-[#1C4D3A] hover:bg-[#163D2E] text-white"
              >
                {isLastStep ? 'Done' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Step counter */}
            <div className="text-xs text-center text-[#6B6760] pt-1">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
