import type {
  ContextMeasuredOutcome,
  ContextOutcomeClaimStatus,
  ContextOutcomeVerificationStatus,
} from '@/types/profile';

export const MAX_CONTEXT_OUTCOME_SKILLS = 3;

const CLAIM_STATUS_LABELS: Record<ContextOutcomeClaimStatus, string> = {
  claimed: 'Claimed outcome',
  proof_linked: 'Proof-linked claim',
  verified: 'Verified outcome',
};

const VERIFICATION_STATUS_LABELS: Record<ContextOutcomeVerificationStatus, string> = {
  unverified: 'Not independently verified',
  proof_linked: 'Linked to proof',
  verified: 'Verified',
};

export function normalizeOutcomeSkillLinks(skills: unknown): string[] {
  const rawSkills = Array.isArray(skills)
    ? skills
    : typeof skills === 'string'
      ? skills.split(/[\n,]/)
      : [];
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const skill of rawSkills) {
    if (typeof skill !== 'string') continue;
    const trimmed = skill.trim();
    if (!trimmed) continue;

    const key = trimmed.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);

    if (normalized.length >= MAX_CONTEXT_OUTCOME_SKILLS) {
      break;
    }
  }

  return normalized;
}

export function resolveContextOutcomeClaimStatus(
  outcome: Pick<
    ContextMeasuredOutcome,
    'claimStatus' | 'verificationStatus' | 'proofPackId' | 'proofItemId'
  >
): ContextOutcomeClaimStatus {
  if (outcome.claimStatus === 'verified' || outcome.verificationStatus === 'verified') {
    return 'verified';
  }

  if (outcome.claimStatus === 'proof_linked' || outcome.proofPackId || outcome.proofItemId) {
    return 'proof_linked';
  }

  return 'claimed';
}

export function resolveContextOutcomeVerificationStatus(
  outcome: Pick<ContextMeasuredOutcome, 'verificationStatus' | 'proofPackId' | 'proofItemId'>
): ContextOutcomeVerificationStatus {
  if (outcome.verificationStatus === 'verified') {
    return 'verified';
  }

  if (outcome.verificationStatus === 'proof_linked' || outcome.proofPackId || outcome.proofItemId) {
    return 'proof_linked';
  }

  return 'unverified';
}

export function contextOutcomeClaimLabel(outcome: ContextMeasuredOutcome): string {
  return CLAIM_STATUS_LABELS[resolveContextOutcomeClaimStatus(outcome)];
}

export function contextOutcomeVerificationLabel(outcome: ContextMeasuredOutcome): string {
  return VERIFICATION_STATUS_LABELS[resolveContextOutcomeVerificationStatus(outcome)];
}

export function formatContextOutcomeValue(outcome: ContextMeasuredOutcome): string | null {
  const hasValue =
    outcome.value !== null &&
    outcome.value !== undefined &&
    String(outcome.value).trim().length > 0;

  if (!hasValue) {
    return null;
  }

  const unitSuffix = outcome.unit?.trim() ? ` ${outcome.unit.trim()}` : '';
  return `${String(outcome.value).trim()}${unitSuffix}`;
}

export function formatContextOutcomeSummary(outcome: ContextMeasuredOutcome): string {
  return [outcome.name, formatContextOutcomeValue(outcome), outcome.timeframe]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(' · ');
}
