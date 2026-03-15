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
import { emitFirstQualifiedIntroAsync, emitMatchActioned } from '@/lib/analytics/events';
import { log } from '@/lib/log';
import {
  appendManualOverrideReason,
  buildVisibilitySafeWhy,
  getOrgMembershipRole,
  normalizeFairnessStatus,
  resolveCanonicalCorridor,
  resolveCanonicalFallbackState,
  getVisibleIdentityFields,
  persistFairnessEvaluationForAssignment,
  recordRevealEvent,
  setMatchReviewStage,
} from '@/lib/matching/review-contract';
import { notifyIntroAccepted } from '@/lib/notifications';
import {
  getOrCreateIntroWorkflow,
  openIntroConversation,
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

    const [matchRow] = await db
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
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const payload = parsed.data;

    if (payload.action === 'reveal_request') {
      const requestedScope = payload.requestedScope ?? 'full_identity';
      const fairnessStatus = normalizeFairnessStatus(matchRow.fairnessStatus);
      const [activeConversation] = await db
        .select({
          id: conversations.id,
          stage: conversations.stage,
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

      if (activeConversation.stage === 'revealed' || matchRow.revealScope === 'full_identity') {
        const corridor = resolveCanonicalCorridor({
          reviewStage: matchRow.reviewStage,
          revealScope: 'full_identity',
          surface: 'review_detail',
          fairnessStatus,
          operationalFallbackMode:
            matchRow.reviewOperationalFallbackMode ?? matchRow.assignmentOperationalFallbackMode,
          introApproved: true,
        });

        return NextResponse.json({
          matchId: matchRow.matchId,
          reviewStage: matchRow.reviewStage,
          revealScope: 'full_identity',
          visibleIdentityFields: getVisibleIdentityFields('full_identity'),
          conversationId: activeConversation.id,
          ...corridor,
          why: buildVisibilitySafeWhy({
            reasonCodes: ['reveal_full_identity'],
            fairnessStatus,
            fallbackState: corridor.fallbackState,
          }),
          message: 'Identity is already revealed for this introduction.',
        });
      }

      const orgParticipantIsOne = activeConversation.participantOneId !== matchRow.profileId;
      const orgRevealAlreadyRequested = orgParticipantIsOne
        ? activeConversation.participantOneWantsReveal
        : activeConversation.participantTwoWantsReveal;

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
          .where(eq(conversations.id, activeConversation.id));
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
          conversationId: activeConversation.id,
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

      return NextResponse.json({
        matchId: matchRow.matchId,
        reviewStage: matchRow.reviewStage,
        revealScope: matchRow.revealScope,
        visibleIdentityFields: getVisibleIdentityFields(matchRow.revealScope),
        conversationId: activeConversation.id,
        waitingForCandidateApproval: true,
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

        return NextResponse.json(
          {
            error: !stage2Ready
              ? 'Intro requests are only allowed after contextual reveal at Stage 2.'
              : 'Intro request is on hold while fallback protections are active.',
            matchId: matchRow.matchId,
            reviewStage: matchRow.reviewStage,
            revealScope: matchRow.revealScope,
            visibleIdentityFields: getVisibleIdentityFields(matchRow.revealScope),
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

        return NextResponse.json({
          matchId: matchRow.matchId,
          reviewStage: matchRow.reviewStage,
          revealScope: matchRow.revealScope,
          visibleIdentityFields: getVisibleIdentityFields(matchRow.revealScope),
          introWorkflowId: intro.id,
          introWorkflowState: intro.state,
          introApproved: false,
          requiresCandidateInterest: true,
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

      const conversationId =
        existingConversation?.id ??
        (
          await db
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
            })
        )[0].id;

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
        conversationId,
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
          error: error instanceof Error ? error.message : 'Unknown error',
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

      return NextResponse.json({
        matchId: matchRow.matchId,
        reviewStage: matchRow.reviewStage,
        revealScope: 'shortlist_identity',
        visibleIdentityFields: getVisibleIdentityFields('shortlist_identity'),
        introWorkflowId: intro.id,
        introWorkflowState: 'conversation_open',
        introApproved: true,
        conversationId,
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
      console.error('org review fairness persistence failed', {
        matchId: matchRow.matchId,
        assignmentId: matchRow.assignmentId,
        error: error instanceof Error ? error.message : 'unknown_error',
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

    return NextResponse.json({
      matchId: matchRow.matchId,
      reviewStage: updated?.reviewStage ?? matchRow.reviewStage,
      revealScope: updated?.revealScope ?? matchRow.revealScope,
      visibleIdentityFields: getVisibleIdentityFields(updated?.revealScope ?? matchRow.revealScope),
      ...resolveCanonicalCorridor({
        reviewStage: updated?.reviewStage ?? matchRow.reviewStage,
        revealScope: updated?.revealScope ?? matchRow.revealScope,
        surface: 'review_detail',
        fairnessStatus: normalizeFairnessStatus(fairnessEvaluation.status),
        operationalFallbackMode:
          matchRow.reviewOperationalFallbackMode ?? matchRow.assignmentOperationalFallbackMode,
      }),
      fairness: {
        status: fairnessEvaluation.status,
        evaluationId: fairnessEvaluation.id,
      },
    });
  } catch (error) {
    console.error('org review mutation failed', error);
    return NextResponse.json({ error: 'Failed to update review state' }, { status: 500 });
  }
}
