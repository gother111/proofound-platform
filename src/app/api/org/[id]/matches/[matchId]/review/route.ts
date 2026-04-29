import { and, eq, or, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';

import { db } from '@/db';
import {
  assignments,
  conversations,
  matchInterest,
  matchReviewStates,
  matches,
  organizations,
  profiles,
} from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import { safeApiErrorResponse } from '@/lib/api/errors';
import { emitFirstQualifiedIntroAsync, emitMatchActioned } from '@/lib/analytics/events';
import { log } from '@/lib/log';
import { sanitizeErrorForLog } from '@/lib/privacy/log-redaction';
import {
  appendManualOverrideReason,
  buildProofFirstReviewCard,
  buildVisibilitySafeWhy,
  getReviewCardProofPackMap,
  getOrgMembershipRole,
  normalizeFairnessStatus,
  resolveCanonicalCorridor,
  resolveCanonicalFallbackState,
  getVisibleIdentityFields,
  ensureMatchReviewState,
  persistFairnessEvaluationForAssignment,
  recordRevealEvent,
  setMatchReviewStage,
  type RevealScope,
} from '@/lib/matching/review-contract';
import { notifyIntroAccepted } from '@/lib/notifications';
import {
  getOrCreateIntroWorkflow,
  openIntroConversation,
  syncRevealRequestTimeoutState,
  syncIntroWorkflowFromInterest,
} from '@/lib/workflow/service';

export const dynamic = 'force-dynamic';

const ReviewMutationSchema = z.object({
  action: z.enum([
    'shortlist',
    'unshortlist',
    'pass',
    'reject',
    'manual_override',
    'reveal_request',
    'request_intro',
  ]),
  annotation: z.string().max(1000).optional(),
  reasonCode: z
    .enum(['override_keep_under_review', 'override_shortlist_manual', 'override_reject_manual'])
    .optional(),
  requestedScope: z.enum(['shortlist_identity', 'full_identity']).optional(),
});

function getReviewMutationReasonCodes(action: 'shortlist' | 'unshortlist' | 'pass' | 'reject') {
  switch (action) {
    case 'shortlist':
      return ['shortlist_selected'];
    case 'reject':
      return ['rejected_constraints'];
    default:
      return ['passed_for_now'];
  }
}

async function getOrgByIdOrSlug(orgIdOrSlug: string) {
  const [org] = await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
    })
    .from(organizations)
    .where(
      sql`${organizations.id}::text = ${orgIdOrSlug} OR ${organizations.slug} = ${orgIdOrSlug}`
    )
    .limit(1);

  return org ?? null;
}

async function buildReviewCardPayload(params: {
  profileId: string;
  reasonCodes: string[];
  fairnessStatus: ReturnType<typeof normalizeFairnessStatus>;
  revealScope: RevealScope;
}) {
  const proofPackByProfileId = await getReviewCardProofPackMap([params.profileId]);

  const reviewCard = buildProofFirstReviewCard({
    profileId: params.profileId,
    reasonCodes: params.reasonCodes,
    fairnessStatus: params.fairnessStatus,
    proofPack: proofPackByProfileId.get(params.profileId) ?? null,
  });

  return params.revealScope === 'full_identity'
    ? reviewCard
    : sanitizeBlindReviewCardForResponse(reviewCard);
}

const ROUTE_REDACTED_TOKEN = '[redacted]';
const ROUTE_FILE_NAME_PATTERN =
  /\b[\w .+-]+\.(pdf|doc|docx|txt|md|png|jpe?g|webp|csv|xls|xlsx)\b/gi;
const ROUTE_EMAIL_PATTERN = /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi;
const ROUTE_URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/gi;
const ROUTE_PHONE_PATTERN = /(?:\+?\d[\s().-]*){7,}\d/g;
const ROUTE_HANDLE_PATTERN = /(?<![\w.+-])@[a-z0-9_][a-z0-9_.-]{1,30}\b/gi;
const ROUTE_COMPANY_PATTERN =
  /\b(?:[A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,4}\s+)?(?:Inc|LLC|Ltd|Limited|Corp|Corporation|Company|Co|AB|Oy|GmbH|SARL|SAS|AS|BV)\b/g;
const ROUTE_SCHOOL_PATTERN =
  /\b(?:[A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,6}\s+)?(?:University|College|School|Institute|Academy|Gymnasium|Universitet|Högskola)\b/g;
const ROUTE_PRECISE_LOCATION_PATTERN =
  /\b\d{1,6}[A-Z]?\s+[A-ZÅÄÖa-zåäö][\wÅÄÖåäö\s.'-]{2,}\s+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Boulevard|Blvd|Way|Place|Pl|Court|Ct|Väg|Vägen|Gatan|Gata|Gränd|Allé|Allee)\b/i;
const ROUTE_FULL_NAME_PATTERN =
  /\b[A-ZÅÄÖ][a-zåäö]{1,}(?:\s+(?:[A-ZÅÄÖ][a-zåäö]{1,}|[A-Z]\.)){1,3}\b/g;

function sanitizeBlindReviewString(value: unknown, fallback: string | null) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { value: fallback, held: false, reasons: [] as string[] };
  }

  const reasons = new Set<string>();
  let output = value.replace(ROUTE_FILE_NAME_PATTERN, () => {
    reasons.add('redacted_original_filename');
    return 'shared document';
  });

  const replace = (pattern: RegExp, replacement: string, reason: string) => {
    let matched = false;
    output = output.replace(pattern, () => {
      matched = true;
      return replacement;
    });
    if (matched) {
      reasons.add(reason);
    }
  };

  replace(ROUTE_URL_PATTERN, ROUTE_REDACTED_TOKEN, 'redacted_url');
  replace(ROUTE_EMAIL_PATTERN, ROUTE_REDACTED_TOKEN, 'redacted_email');
  replace(ROUTE_PHONE_PATTERN, ROUTE_REDACTED_TOKEN, 'redacted_phone');
  replace(ROUTE_HANDLE_PATTERN, ROUTE_REDACTED_TOKEN, 'redacted_handle');
  replace(ROUTE_COMPANY_PATTERN, 'the organization', 'redacted_company_name');
  replace(ROUTE_SCHOOL_PATTERN, 'the institution', 'redacted_school_name');

  const hasUncertainIdentity =
    ROUTE_PRECISE_LOCATION_PATTERN.test(output) ||
    [...output.matchAll(ROUTE_FULL_NAME_PATTERN)].some(
      (match) => !/^(Proof Pack|Proofound|Candidate Review)$/i.test(match[0].trim())
    );

  if (hasUncertainIdentity) {
    reasons.add('manual_review_uncertain_identity_signal');
    return { value: fallback, held: true, reasons: [...reasons] };
  }

  output = output.replace(/\s+/g, ' ').trim();
  return { value: output.length > 0 ? output : fallback, held: false, reasons: [...reasons] };
}

function sanitizeBlindReviewCardForResponse(
  reviewCard: ReturnType<typeof buildProofFirstReviewCard>
) {
  const privacyReasons = new Set<string>(reviewCard.privacy?.reasons ?? []);
  let held = reviewCard.privacy?.reviewState === 'held_for_manual_review';
  const sanitize = (value: unknown, fallback: string | null) => {
    const sanitized = sanitizeBlindReviewString(value, fallback);
    for (const reason of sanitized.reasons) {
      privacyReasons.add(reason);
    }
    if (sanitized.held) {
      held = true;
    }
    return sanitized.value;
  };
  const strongestProofSummary = sanitize(reviewCard.strongestProof?.summary, null);
  const strongestProofOutcome = sanitize(reviewCard.strongestProof?.outcome, null);
  const strongestProofOwnership = sanitize(reviewCard.strongestProof?.ownership, null);
  const strongestProofAnchorContext = sanitize(
    reviewCard.strongestProof?.anchorContext,
    'Anchored in prior proof'
  );
  const verificationSummaryLabel = sanitize(
    reviewCard.verification?.summaryLabel,
    'Scoped verification signal present'
  );
  const fitHeadline = sanitize(
    reviewCard.fitSummary?.headline,
    'Proof-backed fit available for review.'
  );
  const sanitizeList = (values: unknown) =>
    Array.isArray(values)
      ? values
          .map((value) => sanitize(value, null))
          .filter((value): value is string => Boolean(value))
      : [];
  const trustLabels = sanitizeList(reviewCard.trustLabels);
  const fitBullets = sanitizeList(reviewCard.fitSummary?.bullets);

  return {
    candidateLabel: reviewCard.candidateLabel,
    strongestProof: {
      summary: held ? 'Proof summary held for manual privacy review.' : strongestProofSummary,
      outcome: held ? null : strongestProofOutcome,
      ownership: held
        ? 'Ownership statement held for manual privacy review.'
        : strongestProofOwnership,
      anchorContext: strongestProofAnchorContext,
      freshnessLabel: reviewCard.strongestProof?.freshnessLabel ?? null,
    },
    verification: {
      summaryLabel: verificationSummaryLabel,
      count: reviewCard.verification?.count ?? null,
    },
    trustLabels,
    fitBand: reviewCard.fitBand ?? null,
    fitSummary: {
      headline: fitHeadline,
      bullets: fitBullets,
      reasonCodes: Array.isArray(reviewCard.fitSummary?.reasonCodes)
        ? reviewCard.fitSummary.reasonCodes
        : [],
    },
    privacy: {
      reviewState: held ? 'held_for_manual_review' : 'visible',
      reasons: [...privacyReasons].sort(),
    },
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = authContext;
    const { id, matchId } = await params;
    const parsed = ReviewMutationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const org = await getOrgByIdOrSlug(id);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const role = await getOrgMembershipRole(user.id, org.id);
    if (!role) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let [matchRow] = await db
      .select({
        matchId: matches.id,
        assignmentId: matches.assignmentId,
        profileId: matches.profileId,
        orgId: assignments.orgId,
        reviewStage: matchReviewStates.reviewStage,
        revealScope: matchReviewStates.revealScope,
        reviewOperationalFallbackMode: matchReviewStates.operationalFallbackMode,
        assignmentOperationalFallbackMode: assignments.operationalFallbackMode,
        fairnessStatus: matches.fairnessStatus,
      })
      .from(matches)
      .innerJoin(assignments, eq(assignments.id, matches.assignmentId))
      .innerJoin(matchReviewStates, eq(matchReviewStates.matchId, matches.id))
      .where(and(eq(matches.id, matchId), eq(assignments.orgId, org.id)))
      .limit(1);

    if (!matchRow) {
      const [matchWithoutReviewState] = await db
        .select({
          matchId: matches.id,
          assignmentId: matches.assignmentId,
          profileId: matches.profileId,
          orgId: assignments.orgId,
          assignmentOperationalFallbackMode: assignments.operationalFallbackMode,
          fairnessStatus: matches.fairnessStatus,
        })
        .from(matches)
        .innerJoin(assignments, eq(assignments.id, matches.assignmentId))
        .where(and(eq(matches.id, matchId), eq(assignments.orgId, org.id)))
        .limit(1);

      if (!matchWithoutReviewState) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }

      await ensureMatchReviewState({
        matchId: matchWithoutReviewState.matchId,
        assignmentId: matchWithoutReviewState.assignmentId,
        profileId: matchWithoutReviewState.profileId,
        orgId: matchWithoutReviewState.orgId,
      });

      matchRow = {
        ...matchWithoutReviewState,
        reviewStage: 'blind_review',
        revealScope: 'blind',
        reviewOperationalFallbackMode: null,
      };
    }

    const payload = parsed.data;

    if (payload.action === 'reveal_request') {
      const requestedScope = payload.requestedScope ?? 'full_identity';
      const fairnessStatus = normalizeFairnessStatus(matchRow.fairnessStatus);
      const [activeConversation] = await db
        .select({
          id: conversations.id,
          matchId: conversations.matchId,
          stage: conversations.stage,
          participantOneRevealRequestedAt: conversations.participantOneRevealRequestedAt,
          participantTwoRevealRequestedAt: conversations.participantTwoRevealRequestedAt,
          participantOneId: conversations.participantOneId,
          participantTwoId: conversations.participantTwoId,
          participantOneWantsReveal: conversations.participantOneWantsReveal,
          participantTwoWantsReveal: conversations.participantTwoWantsReveal,
        })
        .from(conversations)
        .where(eq(conversations.matchId, matchRow.matchId))
        .limit(1);

      if (!activeConversation) {
        return NextResponse.json(
          {
            error:
              'Reveal requests only open after introduction approval creates a masked conversation.',
            matchId: matchRow.matchId,
            reviewStage: matchRow.reviewStage,
            revealScope: matchRow.revealScope,
            visibleIdentityFields: getVisibleIdentityFields(matchRow.revealScope),
          },
          { status: 409 }
        );
      }

      const {
        conversation: syncedConversation,
        timeout: revealTimeout,
        reset: revealRequestExpired,
      } = await syncRevealRequestTimeoutState({
        conversation: activeConversation,
      });

      if (revealRequestExpired) {
        await recordRevealEvent({
          matchId: matchRow.matchId,
          assignmentId: matchRow.assignmentId,
          profileId: matchRow.profileId,
          orgId: org.id,
          actorType: 'system',
          triggerType: 'policy',
          requestedScope: requestedScope,
          grantedScope: matchRow.revealScope,
          reasonCode: 'reveal_request_expired',
          sourceSurface: 'org_review_route',
          context: {
            conversationId: syncedConversation.id,
            requestedBy: revealTimeout.requestedBy,
            requestedAt: revealTimeout.requestedAt?.toISOString() ?? null,
            expiresAt: revealTimeout.expiresAt?.toISOString() ?? null,
          },
          outcome: 'denied',
        });
      }

      if (syncedConversation.stage === 'revealed' || matchRow.revealScope === 'full_identity') {
        const corridor = resolveCanonicalCorridor({
          reviewStage: matchRow.reviewStage,
          revealScope: 'full_identity',
          surface: 'review_detail',
          fairnessStatus,
          operationalFallbackMode:
            matchRow.reviewOperationalFallbackMode ?? matchRow.assignmentOperationalFallbackMode,
          introApproved: true,
        });
        const reviewCard = await buildReviewCardPayload({
          profileId: matchRow.profileId,
          reasonCodes: ['reveal_full_identity'],
          fairnessStatus,
          revealScope: 'full_identity',
        });

        return NextResponse.json({
          matchId: matchRow.matchId,
          reviewStage: matchRow.reviewStage,
          revealScope: 'full_identity',
          visibleIdentityFields: getVisibleIdentityFields('full_identity'),
          conversationId: syncedConversation.id,
          reviewCard,
          ...corridor,
          why: buildVisibilitySafeWhy({
            reasonCodes: ['reveal_full_identity'],
            fairnessStatus,
            fallbackState: corridor.fallbackState,
          }),
          message: 'Identity is already revealed for this introduction.',
        });
      }

      const orgParticipantIsOne = syncedConversation.participantOneId !== matchRow.profileId;
      const orgRevealAlreadyRequested = orgParticipantIsOne
        ? syncedConversation.participantOneWantsReveal
        : syncedConversation.participantTwoWantsReveal;

      if (!orgRevealAlreadyRequested) {
        const now = new Date();
        await db
          .update(conversations)
          .set(
            orgParticipantIsOne
              ? {
                  participantOneWantsReveal: true,
                  participantOneRevealRequestedAt: now,
                  updatedAt: now,
                }
              : {
                  participantTwoWantsReveal: true,
                  participantTwoRevealRequestedAt: now,
                  updatedAt: now,
                }
          )
          .where(eq(conversations.id, syncedConversation.id));
      }

      await recordRevealEvent({
        matchId: matchRow.matchId,
        assignmentId: matchRow.assignmentId,
        profileId: matchRow.profileId,
        orgId: org.id,
        actorId: user.id,
        actorRole: role,
        actorType: 'user_account',
        triggerType: 'user',
        requestedScope,
        grantedScope: matchRow.revealScope,
        reasonCode: 'org_reveal_request_pending',
        sourceSurface: 'org_review_route',
        context: {
          pending: true,
          conversationId: syncedConversation.id,
          expiredAndReset: revealRequestExpired,
        },
        outcome: 'no_op',
      });

      const corridor = resolveCanonicalCorridor({
        reviewStage: matchRow.reviewStage,
        revealScope: matchRow.revealScope,
        surface: 'review_detail',
        fairnessStatus,
        operationalFallbackMode:
          matchRow.reviewOperationalFallbackMode ?? matchRow.assignmentOperationalFallbackMode,
        revealRequestPending: true,
      });
      const reviewCard = await buildReviewCardPayload({
        profileId: matchRow.profileId,
        reasonCodes: ['org_reveal_request_pending'],
        fairnessStatus,
        revealScope: matchRow.revealScope,
      });

      return NextResponse.json({
        matchId: matchRow.matchId,
        reviewStage: matchRow.reviewStage,
        revealScope: matchRow.revealScope,
        visibleIdentityFields: getVisibleIdentityFields(matchRow.revealScope),
        conversationId: syncedConversation.id,
        waitingForCandidateApproval: true,
        reviewCard,
        ...corridor,
        why: buildVisibilitySafeWhy({
          reasonCodes: ['org_reveal_request_pending'],
          fairnessStatus,
          fallbackState: corridor.fallbackState,
        }),
        message:
          requestedScope === 'full_identity'
            ? 'Reveal request sent. Full identity remains locked until the candidate approves.'
            : 'Reveal request recorded.',
      });
    }

    if (payload.action === 'request_intro') {
      const fairnessStatus = normalizeFairnessStatus(matchRow.fairnessStatus);
      const fallbackState = resolveCanonicalFallbackState({
        operationalFallbackMode:
          matchRow.reviewOperationalFallbackMode ?? matchRow.assignmentOperationalFallbackMode,
        fairnessStatus,
      });
      const stage2Ready =
        matchRow.reviewStage === 'shortlisted' && matchRow.revealScope === 'shortlist_identity';

      if (!stage2Ready || fallbackState === 'intro_hold') {
        const fallbackMode =
          matchRow.reviewOperationalFallbackMode ??
          matchRow.assignmentOperationalFallbackMode ??
          (fallbackState === 'fairness_suppressed_ranking'
            ? 'fairness_suppressed_ranking'
            : 'intro_hold_insufficient_qualified_intros');

        await db
          .update(matchReviewStates)
          .set({
            operationalFallbackMode: fallbackMode,
            updatedAt: new Date(),
          })
          .where(eq(matchReviewStates.matchId, matchRow.matchId));

        const corridor = resolveCanonicalCorridor({
          reviewStage: matchRow.reviewStage,
          revealScope: matchRow.revealScope,
          surface: 'review_detail',
          fairnessStatus,
          operationalFallbackMode: fallbackMode,
          introRequested: true,
        });
        const reviewCard = await buildReviewCardPayload({
          profileId: matchRow.profileId,
          reasonCodes: ['fairness_ranking_suppressed'],
          fairnessStatus,
          revealScope: matchRow.revealScope,
        });

        return NextResponse.json(
          {
            error: !stage2Ready
              ? 'Intro requests are only allowed after contextual reveal at Stage 2.'
              : 'Intro request is on hold while fallback protections are active.',
            matchId: matchRow.matchId,
            reviewStage: matchRow.reviewStage,
            revealScope: matchRow.revealScope,
            visibleIdentityFields: getVisibleIdentityFields(matchRow.revealScope),
            reviewCard,
            ...corridor,
            why: buildVisibilitySafeWhy({
              reasonCodes: ['fairness_ranking_suppressed'],
              fairnessStatus,
              fallbackState: corridor.fallbackState,
            }),
          },
          { status: 409 }
        );
      }

      const [candidateInterest] = await db
        .select({
          actorProfileId: matchInterest.actorProfileId,
        })
        .from(matchInterest)
        .where(
          and(
            eq(matchInterest.assignmentId, matchRow.assignmentId),
            eq(matchInterest.actorProfileId, matchRow.profileId),
            sql`${matchInterest.targetProfileId} IS NULL`
          )
        )
        .limit(1);

      if (!candidateInterest) {
        const intro = await getOrCreateIntroWorkflow({
          assignmentId: matchRow.assignmentId,
          candidateProfileId: matchRow.profileId,
          orgId: org.id,
          actorType: 'organization_member',
          actorId: user.id,
          initialState: 'pending_candidate_interest',
          matchId: matchRow.matchId,
          metadata: {
            sourceSurface: 'org_review_route',
            requestedFromStage: 'stage2_contextual_reveal',
          },
        });

        const corridor = resolveCanonicalCorridor({
          reviewStage: matchRow.reviewStage,
          revealScope: matchRow.revealScope,
          surface: 'review_detail',
          fairnessStatus,
          operationalFallbackMode: null,
          introRequested: true,
        });
        const reviewCard = await buildReviewCardPayload({
          profileId: matchRow.profileId,
          reasonCodes: ['shortlist_selected'],
          fairnessStatus,
          revealScope: matchRow.revealScope,
        });

        return NextResponse.json({
          matchId: matchRow.matchId,
          reviewStage: matchRow.reviewStage,
          revealScope: matchRow.revealScope,
          visibleIdentityFields: getVisibleIdentityFields(matchRow.revealScope),
          introWorkflowId: intro.id,
          introWorkflowState: intro.state,
          introApproved: false,
          requiresCandidateInterest: true,
          reviewCard,
          ...corridor,
          why: buildVisibilitySafeWhy({
            reasonCodes: ['shortlist_selected'],
            fairnessStatus,
            fallbackState: corridor.fallbackState,
          }),
          message:
            'Intro request recorded. Proofound will approve the introduction after the candidate reciprocates interest.',
        });
      }

      const intro = await syncIntroWorkflowFromInterest({
        assignmentId: matchRow.assignmentId,
        candidateProfileId: matchRow.profileId,
        orgId: org.id,
        actorType: 'organization_member',
        actorId: user.id,
        mutual: true,
        matchId: matchRow.matchId,
      });

      let resolvedConversationId = intro.conversationId ?? null;
      const [existingConversation] = await db
        .select({
          id: conversations.id,
        })
        .from(conversations)
        .where(
          or(
            eq(conversations.matchId, matchRow.matchId),
            and(
              eq(conversations.assignmentId, matchRow.assignmentId),
              eq(conversations.participantOneId, matchRow.profileId),
              eq(conversations.participantTwoId, user.id)
            ),
            and(
              eq(conversations.assignmentId, matchRow.assignmentId),
              eq(conversations.participantOneId, user.id),
              eq(conversations.participantTwoId, matchRow.profileId)
            )
          )
        )
        .limit(1);

      if (!resolvedConversationId && existingConversation?.id) {
        resolvedConversationId = existingConversation.id;
      }

      if (!resolvedConversationId) {
        const [insertedConversation] = await db
          .insert(conversations)
          .values({
            matchId: matchRow.matchId,
            assignmentId: matchRow.assignmentId,
            participantOneId: matchRow.profileId,
            participantTwoId: user.id,
            stage: 'masked',
            maskedHandleOne: `Candidate #${nanoid(6).toUpperCase()}`,
            maskedHandleTwo: `Organization #${nanoid(6).toUpperCase()}`,
            lastMessageAt: new Date(),
          })
          .returning({
            id: conversations.id,
          });

        resolvedConversationId = insertedConversation?.id ?? null;
      }

      if (intro.state === 'conversation_open' && resolvedConversationId) {
        const corridor = resolveCanonicalCorridor({
          reviewStage: matchRow.reviewStage,
          revealScope: 'shortlist_identity',
          surface: 'review_detail',
          fairnessStatus,
          operationalFallbackMode: null,
          introApproved: true,
        });
        const reviewCard = await buildReviewCardPayload({
          profileId: matchRow.profileId,
          reasonCodes: ['intro_accepted_masked'],
          fairnessStatus,
          revealScope: 'shortlist_identity',
        });

        return NextResponse.json({
          matchId: matchRow.matchId,
          reviewStage: matchRow.reviewStage,
          revealScope: 'shortlist_identity',
          visibleIdentityFields: getVisibleIdentityFields('shortlist_identity'),
          introWorkflowId: intro.id,
          introWorkflowState: 'conversation_open',
          introApproved: true,
          conversationId: resolvedConversationId,
          reviewCard,
          ...corridor,
          why: buildVisibilitySafeWhy({
            reasonCodes: ['intro_accepted_masked'],
            fairnessStatus,
            fallbackState: corridor.fallbackState,
          }),
          message:
            'Introduction already approved. Masked messaging is open, and full identity stays locked until the candidate approves reveal.',
        });
      }

      if (existingConversation) {
        await db
          .update(conversations)
          .set({
            matchId: matchRow.matchId,
            assignmentId: matchRow.assignmentId,
            stage: 'masked',
            revealedAt: null,
            participantOneWantsReveal: false,
            participantTwoWantsReveal: false,
            participantOneRevealRequestedAt: null,
            participantTwoRevealRequestedAt: null,
            lastMessageAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(conversations.id, existingConversation.id));
      }

      await openIntroConversation({
        introWorkflowId: intro.id,
        conversationId: resolvedConversationId,
        actorType: 'organization_member',
        actorId: user.id,
        matchId: matchRow.matchId,
      });

      await emitMatchActioned(user.id, matchRow.matchId, { action: 'introduce' });
      await emitMatchActioned(matchRow.profileId, matchRow.matchId, { action: 'introduce' });
      emitFirstQualifiedIntroAsync(user.id, matchRow.matchId, matchRow.assignmentId);

      try {
        const [candidateProfile, orgProfile] = await Promise.all([
          db.query.profiles.findFirst({
            where: eq(profiles.id, matchRow.profileId),
            columns: { displayName: true, handle: true },
          }),
          db.query.profiles.findFirst({
            where: eq(profiles.id, user.id),
            columns: { displayName: true, handle: true },
          }),
        ]);

        const candidateName =
          candidateProfile?.displayName || candidateProfile?.handle || 'The candidate';
        const orgName = orgProfile?.displayName || orgProfile?.handle || 'The organization';

        await notifyIntroAccepted(user.id, matchRow.matchId, candidateName);
        await notifyIntroAccepted(matchRow.profileId, matchRow.matchId, orgName);
      } catch (error) {
        log.error('org_review.request_intro.notification_failed', {
          error: sanitizeErrorForLog(error),
          matchId: matchRow.matchId,
        });
      }

      const corridor = resolveCanonicalCorridor({
        reviewStage: matchRow.reviewStage,
        revealScope: 'shortlist_identity',
        surface: 'review_detail',
        fairnessStatus,
        operationalFallbackMode: null,
        introApproved: true,
      });
      const reviewCard = await buildReviewCardPayload({
        profileId: matchRow.profileId,
        reasonCodes: ['intro_accepted_masked'],
        fairnessStatus,
        revealScope: 'shortlist_identity',
      });

      return NextResponse.json({
        matchId: matchRow.matchId,
        reviewStage: matchRow.reviewStage,
        revealScope: 'shortlist_identity',
        visibleIdentityFields: getVisibleIdentityFields('shortlist_identity'),
        introWorkflowId: intro.id,
        introWorkflowState: 'conversation_open',
        introApproved: true,
        conversationId: resolvedConversationId,
        reviewCard,
        ...corridor,
        why: buildVisibilitySafeWhy({
          reasonCodes: ['intro_accepted_masked'],
          fairnessStatus,
          fallbackState: corridor.fallbackState,
        }),
        message:
          'Introduction approved. Masked messaging is open, and full identity stays locked until the candidate approves reveal.',
      });
    }

    if (payload.action === 'manual_override') {
      if (!payload.reasonCode) {
        return NextResponse.json(
          { error: 'reasonCode is required for manual overrides' },
          { status: 400 }
        );
      }

      await appendManualOverrideReason({
        matchId: matchRow.matchId,
        assignmentId: matchRow.assignmentId,
        profileId: matchRow.profileId,
        orgId: org.id,
        actorId: user.id,
        reasonCode: payload.reasonCode,
        annotation: payload.annotation ?? null,
        reviewStage: matchRow.reviewStage,
        revealScope: matchRow.revealScope,
        payload: {
          reviewStage: matchRow.reviewStage,
        },
      });
    } else {
      const actionToStage = {
        shortlist: { reviewStage: 'shortlisted', reasonCode: 'shortlist_selected' },
        unshortlist: { reviewStage: 'blind_review', reasonCode: 'passed_for_now' },
        pass: { reviewStage: 'passed', reasonCode: 'passed_for_now' },
        reject: { reviewStage: 'rejected', reasonCode: 'rejected_constraints' },
      } as const;

      const next = actionToStage[payload.action as keyof typeof actionToStage];
      await setMatchReviewStage({
        matchId: matchRow.matchId,
        actorId: user.id,
        actorRole: role,
        sourceSurface: 'org_review_route',
        reviewStage: next.reviewStage,
        reasonCode: next.reasonCode,
        annotation: payload.annotation ?? null,
      });
    }

    let fairnessEvaluation:
      | {
          id: string | null;
          status: 'pass' | 'unavailable' | 'elevated' | 'breach';
        }
      | undefined;

    try {
      const persisted = await persistFairnessEvaluationForAssignment({
        assignmentId: matchRow.assignmentId,
        actorId: user.id,
        actorType: 'user_account',
      });
      fairnessEvaluation = {
        id: persisted.id,
        status: persisted.status,
      };
    } catch (error) {
      log.error('org_review.fairness_persistence_failed', {
        matchId: matchRow.matchId,
        assignmentId: matchRow.assignmentId,
        error: sanitizeErrorForLog(error),
      });
      fairnessEvaluation = {
        id: null,
        status: normalizeFairnessStatus(matchRow.fairnessStatus),
      };
    }

    const updated = await db.query.matchReviewStates.findFirst({
      where: eq(matchReviewStates.matchId, matchRow.matchId),
      columns: {
        reviewStage: true,
        revealScope: true,
      },
    });

    const nextReviewStage = updated?.reviewStage ?? matchRow.reviewStage;
    const nextRevealScope = updated?.revealScope ?? matchRow.revealScope;
    const nextFairnessStatus = normalizeFairnessStatus(fairnessEvaluation.status);
    const corridor = resolveCanonicalCorridor({
      reviewStage: nextReviewStage,
      revealScope: nextRevealScope,
      surface: 'review_detail',
      fairnessStatus: nextFairnessStatus,
      operationalFallbackMode:
        matchRow.reviewOperationalFallbackMode ?? matchRow.assignmentOperationalFallbackMode,
    });
    const reasonCodes: string[] =
      payload.action === 'manual_override'
        ? payload.reasonCode
          ? [payload.reasonCode]
          : []
        : getReviewMutationReasonCodes(payload.action);
    const reviewCard = await buildReviewCardPayload({
      profileId: matchRow.profileId,
      reasonCodes,
      fairnessStatus: nextFairnessStatus,
      revealScope: nextRevealScope,
    });

    return NextResponse.json({
      matchId: matchRow.matchId,
      reviewStage: nextReviewStage,
      revealScope: nextRevealScope,
      visibleIdentityFields: getVisibleIdentityFields(nextRevealScope),
      reviewCard,
      ...corridor,
      why: buildVisibilitySafeWhy({
        reasonCodes,
        fairnessStatus: nextFairnessStatus,
        fallbackState: corridor.fallbackState,
      }),
      fairness: {
        status: fairnessEvaluation.status,
        evaluationId: fairnessEvaluation.id,
      },
    });
  } catch (error) {
    const routeParams = await params.catch(() => ({ id: 'unknown', matchId: 'unknown' }));
    return safeApiErrorResponse({
      event: 'org_review.mutation_failed',
      error,
      status: 500,
      publicMessage: 'Failed to update review state',
      context: {
        orgId: routeParams.id,
        matchId: routeParams.matchId,
      },
    });
  }
}
