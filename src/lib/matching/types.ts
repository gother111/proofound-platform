import type { OperationalFallbackMode } from '@/lib/contracts/launch-operations';

export const DISCOVERY_STATUS_VALUES = [
  'possible_discovery_match',
  'review_ready_match',
  'intro_ready_match',
] as const;

export type DiscoveryStatus = (typeof DISCOVERY_STATUS_VALUES)[number];

export const FIT_BAND_VALUES = [
  'strong_evidence_overlap',
  'relevant_partial',
  'adjacent_exploratory',
  'needs_more_proof',
  'constraint_or_trust_hold',
] as const;

export type FitBand = (typeof FIT_BAND_VALUES)[number];

export const INTRO_GATE_VALUES = [
  'intro_ready',
  'intro_hold_missing_trust_anchor',
  'intro_hold_missing_fresh_relevant_proof',
  'intro_hold_constraint_mismatch',
  'intro_hold_privacy_or_policy_review',
  'intro_hold_not_match_visible',
] as const;

export type IntroGate = (typeof INTRO_GATE_VALUES)[number];

export const MATCH_REASON_CODE_VALUES_BROAD = [
  'canonical_skill_overlap',
  'alias_skill_overlap',
  'adjacent_skill_overlap',
  'proof_text_overlap',
  'role_relevant_outcome',
  'proof_expectation_overlap',
  'custom_wording_overlap',
  'fresh_proof_present',
  'non_self_trust_anchor_present',
  'verification_gate_missing',
  'fresh_proof_missing',
  'constraint_match',
  'constraint_mismatch',
  'low_supply_expanded_discovery',
  'privacy_safe_for_stage',
  'privacy_or_policy_hold',
] as const;

export type BroadMatchReasonCode = (typeof MATCH_REASON_CODE_VALUES_BROAD)[number];

export type MatchReasonStrength = 'strong' | 'moderate' | 'weak' | 'blocking';

export type PublicSafeEvidenceRef = {
  type:
    | 'assignment'
    | 'assignment_field'
    | 'candidate_skill'
    | 'proof_pack'
    | 'proof_item'
    | 'verification'
    | 'constraint'
    | 'privacy';
  id?: string | null;
  field?: string | null;
  label?: string | null;
};

export type MatchReasonDetail = {
  code: BroadMatchReasonCode | string;
  explanation: string;
  strength: MatchReasonStrength;
  evidenceRefs: PublicSafeEvidenceRef[];
};

export type SkillRelationStrength = 'direct' | 'alias' | 'near' | 'moderate' | 'weak';

export type SkillSignal = {
  raw: string;
  normalized: string;
  source:
    | 'canonical_skill'
    | 'alias'
    | 'adjacent_skill'
    | 'proof_text'
    | 'assignment_text'
    | 'proof_expectation'
    | 'custom_wording';
  canonical?: string | null;
  relationStrength?: SkillRelationStrength;
  evidenceRef?: PublicSafeEvidenceRef;
};

export type AssignmentMatchSignals = {
  assignmentId?: string | null;
  canonicalSkills: SkillSignal[];
  textSignals: SkillSignal[];
  proofExpectationSignals: SkillSignal[];
  outcomeSignals: SkillSignal[];
  customSignals: SkillSignal[];
  hardConstraints: Record<string, unknown>;
};

export type CandidateProofSignal = {
  id?: string | null;
  title?: string | null;
  claim?: string | null;
  summary?: string | null;
  outcome?: string | null;
  ownership?: string | null;
  freshnessState?: string | null;
  verificationStatus?: string | null;
  hasActiveNonSelfTrustAnchor?: boolean | null;
  hasPrimaryAnchor?: boolean | null;
  linkedSkillIds?: string[];
  visibility?: string | null;
  revealGate?: string | null;
};

export type CandidateMatchSignals = {
  profileId: string;
  canonicalSkills: SkillSignal[];
  proofSignals: CandidateProofSignal[];
  proofTextSignals: SkillSignal[];
  customSignals: SkillSignal[];
  trustSignals: {
    activeNonSelfTrustAnchorCount: number;
    hasFreshRoleRelevantProof: boolean;
    hasUnsupportedSkillClaims?: boolean;
    orphanRelevantProofCount?: number;
  };
  readiness?: {
    discoverable?: boolean;
    matchVisible?: boolean;
    introEligible?: boolean;
  };
  constraints?: {
    hardConstraintsSatisfied?: boolean | null;
    constraintMismatchCodes?: string[];
  };
  privacy?: {
    privacySafeForStage?: boolean;
    policyHold?: boolean;
    moderationHold?: boolean;
    redactionHold?: boolean;
  };
};

export type DiscoverySignal =
  | 'canonical_skill_overlap'
  | 'alias_skill_overlap'
  | 'adjacent_skill_overlap'
  | 'proof_text_overlap'
  | 'role_relevant_outcome'
  | 'proof_expectation_overlap'
  | 'custom_wording_overlap'
  | 'low_supply_expanded_discovery';

export type DiscoveredCandidate = {
  profileId: string;
  discoverySignals: DiscoverySignal[];
  matchedPhrases: string[];
  evidenceRefs: PublicSafeEvidenceRef[];
  assignmentSignals: AssignmentMatchSignals;
  candidateSignals: CandidateMatchSignals;
  lowSupplyExpanded: boolean;
  internalOrder: number;
};

export type MatchEvidenceEvaluation = {
  profileId: string;
  discoverySignals: DiscoverySignal[];
  fitBand: FitBand;
  discoveryStatus: DiscoveryStatus;
  internalOrder: number;
  reasonDetails: MatchReasonDetail[];
  missingGates: string[];
  lowSupplyExpanded: boolean;
  hasStrongEvidenceOverlap: boolean;
  hasOnlyWeakDiscoverySignals: boolean;
  canRequestIntro: boolean;
};

export type IntroGateResult = {
  introGate: IntroGate;
  canRequestIntro: boolean;
  missingGates: string[];
  reasonDetails: MatchReasonDetail[];
};

export type LowSupplyPolicyInput = {
  introReadyCount: number;
  introReadyThreshold?: number;
  reviewReadyCount?: number;
  activeFallbackMode?: OperationalFallbackMode | string | null;
};

export type LowSupplyState =
  | null
  | 'browse_only_low_candidate_supply'
  | 'intro_hold_insufficient_qualified_intros';
