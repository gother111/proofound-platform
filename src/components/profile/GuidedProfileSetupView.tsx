'use client';

import { CheckCircle2, Circle, Lock, UserRound, Heart, Leaf, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { IndividualProfileCompletionState } from '@/lib/profile/completion-flow';

type GuidedProfileSetupViewProps = {
  completionState: IndividualProfileCompletionState;
  onEditProfile: () => void;
  onOpenValues: () => void;
  onOpenCauses: () => void;
  onOpenSkills: () => void;
};

type StepState = 'active' | 'completed' | 'locked';

function resolveStepState(
  target: 'step0_name' | 'step1_purpose' | 'step2_profile',
  current: IndividualProfileCompletionState['stage']
): StepState {
  const order = {
    step0_name: 0,
    step1_purpose: 1,
    step2_profile: 2,
  } as const;

  if (order[current] === order[target]) return 'active';
  if (order[current] > order[target]) return 'completed';
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

export function GuidedProfileSetupView({
  completionState,
  onEditProfile,
  onOpenValues,
  onOpenCauses,
  onOpenSkills,
}: GuidedProfileSetupViewProps) {
  const step0State = resolveStepState('step0_name', completionState.stage);
  const step1State = resolveStepState('step1_purpose', completionState.stage);
  const step2State = resolveStepState('step2_profile', completionState.stage);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="guided-profile-setup">
      <Card className="p-6 sm:p-8 border-proofound-stone/60">
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl font-display text-proofound-charcoal">Complete your profile</h1>
          <p className="text-sm text-muted-foreground">
            Follow these steps in order. We unlock the rest of your profile once essentials are in
            place.
          </p>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-proofound-stone/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <StepIcon state={step0State} />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-proofound-charcoal">
                    Step 0: Add name and surname
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Use your first and last name to start your public identity.
                  </p>
                </div>
              </div>
              <UserRound className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <Button
                size="sm"
                onClick={onEditProfile}
                disabled={step0State === 'completed'}
                data-testid="guided-step0-cta"
              >
                {step0State === 'completed' ? 'Completed' : 'Set name'}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-proofound-stone/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <StepIcon state={step1State} />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-proofound-charcoal">
                    Step 1: Add values and causes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Define what you care about before filling the rest of your profile.
                  </p>
                </div>
              </div>
              <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenValues}
                disabled={step1State === 'locked'}
                data-testid="guided-step1-values-cta"
              >
                <Heart className="h-4 w-4 mr-1" />
                Add values
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenCauses}
                disabled={step1State === 'locked'}
                data-testid="guided-step1-causes-cta"
              >
                <Leaf className="h-4 w-4 mr-1" />
                Add causes
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-proofound-stone/60 p-4 bg-proofound-parchment/40">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <StepIcon state={step2State} />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-proofound-charcoal">
                    Step 2: Complete the rest of your profile
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Skills, impact stories, and portfolio are unlocked after steps 0 and 1.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={onOpenSkills}
                disabled={step2State === 'locked'}
                data-testid="guided-step2-skills-cta"
              >
                Open expertise
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
