import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, inArray, isNull } from 'drizzle-orm';

import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import {
  assignments,
  matchInterest,
  matchReviewStates,
  matches,
  organizationMembers,
  organizations,
  skills,
} from '@/db/schema';
import { evaluateAssignmentPolicy } from '@/lib/assignments/policy';
import { emitAnalyticsEventAsync } from '@/lib/analytics/events';
import { log } from '@/lib/log';
import {
  listCanonicalProofPackAggregatesForOwner,
  summarizeCanonicalProofOwnerAggregates,
} from '@/lib/proofs/canonical-pack';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';
import { checkVerificationGates } from '@/lib/verification/gates';
import {
  buildVisibilitySafeWhy,
  normalizeFairnessStatus,
  resolveCanonicalCorridor,
  resolveCanonicalFallbackState,
} from '@/lib/matching/review-contract';
import { syncIntroWorkflowFromInterest } from '@/lib/workflow/service';

export const dynamic = 'force-dynamic';

const InterestSchema = z.object({
  assignmentId: z.string().uuid(),
  targetProfileId: z.string().uuid().optional(), // Org -> candidate
});

async function hasOrgAccess(userId: string, orgId: string) {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.status, 'active')
    ),
  });

  return !!membership;
}

function buildPendingApprovalCopy(isOrgAction: boolean, mutual: boolean) {
  if (mutual) {
    return {
      title: 'Interest is mutual. Introduction approval is still gated.',
      body: 'Both sides are interested, but Proofound only opens the introduction after contextual review and intro approval.',
    };
  }

  return isOrgAction
    ? {
        title: 'Interest recorded.',
        body: 'The candidate will only see the introduction after the review corridor allows it.',
      }
    : {
        title: 'Interest recorded.',
        body: 'If the organization shortlists you and approves the introduction, the corridor will move forward from there.',
      };
}

type AssignmentSkillRequirement = {
  id?: string;
  skillId?: string;
  code?: string;
};

function normalizeSkillKey(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function extractRequiredSkillKeys(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  return Array.from(
    new Set(
      raw
        .map((entry) => {
          const requirement = entry as AssignmentSkillRequirement;
          return (
            normalizeSkillKey(requirement.id) ||
            normalizeSkillKey(requirement.skillId) ||
            normalizeSkillKey(requirement.code)
          );
        })
        .filter((value): value is string => Boolean(value))
    )
  );
}

async function getAssignmentRelevantProofLinkedSkillCount(
  profileId: string,
  assignment: typeof assignments.$inferSelect
) {
  const requiredSkillKeys = extractRequiredSkillKeys(assignment.mustHaveSkills);
  if (requiredSkillKeys.length === 0) {
    return {
      requiredSkillKeys,
      overlapCount: 0,
      assignmentEligible: true,
    };
  }

  const [skillRows, proofRows] = await Promise.all([
    db.query?.skills?.findMany?.({
      where: eq(skills.profileId, profileId),
    }) ?? [],
    listCanonicalProofPackAggregatesForOwner('individual_profile', profileId),
  ]);

  const nowMs = Date.now();
  const canonicalSummary = summarizeCanonicalProofOwnerAggregates(proofRows || []);
  const proofBackedSkillIds = new Set(
    canonicalSummary.subjectSummaries
      .filter(
        (summary) =>
          summary.subjectType === 'skill' &&
          summary.freshnessState !== 'expired' &&
          summary.subjectId
      )
      .map((summary) => summary.subjectId)
  );

  const recentProofLinkedSkillKeys = new Set(
    (skillRows || [])
      .filter((skill) => {
        if (!proofBackedSkillIds.has(skill.id)) return false;
        if (skill.relevance === 'current' || skill.relevance === 'emerging') return true;
        if (!skill.lastUsedAt) return false;
        const timestamp =
          skill.lastUsedAt instanceof Date
            ? skill.lastUsedAt.getTime()
            : new Date(skill.lastUsedAt).getTime();
        return Number.isFinite(timestamp) && timestamp >= nowMs - 3 * 365 * 24 * 60 * 60 * 1000;
      })
      .map(
        (skill) =>
          normalizeSkillKey(skill.skillCode) ||
          normalizeSkillKey(skill.skillId) ||
          normalizeSkillKey(skill.id)
      )
      .filter((value): value is string => Boolean(value))
  );

  const overlapCount = requiredSkillKeys.filter((key) =>
    recentProofLinkedSkillKeys.has(key)
  ).length;
  const minimumRequiredOverlap = requiredSkillKeys.length >= 2 ? 2 : 1;

  return {
    requiredSkillKeys,
    overlapCount,
    assignmentEligible: overlapCount >= minimumRequiredOverlap,
  };
}

function buildIntroBlockedCopy(
  isOrgAction: boolean,
  reasonCodes: string[]
): { title: string; body: string } {
  if (reasonCodes.includes('trust_regressed')) {
    return {
      title: 'Trust changed since this profile last qualified.',
      body: 'The profile is still visible in matching, but new introductions are paused until proof or trust signals are refreshed.',
    };
  }

  if (isOrgAction) {
    return {
      title: 'This candidate is reviewable, but not yet intro-eligible.',
      body: 'You can save this profile and keep reviewing it, but Proofound is holding introductions until the candidate has stronger relevant proof and at least one active trust anchor for this assignment.',
    };
  }

  return {
    title: 'You can keep browsing. Introductions unlock after stronger proof.',
    body: 'Your profile is visible, but it does not yet meet Proofound’s qualified introduction threshold. Add proof to more relevant skills and complete one trusted or attested proof to unlock introductions.',
  };
}

function buildPolicyBlockedCopy(decision: 'hold' | 'blocked') {
  return decision === 'blocked'
    ? {
        title: 'Introductions are blocked for this assignment.',
        body: 'Proofound is blocking new introductions until the organization or assignment policy issue is resolved.',
      }
    : {
        title: 'Introductions are on hold for this assignment.',
        body: 'Proofound is holding new introductions until the required trust or policy review is completed.',
      };
}

function buildGateBlockedCopy() {
  return {
    title: 'Introductions are blocked by trust requirements.',
    body: 'Proofound is pausing this introduction until the required verification gates are satisfied.',
  };
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const body = await request.json();
    const validated = InterestSchema.parse(body);
    const { assignmentId, targetProfileId } = validated;
    const isOrgAction = !!targetProfileId;

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (isOrgAction) {
      const canActForOrg = await hasOrgAccess(user.id, assignment.orgId);
      if (!canActForOrg) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      if (targetProfileId === user.id) {
        return NextResponse.json(
          { error: 'Cannot express interest in your own profile' },
          { status: 400 }
        );
      }

      const assignmentMatch = await db.query.matches.findFirst({
        where: and(eq(matches.assignmentId, assignmentId), eq(matches.profileId, targetProfileId!)),
      });

      if (!assignmentMatch) {
        return NextResponse.json(
          { error: 'Target profile not found for assignment' },
          { status: 404 }
        );
      }
    }

    const introductionProfileId = isOrgAction ? targetProfileId! : user.id;
    const [organization, gateCheck, introductionReadiness, assignmentQualification] =
      await Promise.all([
        db.query.organizations.findFirst({
          where: eq(organizations.id, assignment.orgId),
          columns: {
            id: true,
            trustStatus: true,
            orgTrustTier: true,
            verified: true,
          },
        }),
        checkVerificationGates(introductionProfileId, assignmentId),
        getIndividualReadinessState(introductionProfileId),
        getAssignmentRelevantProofLinkedSkillCount(
          introductionProfileId,
          assignment as typeof assignments.$inferSelect
        ),
      ]);

    const assignmentPolicy = evaluateAssignmentPolicy({
      assignment,
      organization: organization ?? null,
    });

    if (assignmentPolicy.decision !== 'allow') {
      const copy = buildPolicyBlockedCopy(
        assignmentPolicy.decision === 'blocked' ? 'blocked' : 'hold'
      );
      return NextResponse.json(
        {
          error:
            assignmentPolicy.decision === 'blocked'
              ? 'INTRO_BLOCKED_BY_POLICY'
              : 'INTRO_ON_HOLD_BY_POLICY',
          decision: assignmentPolicy.decision,
          browseStillAvailable: true,
          copy,
          reasonCodes: assignmentPolicy.reasons.map((reason) => reason.code),
          policy: assignmentPolicy,
          message: copy.body,
        },
        { status: assignmentPolicy.decision === 'blocked' ? 403 : 409 }
      );
    }

    if (!gateCheck.canIntroduce) {
      const copy = buildGateBlockedCopy();
      return NextResponse.json(
        {
          error: 'INTRO_VERIFICATION_GATE_BLOCKED',
          decision: 'blocked',
          browseStillAvailable: true,
          copy,
          unmetGates: gateCheck.unmetGates,
          userVerifications: gateCheck.userVerifications,
          message:
            gateCheck.blockingMessage ||
            'Verification gates are not satisfied for this assignment.',
        },
        { status: 409 }
      );
    }
    const profileEligible = introductionReadiness.introEligibility.profileEligible;
    const assignmentEligible =
      assignmentQualification.requiredSkillKeys.length === 0
        ? profileEligible
        : profileEligible && assignmentQualification.assignmentEligible;

    if (!profileEligible || !assignmentEligible) {
      const reasonCodes = Array.from(
        new Set([
          ...introductionReadiness.introEligibility.reasonCodes,
          ...(!assignmentEligible && assignmentQualification.requiredSkillKeys.length > 0
            ? ['assignment_relevant_proof_insufficient']
            : []),
        ])
      );
      const copy = buildIntroBlockedCopy(isOrgAction, reasonCodes);
      const introEligibility = {
        ...introductionReadiness.introEligibility,
        status:
          profileEligible && !assignmentEligible
            ? ('blocked_assignment' as const)
            : 'blocked_profile',
        profileEligible,
        assignmentEligible,
        reasonCodes,
        assignmentRelevantProofLinkedL4Count: assignmentQualification.overlapCount,
      };

      emitAnalyticsEventAsync({
        eventType: 'intro_qualification_blocked',
        userId: user.id,
        profileId: introductionProfileId,
        entityType: 'assignment',
        entityId: assignmentId,
        properties: {
          assignment_id: assignmentId,
          current_trust_level: introductionReadiness.trustLevel,
          previous_trust_level: introductionReadiness.trustLevel,
          new_trust_level: introductionReadiness.trustLevel,
          profile_eligible: profileEligible,
          assignment_eligible: assignmentEligible,
          reason_codes: reasonCodes,
          qualifying_proof_linked_l4_count:
            introductionReadiness.counts.qualifyingProofLinkedL4Count,
          role_relevant_proof_linked_l4_count:
            introductionReadiness.counts.roleRelevantProofLinkedL4Count,
          assignment_relevant_proof_linked_l4_count: assignmentQualification.overlapCount,
          active_trust_anchor_count: introductionReadiness.counts.activeTrustAnchorCount,
          actor_type: isOrgAction ? 'organization' : 'candidate',
        },
      });

      return NextResponse.json(
        {
          error: 'INTRO_QUALIFICATION_NOT_MET',
          currentTrustLevel: introductionReadiness.trustLevel,
          profileEligible,
          assignmentEligible,
          reasonCodes,
          missingRequirements: introEligibility.missingRequirements,
          nextActions: introEligibility.nextActions,
          browseStillAvailable: true,
          copy,
          message: copy.body,
          introEligibility,
          readiness: introductionReadiness,
        },
        { status: 409 }
      );
    }

    const interestResult = await db.transaction(async (tx) => {
      await tx
        .insert(matchInterest)
        .values({
          actorProfileId: user.id,
          assignmentId,
          targetProfileId: targetProfileId || null,
        })
        .onConflictDoNothing({
          target: [
            matchInterest.actorProfileId,
            matchInterest.assignmentId,
            matchInterest.targetProfileId,
          ],
        });

      if (isOrgAction) {
        const reciprocal = await tx.query.matchInterest.findFirst({
          where: and(
            eq(matchInterest.actorProfileId, targetProfileId!),
            eq(matchInterest.assignmentId, assignmentId),
            isNull(matchInterest.targetProfileId)
          ),
        });

        return {
          mutual: !!reciprocal,
          reciprocalActorProfileId: reciprocal?.actorProfileId ?? null,
        };
      }

      const reciprocalInterests = await tx.query.matchInterest.findMany({
        where: and(
          eq(matchInterest.assignmentId, assignmentId),
          eq(matchInterest.targetProfileId, user.id)
        ),
      });

      if (reciprocalInterests.length === 0) {
        return {
          mutual: false,
          reciprocalActorProfileId: null,
        };
      }

      const reciprocalActorIds = Array.from(
        new Set(reciprocalInterests.map((interest) => interest.actorProfileId))
      );

      const activeOrgMembers =
        reciprocalActorIds.length > 0
          ? await tx.query.organizationMembers.findMany({
              where: and(
                inArray(organizationMembers.userId, reciprocalActorIds),
                eq(organizationMembers.orgId, assignment.orgId),
                eq(organizationMembers.status, 'active')
              ),
            })
          : [];

      const activeOrgActorIds = new Set(activeOrgMembers.map((member) => member.userId));
      const reciprocal = reciprocalInterests.find((interest) =>
        activeOrgActorIds.has(interest.actorProfileId)
      );

      if (!reciprocal) {
        return {
          mutual: false,
          reciprocalActorProfileId: null,
        };
      }

      return {
        mutual: true,
        reciprocalActorProfileId: reciprocal.actorProfileId,
      };
    });

    log.info('match.interest.recorded', {
      userId: user.id,
      assignmentId,
      targetProfileId: targetProfileId || null,
      mutualInterest: interestResult.mutual,
    });

    if (!interestResult.mutual) {
      return NextResponse.json({ revealed: false });
    }

    const individualId = isOrgAction ? targetProfileId! : user.id;
    const orgRepId = isOrgAction ? user.id : interestResult.reciprocalActorProfileId;

    if (!orgRepId) {
      return NextResponse.json({ revealed: false });
    }

    const [match] = await db
      .select({
        id: matches.id,
        assignmentId: matches.assignmentId,
        profileId: matches.profileId,
        score: matches.score,
        vector: matches.vector,
        fairnessStatus: matches.fairnessStatus,
        reviewStage: matchReviewStates.reviewStage,
        revealScope: matchReviewStates.revealScope,
        operationalFallbackMode: matchReviewStates.operationalFallbackMode,
      })
      .from(matches)
      .leftJoin(matchReviewStates, eq(matchReviewStates.matchId, matches.id))
      .where(and(eq(matches.assignmentId, assignmentId), eq(matches.profileId, individualId)))
      .limit(1);

    const counterpartId = isOrgAction ? individualId : orgRepId;

    const fairnessStatus = normalizeFairnessStatus(match?.fairnessStatus);
    const fallbackState = resolveCanonicalFallbackState({
      operationalFallbackMode: match?.operationalFallbackMode,
      fairnessStatus,
    });
    const introAllowed =
      Boolean(match) &&
      match?.reviewStage === 'shortlisted' &&
      match?.revealScope === 'shortlist_identity' &&
      !fallbackState;

    if (!match || !introAllowed) {
      const copy = buildPendingApprovalCopy(isOrgAction, interestResult.mutual);
      return NextResponse.json({
        revealed: false,
        mutual: interestResult.mutual,
        introApproved: false,
        requiresIntroApproval: true,
        ...(match
          ? {
              matchId: match.id,
              ...resolveCanonicalCorridor({
                reviewStage: match.reviewStage ?? 'blind_review',
                revealScope: match.revealScope ?? 'blind',
                surface: 'review_detail',
                fairnessStatus,
                operationalFallbackMode: match.operationalFallbackMode,
                introRequested: interestResult.mutual,
              }),
              why: buildVisibilitySafeWhy({
                reasonCodes: ['shortlist_selected'],
                fairnessStatus,
                fallbackState,
              }),
            }
          : {}),
        copy,
        message: copy.body,
      });
    }

    const intro = await syncIntroWorkflowFromInterest({
      assignmentId,
      candidateProfileId: individualId,
      orgId: assignment.orgId,
      actorType: isOrgAction ? 'organization_member' : 'candidate',
      actorId: user.id,
      mutual: true,
      matchId: match.id,
    });

    return NextResponse.json({
      revealed: false,
      mutual: true,
      introApproved: false,
      requiresIntroApproval: true,
      matchId: match.id,
      counterpartId,
      introWorkflowId: intro.id,
      introWorkflowState: intro.state,
      ...resolveCanonicalCorridor({
        reviewStage: match.reviewStage ?? 'blind_review',
        revealScope: match.revealScope ?? 'blind',
        surface: 'review_detail',
        fairnessStatus,
        operationalFallbackMode: match.operationalFallbackMode,
        introRequested: true,
      }),
      why: buildVisibilitySafeWhy({
        reasonCodes: ['shortlist_selected'],
        fairnessStatus,
        fallbackState,
      }),
      copy: buildPendingApprovalCopy(isOrgAction, true),
      message:
        'Interest is mutual. The organization still needs to approve the introduction from the shortlist corridor.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    log.error('match.interest.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to record interest' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
    }

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const canAccess = await hasOrgAccess(user.id, assignment.orgId);
    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const interests = await db.query.matchInterest.findMany({
      where: eq(matchInterest.assignmentId, assignmentId),
    });

    return NextResponse.json({ items: interests });
  } catch (error) {
    log.error('match.interest.list.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch interests' }, { status: 500 });
  }
}
