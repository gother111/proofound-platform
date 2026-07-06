export type IndividualProfileCompletionStage =
  | 'safe_shell'
  | 'real_context'
  | 'first_proof'
  | 'proof_pack'
  | 'verification'
  | 'publish_portfolio';

export type PortfolioLockCode =
  | 'safe_shell'
  | 'context'
  | 'proof'
  | 'verification'
  | 'publish'
  | null;

export interface IndividualProfileCompletionInput {
  displayName: string | null | undefined;
  handle?: string | null | undefined;
  headline?: string | null | undefined;
  bio?: string | null | undefined;
  location?: string | null | undefined;
  timezone?: string | null | undefined;
  desiredRolesCount?: number;
  workPreference?: string | null | undefined;
  engagementType?: string | null | undefined;
  contextCount?: number;
  skillsCount: number;
  proofCount: number;
  proofArtifactCount?: number;
  anchoredProofPackCount?: number;
  acceptedVerificationCount: number;
  publicProofCount?: number;
  publishedPortfolio?: boolean;
}

export interface IndividualProfileCompletionChecks {
  hasDisplayName: boolean;
  hasHandle: boolean;
  hasHeadlineOrBio: boolean;
  hasLocationOrTimezone: boolean;
  hasTargetRoleFocus: boolean;
  hasWorkPreference: boolean;
  hasEngagementPreference: boolean;
  hasLegacyShellCompatibility: boolean;
  hasSafeShell: boolean;
  hasRealContext: boolean;
  hasFirstProof: boolean;
  hasStructuredProofPack: boolean;
  hasProofForPublishing: boolean;
  hasPublishedPortfolio: boolean;
  hasRequiredVerification: boolean;
}

export interface IndividualProfileCompletionState {
  stage: IndividualProfileCompletionStage;
  checks: IndividualProfileCompletionChecks;
  counts: {
    contexts: number;
    skills: number;
    proofPacks: number;
    anchoredProofPacks: number;
    proofArtifacts: number;
    acceptedVerifications: number;
  };
  isCoreProfileComplete: boolean;
  isPortfolioReady: boolean;
  portfolioLockCode: PortfolioLockCode;
  portfolioLockReason: string | null;
}

const NAME_PLACEHOLDER = 'your name';

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
  const contextCount = toSafeCount(input.contextCount ?? 0);
  const skillsCount = toSafeCount(input.skillsCount);
  const proofPackCount = toSafeCount(input.proofCount);
  const anchoredProofPackCount = toSafeCount(input.anchoredProofPackCount ?? proofPackCount);
  const proofArtifactCount = toSafeCount(input.proofArtifactCount ?? proofPackCount);
  const acceptedVerificationCount = toSafeCount(input.acceptedVerificationCount);
  const desiredRolesCount = toSafeCount(input.desiredRolesCount ?? 0);

  const hasHeadlineOrBio =
    input.headline === undefined && input.bio === undefined
      ? true
      : (typeof input.headline === 'string' && input.headline.trim().length > 0) ||
        (typeof input.bio === 'string' && input.bio.trim().length > 0);
  const hasLocationOrTimezone =
    (typeof input.location === 'string' && input.location.trim().length > 0) ||
    (typeof input.timezone === 'string' && input.timezone.trim().length > 0);
  const hasTargetRoleFocus = desiredRolesCount > 0;
  const hasWorkPreference =
    typeof input.workPreference === 'string' && input.workPreference.trim().length > 0;
  const hasEngagementPreference =
    typeof input.engagementType === 'string' && input.engagementType.trim().length > 0;
  const hasHandle =
    input.handle === undefined
      ? true
      : typeof input.handle === 'string' && input.handle.trim().length > 0;
  const hasLegacyShellCompatibility =
    isTwoWordName(input.displayName) && hasHandle && hasHeadlineOrBio;
  const hasSafeShell = hasLegacyShellCompatibility;
  const hasRealContext = contextCount > 0;
  const hasFirstProof = proofArtifactCount > 0;
  const hasStructuredProofPack = anchoredProofPackCount > 0;
  const hasRequiredVerification = acceptedVerificationCount > 0;
  const hasProofForPublishing = hasStructuredProofPack;
  const hasPublishedPortfolio = input.publishedPortfolio === true;

  const checks: IndividualProfileCompletionChecks = {
    hasDisplayName: isTwoWordName(input.displayName),
    hasHandle,
    hasHeadlineOrBio,
    hasLocationOrTimezone,
    hasTargetRoleFocus,
    hasWorkPreference,
    hasEngagementPreference,
    hasLegacyShellCompatibility,
    hasSafeShell,
    hasRealContext,
    hasFirstProof,
    hasStructuredProofPack,
    hasProofForPublishing,
    hasPublishedPortfolio,
    hasRequiredVerification,
  };

  const isCoreProfileComplete = checks.hasSafeShell;

  let stage: IndividualProfileCompletionStage = 'publish_portfolio';
  if (!checks.hasSafeShell) {
    stage = 'safe_shell';
  } else if (!checks.hasRealContext) {
    stage = 'real_context';
  } else if (!checks.hasFirstProof) {
    stage = 'first_proof';
  } else if (!checks.hasStructuredProofPack) {
    stage = 'proof_pack';
  } else if (!checks.hasProofForPublishing) {
    stage = 'publish_portfolio';
  }

  const isPortfolioReady =
    isCoreProfileComplete &&
    checks.hasRealContext &&
    checks.hasStructuredProofPack &&
    checks.hasPublishedPortfolio;

  let portfolioLockCode: PortfolioLockCode = null;
  let portfolioLockReason: string | null = null;

  if (!isPortfolioReady) {
    if (!checks.hasSafeShell) {
      portfolioLockCode = 'safe_shell';
      portfolioLockReason =
        'Finish your safe shell with the basics people need before they open your proof.';
    } else if (!checks.hasRealContext) {
      portfolioLockCode = 'context';
      portfolioLockReason =
        'Add one real work, volunteering, or learning context before you publish your portfolio.';
    } else if (!checks.hasFirstProof || !checks.hasStructuredProofPack) {
      portfolioLockCode = 'proof';
      portfolioLockReason =
        'Add at least one anchored proof record before your portfolio can be ready.';
    } else if (!checks.hasPublishedPortfolio) {
      portfolioLockCode = 'publish';
      portfolioLockReason =
        'Publish your portfolio so the anchored proof is accessible from your public page.';
    }
  }

  return {
    stage,
    checks,
    counts: {
      contexts: contextCount,
      skills: skillsCount,
      proofPacks: proofPackCount,
      anchoredProofPacks: anchoredProofPackCount,
      proofArtifacts: proofArtifactCount,
      acceptedVerifications: acceptedVerificationCount,
    },
    isCoreProfileComplete,
    isPortfolioReady,
    portfolioLockCode,
    portfolioLockReason,
  };
}
