import { describe, expect, it } from 'vitest';

import { deriveLegacyMatchLifecycleState } from '@/lib/lifecycle/residual';
import {
  APPLICATION_VS_INTRO_CONTRACT,
  CANONICAL_RELATIONSHIP_LIFECYCLE_CONTRACT,
  RESIDUAL_LIFECYCLE_APPENDIX,
} from '@/lib/workflow/contracts';

describe('RESIDUAL_LIFECYCLE_APPENDIX', () => {
  it('defines initial state, terminal states, timestamps, and audit events for every residual lifecycle', () => {
    for (const [machineName, machine] of Object.entries(RESIDUAL_LIFECYCLE_APPENDIX)) {
      expect(machine.states.length, `${machineName} states`).toBeGreaterThan(0);
      expect(machine.states).toContain(machine.initialState);
      expect(machine.terminalStates.length, `${machineName} terminal states`).toBeGreaterThan(0);
      expect(machine.requiredTimestamps.length, `${machineName} timestamps`).toBeGreaterThan(0);
      expect(machine.requiredAuditEvents.length, `${machineName} audit events`).toBeGreaterThan(0);
    }
  });

  it('keeps export and deletion as explicitly persisted async lifecycles', () => {
    expect(RESIDUAL_LIFECYCLE_APPENDIX.export.states).toContain('ready');
    expect(RESIDUAL_LIFECYCLE_APPENDIX.export.requiredTimestamps).toContain('expires_at');
    expect(RESIDUAL_LIFECYCLE_APPENDIX.deletion.states).toContain('processing');
    expect(RESIDUAL_LIFECYCLE_APPENDIX.deletion.states).toContain('failed_requires_manual_review');
  });
});

describe('APPLICATION_VS_INTRO_CONTRACT', () => {
  it('keeps application and intro conceptually separate while preserving intro as the MVP pipeline object', () => {
    expect(APPLICATION_VS_INTRO_CONTRACT.areSeparateObjects).toBe(true);
    expect(APPLICATION_VS_INTRO_CONTRACT.currentMvpPolicy).toContain('Intro');
    expect(APPLICATION_VS_INTRO_CONTRACT.duplicationRules).toContain(
      'At most one active intro may exist per candidate_profile_id and assignment_id.'
    );
  });

  it('documents launch-safe reentry instead of reopening withdrawn or no-show records in place', () => {
    expect(APPLICATION_VS_INTRO_CONTRACT.reopenRules).toContain(
      'Withdrawn intros do not reopen in place. Re-entry requires a new intro attempt after a terminal loss state.'
    );
    expect(APPLICATION_VS_INTRO_CONTRACT.reopenRules).toContain(
      'No-show interview records remain terminal. Recovery uses a new interview attempt, not a state mutation on the same no-show record.'
    );
  });
});

describe('CANONICAL_RELATIONSHIP_LIFECYCLE_CONTRACT', () => {
  it('defines the launch-safe lifecycle objects and timers', () => {
    expect(CANONICAL_RELATIONSHIP_LIFECYCLE_CONTRACT.objects.introWorkflow.productStates).toContain(
      'intro_pending'
    );
    expect(CANONICAL_RELATIONSHIP_LIFECYCLE_CONTRACT.objects.revealRequest.productStates).toEqual([
      'reveal_pending',
      'reveal_completed',
    ]);
    expect(CANONICAL_RELATIONSHIP_LIFECYCLE_CONTRACT.timers.introExpiryDays).toBe(14);
    expect(CANONICAL_RELATIONSHIP_LIFECYCLE_CONTRACT.policy.reveal.timeoutHours).toBe(72);
    expect(CANONICAL_RELATIONSHIP_LIFECYCLE_CONTRACT.policy.feedback.tokenTtlDays).toBe(7);
  });

  it('keeps reveal candidate-approved and duplicate intros blocked', () => {
    expect(CANONICAL_RELATIONSHIP_LIFECYCLE_CONTRACT.policy.reveal.requiresCandidateApproval).toBe(
      true
    );
    expect(CANONICAL_RELATIONSHIP_LIFECYCLE_CONTRACT.policy.reveal.autoRevealOnMutualIntro).toBe(
      false
    );
    expect(
      CANONICAL_RELATIONSHIP_LIFECYCLE_CONTRACT.policy.intro.singleActiveIntroPerCandidateAssignment
    ).toBe(true);
  });

  it('maps non-hire terminal outcomes to closed_lost and supersedes reopen loops', () => {
    expect(CANONICAL_RELATIONSHIP_LIFECYCLE_CONTRACT.aggregateOutcomeMapping.hire).toBe(
      'closed_won'
    );
    expect(CANONICAL_RELATIONSHIP_LIFECYCLE_CONTRACT.aggregateOutcomeMapping.reject).toBe(
      'closed_lost'
    );
    expect(CANONICAL_RELATIONSHIP_LIFECYCLE_CONTRACT.supersedesLegacyReopenLoops).toContain(
      'withdrawn -> pending_*'
    );
    expect(CANONICAL_RELATIONSHIP_LIFECYCLE_CONTRACT.supersedesLegacyReopenLoops).toContain(
      'no_show -> scheduled'
    );
  });
});

describe('deriveLegacyMatchLifecycleState', () => {
  it('treats active intro states as intro in progress', () => {
    expect(
      deriveLegacyMatchLifecycleState({
        reviewStage: 'shortlisted',
        introState: 'conversation_open',
      })
    ).toBe('intro_in_progress');
  });

  it('treats interview handoff as interview in progress', () => {
    expect(
      deriveLegacyMatchLifecycleState({
        reviewStage: 'passed',
        introState: 'interview_handoff',
      })
    ).toBe('interview_in_progress');
  });

  it('keeps policy-hidden and stale matches in explicit side states', () => {
    expect(
      deriveLegacyMatchLifecycleState({
        scoreState: 'hidden_due_to_policy',
        reviewStage: 'shortlisted',
      })
    ).toBe('hidden_due_to_policy');
    expect(
      deriveLegacyMatchLifecycleState({
        scoreState: 'stale',
        reviewStage: 'passed',
      })
    ).toBe('stale');
  });

  it('falls back to generated when no downstream lifecycle evidence exists', () => {
    expect(deriveLegacyMatchLifecycleState({ reviewStage: 'blind_review' })).toBe('generated');
  });
});
