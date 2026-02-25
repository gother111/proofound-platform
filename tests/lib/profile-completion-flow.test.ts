import { describe, expect, it } from 'vitest';

import { evaluateIndividualProfileCompletion, isTwoWordName } from '@/lib/profile/completion-flow';

describe('profile completion flow', () => {
  it('validates two-word names and rejects placeholder name', () => {
    expect(isTwoWordName('Jane Doe')).toBe(true);
    expect(isTwoWordName('Your Name')).toBe(false);
    expect(isTwoWordName('Jane')).toBe(false);
    expect(isTwoWordName('')).toBe(false);
  });

  it('returns step 0 when two-word name is missing', () => {
    const state = evaluateIndividualProfileCompletion({
      displayName: 'Jane',
      valuesCount: 2,
      causesCount: 2,
      skillsCount: 3,
      proofCount: 1,
      acceptedVerificationCount: 0,
    });

    expect(state.stage).toBe('step0_name');
    expect(state.isPortfolioReady).toBe(false);
    expect(state.portfolioLockCode).toBe('name');
  });

  it('returns step 1 when values/causes are missing', () => {
    const state = evaluateIndividualProfileCompletion({
      displayName: 'Jane Doe',
      valuesCount: 0,
      causesCount: 1,
      skillsCount: 3,
      proofCount: 1,
      acceptedVerificationCount: 0,
    });

    expect(state.stage).toBe('step1_purpose');
    expect(state.isCoreProfileComplete).toBe(false);
    expect(state.portfolioLockCode).toBe('purpose');
  });

  it('requires artifact as proof OR accepted verification', () => {
    const stateWithAcceptedVerification = evaluateIndividualProfileCompletion({
      displayName: 'Jane Doe',
      valuesCount: 1,
      causesCount: 1,
      skillsCount: 3,
      proofCount: 0,
      acceptedVerificationCount: 1,
    });

    expect(stateWithAcceptedVerification.checks.hasVerificationArtifact).toBe(true);
    expect(stateWithAcceptedVerification.isPortfolioReady).toBe(true);
  });

  it('gates readiness when skills are below the minimum', () => {
    const state = evaluateIndividualProfileCompletion({
      displayName: 'Jane Doe',
      valuesCount: 1,
      causesCount: 1,
      skillsCount: 2,
      proofCount: 1,
      acceptedVerificationCount: 0,
    });

    expect(state.stage).toBe('step2_profile');
    expect(state.isPortfolioReady).toBe(false);
    expect(state.portfolioLockCode).toBe('skills');
  });
});
