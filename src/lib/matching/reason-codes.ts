import type {
  BroadMatchReasonCode,
  MatchReasonDetail,
  MatchReasonStrength,
  PublicSafeEvidenceRef,
} from '@/lib/matching/types';

const REASON_COPY: Record<
  BroadMatchReasonCode,
  { explanation: string; strength: MatchReasonStrength }
> = {
  canonical_skill_overlap: {
    explanation: 'A requested skill overlaps directly with candidate skill evidence.',
    strength: 'strong',
  },
  alias_skill_overlap: {
    explanation: 'Different wording appears to describe the same capability.',
    strength: 'moderate',
  },
  adjacent_skill_overlap: {
    explanation: 'Nearby capability evidence may be relevant, but it needs reviewer judgment.',
    strength: 'weak',
  },
  proof_text_overlap: {
    explanation: 'Proof text contains wording that overlaps with the assignment need.',
    strength: 'moderate',
  },
  role_relevant_outcome: {
    explanation: 'A proof outcome lines up with the role outcome being requested.',
    strength: 'strong',
  },
  proof_expectation_overlap: {
    explanation: 'The candidate has proof that overlaps with the assignment proof expectation.',
    strength: 'moderate',
  },
  custom_wording_overlap: {
    explanation: 'Custom wording overlaps with the assignment outcome language.',
    strength: 'weak',
  },
  fresh_proof_present: {
    explanation: 'At least one relevant proof signal is fresh enough for serious review.',
    strength: 'strong',
  },
  non_self_trust_anchor_present: {
    explanation: 'A relevant non-self trust anchor is active.',
    strength: 'strong',
  },
  verification_gate_missing: {
    explanation: 'A required verification or trust gate is still missing.',
    strength: 'blocking',
  },
  fresh_proof_missing: {
    explanation: 'Fresh role-relevant proof is missing or too weak for an intro.',
    strength: 'blocking',
  },
  constraint_match: {
    explanation: 'Known practical constraints do not block review.',
    strength: 'moderate',
  },
  constraint_mismatch: {
    explanation: 'One or more hard assignment constraints are not satisfied.',
    strength: 'blocking',
  },
  low_supply_expanded_discovery: {
    explanation: 'Low qualified supply expanded discovery, but did not lower the intro threshold.',
    strength: 'weak',
  },
  privacy_safe_for_stage: {
    explanation: 'The review payload is safe for the current blind or contextual stage.',
    strength: 'moderate',
  },
  privacy_or_policy_hold: {
    explanation: 'Privacy, moderation, policy, or redaction review is holding advancement.',
    strength: 'blocking',
  },
};

export function describeReasonCode(
  code: BroadMatchReasonCode | string,
  evidenceRefs: PublicSafeEvidenceRef[] = []
): MatchReasonDetail {
  if (code in REASON_COPY) {
    const entry = REASON_COPY[code as BroadMatchReasonCode];
    return {
      code,
      explanation: entry.explanation,
      strength: entry.strength,
      evidenceRefs,
    };
  }

  return {
    code,
    explanation: `Recorded deterministic review reason: ${code}.`,
    strength: 'moderate',
    evidenceRefs,
  };
}

const REASON_ORDER = [
  'canonical_skill_overlap',
  'alias_skill_overlap',
  'role_relevant_outcome',
  'proof_text_overlap',
  'proof_expectation_overlap',
  'custom_wording_overlap',
  'adjacent_skill_overlap',
  'fresh_proof_present',
  'non_self_trust_anchor_present',
  'constraint_match',
  'constraint_mismatch',
  'verification_gate_missing',
  'fresh_proof_missing',
  'low_supply_expanded_discovery',
  'privacy_safe_for_stage',
  'privacy_or_policy_hold',
  'skills_strong',
  'skills_gap',
  'verification_ready',
  'verification_gap',
  'logistics_fit',
  'compensation_fit',
  'language_fit',
  'focus_role',
  'focus_industry',
  'focus_org_type',
] as const;

export function sortReasonCodeStrings(codes: string[]): string[] {
  const order = new Map(REASON_ORDER.map((code, index) => [code, index]));
  return [...new Set(codes)].sort((left, right) => {
    const leftOrder = order.get(left as (typeof REASON_ORDER)[number]) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = order.get(right as (typeof REASON_ORDER)[number]) ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.localeCompare(right);
  });
}

export function describeReasonCodes(
  codes: string[],
  evidenceRefsByCode: Partial<Record<string, PublicSafeEvidenceRef[]>> = {}
): MatchReasonDetail[] {
  return sortReasonCodeStrings(codes).map((code) =>
    describeReasonCode(code, evidenceRefsByCode[code] ?? [])
  );
}
