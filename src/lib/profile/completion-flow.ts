export type IndividualProfileCompletionStage = 'step0_name' | 'step1_purpose' | 'step2_profile';

export type PortfolioLockCode = 'name' | 'purpose' | 'skills' | 'artifact' | null;

export interface IndividualProfileCompletionInput {
  displayName: string | null | undefined;
  valuesCount: number;
  causesCount: number;
  skillsCount: number;
  proofCount: number;
  acceptedVerificationCount: number;
}

export interface IndividualProfileCompletionChecks {
  hasTwoWordName: boolean;
  hasValues: boolean;
  hasCauses: boolean;
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
const MIN_SKILLS_FOR_READY = 3;

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

  const checks: IndividualProfileCompletionChecks = {
    hasTwoWordName: isTwoWordName(input.displayName),
    hasValues: valuesCount >= 1,
    hasCauses: causesCount >= 1,
    hasMinimumSkills: skillsCount >= MIN_SKILLS_FOR_READY,
    hasVerificationArtifact: proofCount > 0 || acceptedVerificationCount > 0,
  };

  const isCoreProfileComplete = checks.hasTwoWordName && checks.hasValues && checks.hasCauses;

  let stage: IndividualProfileCompletionStage = 'step2_profile';
  if (!checks.hasTwoWordName) {
    stage = 'step0_name';
  } else if (!checks.hasValues || !checks.hasCauses) {
    stage = 'step1_purpose';
  }

  const isPortfolioReady =
    isCoreProfileComplete && checks.hasMinimumSkills && checks.hasVerificationArtifact;

  let portfolioLockCode: PortfolioLockCode = null;
  let portfolioLockReason: string | null = null;

  if (!isPortfolioReady) {
    if (!checks.hasTwoWordName) {
      portfolioLockCode = 'name';
      portfolioLockReason = 'Add your first and last name on Profile to unlock Public Portfolio.';
    } else if (!checks.hasValues || !checks.hasCauses) {
      portfolioLockCode = 'purpose';
      portfolioLockReason = 'Add at least one value and one cause to unlock Public Portfolio.';
    } else if (!checks.hasMinimumSkills) {
      portfolioLockCode = 'skills';
      portfolioLockReason = 'Add at least 3 skills to unlock Public Portfolio.';
    } else if (!checks.hasVerificationArtifact) {
      portfolioLockCode = 'artifact';
      portfolioLockReason =
        'Add at least one proof or accepted verification to unlock Public Portfolio.';
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
