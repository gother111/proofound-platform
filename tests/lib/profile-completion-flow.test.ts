import { describe, expect, it } from 'vitest';

import { evaluateIndividualProfileCompletion, isTwoWordName } from '@/lib/profile/completion-flow';

describe('profile completion flow', () => {
  it('validates two-word names and rejects placeholder name', () => {
    expect(isTwoWordName('Jane Doe')).toBe(true);
    expect(isTwoWordName('Your Name')).toBe(false);
    expect(isTwoWordName('Jane')).toBe(false);
    expect(isTwoWordName('')).toBe(false);
  });

  it('uses the locked stage order from shell to publication', () => {
    const safeShellState = evaluateIndividualProfileCompletion({
      displayName: 'Jane Doe',
      handle: '',
      headline: '',
      bio: '',
      contextCount: 0,
      skillsCount: 0,
      proofCount: 0,
      proofArtifactCount: 0,
      anchoredProofPackCount: 0,
      acceptedVerificationCount: 0,
      publishedPortfolio: false,
    });

    const contextState = evaluateIndividualProfileCompletion({
      displayName: 'Jane Doe',
      handle: 'jane-doe',
      headline: 'Builder',
      bio: '',
      contextCount: 0,
      skillsCount: 0,
      proofCount: 0,
      proofArtifactCount: 0,
      anchoredProofPackCount: 0,
      acceptedVerificationCount: 0,
      publishedPortfolio: false,
    });

    const firstProofState = evaluateIndividualProfileCompletion({
      displayName: 'Jane Doe',
      handle: 'jane-doe',
      headline: 'Builder',
      bio: '',
      contextCount: 1,
      skillsCount: 0,
      proofCount: 0,
      proofArtifactCount: 0,
      anchoredProofPackCount: 0,
      acceptedVerificationCount: 0,
      publishedPortfolio: false,
    });

    const anchoredPackState = evaluateIndividualProfileCompletion({
      displayName: 'Jane Doe',
      handle: 'jane-doe',
      headline: 'Builder',
      bio: '',
      contextCount: 1,
      skillsCount: 0,
      proofCount: 0,
      proofArtifactCount: 1,
      anchoredProofPackCount: 0,
      acceptedVerificationCount: 0,
      publishedPortfolio: false,
    });

    const publishableState = evaluateIndividualProfileCompletion({
      displayName: 'Jane Doe',
      handle: 'jane-doe',
      headline: 'Builder',
      bio: '',
      contextCount: 1,
      skillsCount: 0,
      proofCount: 1,
      proofArtifactCount: 1,
      anchoredProofPackCount: 1,
      acceptedVerificationCount: 0,
      publishedPortfolio: false,
    });

    const verifiedPublishableState = evaluateIndividualProfileCompletion({
      displayName: 'Jane Doe',
      handle: 'jane-doe',
      headline: 'Builder',
      bio: '',
      contextCount: 1,
      skillsCount: 0,
      proofCount: 1,
      proofArtifactCount: 1,
      anchoredProofPackCount: 1,
      acceptedVerificationCount: 1,
      publishedPortfolio: false,
    });

    expect(safeShellState.stage).toBe('safe_shell');
    expect(contextState.stage).toBe('real_context');
    expect(firstProofState.stage).toBe('first_proof');
    expect(anchoredPackState.stage).toBe('proof_pack');
    expect(publishableState.stage).toBe('publish_portfolio');
    expect(verifiedPublishableState.stage).toBe('publish_portfolio');
  });

  it('requires safe shell, real context, anchored proof pack, and publication for portfolio readiness', () => {
    const readyState = evaluateIndividualProfileCompletion({
      displayName: 'Jane Doe',
      handle: 'jane-doe',
      headline: 'Builder',
      bio: '',
      contextCount: 1,
      skillsCount: 5,
      proofCount: 1,
      proofArtifactCount: 2,
      anchoredProofPackCount: 1,
      acceptedVerificationCount: 0,
      publishedPortfolio: true,
    });

    expect(readyState.isCoreProfileComplete).toBe(true);
    expect(readyState.checks.hasRequiredVerification).toBe(false);
    expect(readyState.isPortfolioReady).toBe(true);
    expect(readyState.portfolioLockCode).toBeNull();
  });

  it('does not let skills alone or accepted verification satisfy portfolio readiness', () => {
    const state = evaluateIndividualProfileCompletion({
      displayName: 'Jane Doe',
      handle: 'jane-doe',
      headline: 'Builder',
      bio: '',
      contextCount: 0,
      skillsCount: 4,
      proofCount: 0,
      proofArtifactCount: 0,
      anchoredProofPackCount: 0,
      acceptedVerificationCount: 1,
      publishedPortfolio: false,
    });

    expect(state.checks.hasRequiredVerification).toBe(true);
    expect(state.isPortfolioReady).toBe(false);
    expect(state.portfolioLockCode).toBe('context');
  });

  it('keeps verification visible without gating portfolio readiness', () => {
    const state = evaluateIndividualProfileCompletion({
      displayName: 'Jane Doe',
      handle: 'jane-doe',
      headline: 'Builder',
      bio: '',
      contextCount: 1,
      skillsCount: 5,
      proofCount: 1,
      proofArtifactCount: 2,
      anchoredProofPackCount: 1,
      acceptedVerificationCount: 0,
      publishedPortfolio: true,
    });

    expect(state.checks.hasRequiredVerification).toBe(false);
    expect(state.checks.hasProofForPublishing).toBe(true);
    expect(state.isPortfolioReady).toBe(true);
    expect(state.portfolioLockCode).toBeNull();
  });

  it('keeps legacy unanchored proof data readable but not portfolio-ready', () => {
    const legacyState = evaluateIndividualProfileCompletion({
      displayName: 'Jane Doe',
      handle: 'jane-doe',
      headline: 'Builder',
      bio: '',
      contextCount: 1,
      skillsCount: 3,
      proofCount: 1,
      proofArtifactCount: 1,
      anchoredProofPackCount: 0,
      acceptedVerificationCount: 1,
      publicProofCount: 1,
      publishedPortfolio: true,
    });

    expect(legacyState.checks.hasFirstProof).toBe(true);
    expect(legacyState.checks.hasStructuredProofPack).toBe(false);
    expect(legacyState.isPortfolioReady).toBe(false);
    expect(legacyState.portfolioLockCode).toBe('proof');
  });
});
