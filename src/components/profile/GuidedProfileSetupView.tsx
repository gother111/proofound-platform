'use client';

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
    checks.hasRequiredVerification,
    checks.hasProofForPublishing,
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
      label: 'Structure your first Proof Pack',
      detail:
        'Turn the first proof into a clean Proof Pack with context, evidence, and outcomes before you publish.',
      state: resolveStepState(3, activeIndex),
      icon: PackageOpen,
      actions: [
        {
          id: 'proof-pack',
          label: checks.hasStructuredProofPack ? 'Review Proof Pack' : 'Structure first Proof Pack',
          onClick: handlers.onOpenProofs,
          variant: 'secondary',
          disabled: !checks.hasFirstProof,
          testId: 'guided-proof-pack-cta',
        },
      ],
    },
    {
      id: 'verification',
      label: 'Optional trust checkpoint',
      detail:
        'You can finish the first Proof Pack without sending emails. Later, one accepted non-self verification helps unlock stronger trust and intro eligibility.',
      state: resolveStepState(4, activeIndex),
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
      ],
    },
    {
      id: 'publish_portfolio',
      label: 'Publish Public Page',
      detail:
        'Publish a direct-link proof snapshot when one proof-backed signal is public-safe. Day one does not require extra profile fields.',
      state: resolveStepState(5, activeIndex),
      icon: Rocket,
      actions: [
        {
          id: 'publish',
          label: checks.hasProofForPublishing ? 'Publish Public Page' : 'Choose what to publish',
          onClick: checks.hasProofForPublishing ? handlers.onOpenPortfolio : handlers.onOpenProofs,
          testId: 'guided-publish-cta',
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

  const dominantAction = !completionState.checks.hasFirstProof
    ? {
        label: 'Add your first proof',
        onClick: onOpenProofs,
        testId: 'guided-dominant-proof-cta',
      }
    : !completionState.checks.hasStructuredProofPack
      ? {
          label: 'Structure first Proof Pack',
          onClick: onOpenProofs,
          testId: 'guided-dominant-proof-cta',
        }
      : !completionState.checks.hasRequiredVerification
        ? {
            label: 'Review trust options',
            onClick: onOpenVerification,
            testId: 'guided-dominant-proof-cta',
          }
        : !completionState.checks.hasProofForPublishing
          ? {
              label: 'Choose proof to publish',
              onClick: onOpenProofs,
              testId: 'guided-dominant-proof-cta',
            }
          : {
              label: 'Publish Public Page',
              onClick: onOpenPortfolio,
              testId: 'guided-dominant-proof-cta',
            };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8" data-testid="guided-profile-setup">
      <Card className="border-proofound-stone/60 p-5 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-display text-proofound-charcoal">
              Start with proof, then choose what to share
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Build only the parts that make the first proof credible: safe shell, one real context,
              one structured Proof Pack, then decide what trust signal comes next.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            <Button
              size="sm"
              onClick={dominantAction.onClick}
              data-testid={dominantAction.testId}
              className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90 sm:w-auto"
            >
              {dominantAction.label}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onOpenFullProfile}
              data-testid="guided-open-full-profile"
              className="w-full sm:w-auto"
            >
              Open full profile
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`rounded-xl border p-4 transition-colors ${getStepCardClass(step.state)}`}
                data-testid={`guided-step-${step.id}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <StepIcon state={step.state} />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-proofound-charcoal">{step.label}</p>
                        {step.state === 'active' ? (
                          <span className="rounded-full bg-proofound-forest px-2 py-0.5 text-[11px] font-medium text-white">
                            Next action
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">{step.detail}</p>
                    </div>
                  </div>
                  <Icon
                    className="hidden h-4 w-4 text-muted-foreground sm:block"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {step.actions.map((action) => (
                    <Button
                      key={action.id}
                      size="sm"
                      variant={action.variant ?? 'default'}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      data-testid={action.testId}
                      className="w-full sm:w-auto"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
