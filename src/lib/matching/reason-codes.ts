import type {
  BroadMatchReasonCode,
  MatchReasonDetail,
  MatchReasonStrength,
  PublicSafeEvidenceRef,
} from '@/lib/matching/types';
import { internalValueLabel } from '@/lib/copy/labels';

const REASON_COPY: Record<
  BroadMatchReasonCode,
  { explanation: string; label: string; strength: MatchReasonStrength }
> = {
  canonical_skill_overlap: {
    explanation: 'A requested skill overlaps directly with candidate skill evidence.',
    label: 'Direct skill overlap',
    strength: 'strong',
  },
  alias_skill_overlap: {
    explanation: 'Different wording appears to describe the same capability.',
    label: 'Similar skill wording',
    strength: 'moderate',
  },
  adjacent_skill_overlap: {
    explanation: 'Nearby capability evidence may be relevant, but it needs reviewer judgment.',
    label: 'Adjacent capability',
    strength: 'weak',
  },
  proof_text_overlap: {
    explanation: 'Proof text contains wording that overlaps with the assignment need.',
    label: 'Proof wording overlap',
    strength: 'moderate',
  },
  role_relevant_outcome: {
    explanation: 'A proof outcome lines up with the role outcome being requested.',
    label: 'Role outcome overlap',
    strength: 'strong',
  },
  proof_expectation_overlap: {
    explanation: 'The candidate has proof that overlaps with the assignment proof expectation.',
    label: 'Proof expectation overlap',
    strength: 'moderate',
  },
  custom_wording_overlap: {
    explanation: 'Custom wording overlaps with the assignment outcome language.',
    label: 'Custom wording overlap',
    strength: 'weak',
  },
  fresh_proof_present: {
    explanation: 'At least one relevant proof signal is fresh enough for serious review.',
    label: 'Fresh proof present',
    strength: 'strong',
  },
  non_self_trust_anchor_present: {
    explanation: 'A relevant non-self trust anchor is active.',
    label: 'Non-self trust anchor',
    strength: 'strong',
  },
  verification_gate_missing: {
    explanation: 'A required verification or trust gate is still missing.',
    label: 'Verification gate missing',
    strength: 'blocking',
  },
  fresh_proof_missing: {
    explanation: 'Fresh role-relevant proof is missing or too weak for an intro.',
    label: 'Fresh proof missing',
    strength: 'blocking',
  },
  constraint_match: {
    explanation: 'Known practical constraints do not block review.',
    label: 'Practical constraints aligned',
    strength: 'moderate',
  },
  constraint_mismatch: {
    explanation: 'One or more hard assignment constraints are not satisfied.',
    label: 'Constraint mismatch',
    strength: 'blocking',
  },
  low_supply_expanded_discovery: {
    explanation: 'Low qualified supply expanded discovery, but did not lower the intro threshold.',
    label: 'Broader discovery',
    strength: 'weak',
  },
  privacy_safe_for_stage: {
    explanation: 'The review payload is safe for the current blind or contextual stage.',
    label: 'Privacy-safe for this stage',
    strength: 'moderate',
  },
  privacy_or_policy_hold: {
    explanation: 'Privacy, moderation, policy, or redaction review is holding advancement.',
    label: 'Privacy or policy hold',
    strength: 'blocking',
  },
};

const LEGACY_REASON_LABELS: Record<string, string> = {
  fairness_ranking_suppressed: 'Fairness-safe review band',
  logistics_fit: 'Logistics fit',
  compensation_fit: 'Compensation fit',
  language_fit: 'Language fit',
  focus_role: 'Role focus',
  focus_industry: 'Industry focus',
  focus_org_type: 'Organization-type focus',
  proof_overlap: 'Proof overlap',
  proof_relevance_strong: 'Strong proof relevance',
  privacy_ready: 'Privacy ready',
  recent_proof: 'Recent proof',
  skills_fit_high: 'Strong skills fit',
  skills_gap: 'Skills gap',
  skills_strong: 'Strong skills evidence',
  shortlist_selected: 'Shortlist selected',
  verification_gap: 'Verification gap',
  verification_ready: 'Verification ready',
};

export function reasonCodeDisplayLabel(code: string | null | undefined) {
  const trimmed = code?.trim();
  if (!trimmed) return 'Review signal';

  if (trimmed in REASON_COPY) {
    return REASON_COPY[trimmed as BroadMatchReasonCode].label;
  }

  return LEGACY_REASON_LABELS[trimmed] ?? internalValueLabel(trimmed, 'Review signal');
}

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
