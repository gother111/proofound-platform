import { randomUUID } from 'node:crypto';
import { Resend } from 'resend';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  fairnessEvaluations,
  fairnessRemediationEvents,
  matchReasonLedger,
  matchReviewStates,
  matches,
  demographicOptIns,
  organizationMembers,
  profiles,
  proofPacks,
  revealEvents,
  type Match,
} from '@/db/schema';
import { emitLifecycleEvent } from '@/lib/analytics/lifecycle-events';
import {
  authorize,
  getEffectiveReviewRevealScope,
  getEffectiveShortlistRevealScope,
  getVerificationSummaryVisibility,
  isActiveMembershipState,
  normalizeAuthorizedOrgRole,
  type OrgRole,
} from '@/lib/authz';
import { EMAIL_CONFIG } from '@/lib/email/config';
import {
  resolveEffectiveScoreState,
  type CanonicalMatchScoreArtifact,
  type MatchScoreState,
} from '@/lib/matching/match-score-contract';
import {
  hasPrimaryAnchorContext,
  listCanonicalProofPackAggregatesForOwner,
  type CanonicalProofPackAggregate,
  type CanonicalProofPackContract,
} from '@/lib/proofs/canonical-pack';
import {
  MATCH_REASON_CODE_VALUES,
  type MatchReasonCategory,
  type MatchReasonCode,
} from '@/lib/contracts/canonical-domain';
import { hashOpaqueToken } from '@/lib/contracts/canonical-domain';
import { type OperationalFallbackMode } from '@/lib/contracts/launch-operations';
import { log } from '@/lib/log';

export const CANONICAL_EXPLANATION_VERSION = 'reason-ledger/v1';
export const CANONICAL_MODEL_VERSION =
  process.env.MATCHING_MODEL_VERSION?.trim() || 'core-rules/v1';
export const CANONICAL_FAIRNESS_CHECK_VERSION = 'assignment-review-fairness/v1';

export const FAIRNESS_THRESHOLDS = {
  minCohortSize: 20,
  minAssignmentPool: 50,
  significancePValue: 0.05,
  softExposureGap: 0.15,
  hardExposureGap: 0.25,
  softMeanScoreGap: 0.12,
  hardMeanScoreGap: 0.2,
} as const;

export type ReviewStage = 'blind_review' | 'shortlisted' | 'passed' | 'rejected' | 'closed';
export type RevealScope = 'blind' | 'shortlist_identity' | 'full_identity';
export type FairnessStatus = 'pass' | 'unavailable' | 'elevated' | 'breach';
export type OrgReviewRole = OrgRole;
export type RevealActorType = 'user_account' | 'organization' | 'platform_admin' | 'system';
export type ProgressiveRevealStage =
  | 'stage0_anonymous'
  | 'stage1_capability_and_proof'
  | 'stage2_contextual_reveal'
  | 'stage3_intro_approved'
  | 'stage4_interview_coordination';
export type CanonicalCorridorState =
  | 'shortlist'
  | 'pass'
  | 'request_reveal'
  | 'request_intro'
  | 'intro_approved'
  | 'intro_hold'
  | 'interview_scheduled'
  | 'no_show'
  | 'withdrawn'
  | 'decision_pending'
  | 'feedback_pending'
  | 'feedback_delivered'
  | 'terminal_close';
export type CanonicalFallbackState =
  | 'low_supply'
  | 'weak_shortlist'
  | 'fairness_suppressed_ranking'
  | 'intro_hold'
  | null;

type RevealSurface = 'assignment_card' | 'review_detail' | 'shortlist' | 'intro' | 'interview';

type ReasonDictionaryEntry = {
  category: MatchReasonCategory;
  orgCopy: string;
  candidateCopy?: string;
  importance: number;
};

type ExplainableLedgerEntry = {
  category: MatchReasonCategory;
  reasonCode: MatchReasonCode | string;
  source: 'system' | 'reviewer' | 'policy';
  payloadJson: Record<string, unknown>;
  createdAt: Date | string | null;
  noteHash: string | null;
};

type CandidateProjectionInput = {
  profileId: string;
  displayName?: string | null;
  handle?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  headline?: string | null;
  tagline?: string | null;
  workMode?: string | null;
  country?: string | null;
  city?: string | null;
  exactLocation?: string | null;
  portfolioUrl?: string | null;
  employerNames?: string[] | null;
  schoolNames?: string[] | null;
  desiredRoles?: string[] | null;
  verified?: Record<string, unknown> | null;
  publicPortfolioPublished?: boolean | null;
};

type ReviewCardProofPackSnapshot = {
  ownerId: string;
  primarySubjectType: string | null;
  lifecycleState: string;
  title: string;
  summary: string | null;
  contextJson: Record<string, unknown>;
  ownershipStatement: string | null;
  evidenceSummary: string | null;
  outcomesSummary: string | null;
  verificationSummary: string;
  verificationStatus: string;
  freshnessState: string;
  proofQualityScore: number | null;
  contract: CanonicalProofPackContract;
  updatedAt: Date | null;
  publishedAt: Date | null;
};

export type ProofFirstReviewCard = {
  candidateLabel: string;
  strongestProof: {
    summary: string | null;
    outcome: string | null;
    ownership: string | null;
    anchorContext: string | null;
    freshnessLabel: string | null;
  };
  verification: {
    summaryLabel: string;
    count: number | null;
  };
  trustLabels: string[];
  fitBand: string | null;
  fitSummary: {
    headline: string;
    bullets: string[];
    reasonCodes: string[];
  };
  privacy: {
    reviewState: 'visible' | 'held_for_manual_review';
    reasons: string[];
  };
};

const REASON_DICTIONARY: Record<MatchReasonCode, ReasonDictionaryEntry> = {
  canonical_skill_overlap: {
    category: 'positive_match',
    orgCopy: 'A requested skill overlaps directly with candidate skill evidence.',
    candidateCopy: 'Your proof-backed skill evidence overlaps directly with this assignment.',
    importance: 88,
  },
  alias_skill_overlap: {
    category: 'positive_match',
    orgCopy: 'Different wording appears to describe the same capability.',
    candidateCopy: 'Different wording appears to describe the same capability.',
    importance: 78,
  },
  adjacent_skill_overlap: {
    category: 'positive_match',
    orgCopy: 'Nearby capability evidence may be relevant, but it needs reviewer judgment.',
    candidateCopy: 'Nearby capability evidence may be relevant, but it needs reviewer judgment.',
    importance: 55,
  },
  proof_text_overlap: {
    category: 'positive_match',
    orgCopy: 'Proof text overlaps with the assignment need.',
    candidateCopy: 'Your proof text overlaps with the assignment need.',
    importance: 70,
  },
  role_relevant_outcome: {
    category: 'positive_match',
    orgCopy: 'A proof outcome lines up with the role outcome being requested.',
    candidateCopy: 'A proof outcome lines up with the role outcome being requested.',
    importance: 84,
  },
  proof_expectation_overlap: {
    category: 'positive_match',
    orgCopy: 'Candidate proof overlaps with the assignment proof expectation.',
    candidateCopy: 'Your proof overlaps with the assignment proof expectation.',
    importance: 72,
  },
  custom_wording_overlap: {
    category: 'positive_match',
    orgCopy: 'Custom wording overlaps with the assignment outcome language.',
    candidateCopy: 'Your wording overlaps with the assignment outcome language.',
    importance: 50,
  },
  fresh_proof_present: {
    category: 'positive_match',
    orgCopy: 'Relevant proof is fresh enough for serious review.',
    candidateCopy: 'Relevant proof is fresh enough for serious review.',
    importance: 82,
  },
  non_self_trust_anchor_present: {
    category: 'positive_match',
    orgCopy: 'A relevant non-self trust anchor is active.',
    candidateCopy: 'A relevant non-self trust anchor is active.',
    importance: 86,
  },
  verification_gate_missing: {
    category: 'constraint_mismatch',
    orgCopy: 'A required verification or trust gate is still missing.',
    candidateCopy: 'A required verification or trust gate is still missing.',
    importance: 90,
  },
  fresh_proof_missing: {
    category: 'constraint_mismatch',
    orgCopy: 'Fresh role-relevant proof is missing or too weak for an intro.',
    candidateCopy: 'Fresh role-relevant proof is missing or too weak for an intro.',
    importance: 88,
  },
  constraint_match: {
    category: 'positive_match',
    orgCopy: 'Known practical constraints do not block review.',
    candidateCopy: 'Known practical constraints do not block review.',
    importance: 60,
  },
  constraint_mismatch: {
    category: 'constraint_mismatch',
    orgCopy: 'One or more hard assignment constraints are not satisfied.',
    candidateCopy: 'One or more hard assignment constraints are not satisfied.',
    importance: 92,
  },
  low_supply_expanded_discovery: {
    category: 'workflow_decision',
    orgCopy: 'Low qualified supply expanded discovery, but did not lower intro thresholds.',
    candidateCopy: 'Low qualified supply expanded discovery, but did not lower intro thresholds.',
    importance: 52,
  },
  privacy_safe_for_stage: {
    category: 'positive_match',
    orgCopy: 'The review payload is safe for the current blind or contextual stage.',
    candidateCopy: 'The review payload is safe for the current blind or contextual stage.',
    importance: 64,
  },
  privacy_or_policy_hold: {
    category: 'constraint_mismatch',
    orgCopy: 'Privacy, moderation, policy, or redaction review is holding advancement.',
    candidateCopy: 'Privacy, moderation, policy, or redaction review is holding advancement.',
    importance: 96,
  },
  skills_strong: {
    category: 'positive_match',
    orgCopy: 'Evidence points to a strong skills fit for this assignment.',
    candidateCopy: 'Your stored evidence shows a strong skills fit for this assignment.',
    importance: 95,
  },
  skills_gap: {
    category: 'constraint_mismatch',
    orgCopy: 'Some required skills or depth signals are still missing.',
    candidateCopy: 'Some required skills or depth signals are still missing.',
    importance: 85,
  },
  purpose_alignment_strong: {
    category: 'positive_match',
    orgCopy: 'Stored purpose and impact signals align strongly with this assignment.',
    candidateCopy: 'Your stored purpose and impact signals align strongly here.',
    importance: 90,
  },
  purpose_alignment_partial: {
    category: 'positive_match',
    orgCopy: 'Purpose alignment is present, but not among the strongest signals.',
    candidateCopy: 'Purpose alignment is present, but not among your strongest signals yet.',
    importance: 65,
  },
  verification_ready: {
    category: 'positive_match',
    orgCopy: 'Required proof and verification signals are in place.',
    candidateCopy: 'Required proof and verification signals are in place.',
    importance: 82,
  },
  verification_gap: {
    category: 'constraint_mismatch',
    orgCopy: 'Verification requirements are not fully met yet.',
    candidateCopy: 'Verification requirements are not fully met yet.',
    importance: 80,
  },
  logistics_fit: {
    category: 'positive_match',
    orgCopy: 'Availability and logistics align with the assignment constraints.',
    candidateCopy: 'Availability and logistics align with the assignment constraints.',
    importance: 78,
  },
  compensation_fit: {
    category: 'positive_match',
    orgCopy: 'Compensation expectations overlap with the assignment range.',
    candidateCopy: 'Compensation expectations overlap with the assignment range.',
    importance: 72,
  },
  language_fit: {
    category: 'positive_match',
    orgCopy: 'Language requirements are met from stored profile signals.',
    candidateCopy: 'Language requirements are met from your stored profile signals.',
    importance: 70,
  },
  focus_role: {
    category: 'positive_match',
    orgCopy: 'This role aligns with the proof-review participant’s stated focus.',
    candidateCopy: 'This role aligns with your stated focus.',
    importance: 60,
  },
  focus_industry: {
    category: 'positive_match',
    orgCopy: 'This industry aligns with the proof-review participant’s stated focus.',
    candidateCopy: 'This industry aligns with your stated focus.',
    importance: 58,
  },
  focus_org_type: {
    category: 'positive_match',
    orgCopy: 'This organization type aligns with the proof-review participant’s stated focus.',
    candidateCopy: 'This organization type aligns with your stated focus.',
    importance: 56,
  },
  shortlist_selected: {
    category: 'workflow_decision',
    orgCopy: 'The proof-review participant was shortlisted for deeper review.',
    candidateCopy: 'You have been shortlisted for deeper review.',
    importance: 60,
  },
  passed_for_now: {
    category: 'workflow_decision',
    orgCopy: 'The proof-review participant remains under review but is not shortlisted right now.',
    candidateCopy: 'You are still under review, but not shortlisted right now.',
    importance: 55,
  },
  rejected_constraints: {
    category: 'workflow_decision',
    orgCopy:
      'The proof-review participant was not advanced because core constraints did not line up.',
    candidateCopy: 'You were not advanced because core constraints did not line up.',
    importance: 70,
  },
  override_keep_under_review: {
    category: 'manual_override',
    orgCopy: 'A reviewer kept this proof-review participant under review with a manual override.',
    candidateCopy: 'A reviewer kept your profile under review with a manual override.',
    importance: 68,
  },
  override_shortlist_manual: {
    category: 'manual_override',
    orgCopy: 'A reviewer manually shortlisted this proof-review participant.',
    candidateCopy: 'A reviewer manually shortlisted your profile.',
    importance: 75,
  },
  override_reject_manual: {
    category: 'manual_override',
    orgCopy: 'A reviewer manually closed this proof-review participant out.',
    candidateCopy: 'A reviewer manually closed your profile out.',
    importance: 75,
  },
  fairness_warning_active: {
    category: 'fairness',
    orgCopy: 'Policy checks are elevated, so comparative detail is limited.',
    candidateCopy: 'Comparative detail is limited while policy checks are reviewed.',
    importance: 88,
  },
  fairness_ranking_suppressed: {
    category: 'fairness',
    orgCopy: 'Exact ordering detail is suppressed while policy review is active.',
    candidateCopy: 'Exact ordering detail is suppressed while policy review is active.',
    importance: 92,
  },
  reveal_shortlist_identity: {
    category: 'workflow_decision',
    orgCopy: 'Shortlist identity reveal was granted under the review policy.',
    candidateCopy: 'Your shortlist identity reveal was granted under the review policy.',
    importance: 50,
  },
  intro_accepted_masked: {
    category: 'workflow_decision',
    orgCopy:
      'The introduction is approved and masked messaging is open. Full identity remains locked until reveal consent is granted.',
    candidateCopy:
      'The introduction is approved and masked messaging is open. Full identity remains locked until reveal consent is granted.',
    importance: 64,
  },
  org_reveal_request_pending: {
    category: 'workflow_decision',
    orgCopy:
      'A reveal request is pending proof-review participant approval. Identity-bearing fields stay hidden until consent is granted.',
    candidateCopy:
      'The organization has requested reveal. Identity-bearing fields stay hidden until you approve.',
    importance: 66,
  },
  reveal_full_identity: {
    category: 'workflow_decision',
    orgCopy: 'Full identity reveal was granted under an explicit downstream trigger.',
    candidateCopy: 'Your full identity reveal was granted under an explicit downstream trigger.',
    importance: 50,
  },
};

const ALWAYS_BLIND_FIELDS = [
  'displayName',
  'handle',
  'avatarUrl',
  'email',
  'headline',
  'tagline',
  'city',
  'country',
  'exactLocation',
  'portfolioUrl',
  'employerNames',
  'schoolNames',
] as const;

const SHORTLIST_VISIBLE_FIELDS = [
  'headline',
  'tagline',
  'desiredRoles',
  'workMode',
  'verificationSummary',
] as const;

const FULL_VISIBLE_FIELDS = [
  ...SHORTLIST_VISIBLE_FIELDS,
  'displayName',
  'handle',
  'avatarUrl',
  'email',
  'portfolioUrl',
  'employerNames',
  'schoolNames',
  'locationSummary',
] as const;

const LEGACY_PURPOSE_REASON_CODES = new Set([
  'purpose_alignment_strong',
  'purpose_alignment_partial',
]);

export function sanitizeMatchReasonCodes(reasonCodes: string[]): string[] {
  return reasonCodes.filter((reasonCode) => !LEGACY_PURPOSE_REASON_CODES.has(reasonCode));
}

function getStableCandidateLabel(profileId: string) {
  const suffix = profileId.replace(/-/g, '').slice(-4).toUpperCase();
  return `Submission ${suffix || 'ANON'}`;
}

function getFreshnessLabel(state: string | null | undefined) {
  switch (state) {
    case 'fresh':
      return 'Fresh';
    case 'review_soon':
      return 'Review soon';
    case 'expired':
      return 'Expired';
    case 'stale':
      return 'Stale';
    default:
      return null;
  }
}

function buildTrustLabels(input: {
  fairnessStatus: FairnessStatus;
  verificationSummaryLabel: string;
  proofPack: ReviewCardProofPackSnapshot | null;
  verificationCount: number | null;
}) {
  const labels = [input.verificationSummaryLabel];

  if (input.proofPack?.verificationStatus === 'verified') {
    labels.push('Auditable verification history');
  } else if (input.proofPack?.verificationStatus === 'partially_verified') {
    labels.push('Verification partially complete');
  } else if ((input.verificationCount ?? 0) > 0) {
    labels.push('Account-side checks recorded');
  } else {
    labels.push('Verification still narrow');
  }

  if (input.fairnessStatus !== 'pass') {
    labels.push('Policy protected');
  }

  return Array.from(new Set(labels.filter(Boolean)));
}

function getAnchorContextLabel(
  subjectType: string | null | undefined,
  contextJson: Record<string, unknown>
) {
  const contextType =
    typeof contextJson.contextType === 'string' ? contextJson.contextType : subjectType;
  const focusArea = typeof contextJson.focusArea === 'string' ? contextJson.focusArea.trim() : '';

  let baseLabel: string;
  switch (contextType) {
    case 'experience':
      baseLabel = 'Anchored in prior work';
      break;
    case 'education':
      baseLabel = 'Anchored in prior learning';
      break;
    case 'volunteering':
      baseLabel = 'Anchored in prior volunteering';
      break;
    case 'project':
      baseLabel = 'Anchored in prior project work';
      break;
    case 'impact_story':
      baseLabel = 'Anchored in prior impact work';
      break;
    default:
      baseLabel = 'Anchored in prior proof';
      break;
  }

  return focusArea ? `${baseLabel} around ${focusArea}` : baseLabel;
}

type BlindReviewTextPrivacyState = {
  reviewState: 'visible' | 'held_for_manual_review';
  reasons: string[];
};

type BlindReviewTextResult = BlindReviewTextPrivacyState & {
  text: string | null;
};

const BLIND_REVIEW_REDACTED_TOKEN = '[redacted]';
const FILE_NAME_PATTERN = /\b[\w .+-]+\.(pdf|doc|docx|txt|md|png|jpe?g|webp|csv|xls|xlsx)\b/gi;
const EMAIL_PATTERN = /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi;
const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/gi;
const PHONE_PATTERN = /(?:\+?\d[\s().-]*){7,}\d/g;
const HANDLE_PATTERN = /(?<![\w.+-])@[a-z0-9_][a-z0-9_.-]{1,30}\b/gi;
const COMPANY_PATTERN =
  /\b(?:[A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,4}\s+)?(?:Inc|LLC|Ltd|Limited|Corp|Corporation|Company|Co|AB|Oy|GmbH|SARL|SAS|AS|BV)\b/g;
const SCHOOL_PATTERN =
  /\b(?:[A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,6}\s+)?(?:University|College|School|Institute|Academy|Gymnasium|Universitet|Högskola)\b/g;
const PRECISE_ADDRESS_PATTERN =
  /\b\d{1,6}[A-Z]?\s+[A-ZÅÄÖa-zåäö][\wÅÄÖåäö\s.'-]{2,}\s+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Boulevard|Blvd|Way|Place|Pl|Court|Ct|Väg|Vägen|Gatan|Gata|Gränd|Allé|Allee)\b/i;
const GEO_COORDINATE_PATTERN = /\b-?\d{1,2}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}\b/;
const FULL_NAME_PATTERN = /\b[A-ZÅÄÖ][a-zåäö]{1,}(?:\s+(?:[A-ZÅÄÖ][a-zåäö]{1,}|[A-Z]\.)){1,3}\b/g;
const GENERIC_CAPITALIZED_PHRASES = new Set([
  'Proof Pack',
  'Proof Packs',
  'Proofound',
  'Stage 0',
  'Stage 1',
  'Stage 2',
  'Stage 3',
  'Stage 4',
]);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addReason(reasons: Set<string>, reason: string) {
  reasons.add(reason);
}

function readContextString(contextJson: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = contextJson[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function readContextStringList(contextJson: Record<string, unknown>, keys: string[]) {
  const values = new Set<string>();

  for (const key of keys) {
    const value = contextJson[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      values.add(value.trim());
    } else if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === 'string' && entry.trim().length > 0) {
          values.add(entry.trim());
        }
      }
    }
  }

  return [...values];
}

function replacePattern(
  input: string,
  pattern: RegExp,
  replacement: string,
  reasons: Set<string>,
  reason: string
) {
  let matched = false;
  const output = input.replace(pattern, () => {
    matched = true;
    return replacement;
  });
  if (matched) {
    addReason(reasons, reason);
  }
  return output;
}

function redactExactTerms(input: string, terms: string[], label: string, reasons: Set<string>) {
  let output = input;

  for (const term of terms) {
    const normalized = term.trim();
    if (normalized.length < 2) {
      continue;
    }
    const pattern = new RegExp(`\\b${escapeRegExp(normalized)}\\b`, 'gi');
    output = replacePattern(output, pattern, label, reasons, `redacted_exact_${label}`);
  }

  return output;
}

function likelyFullNameMatches(input: string) {
  return [...input.matchAll(FULL_NAME_PATTERN)]
    .map((match) => match[0].trim())
    .filter((match) => !GENERIC_CAPITALIZED_PHRASES.has(match))
    .filter(
      (match) => !/(Proof|Review|Candidate|Stage|Organization|University|College)$/i.test(match)
    );
}

export function redactBlindReviewText(
  input: string | null | undefined,
  contextJson: Record<string, unknown>
): BlindReviewTextResult {
  if (!input) {
    return { text: null, reviewState: 'visible', reasons: [] };
  }

  const reasons = new Set<string>();
  const holdReasons = new Set<string>();
  const organizationNames = readContextStringList(contextJson, [
    'contextOrganizationName',
    'organizationName',
    'employerName',
    'employerNames',
    'companyName',
    'companyNames',
  ]);
  const schoolNames = readContextStringList(contextJson, [
    'contextSchoolName',
    'contextInstitutionName',
    'schoolName',
    'schoolNames',
    'institutionName',
    'institutionNames',
  ]);
  const locations = readContextStringList(contextJson, [
    'contextLocation',
    'location',
    'exactLocation',
    'city',
    'country',
  ]);
  const roleTitle = readContextString(contextJson, ['contextTitle']);

  let output = input
    .replace(FILE_NAME_PATTERN, () => {
      addReason(reasons, 'redacted_original_filename');
      return 'shared document';
    })
    .trim();

  output = replacePattern(
    output,
    URL_PATTERN,
    BLIND_REVIEW_REDACTED_TOKEN,
    reasons,
    'redacted_url'
  );
  output = replacePattern(
    output,
    EMAIL_PATTERN,
    BLIND_REVIEW_REDACTED_TOKEN,
    reasons,
    'redacted_email'
  );
  output = replacePattern(
    output,
    PHONE_PATTERN,
    BLIND_REVIEW_REDACTED_TOKEN,
    reasons,
    'redacted_phone'
  );
  output = replacePattern(
    output,
    HANDLE_PATTERN,
    BLIND_REVIEW_REDACTED_TOKEN,
    reasons,
    'redacted_handle'
  );
  output = replacePattern(
    output,
    COMPANY_PATTERN,
    'the organization',
    reasons,
    'redacted_company_name'
  );
  output = replacePattern(
    output,
    SCHOOL_PATTERN,
    'the institution',
    reasons,
    'redacted_school_name'
  );

  output = redactExactTerms(output, organizationNames, 'the organization', reasons);
  output = redactExactTerms(output, schoolNames, 'the institution', reasons);
  output = redactExactTerms(output, locations, 'the location', reasons);
  if (roleTitle) {
    output = redactExactTerms(output, [roleTitle], 'the role', reasons);
  }

  if (PRECISE_ADDRESS_PATTERN.test(output) || GEO_COORDINATE_PATTERN.test(output)) {
    addReason(holdReasons, 'manual_review_precise_location');
  }

  if (likelyFullNameMatches(output).length > 0) {
    addReason(holdReasons, 'manual_review_possible_full_name');
  }

  output = output.replace(/\s+/g, ' ').trim();
  if (!output || output === BLIND_REVIEW_REDACTED_TOKEN) {
    return {
      text: null,
      reviewState: holdReasons.size > 0 ? 'held_for_manual_review' : 'visible',
      reasons: [...reasons, ...holdReasons],
    };
  }

  return {
    text: holdReasons.size > 0 ? null : output,
    reviewState: holdReasons.size > 0 ? 'held_for_manual_review' : 'visible',
    reasons: [...reasons, ...holdReasons],
  };
}

function resolveReviewSafePackTitle(aggregate: CanonicalProofPackAggregate) {
  const reviewSafeUploadLabel = aggregate.items
    .filter(
      ({ effectiveVisibility, artifact, uploadedFile }) =>
        uploadedFile &&
        effectiveVisibility !== 'owner_only' &&
        !artifact.deletedAt &&
        !artifact.revokedAt &&
        artifact.lifecycleState !== 'deleted'
    )
    .map(({ uploadedFile }) => {
      const uploadMetadata =
        uploadedFile?.metadata &&
        typeof uploadedFile.metadata === 'object' &&
        !Array.isArray(uploadedFile.metadata)
          ? (uploadedFile.metadata as Record<string, unknown>)
          : null;
      const surfaceLabels =
        uploadMetadata?.surfaceLabels &&
        typeof uploadMetadata.surfaceLabels === 'object' &&
        !Array.isArray(uploadMetadata.surfaceLabels)
          ? (uploadMetadata.surfaceLabels as Record<string, unknown>)
          : undefined;

      return typeof surfaceLabels?.review === 'string' ? surfaceLabels.review.trim() : null;
    })
    .find((value): value is string => Boolean(value));

  const title = aggregate.ownerFull.contract.title || aggregate.pack.title;
  if (
    reviewSafeUploadLabel &&
    /\b[\w.-]+\.(pdf|doc|docx|txt|md|png|jpe?g|webp|csv|xls|xlsx)\b/i.test(title)
  ) {
    return reviewSafeUploadLabel;
  }

  return title;
}

function verificationStatusRank(status: string) {
  switch (status) {
    case 'verified':
      return 3;
    case 'partially_verified':
      return 2;
    case 'unverified':
      return 1;
    case 'disputed':
      return 0;
    default:
      return 1;
  }
}

function freshnessRank(state: string) {
  switch (state) {
    case 'fresh':
      return 3;
    case 'review_soon':
      return 2;
    case 'stale':
      return 1;
    case 'expired':
      return 0;
    default:
      return 1;
  }
}

function getBestReviewProofPackSnapshot(
  snapshots: ReviewCardProofPackSnapshot[]
): ReviewCardProofPackSnapshot | null {
  if (snapshots.length === 0) {
    return null;
  }

  return [...snapshots].sort((left, right) => {
    const lifecycleScore =
      Number(right.lifecycleState === 'published') - Number(left.lifecycleState === 'published');
    if (lifecycleScore !== 0) {
      return lifecycleScore;
    }

    const verificationScore =
      verificationStatusRank(right.verificationStatus) -
      verificationStatusRank(left.verificationStatus);
    if (verificationScore !== 0) {
      return verificationScore;
    }

    const qualityScore = (right.proofQualityScore ?? 0) - (left.proofQualityScore ?? 0);
    if (qualityScore !== 0) {
      return qualityScore;
    }

    const freshnessScore = freshnessRank(right.freshnessState) - freshnessRank(left.freshnessState);
    if (freshnessScore !== 0) {
      return freshnessScore;
    }

    const evidenceScore =
      Number(Boolean(right.evidenceSummary || right.outcomesSummary)) -
      Number(Boolean(left.evidenceSummary || left.outcomesSummary));
    if (evidenceScore !== 0) {
      return evidenceScore;
    }

    const rightDate = right.updatedAt ?? right.publishedAt ?? null;
    const leftDate = left.updatedAt ?? left.publishedAt ?? null;
    return (rightDate?.getTime() ?? 0) - (leftDate?.getTime() ?? 0);
  })[0];
}

type ReviewCardProofPackAggregate = Awaited<
  ReturnType<typeof listCanonicalProofPackAggregatesForOwner>
>[number];

function isProofPackVisibleToMatchedOrg(aggregate: ReviewCardProofPackAggregate) {
  return (
    aggregate.pack.packKind === 'verification_bundle' &&
    aggregate.pack.lifecycleState === 'published' &&
    (aggregate.pack.visibility === 'public' || aggregate.pack.visibility === 'matched_org') &&
    (aggregate.pack.revealGate === 'none' || aggregate.pack.revealGate === 'match_exists') &&
    hasPrimaryAnchorContext(aggregate.pack)
  );
}

function isProofPackVisibleToOwnerReviewCard(aggregate: ReviewCardProofPackAggregate) {
  return (
    aggregate.pack.packKind === 'verification_bundle' && hasPrimaryAnchorContext(aggregate.pack)
  );
}

async function getReviewCardProofPackMapWithFilter(
  profileIds: string[],
  isVisible: (aggregate: ReviewCardProofPackAggregate) => boolean
) {
  const uniqueProfileIds = [...new Set(profileIds.filter(Boolean))];
  if (uniqueProfileIds.length === 0) {
    return new Map<string, ReviewCardProofPackSnapshot | null>();
  }

  const snapshotMap = new Map<string, ReviewCardProofPackSnapshot | null>();
  const aggregatesByProfile = await Promise.all(
    uniqueProfileIds.map(async (profileId) => ({
      profileId,
      aggregates: await listCanonicalProofPackAggregatesForOwner('individual_profile', profileId),
    }))
  );

  for (const { profileId, aggregates } of aggregatesByProfile) {
    const snapshots = aggregates.filter(isVisible).map((aggregate) => ({
      ownerId: aggregate.pack.ownerId,
      primarySubjectType: aggregate.pack.primarySubjectType,
      lifecycleState: aggregate.ownerFull.contract.status,
      title: resolveReviewSafePackTitle(aggregate),
      summary: aggregate.ownerFull.contract.primaryClaim.statement,
      contextJson:
        aggregate.pack.contextJson &&
        typeof aggregate.pack.contextJson === 'object' &&
        !Array.isArray(aggregate.pack.contextJson)
          ? (aggregate.pack.contextJson as Record<string, unknown>)
          : {},
      ownershipStatement: aggregate.ownerFull.contract.ownershipStatement,
      evidenceSummary: aggregate.pack.evidenceSummary,
      outcomesSummary: aggregate.ownerFull.contract.outcomeSummary,
      verificationSummary: aggregate.ownerFull.contract.verificationSummary.summary,
      verificationStatus: aggregate.verificationStatus,
      freshnessState: aggregate.freshnessState,
      proofQualityScore: aggregate.ownerFull.contract.proofQualityScore,
      contract: aggregate.ownerFull.contract,
      updatedAt: aggregate.pack.updatedAt,
      publishedAt: aggregate.pack.publishedAt,
    }));

    snapshotMap.set(profileId, getBestReviewProofPackSnapshot(snapshots));
  }

  return snapshotMap;
}

export async function getReviewCardProofPackMapForMatchedOrg(profileIds: string[]) {
  return getReviewCardProofPackMapWithFilter(profileIds, isProofPackVisibleToMatchedOrg);
}

export async function getReviewCardProofPackMapForOwner(profileIds: string[]) {
  return getReviewCardProofPackMapWithFilter(profileIds, isProofPackVisibleToOwnerReviewCard);
}

export async function getReviewCardProofPackMap(profileIds: string[]) {
  return getReviewCardProofPackMapForOwner(profileIds);
}

function mapRevealActorTypeToLifecycleActorType(
  actorType: RevealActorType,
  actorRole?: string | null
): 'candidate' | 'organization_member' | 'platform_admin' | 'system' {
  if (actorType === 'platform_admin') {
    return 'platform_admin';
  }
  if (actorType === 'system') {
    return 'system';
  }
  if (actorType === 'organization' || actorRole) {
    return 'organization_member';
  }
  return 'candidate';
}

function resolveRevealEventName(outcome: 'granted' | 'denied' | 'no_op') {
  if (outcome === 'granted') return 'reveal_granted' as const;
  if (outcome === 'denied') return 'reveal_denied' as const;
  return 'reveal_requested' as const;
}

export function evaluateFairnessCohortAvailability(input: {
  poolCount: number;
  availableColumns: string[];
  optedInCount: number;
  minAssignmentPool?: number;
  minCohortSize?: number;
}) {
  const minAssignmentPool = input.minAssignmentPool ?? FAIRNESS_THRESHOLDS.minAssignmentPool;
  const minCohortSize = input.minCohortSize ?? FAIRNESS_THRESHOLDS.minCohortSize;

  if (input.poolCount < minAssignmentPool) {
    return {
      status: 'unavailable' as const,
      insufficientReason: 'assignment_pool_below_threshold',
    };
  }

  if (input.availableColumns.length === 0) {
    return {
      status: 'unavailable' as const,
      insufficientReason: 'demographic_columns_unavailable',
    };
  }

  if (input.optedInCount < minCohortSize) {
    return {
      status: 'unavailable' as const,
      insufficientReason: 'demographic_opt_in_cohort_below_threshold',
    };
  }

  return {
    status: 'pass' as const,
    insufficientReason: null,
  };
}

export function getVisibleIdentityFields(scope: RevealScope): string[] {
  if (scope === 'blind') {
    return [];
  }
  if (scope === 'shortlist_identity') {
    return [...SHORTLIST_VISIBLE_FIELDS];
  }
  return [...FULL_VISIBLE_FIELDS];
}

export function resolveProgressiveRevealStage(input: {
  scope: RevealScope;
  surface: RevealSurface;
}): ProgressiveRevealStage {
  if (input.scope === 'blind') {
    return input.surface === 'review_detail' ? 'stage1_capability_and_proof' : 'stage0_anonymous';
  }

  if (input.scope === 'shortlist_identity') {
    return 'stage2_contextual_reveal';
  }

  return input.surface === 'interview' ? 'stage4_interview_coordination' : 'stage3_intro_approved';
}

export function mapOperationalFallbackModeToCanonical(
  mode: OperationalFallbackMode | string | null | undefined
): CanonicalFallbackState {
  switch (mode) {
    case 'browse_only_low_candidate_supply':
    case 'browse_only_low_assignment_supply':
      return 'low_supply';
    case 'proof_building_weak_coverage':
    case 'trust_pending_verification':
      return 'weak_shortlist';
    case 'fairness_suppressed_ranking':
      return 'fairness_suppressed_ranking';
    case 'intro_hold_insufficient_qualified_intros':
      return 'intro_hold';
    default:
      return null;
  }
}

export function resolveCanonicalFallbackState(input: {
  operationalFallbackMode?: OperationalFallbackMode | string | null;
  fairnessStatus?: FairnessStatus | null;
}): CanonicalFallbackState {
  const mappedFallback = mapOperationalFallbackModeToCanonical(input.operationalFallbackMode);
  if (mappedFallback) {
    return mappedFallback;
  }

  if (input.fairnessStatus && input.fairnessStatus !== 'pass') {
    return 'fairness_suppressed_ranking' as const;
  }

  return null;
}

export function buildVisibilitySafeWhy(input: {
  reasonCodes: string[];
  fairnessStatus: FairnessStatus;
  fallbackState: CanonicalFallbackState;
  rankBand?: string | null;
}) {
  const reasonCodes = sanitizeMatchReasonCodes(input.reasonCodes);
  const rendered = renderExplanationFromReasonCodes({
    reasonCodes,
    fairnessStatus: input.fairnessStatus,
    audience: 'org',
  });

  const fallbackReasonCode =
    input.fallbackState === 'fairness_suppressed_ranking'
      ? 'fairness_ranking_suppressed'
      : input.fallbackState === 'low_supply'
        ? 'low_supply'
        : input.fallbackState === 'weak_shortlist'
          ? 'weak_shortlist'
          : input.fallbackState === 'intro_hold'
            ? 'intro_hold'
            : null;

  const summary = [...rendered.summary];

  if (input.rankBand) {
    summary.push(`Review band: ${input.rankBand}`);
  }

  if (input.fallbackState === 'low_supply') {
    summary.push('Low supply fallback keeps introductions conservative.');
  } else if (input.fallbackState === 'weak_shortlist') {
    summary.push('Weak shortlist fallback keeps review contextual and identity-safe.');
  } else if (input.fallbackState === 'intro_hold') {
    summary.push('Intro hold is active until qualified introduction capacity recovers.');
  }

  return {
    explanationVersion: CANONICAL_EXPLANATION_VERSION,
    reasonCodes: fallbackReasonCode
      ? Array.from(new Set([...reasonCodes, fallbackReasonCode]))
      : reasonCodes,
    fairnessStatus: input.fairnessStatus,
    fallbackState: input.fallbackState,
    rankBand: input.rankBand ?? null,
    summary,
  };
}

export function resolveCanonicalCorridor(input: {
  reviewStage: ReviewStage;
  revealScope: RevealScope;
  surface: RevealSurface;
  fairnessStatus?: FairnessStatus | null;
  operationalFallbackMode?: OperationalFallbackMode | string | null;
  revealRequestPending?: boolean;
  introRequested?: boolean;
  introApproved?: boolean;
  interviewScheduled?: boolean;
  noShow?: boolean;
  withdrawn?: boolean;
  decisionPending?: boolean;
  feedbackDelivered?: boolean;
  feedbackPending?: boolean;
}) {
  const fallbackState = resolveCanonicalFallbackState({
    operationalFallbackMode: input.operationalFallbackMode,
    fairnessStatus: input.fairnessStatus ?? null,
  });

  let corridorState: CanonicalCorridorState;

  if (input.noShow) {
    corridorState = 'no_show';
  } else if (input.withdrawn) {
    corridorState = 'withdrawn';
  } else if (input.feedbackDelivered) {
    corridorState = 'feedback_delivered';
  } else if (input.feedbackPending) {
    corridorState = 'feedback_pending';
  } else if (input.decisionPending) {
    corridorState = 'decision_pending';
  } else if (input.interviewScheduled) {
    corridorState = 'interview_scheduled';
  } else if (fallbackState === 'intro_hold') {
    corridorState = 'intro_hold';
  } else if (input.introApproved || input.revealScope === 'full_identity') {
    corridorState = 'intro_approved';
  } else if (input.introRequested) {
    corridorState = 'request_intro';
  } else if (input.revealRequestPending) {
    corridorState = 'request_reveal';
  } else if (input.reviewStage === 'passed') {
    corridorState = 'pass';
  } else if (input.reviewStage === 'rejected' || input.reviewStage === 'closed') {
    corridorState = 'terminal_close';
  } else {
    corridorState = 'shortlist';
  }

  return {
    progressiveRevealStage: resolveProgressiveRevealStage({
      scope: input.revealScope,
      surface: input.surface,
    }),
    corridorState,
    fallbackState,
  };
}

export function getReasonCategory(reasonCode: MatchReasonCode | string): MatchReasonCategory {
  if (reasonCode in REASON_DICTIONARY) {
    return REASON_DICTIONARY[reasonCode as MatchReasonCode].category;
  }
  return 'workflow_decision';
}

export function getReasonDictionaryEntry(reasonCode: MatchReasonCode | string) {
  if (reasonCode in REASON_DICTIONARY) {
    return REASON_DICTIONARY[reasonCode as MatchReasonCode];
  }
  return {
    category: 'workflow_decision' as MatchReasonCategory,
    orgCopy: `Recorded review reason: ${reasonCode}.`,
    candidateCopy: `Recorded review reason: ${reasonCode}.`,
    importance: 40,
  };
}

export function buildCanonicalMatchPersistenceFields(args: {
  artifact: CanonicalMatchScoreArtifact | null;
  fairnessStatus?: FairnessStatus;
  fairnessCheckVersion?: string | null;
  fairnessEvaluatedAt?: Date | null;
}) {
  const artifact = args.artifact;
  return {
    score: artifact ? artifact.scoreNormalized.toString() : '0',
    scoreTotal: artifact?.scoreTotal ?? null,
    scoreState: artifact?.scoreState ?? null,
    scoreVersion: artifact?.scoreVersion ?? null,
    modelVersion: artifact?.modelVersion ?? CANONICAL_MODEL_VERSION,
    explanationVersion: CANONICAL_EXPLANATION_VERSION,
    fairnessCheckVersion: args.fairnessCheckVersion ?? CANONICAL_FAIRNESS_CHECK_VERSION,
    fairnessStatus: args.fairnessStatus ?? 'unavailable',
    fairnessEvaluatedAt: args.fairnessEvaluatedAt ?? null,
    inputsHash: artifact?.inputsHash ?? null,
    reasonCodes: artifact?.reasonCodes ?? [],
    staleReasonCodes: [],
    generatedAt: artifact?.generatedAt ?? null,
    staleAt: artifact?.staleAt ?? null,
    recomputedAt: artifact?.recomputedAt ?? null,
    hiddenDueToPolicyAt: artifact?.hiddenDueToPolicyAt ?? null,
    hiddenDueToPolicyReasonCodes: artifact?.hiddenDueToPolicyReasonCodes ?? [],
    subscoresJson: artifact?.subscoresJson ?? {},
    scoreSnapshotJson: artifact?.scoreSnapshotJson ?? {},
  };
}

export function shouldSuppressExactRank(
  fairnessStatus: FairnessStatus,
  scoreState?: MatchScoreState | null,
  generatedAt?: Date | string | null,
  staleAt?: Date | string | null
) {
  return (
    fairnessStatus !== 'pass' ||
    resolveEffectiveScoreState({ scoreState, generatedAt, staleAt }) === 'stale'
  );
}

export async function ensureMatchReviewState(input: {
  matchId: string;
  assignmentId: string;
  profileId: string;
  orgId: string;
}) {
  await db
    .insert(matchReviewStates)
    .values({
      matchId: input.matchId,
      assignmentId: input.assignmentId,
      profileId: input.profileId,
      orgId: input.orgId,
      reviewStage: 'blind_review',
      revealScope: 'blind',
    })
    .onConflictDoUpdate({
      target: matchReviewStates.matchId,
      set: {
        assignmentId: input.assignmentId,
        profileId: input.profileId,
        orgId: input.orgId,
        updatedAt: new Date(),
      },
    });
}

export async function appendSystemReasonLedger(input: {
  matchId: string;
  assignmentId: string;
  profileId: string;
  reasonCodes: MatchReasonCode[];
  createdAt?: Date | null;
}) {
  if (input.reasonCodes.length === 0) {
    return;
  }

  const existing = await db
    .select({
      reasonCode: matchReasonLedger.reasonCode,
    })
    .from(matchReasonLedger)
    .where(
      and(eq(matchReasonLedger.matchId, input.matchId), eq(matchReasonLedger.source, 'system'))
    );

  const existingCodes = new Set(existing.map((row) => row.reasonCode));
  const missingCodes = input.reasonCodes.filter((reasonCode) => !existingCodes.has(reasonCode));

  if (missingCodes.length === 0) {
    return;
  }

  await db.insert(matchReasonLedger).values(
    missingCodes.map((reasonCode) => ({
      matchId: input.matchId,
      assignmentId: input.assignmentId,
      profileId: input.profileId,
      category: getReasonCategory(reasonCode),
      reasonCode,
      source: 'system' as const,
      payloadJson: {},
      importance: getReasonDictionaryEntry(reasonCode).importance,
      createdAt: input.createdAt ?? new Date(),
    }))
  );
}

export async function appendManualOverrideReason(input: {
  matchId: string;
  assignmentId: string;
  profileId: string;
  orgId: string;
  actorId: string;
  reasonCode: 'override_keep_under_review' | 'override_shortlist_manual' | 'override_reject_manual';
  annotation?: string | null;
  reviewStage: ReviewStage;
  revealScope: RevealScope;
  payload?: Record<string, unknown>;
}) {
  await db.insert(matchReasonLedger).values({
    matchId: input.matchId,
    assignmentId: input.assignmentId,
    profileId: input.profileId,
    category: getReasonCategory(input.reasonCode),
    reasonCode: input.reasonCode,
    source: 'reviewer',
    payloadJson: {
      ...(input.payload || {}),
      annotation: input.annotation?.trim() || null,
    },
    importance: getReasonDictionaryEntry(input.reasonCode).importance,
    createdBy: input.actorId,
    noteHash: input.annotation?.trim() ? hashOpaqueToken(input.annotation.trim()) : null,
  });

  await emitLifecycleEvent(
    'review_override_applied',
    {
      match_id: input.matchId,
      assignment_id: input.assignmentId,
      org_id: input.orgId,
      override_reason_code: input.reasonCode,
      previous_stage: input.reviewStage,
      new_stage: input.reviewStage,
      requested_scope: input.revealScope,
      actor_type: 'organization_member',
      source: 'matching.review-contract',
    },
    {
      userId: input.profileId,
      organizationId: input.orgId,
      entityType: 'match',
      entityId: input.matchId,
    }
  );
}

export async function recordRevealEvent(input: {
  matchId: string;
  assignmentId: string;
  profileId: string;
  orgId: string;
  actorId?: string | null;
  actorRole?: string | null;
  actorType: RevealActorType;
  triggerType: 'user' | 'system' | 'policy' | 'automatic';
  requestedScope: RevealScope;
  grantedScope: RevealScope;
  reasonCode: string;
  sourceSurface?: string | null;
  context?: Record<string, unknown>;
  outcome: 'granted' | 'denied' | 'no_op';
}) {
  const revealEventId = randomUUID();

  await db.insert(revealEvents).values({
    id: revealEventId,
    matchId: input.matchId,
    assignmentId: input.assignmentId,
    profileId: input.profileId,
    orgId: input.orgId,
    actorId: input.actorId ?? null,
    actorRole: input.actorRole ?? null,
    actorType: input.actorType,
    triggerType: input.triggerType,
    requestedScope: input.requestedScope,
    grantedScope: input.grantedScope,
    reasonCode: input.reasonCode,
    sourceSurface: input.sourceSurface ?? null,
    contextJson: input.context ?? {},
    outcome: input.outcome,
  });

  const lifecycleActorType = mapRevealActorTypeToLifecycleActorType(
    input.actorType,
    input.actorRole
  );
  const basePayload = {
    reveal_event_id: revealEventId,
    match_id: input.matchId,
    assignment_id: input.assignmentId,
    profile_id: input.profileId,
    org_id: input.orgId,
    requested_scope: input.requestedScope,
    granted_scope: input.grantedScope,
    trigger_type: input.triggerType,
    reason_code: input.reasonCode,
    source_surface: input.sourceSurface ?? null,
    outcome: input.outcome,
    actor_type: lifecycleActorType,
    source: 'matching.review-contract',
  } as const;

  await emitLifecycleEvent('reveal_requested', basePayload, {
    userId: input.profileId,
    organizationId: input.orgId,
    entityType: 'match',
    entityId: input.matchId,
  });

  if (input.outcome !== 'no_op') {
    await emitLifecycleEvent(resolveRevealEventName(input.outcome), basePayload, {
      userId: input.profileId,
      organizationId: input.orgId,
      entityType: 'match',
      entityId: input.matchId,
    });
  }
}

export async function getOrgMembershipRole(
  userId: string,
  orgId: string
): Promise<OrgReviewRole | null> {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.state, 'active')
    ),
    columns: {
      role: true,
      state: true,
    },
  });

  if (!membership || !isActiveMembershipState(membership.state)) {
    return null;
  }

  return normalizeAuthorizedOrgRole(membership.role) as OrgReviewRole | null;
}

export function canMutateReview(role: OrgReviewRole | null): boolean {
  return authorize({
    resource: 'candidate_full_review',
    action: 'update',
    orgRole: role,
  }).allowed;
}

export function getRankBand(rank: number, totalCandidates: number): string {
  if (rank > 0 && totalCandidates > 0) return 'Review-ready proof';
  return 'Proof review needed';
}

export function buildCandidateReviewProjection(
  source: CandidateProjectionInput,
  scope: RevealScope,
  options?: {
    verificationSummaryVisibility?: 'none' | 'redacted' | 'detailed';
  }
) {
  const verificationSummaryVisibility = options?.verificationSummaryVisibility ?? 'redacted';
  const verificationSummary =
    verificationSummaryVisibility === 'none'
      ? null
      : source.verified
        ? Object.keys(source.verified).filter((key) => Boolean(source.verified?.[key])).length
        : 0;
  const base = {
    id: source.profileId,
    workMode: source.workMode ?? null,
    desiredRoles: source.desiredRoles ?? [],
    verificationSummary,
    email: null,
    portfolioUrl: null,
    employerNames: null,
    schoolNames: null,
    exactLocation: null,
    locationSummary:
      scope === 'full_identity'
        ? source.exactLocation || [source.city, source.country].filter(Boolean).join(', ') || null
        : source.workMode
          ? 'Location hidden'
          : null,
  };

  if (scope === 'blind') {
    return {
      ...base,
      displayName: null,
      headline: null,
      tagline: null,
      handle: null,
      avatarUrl: null,
      hiddenFields: [...ALWAYS_BLIND_FIELDS],
    };
  }

  if (scope === 'shortlist_identity') {
    return {
      ...base,
      displayName: null,
      headline: source.headline ?? null,
      tagline: source.tagline ?? null,
      handle: null,
      avatarUrl: null,
      hiddenFields: [
        'displayName',
        'handle',
        'avatarUrl',
        'email',
        'city',
        'country',
        'exactLocation',
        'portfolioUrl',
        'employerNames',
        'schoolNames',
      ],
    };
  }

  return {
    ...base,
    displayName: source.displayName ?? 'Candidate',
    headline: source.headline ?? null,
    tagline: source.tagline ?? null,
    handle: source.handle ?? null,
    avatarUrl: source.avatarUrl ?? null,
    email: source.email ?? null,
    portfolioUrl: source.portfolioUrl ?? null,
    employerNames: source.employerNames ?? [],
    schoolNames: source.schoolNames ?? [],
    exactLocation: source.exactLocation ?? null,
    hiddenFields: [],
  };
}

export async function setMatchReviewStage(input: {
  matchId: string;
  actorId: string;
  actorRole: OrgReviewRole;
  sourceSurface: string;
  reviewStage: ReviewStage;
  revealScope?: RevealScope;
  reasonCode?: MatchReasonCode | 'shortlist_selected' | 'passed_for_now' | 'rejected_constraints';
  annotation?: string | null;
}) {
  const state = await db.query.matchReviewStates.findFirst({
    where: eq(matchReviewStates.matchId, input.matchId),
  });

  if (!state) {
    throw new Error('Match review state not found');
  }

  if (!canMutateReview(input.actorRole)) {
    await recordRevealEvent({
      matchId: state.matchId,
      assignmentId: state.assignmentId,
      profileId: state.profileId,
      orgId: state.orgId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      actorType: 'user_account',
      triggerType: 'user',
      requestedScope: input.revealScope ?? state.revealScope,
      grantedScope: state.revealScope,
      reasonCode: 'review_stage_forbidden',
      sourceSurface: input.sourceSurface,
      context: { reviewStage: input.reviewStage },
      outcome: 'denied',
    });
    throw new Error('Review mutation forbidden');
  }

  const nextRevealScope =
    input.reviewStage === 'shortlisted'
      ? 'shortlist_identity'
      : input.reviewStage === 'blind_review'
        ? 'blind'
        : (input.revealScope ?? state.revealScope);
  const now = new Date();

  await db
    .update(matchReviewStates)
    .set({
      reviewStage: input.reviewStage,
      revealScope: nextRevealScope,
      shortlistedAt: input.reviewStage === 'shortlisted' ? now : state.shortlistedAt,
      shortlistedBy: input.reviewStage === 'shortlisted' ? input.actorId : state.shortlistedBy,
      decisionAt:
        input.reviewStage === 'passed' || input.reviewStage === 'rejected' ? now : state.decisionAt,
      decisionBy:
        input.reviewStage === 'passed' || input.reviewStage === 'rejected'
          ? input.actorId
          : state.decisionBy,
      updatedAt: now,
    })
    .where(eq(matchReviewStates.matchId, input.matchId));

  if (input.reasonCode) {
    await db.insert(matchReasonLedger).values({
      matchId: state.matchId,
      assignmentId: state.assignmentId,
      profileId: state.profileId,
      category: getReasonCategory(input.reasonCode),
      reasonCode: input.reasonCode,
      source: 'policy',
      payloadJson: {
        reviewStage: input.reviewStage,
        annotation: input.annotation?.trim() || null,
      },
      importance: getReasonDictionaryEntry(input.reasonCode).importance,
      createdBy: input.actorId,
      noteHash: input.annotation?.trim() ? hashOpaqueToken(input.annotation.trim()) : null,
    });
  }

  if (nextRevealScope !== state.revealScope) {
    await recordRevealEvent({
      matchId: state.matchId,
      assignmentId: state.assignmentId,
      profileId: state.profileId,
      orgId: state.orgId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      actorType: 'user_account',
      triggerType: 'automatic',
      requestedScope: nextRevealScope,
      grantedScope: nextRevealScope,
      reasonCode:
        nextRevealScope === 'shortlist_identity'
          ? 'reveal_shortlist_identity'
          : 'reveal_full_identity',
      sourceSurface: input.sourceSurface,
      context: {
        reviewStage: input.reviewStage,
      },
      outcome: 'granted',
    });
  }
}

export function getReviewProjectionPolicy(role: OrgReviewRole | null, storedScope: RevealScope) {
  const effectiveScope = getEffectiveReviewRevealScope(role, storedScope);
  return {
    allowed: effectiveScope !== null,
    effectiveScope: effectiveScope ?? 'blind',
    verificationSummaryVisibility: getVerificationSummaryVisibility(role),
  };
}

export function getShortlistProjectionPolicy(role: OrgReviewRole | null, storedScope: RevealScope) {
  return {
    effectiveScope: getEffectiveShortlistRevealScope(role, storedScope),
    verificationSummaryVisibility: getVerificationSummaryVisibility(role),
  };
}

export async function unlockFullIdentityForMatch(input: {
  matchId: string;
  actorId?: string | null;
  actorRole?: string | null;
  actorType?: RevealActorType;
  triggerType: 'system' | 'policy' | 'automatic' | 'user';
  sourceSurface: string;
  reasonCode: string;
  unlockTrigger:
    | 'mutual_interest'
    | 'conversation_reveal'
    | 'interview_scheduled'
    | 'policy_override';
  context?: Record<string, unknown>;
}) {
  const state = await db.query.matchReviewStates.findFirst({
    where: eq(matchReviewStates.matchId, input.matchId),
  });

  if (!state) {
    throw new Error('Match review state not found');
  }

  const now = new Date();
  const grantedScope: RevealScope =
    state.revealScope === 'full_identity' ? 'full_identity' : 'full_identity';

  await db
    .update(matchReviewStates)
    .set({
      revealScope: 'full_identity',
      fullIdentityUnlockedAt: now,
      fullIdentityUnlockedBy: input.actorId ?? null,
      fullIdentityUnlockTrigger: input.unlockTrigger,
      updatedAt: now,
    })
    .where(eq(matchReviewStates.matchId, input.matchId));

  await recordRevealEvent({
    matchId: state.matchId,
    assignmentId: state.assignmentId,
    profileId: state.profileId,
    orgId: state.orgId,
    actorId: input.actorId ?? null,
    actorRole: input.actorRole ?? null,
    actorType: input.actorType ?? 'system',
    triggerType: input.triggerType,
    requestedScope: 'full_identity',
    grantedScope,
    reasonCode: input.reasonCode,
    sourceSurface: input.sourceSurface,
    context: {
      ...(input.context || {}),
      unlockTrigger: input.unlockTrigger,
    },
    outcome: state.revealScope === 'full_identity' ? 'no_op' : 'granted',
  });
}

export async function getLatestFairnessEvaluation(assignmentId: string) {
  return db.query.fairnessEvaluations.findFirst({
    where: eq(fairnessEvaluations.assignmentId, assignmentId),
    orderBy: [desc(fairnessEvaluations.evaluatedAt)],
  });
}

async function listAvailableFairnessColumns() {
  const result = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'demographic_opt_ins'
      AND column_name IN ('age', 'gender', 'location', 'ethnicity')
  `);

  return (result as unknown as Array<{ column_name: string }>).map((row) => row.column_name);
}

export async function evaluateAssignmentFairnessSnapshot(assignmentId: string) {
  const availableColumns = await listAvailableFairnessColumns();
  const [poolResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matches)
    .where(eq(matches.assignmentId, assignmentId));

  const poolCount = Number(poolResult?.count || 0);
  const optedInRows = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(matches)
    .innerJoin(demographicOptIns, eq(demographicOptIns.profileId, matches.profileId))
    .where(and(eq(matches.assignmentId, assignmentId), eq(demographicOptIns.optedIn, true)));

  const optedInCount = Number(optedInRows[0]?.count || 0);

  const cohortAvailability = evaluateFairnessCohortAvailability({
    poolCount,
    availableColumns,
    optedInCount,
  });

  return {
    status: cohortAvailability.status,
    metricsJson: {
      assignmentPoolCount: poolCount,
      optedInCohortCount: optedInCount,
      availableColumns,
      significancePValue: FAIRNESS_THRESHOLDS.significancePValue,
    },
    thresholdsJson: FAIRNESS_THRESHOLDS,
    eligibleCohortCount: optedInCount,
    sampleSizesJson: {
      assignmentPoolCount: poolCount,
      optedInCohortCount: optedInCount,
    },
    insufficientReason: cohortAvailability.insufficientReason,
  };
}

async function sendFairnessBreachAlert(input: {
  assignmentId: string;
  orgId?: string | null;
  status: FairnessStatus;
  metrics: Record<string, unknown>;
}) {
  const recipients =
    process.env.FAIRNESS_ALERT_EMAILS?.split(',')
      .map((value) => value.trim())
      .filter(Boolean) || [];
  const slackWebhook = process.env.SLACK_FAIRNESS_WEBHOOK_URL?.trim();

  try {
    if (process.env.RESEND_API_KEY && recipients.length > 0) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: recipients,
        subject: `[Proofound] Fairness ${input.status} for assignment ${input.assignmentId}`,
        html: `
          <p>Fairness status: <strong>${input.status}</strong></p>
          <p>Assignment: <code>${input.assignmentId}</code></p>
          <pre>${JSON.stringify(input.metrics, null, 2)}</pre>
        `,
      });
    }

    if (slackWebhook) {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Fairness ${input.status} for assignment ${input.assignmentId}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Fairness ${input.status}*\nAssignment: \`${input.assignmentId}\``,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `\`\`\`${JSON.stringify(input.metrics, null, 2)}\`\`\``,
              },
            },
          ],
        }),
      });
    }
  } catch (error) {
    log.error('fairness.alert.failed', {
      assignmentId: input.assignmentId,
      status: input.status,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function persistFairnessEvaluationForAssignment(input: {
  assignmentId: string;
  actorId?: string | null;
  actorType?: RevealActorType;
}) {
  const evaluation = await evaluateAssignmentFairnessSnapshot(input.assignmentId);
  const now = new Date();

  const [saved] = await db
    .insert(fairnessEvaluations)
    .values({
      assignmentId: input.assignmentId,
      scope: 'ranking_snapshot',
      checkVersion: CANONICAL_FAIRNESS_CHECK_VERSION,
      status: evaluation.status,
      metricsJson: evaluation.metricsJson,
      thresholdsJson: evaluation.thresholdsJson,
      eligibleCohortCount: evaluation.eligibleCohortCount,
      sampleSizesJson: evaluation.sampleSizesJson,
      insufficientReason: evaluation.insufficientReason,
      evaluatedAt: now,
    })
    .returning();

  await db
    .update(matches)
    .set({
      fairnessCheckVersion: CANONICAL_FAIRNESS_CHECK_VERSION,
      fairnessStatus: evaluation.status,
      fairnessEvaluatedAt: now,
    })
    .where(eq(matches.assignmentId, input.assignmentId));

  if (saved.status === 'elevated' || saved.status === 'breach') {
    await db.insert(fairnessRemediationEvents).values([
      {
        fairnessEvaluationId: saved.id,
        assignmentId: input.assignmentId,
        actorId: input.actorId ?? null,
        actorType: input.actorType ?? 'system',
        actionType: 'warning_issued',
        detailsJson: {
          status: evaluation.status,
        },
      },
      {
        fairnessEvaluationId: saved.id,
        assignmentId: input.assignmentId,
        actorId: input.actorId ?? null,
        actorType: input.actorType ?? 'system',
        actionType: 'ranking_suppressed',
        detailsJson: {
          status: evaluation.status,
        },
      },
    ]);
  }

  if (saved.status === 'breach') {
    await db.insert(fairnessRemediationEvents).values({
      fairnessEvaluationId: saved.id,
      assignmentId: input.assignmentId,
      actorId: input.actorId ?? null,
      actorType: input.actorType ?? 'system',
      actionType: 'admin_alert_sent',
      detailsJson: {
        status: evaluation.status,
      },
    });

    await sendFairnessBreachAlert({
      assignmentId: input.assignmentId,
      status: evaluation.status,
      metrics: evaluation.metricsJson,
    });
  }

  return saved;
}

export async function acknowledgeFairnessEvaluation(input: {
  fairnessEvaluationId: string;
  assignmentId: string;
  actorId: string;
}) {
  await db.insert(fairnessRemediationEvents).values({
    fairnessEvaluationId: input.fairnessEvaluationId,
    assignmentId: input.assignmentId,
    actorId: input.actorId,
    actorType: 'platform_admin',
    actionType: 'acknowledged',
    detailsJson: {},
  });
}

export function buildFairnessUiContract(status: FairnessStatus) {
  if (status === 'pass') {
    return {
      showWarning: false,
      suppressExactRank: false,
      warning: null,
    };
  }

  if (status === 'elevated') {
    return {
      showWarning: true,
      suppressExactRank: true,
      warning:
        'Policy checks are elevated. Ordering detail is limited while this snapshot is reviewed.',
    };
  }

  if (status === 'breach') {
    return {
      showWarning: true,
      suppressExactRank: true,
      warning:
        'Policy review is active. Exact ordering detail is temporarily suppressed for this snapshot.',
    };
  }

  return {
    showWarning: true,
    suppressExactRank: true,
    warning:
      'Exact ordering detail is unavailable because policy evidence is not strong enough yet.',
  };
}

export function renderExplanationFromReasonCodes(input: {
  reasonCodes: string[];
  ledgerEntries?: ExplainableLedgerEntry[];
  fairnessStatus: FairnessStatus;
  audience: 'org' | 'candidate';
}) {
  const sections: Record<MatchReasonCategory, string[]> = {
    positive_match: [],
    constraint_mismatch: [],
    workflow_decision: [],
    manual_override: [],
    fairness: [],
  };

  const reasonCodes = sanitizeMatchReasonCodes(input.reasonCodes);
  const currentEntries = reasonCodes
    .filter((reasonCode): reasonCode is MatchReasonCode =>
      MATCH_REASON_CODE_VALUES.includes(reasonCode as MatchReasonCode)
    )
    .map((reasonCode) => ({
      category: getReasonCategory(reasonCode),
      reasonCode,
      source: 'system' as const,
      payloadJson: {},
      createdAt: null,
      noteHash: null,
    }));

  const manualEntries = (input.ledgerEntries || []).filter(
    (entry) =>
      !LEGACY_PURPOSE_REASON_CODES.has(entry.reasonCode) &&
      (entry.source !== 'system' || !reasonCodes.includes(entry.reasonCode))
  );

  for (const entry of [...currentEntries, ...manualEntries]) {
    const dictionaryEntry = getReasonDictionaryEntry(entry.reasonCode);
    const baseCopy =
      input.audience === 'candidate'
        ? dictionaryEntry.candidateCopy || dictionaryEntry.orgCopy
        : dictionaryEntry.orgCopy;

    sections[dictionaryEntry.category].push(baseCopy);

    const annotationValue = (entry.payloadJson as Record<string, unknown>)?.annotation;
    const annotation = typeof annotationValue === 'string' ? annotationValue.trim() : '';
    if (annotation && dictionaryEntry.category === 'manual_override') {
      sections.manual_override.push(`Reviewer note: ${annotation}`);
    }
  }

  if (input.fairnessStatus !== 'pass') {
    sections.fairness.push(buildFairnessUiContract(input.fairnessStatus).warning || '');
  }

  return {
    explanationVersion: CANONICAL_EXPLANATION_VERSION,
    sections,
    summary: [
      ...sections.positive_match,
      ...sections.constraint_mismatch,
      ...sections.workflow_decision,
    ].slice(0, 3),
  };
}

export function buildProofFirstReviewCard(input: {
  profileId: string;
  reasonCodes: string[];
  fairnessStatus: FairnessStatus;
  verificationCount?: number | null;
  proofPack?: ReviewCardProofPackSnapshot | null;
  fallbackHeadline?: string | null;
  fitBand?: string | null;
}): ProofFirstReviewCard {
  const reasonCodes = sanitizeMatchReasonCodes(input.reasonCodes);
  const rendered = renderExplanationFromReasonCodes({
    reasonCodes,
    fairnessStatus: input.fairnessStatus,
    audience: 'org',
  });

  const proofPack = input.proofPack ?? null;
  const contextJson = proofPack?.contextJson ?? {};
  const privacyReasons = new Set<string>();
  const privacyState: { reviewState: ProofFirstReviewCard['privacy']['reviewState'] } = {
    reviewState: 'visible',
  };
  const applyBlindSafeText = (value: string | null | undefined) => {
    const result = redactBlindReviewText(value, contextJson);
    for (const reason of result.reasons) {
      privacyReasons.add(reason);
    }
    if (result.reviewState === 'held_for_manual_review') {
      privacyState.reviewState = 'held_for_manual_review';
    }
    return result.text;
  };
  const strongestProofSummary =
    applyBlindSafeText(proofPack?.contract.primaryClaim.statement) ??
    applyBlindSafeText(proofPack?.title) ??
    rendered.sections.positive_match[0] ??
    null;
  const strongestProofOutcome = applyBlindSafeText(
    proofPack?.contract.outcomeSummary ?? proofPack?.outcomesSummary
  );
  const ownership =
    applyBlindSafeText(
      proofPack?.contract.ownershipStatement ?? proofPack?.ownershipStatement ?? null
    ) ?? 'Ownership statement available after deeper review.';

  const fitBullets = [
    ...rendered.sections.positive_match,
    ...rendered.sections.constraint_mismatch,
    ...rendered.sections.workflow_decision,
  ]
    .filter(Boolean)
    .slice(0, 3);

  const verificationCount = input.verificationCount ?? null;
  const verificationSummaryLabel =
    applyBlindSafeText(proofPack?.contract.verificationSummary.summary) ??
    (proofPack?.verificationStatus === 'verified'
      ? 'Verified Proof Pack review present'
      : proofPack?.verificationStatus === 'partially_verified'
        ? 'Partial Proof Pack review present'
        : verificationCount && verificationCount > 0
          ? `${verificationCount} account-side check${verificationCount === 1 ? '' : 's'} recorded`
          : 'No verification signal recorded yet');
  const trustLabels = buildTrustLabels({
    fairnessStatus: input.fairnessStatus,
    verificationSummaryLabel,
    proofPack,
    verificationCount,
  });
  const fallbackHeadline = applyBlindSafeText(input.fallbackHeadline);
  const anchorContext =
    applyBlindSafeText(proofPack?.contract.primaryAnchor.label) ??
    getAnchorContextLabel(proofPack?.primarySubjectType ?? null, contextJson);

  return {
    candidateLabel: getStableCandidateLabel(input.profileId),
    strongestProof: {
      summary:
        privacyState.reviewState === 'held_for_manual_review'
          ? 'Proof summary held for manual privacy review.'
          : strongestProofSummary,
      outcome: privacyState.reviewState === 'held_for_manual_review' ? null : strongestProofOutcome,
      ownership:
        privacyState.reviewState === 'held_for_manual_review'
          ? 'Ownership statement held for manual privacy review.'
          : ownership,
      anchorContext,
      freshnessLabel: getFreshnessLabel(proofPack?.freshnessState),
    },
    verification: {
      summaryLabel: verificationSummaryLabel,
      count: verificationCount,
    },
    trustLabels,
    fitBand: input.fitBand ?? null,
    fitSummary: {
      headline:
        fallbackHeadline ||
        fitBullets[0] ||
        (privacyState.reviewState === 'held_for_manual_review' ? null : strongestProofSummary) ||
        'Proof-backed fit available for review.',
      bullets:
        fitBullets.length > 0
          ? fitBullets
          : ['Review the strongest proof summary and hiring-flow state for this candidate.'],
      reasonCodes,
    },
    privacy: {
      reviewState: privacyState.reviewState,
      reasons: [...privacyReasons].sort(),
    },
  };
}

export async function getReasonLedgerEntries(matchId: string) {
  return db.query.matchReasonLedger.findMany({
    where: eq(matchReasonLedger.matchId, matchId),
    orderBy: [desc(matchReasonLedger.createdAt)],
  });
}

export async function getCandidateReviewSnapshot(input: { matchId: string }) {
  const [row] = await db
    .select({
      matchId: matches.id,
      assignmentId: matches.assignmentId,
      profileId: matches.profileId,
      score: matches.score,
      fairnessStatus: matches.fairnessStatus,
      scoreVersion: matches.scoreVersion,
      modelVersion: matches.modelVersion,
      explanationVersion: matches.explanationVersion,
      fairnessCheckVersion: matches.fairnessCheckVersion,
      fairnessEvaluatedAt: matches.fairnessEvaluatedAt,
      reasonCodes: matches.reasonCodes,
      reviewStage: matchReviewStates.reviewStage,
      revealScope: matchReviewStates.revealScope,
      orgId: matchReviewStates.orgId,
      displayName: profiles.displayName,
      handle: profiles.handle,
      avatarUrl: profiles.avatarUrl,
    })
    .from(matches)
    .innerJoin(matchReviewStates, eq(matchReviewStates.matchId, matches.id))
    .innerJoin(profiles, eq(profiles.id, matches.profileId))
    .where(eq(matches.id, input.matchId))
    .limit(1);

  return row || null;
}

export function normalizeFairnessStatus(status: string | null | undefined): FairnessStatus {
  if (status === 'pass' || status === 'elevated' || status === 'breach') {
    return status;
  }
  return 'unavailable';
}

export function getDefaultFairnessStatusForMatch(
  match: Pick<Match, 'fairnessStatus'>
): FairnessStatus {
  return normalizeFairnessStatus(match.fairnessStatus);
}
