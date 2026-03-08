export type IndividualProfileCompletionStage = 'step0_name' | 'step1_purpose' | 'step2_profile';

export type PortfolioLockCode = 'name' | 'purpose' | 'skills' | 'artifact' | null;

export interface IndividualProfileCompletionInput {
  displayName: string | null | undefined;
  handle?: string | null | undefined;
  headline?: string | null | undefined;
  bio?: string | null | undefined;
  valuesCount: number;
  causesCount: number;
  skillsCount: number;
  proofCount: number;
  acceptedVerificationCount: number;
  publicProofCount?: number;
}

export interface IndividualProfileCompletionChecks {
  hasDisplayName: boolean;
  hasHandle: boolean;
  hasHeadlineOrBio: boolean;
  hasMinimumSkills: boolean;
  hasVerificationArtifact: boolean;
}

export interface IndividualProfileCompletionState {
  stage: IndividualProfileCompletionStage;
  checks: IndividualProfileCompletionChecks;
  counts: {
    values: number;
    causes: number;
    skills: number;
    proofArtifacts: number;
    acceptedVerifications: number;
  };
  isCoreProfileComplete: boolean;
  isPortfolioReady: boolean;
  portfolioLockCode: PortfolioLockCode;
  portfolioLockReason: string | null;
}

const NAME_PLACEHOLDER = 'your name';
const MIN_SKILLS_FOR_READY = 1;

function toSafeCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function isTwoWordName(name: string | null | undefined): boolean {
  if (!name) return false;

  const trimmed = name.trim();
  if (!trimmed) return false;
  if (trimmed.toLowerCase() === NAME_PLACEHOLDER) return false;

  const words = trimmed.split(/\s+/).filter(Boolean);
  return words.length >= 2;
}

export function evaluateIndividualProfileCompletion(
  input: IndividualProfileCompletionInput
): IndividualProfileCompletionState {
  const valuesCount = toSafeCount(input.valuesCount);
  const causesCount = toSafeCount(input.causesCount);
  const skillsCount = toSafeCount(input.skillsCount);
  const proofCount = toSafeCount(input.proofCount);
  const acceptedVerificationCount = toSafeCount(input.acceptedVerificationCount);
  const publicProofCount = toSafeCount(input.publicProofCount ?? proofCount);

  const checks: IndividualProfileCompletionChecks = {
    hasDisplayName: isTwoWordName(input.displayName),
    hasHandle:
      input.handle === undefined
        ? true
        : typeof input.handle === 'string' && input.handle.trim().length > 0,
    hasHeadlineOrBio:
      input.headline === undefined && input.bio === undefined
        ? true
        : (typeof input.headline === 'string' && input.headline.trim().length > 0) ||
          (typeof input.bio === 'string' && input.bio.trim().length > 0),
    hasMinimumSkills: skillsCount >= MIN_SKILLS_FOR_READY,
    hasVerificationArtifact: publicProofCount > 0 || acceptedVerificationCount > 0,
  };

  const isCoreProfileComplete =
    checks.hasDisplayName && checks.hasHandle && checks.hasHeadlineOrBio;

  let stage: IndividualProfileCompletionStage = 'step2_profile';
  if (!checks.hasDisplayName) {
    stage = 'step0_name';
  } else if (!checks.hasHandle || !checks.hasHeadlineOrBio) {
    stage = 'step1_purpose';
  }

  const isPortfolioReady =
    isCoreProfileComplete && checks.hasMinimumSkills && checks.hasVerificationArtifact;

  let portfolioLockCode: PortfolioLockCode = null;
  let portfolioLockReason: string | null = null;

  if (!isPortfolioReady) {
    if (!checks.hasDisplayName || !checks.hasHandle || !checks.hasHeadlineOrBio) {
      portfolioLockCode = 'name';
      portfolioLockReason =
        'Add your display name, public handle, and a short headline to publish your portfolio.';
    } else if (!checks.hasMinimumSkills) {
      portfolioLockCode = 'skills';
      portfolioLockReason = 'Add at least one skill to publish your public portfolio.';
    } else if (!checks.hasVerificationArtifact) {
      portfolioLockCode = 'artifact';
      portfolioLockReason =
        'Add one proof link or accepted verification that you want to show on your portfolio.';
    }
  }

  return {
    stage,
    checks,
    counts: {
      values: valuesCount,
      causes: causesCount,
      skills: skillsCount,
      proofArtifacts: proofCount,
      acceptedVerifications: acceptedVerificationCount,
    },
    isCoreProfileComplete,
    isPortfolioReady,
    portfolioLockCode,
    portfolioLockReason,
  };
}
