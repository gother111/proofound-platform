'use client';

import { useState } from 'react';
import {
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Circle,
  Link2,
  Lock,
  PackageOpen,
  Rocket,
  UserRound,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type {
  IndividualProfileCompletionChecks,
  IndividualProfileCompletionState,
} from '@/lib/profile/completion-flow';

type GuidedProfileSetupViewProps = {
  completionState: IndividualProfileCompletionState;
  onEditProfile: () => void;
  onOpenFullProfile: () => void;
  onAddExperience: () => void;
  onAddEducation: () => void;
  onAddVolunteering: () => void;
  onOpenProofs: () => void;
  onOpenVerification: () => void;
  onOpenPortfolio: () => void;
  onOpenMatchingPreferences: () => void;
};

type StepState = 'active' | 'completed' | 'locked';

type GuidedStep = {
  id: string;
  label: string;
  detail: string;
  state: StepState;
  icon: typeof UserRound;
  actions: Array<{
    id: string;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
    disabled?: boolean;
    testId: string;
  }>;
};

function resolveStepState(index: number, firstIncompleteIndex: number): StepState {
  if (index < firstIncompleteIndex) return 'completed';
  if (index === firstIncompleteIndex) return 'active';
  return 'locked';
}

function StepIcon({ state }: { state: StepState }) {
  if (state === 'completed') {
    return <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />;
  }

  if (state === 'locked') {
    return <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />;
  }

  return <Circle className="h-5 w-5 text-proofound-forest" aria-hidden="true" />;
}

function getStepCardClass(state: StepState) {
  if (state === 'active') {
    return 'border-proofound-forest/40 bg-proofound-forest/5 shadow-[0_10px_32px_-24px_rgba(28,77,58,0.65)]';
  }
  if (state === 'completed') {
    return 'border-emerald-200 bg-white';
  }
  return 'border-proofound-stone/50 bg-white/70';
}

function buildGuidedSteps(
  checks: IndividualProfileCompletionChecks,
  handlers: Omit<GuidedProfileSetupViewProps, 'completionState'>
): GuidedStep[] {
  const completionMap = [
    checks.hasSafeShell,
    checks.hasRealContext,
    checks.hasFirstProof,
    checks.hasStructuredProofPack,
    checks.hasPublishedPortfolio,
    checks.hasRequiredVerification,
  ];
  const firstIncompleteIndex = completionMap.findIndex((value) => !value);
  const activeIndex = firstIncompleteIndex === -1 ? completionMap.length - 1 : firstIncompleteIndex;

  return [
    {
      id: 'safe_shell',
      label: 'Create a safe shell',
      detail:
        'Keep the shell light: display name, handle, headline, general location and timezone, target role, and work preferences.',
      state: resolveStepState(0, activeIndex),
      icon: UserRound,
      actions: [
        {
          id: 'safe-shell',
          label: checks.hasSafeShell ? 'Edit shell' : 'Finish safe shell',
          onClick: handlers.onEditProfile,
          testId: 'guided-safe-shell-cta',
        },
      ],
    },
    {
      id: 'real_context',
      label: 'Add one real context',
      detail:
        'Anchor your first proof in one real work, volunteering, or learning context before expanding public details.',
      state: resolveStepState(1, activeIndex),
      icon: Briefcase,
      actions: [
        {
          id: 'context-work',
          label: 'Add work context',
          onClick: handlers.onAddExperience,
          variant: 'outline',
          disabled: !checks.hasSafeShell,
          testId: 'guided-context-work-cta',
        },
        {
          id: 'context-learning',
          label: 'Add learning context',
          onClick: handlers.onAddEducation,
          variant: 'outline',
          disabled: !checks.hasSafeShell,
          testId: 'guided-context-learning-cta',
        },
        {
          id: 'context-service',
          label: 'Add volunteering context',
          onClick: handlers.onAddVolunteering,
          variant: 'outline',
          disabled: !checks.hasSafeShell,
          testId: 'guided-context-service-cta',
        },
      ],
    },
    {
      id: 'first_proof',
      label: 'Add your first proof',
      detail:
        'Start with one real proof link or artifact attached to that context. This is the dominant first-session action.',
      state: resolveStepState(2, activeIndex),
      icon: Link2,
      actions: [
        {
          id: 'first-proof',
          label: checks.hasFirstProof ? 'Add another proof' : 'Add your first proof',
          onClick: handlers.onOpenProofs,
          disabled: !checks.hasRealContext,
          testId: 'guided-first-proof-cta',
        },
      ],
    },
    {
      id: 'proof_pack',
      label: 'Structure your first proof record',
      detail:
        'Turn the first proof into a clean proof record with context, evidence, and outcomes before you publish.',
      state: resolveStepState(3, activeIndex),
      icon: PackageOpen,
      actions: [
        {
          id: 'proof-pack',
          label: checks.hasStructuredProofPack
            ? 'Review proof record'
            : 'Structure first proof record',
          onClick: handlers.onOpenProofs,
          variant: 'secondary',
          disabled: !checks.hasFirstProof,
          testId: 'guided-proof-pack-cta',
        },
      ],
    },
    {
      id: 'publish_portfolio',
      label: 'Publish Public Page',
      detail:
        'Publish a direct-link proof snapshot when one proof-backed item is public-safe. Full profile setup and verification are not required for day one.',
      state: resolveStepState(4, activeIndex),
      icon: Rocket,
      actions: [
        {
          id: 'publish',
          label: checks.hasPublishedPortfolio ? 'Review Public Page' : 'Publish Public Page',
          onClick: handlers.onOpenPortfolio,
          disabled: !checks.hasProofForPublishing,
          testId: 'guided-publish-cta',
        },
      ],
    },
    {
      id: 'verification',
      label: 'Upgrade trust badge',
      detail:
        'Verification upgrades Self-reported proof to Verified and can strengthen assignment-review and intro eligibility.',
      state: resolveStepState(5, activeIndex),
      icon: BadgeCheck,
      actions: [
        {
          id: 'verification',
          label: checks.hasRequiredVerification ? 'Review verification' : 'Add verification later',
          onClick: handlers.onOpenVerification,
          variant: 'outline',
          disabled: !checks.hasStructuredProofPack,
          testId: 'guided-verification-cta',
        },
        {
          id: 'matching-preferences',
          label: 'Edit focus and work preferences',
          onClick: handlers.onOpenMatchingPreferences,
          variant: 'outline',
          disabled: !checks.hasSafeShell,
          testId: 'guided-matching-preferences-cta',
        },
      ],
    },
  ];
}

export function GuidedProfileSetupView({
  completionState,
  onEditProfile,
  onOpenFullProfile,
  onAddExperience,
  onAddEducation,
  onAddVolunteering,
  onOpenProofs,
  onOpenVerification,
  onOpenPortfolio,
  onOpenMatchingPreferences,
}: GuidedProfileSetupViewProps) {
  const [showAllSteps, setShowAllSteps] = useState(false);

  const steps = buildGuidedSteps(completionState.checks, {
    onEditProfile,
    onOpenFullProfile,
    onAddExperience,
    onAddEducation,
    onAddVolunteering,
    onOpenProofs,
    onOpenVerification,
    onOpenPortfolio,
    onOpenMatchingPreferences,
  });

  const activeStepIndex = steps.findIndex((s) => s.state === 'active');
  const completedCount = steps.filter((s) => s.state === 'completed').length;
  const displayIndex = activeStepIndex === -1 ? steps.length : activeStepIndex + 1;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const activeStep = steps.find((s) => s.state === 'active') || steps[steps.length - 1];

  const dominantAction = !completionState.checks.hasFirstProof
    ? {
        label: 'Add your first proof',
        onClick: onOpenProofs,
        testId: 'guided-dominant-proof-cta',
      }
    : !completionState.checks.hasStructuredProofPack
      ? {
          label: 'Structure first proof record',
          onClick: onOpenProofs,
          testId: 'guided-dominant-proof-cta',
        }
      : !completionState.checks.hasPublishedPortfolio
        ? {
            label: 'Publish Public Page',
            onClick: onOpenPortfolio,
            testId: 'guided-dominant-proof-cta',
          }
        : !completionState.checks.hasRequiredVerification
          ? {
              label: 'Review trust options',
              onClick: onOpenVerification,
              testId: 'guided-dominant-proof-cta',
            }
          : {
              label: 'Review Public Page',
              onClick: onOpenPortfolio,
              testId: 'guided-dominant-proof-cta',
            };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8" data-testid="guided-profile-setup">
      <Card className="border-proofound-stone/60 p-5 sm:p-8 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-proofound-stone/50 pb-5">
          <div className="space-y-2">
            <h1 className="text-xl font-display text-proofound-charcoal">
              Start with proof, then choose what to share
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Build only the parts that make the first proof credible: safe shell, one real context,
              one structured proof record, then decide what trust signal comes next.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end shrink-0">
            <Button
              size="touch"
              onClick={dominantAction.onClick}
              data-testid={dominantAction.testId}
              className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90 sm:w-auto"
            >
              {dominantAction.label}
            </Button>
            <Button
              size="touch"
              variant="secondary"
              onClick={onOpenFullProfile}
              data-testid="guided-open-full-profile"
              className="w-full sm:w-auto"
            >
              Open full profile
            </Button>
          </div>
        </div>

        {/* Active Step Highlight */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-proofound-forest">
            <span>
              STEP {displayIndex} OF {steps.length}
            </span>
            <span>{progressPercent}% COMPLETE</span>
          </div>
          <div className="h-1 w-full bg-proofound-stone/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-proofound-forest transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div
            className={`rounded-xl border p-5 transition-colors ${getStepCardClass(activeStep.state)}`}
            data-testid={`guided-step-${activeStep.id}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <StepIcon state={activeStep.state} />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-proofound-charcoal">
                      {activeStep.label}
                    </p>
                    <span className="rounded-full bg-proofound-forest px-2 py-0.5 text-[10px] font-medium text-white">
                      Active Step
                    </span>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">{activeStep.detail}</p>
                </div>
              </div>
              {(() => {
                const ActiveIcon = activeStep.icon;
                return (
                  <ActiveIcon
                    className="hidden h-4 w-4 text-muted-foreground sm:block"
                    aria-hidden="true"
                  />
                );
              })()}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {activeStep.actions.map((action) => (
                <Button
                  key={action.id}
                  size="sm"
                  variant={action.variant ?? 'default'}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  data-testid={action.testId}
                  className="w-full sm:w-auto text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Collapsible Checklist for all steps */}
        <div className="border-t border-proofound-stone/50 pt-4">
          <button
            onClick={() => setShowAllSteps(!showAllSteps)}
            className="flex w-full items-center justify-between text-xs font-semibold text-muted-foreground hover:text-proofound-charcoal transition-colors"
          >
            <span>{showAllSteps ? 'HIDE ALL SETUP STEPS' : 'SHOW ALL SETUP STEPS'}</span>
            {showAllSteps ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showAllSteps && (
            <div className="mt-4 space-y-3">
              {steps.map((step) => {
                return (
                  <div
                    key={step.id}
                    className={`flex items-start justify-between rounded-lg border p-3 bg-white ${
                      step.state === 'active'
                        ? 'border-proofound-forest/30 bg-proofound-forest/5'
                        : 'border-proofound-stone/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <StepIcon state={step.state} />
                      <div>
                        <p
                          className={`text-xs font-medium ${step.state === 'locked' ? 'text-muted-foreground' : 'text-proofound-charcoal'}`}
                        >
                          {step.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{step.detail}</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      {step.state}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
