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

function buildGuidedSteps(
  checks: IndividualProfileCompletionChecks,
  handlers: Omit<GuidedProfileSetupViewProps, 'completionState'>
): GuidedStep[] {
  const completionMap = [
    checks.hasSafeShell,
    checks.hasRealContext,
    checks.hasFirstProof,
    checks.hasStructuredProofPack,
    checks.hasOptionalVerification,
    checks.hasProofForPublishing,
  ];
  const firstIncompleteIndex = completionMap.findIndex((value) => !value);
  const activeIndex = firstIncompleteIndex === -1 ? completionMap.length - 1 : firstIncompleteIndex;

  return [
    {
      id: 'safe_shell',
      label: 'Create a safe shell',
      detail:
        'Keep the shell light: display name, handle, headline, broad location and timezone, target role, and work preferences.',
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
        'Anchor your first proof in one real work, volunteering, or learning context. No broad profile polishing needed first.',
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
      id: 'optional_verification',
      label: 'Optional verification',
      detail:
        'Verification is helpful, but it is optional for portfolio readiness. Request it after your first proof is structured.',
      state: resolveStepState(4, activeIndex),
      icon: BadgeCheck,
      actions: [
        {
          id: 'verification',
          label: checks.hasOptionalVerification ? 'Review verification' : 'Request verification',
          onClick: handlers.onOpenVerification,
          variant: 'outline',
          disabled: !checks.hasStructuredProofPack,
          testId: 'guided-verification-cta',
        },
      ],
    },
    {
      id: 'publish_portfolio',
      label: 'Publish portfolio',
      detail:
        'Publish when one proof-backed signal is public-safe. Values, causes, and broad skill setup are not required for day one.',
      state: resolveStepState(5, activeIndex),
      icon: Rocket,
      actions: [
        {
          id: 'publish',
          label: checks.hasProofForPublishing ? 'Publish portfolio' : 'Choose what to publish',
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
      : !completionState.checks.hasProofForPublishing
        ? {
            label: 'Choose proof to publish',
            onClick: onOpenProofs,
            testId: 'guided-dominant-proof-cta',
          }
        : {
            label: 'Publish portfolio',
            onClick: onOpenPortfolio,
            testId: 'guided-dominant-proof-cta',
          };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8" data-testid="guided-profile-setup">
      <Card className="border-proofound-stone/60 p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-2xl font-display text-proofound-charcoal">
              Start with proof, not profile polish
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              The locked MVP corridor is simple: build a safe shell, anchor one real context, add
              one real proof, structure it, optionally verify it, then publish.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={dominantAction.onClick}
              data-testid={dominantAction.testId}
              className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
            >
              {dominantAction.label}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onOpenFullProfile}
              data-testid="guided-open-full-profile"
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
                className="rounded-xl border border-proofound-stone/50 bg-white p-4"
                data-testid={`guided-step-${step.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <StepIcon state={step.state} />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-proofound-charcoal">{step.label}</p>
                      <p className="text-xs text-muted-foreground">{step.detail}</p>
                    </div>
                  </div>
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {step.actions.map((action) => (
                    <Button
                      key={action.id}
                      size="sm"
                      variant={action.variant ?? 'default'}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      data-testid={action.testId}
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
