import { Resend } from 'resend';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

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
  revealEvents,
  type Match,
} from '@/db/schema';
import { emitLifecycleEvent } from '@/lib/analytics/lifecycle-events';
import {
  authorize,
  getEffectiveReviewRevealScope,
  getEffectiveShortlistRevealScope,
  getVerificationSummaryVisibility,
  type OrgRole,
} from '@/lib/authz';
import { EMAIL_CONFIG } from '@/lib/email/config';
import {
  resolveEffectiveScoreState,
  type CanonicalMatchScoreArtifact,
  type MatchScoreState,
} from '@/lib/matching/match-score-contract';
import {
  MATCH_REASON_CODE_VALUES,
  type MatchReasonCategory,
  type MatchReasonCode,
} from '@/lib/contracts/canonical-domain';
import { hashOpaqueToken } from '@/lib/contracts/canonical-domain';
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
  headline?: string | null;
  tagline?: string | null;
  workMode?: string | null;
  country?: string | null;
  city?: string | null;
  desiredRoles?: string[] | null;
  valuesTags?: string[] | null;
  causeTags?: string[] | null;
  verified?: Record<string, unknown> | null;
};

const REASON_DICTIONARY: Record<MatchReasonCode, ReasonDictionaryEntry> = {
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
    orgCopy: 'This role aligns with the candidate’s stated focus.',
    candidateCopy: 'This role aligns with your stated focus.',
    importance: 60,
  },
  focus_industry: {
    category: 'positive_match',
    orgCopy: 'This industry aligns with the candidate’s stated focus.',
    candidateCopy: 'This industry aligns with your stated focus.',
    importance: 58,
  },
  focus_org_type: {
    category: 'positive_match',
    orgCopy: 'This organization type aligns with the candidate’s stated focus.',
    candidateCopy: 'This organization type aligns with your stated focus.',
    importance: 56,
  },
  shortlist_selected: {
    category: 'workflow_decision',
    orgCopy: 'The candidate was shortlisted for deeper review.',
    candidateCopy: 'You have been shortlisted for deeper review.',
    importance: 60,
  },
  passed_for_now: {
    category: 'workflow_decision',
    orgCopy: 'The candidate remains under review but is not shortlisted right now.',
    candidateCopy: 'You are still under review, but not shortlisted right now.',
    importance: 55,
  },
  rejected_constraints: {
    category: 'workflow_decision',
    orgCopy: 'The candidate was not advanced because core constraints did not line up.',
    candidateCopy: 'You were not advanced because core constraints did not line up.',
    importance: 70,
  },
  override_keep_under_review: {
    category: 'manual_override',
    orgCopy: 'A reviewer kept this candidate under review with a manual override.',
    candidateCopy: 'A reviewer kept your profile under review with a manual override.',
    importance: 68,
  },
  override_shortlist_manual: {
    category: 'manual_override',
    orgCopy: 'A reviewer manually shortlisted this candidate.',
    candidateCopy: 'A reviewer manually shortlisted your profile.',
    importance: 75,
  },
  override_reject_manual: {
    category: 'manual_override',
    orgCopy: 'A reviewer manually closed this candidate out.',
    candidateCopy: 'A reviewer manually closed your profile out.',
    importance: 75,
  },
  fairness_warning_active: {
    category: 'fairness',
    orgCopy: 'Fairness checks are elevated, so comparative detail is limited.',
    candidateCopy: 'Comparative detail is limited while fairness checks are reviewed.',
    importance: 88,
  },
  fairness_ranking_suppressed: {
    category: 'fairness',
    orgCopy: 'Exact ranking detail is suppressed while fairness remediation is active.',
    candidateCopy: 'Exact ranking detail is suppressed while fairness remediation is active.',
    importance: 92,
  },
  reveal_shortlist_identity: {
    category: 'workflow_decision',
    orgCopy: 'Shortlist identity reveal was granted under the review policy.',
    candidateCopy: 'Your shortlist identity reveal was granted under the review policy.',
    importance: 50,
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
  'headline',
  'tagline',
  'city',
  'country',
] as const;

const SHORTLIST_VISIBLE_FIELDS = [
  'displayName',
  'headline',
  'tagline',
  'desiredRoles',
  'workMode',
  'valuesTags',
  'causeTags',
  'verificationSummary',
] as const;

const FULL_VISIBLE_FIELDS = [
  ...SHORTLIST_VISIBLE_FIELDS,
  'handle',
  'avatarUrl',
  'locationSummary',
] as const;

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
  const [saved] = await db
    .insert(revealEvents)
    .values({
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
    })
    .returning();

  const lifecycleActorType = mapRevealActorTypeToLifecycleActorType(
    input.actorType,
    input.actorRole
  );
  const basePayload = {
    reveal_event_id: saved.id,
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
      eq(organizationMembers.status, 'active')
    ),
    columns: {
      role: true,
    },
  });

  return (membership?.role as OrgReviewRole | undefined) ?? null;
}

export function canMutateReview(role: OrgReviewRole | null): boolean {
  return authorize({
    resource: 'candidate_full_review',
    action: 'update',
    orgRole: role,
  }).allowed;
}

export function canRevealExactRank(
  role: OrgReviewRole | null,
  fairnessStatus: FairnessStatus
): boolean {
  return fairnessStatus === 'pass' && (role === 'owner' || role === 'admin' || role === 'member');
}

export function getRankBand(rank: number, totalCandidates: number): string {
  if (rank <= 5) return 'Top 5';
  if (rank <= 10) return 'Top 10';
  if (rank <= 20) return 'Top 20';
  if (rank <= Math.ceil(totalCandidates * 0.3)) return 'Top 30%';
  if (rank <= Math.ceil(totalCandidates * 0.5)) return 'Top 50%';
  return 'Competitive';
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
    valuesTags: source.valuesTags ?? [],
    causeTags: source.causeTags ?? [],
    verificationSummary,
    locationSummary:
      scope === 'full_identity'
        ? [source.city, source.country].filter(Boolean).join(', ') || null
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
      displayName: source.displayName ?? 'Candidate',
      headline: source.headline ?? null,
      tagline: source.tagline ?? null,
      handle: null,
      avatarUrl: null,
      hiddenFields: ['handle', 'avatarUrl', 'city', 'country'],
    };
  }

  return {
    ...base,
    displayName: source.displayName ?? 'Candidate',
    headline: source.headline ?? null,
    tagline: source.tagline ?? null,
    handle: source.handle ?? null,
    avatarUrl: source.avatarUrl ?? null,
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
        'Fairness checks are elevated. Rank detail is limited while this snapshot is reviewed.',
    };
  }

  if (status === 'breach') {
    return {
      showWarning: true,
      suppressExactRank: true,
      warning:
        'Fairness remediation is active. Exact ranking detail is temporarily suppressed for this snapshot.',
    };
  }

  return {
    showWarning: true,
    suppressExactRank: true,
    warning:
      'Exact ranking detail is unavailable because fairness evidence is not strong enough yet.',
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

  const currentEntries = input.reasonCodes
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
    (entry) => entry.source !== 'system' || !input.reasonCodes.includes(entry.reasonCode)
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
    summary: [...sections.positive_match, ...sections.workflow_decision].slice(0, 3),
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
