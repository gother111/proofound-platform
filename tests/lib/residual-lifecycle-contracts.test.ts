import { describe, expect, it } from 'vitest';

import { deriveLegacyMatchLifecycleState } from '@/lib/lifecycle/residual';
import {
  APPLICATION_VS_INTRO_CONTRACT,
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
