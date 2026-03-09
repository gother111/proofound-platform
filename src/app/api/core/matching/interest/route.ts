import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import {
  assignments,
  conversations,
  matchInterest,
  matches,
  organizationMembers,
  profiles,
  skillProofs,
  skills,
} from '@/db/schema';
import { emitAnalyticsEventAsync, emitMatchActioned } from '@/lib/analytics/events';
import { log } from '@/lib/log';
import { notifyIntroAccepted } from '@/lib/notifications';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';

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
    db.query?.skillProofs?.findMany?.({
      where: eq(skillProofs.profileId, profileId),
    }) ?? [],
  ]);

  const nowMs = Date.now();
  const proofBackedSkillIds = new Set(
    (proofRows || [])
      .filter((proof) => {
        const expiresAt = proof.expiresDate ? new Date(proof.expiresDate).getTime() : null;
        return expiresAt === null || expiresAt >= nowMs;
      })
      .map((proof) => proof.skillId)
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
    }

    const introductionProfileId = isOrgAction ? targetProfileId! : user.id;
    const [introductionReadiness, assignmentQualification] = await Promise.all([
      getIndividualReadinessState(introductionProfileId),
      getAssignmentRelevantProofLinkedSkillCount(
        introductionProfileId,
        assignment as typeof assignments.$inferSelect
      ),
    ]);
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
      .select()
      .from(matches)
      .where(and(eq(matches.assignmentId, assignmentId), eq(matches.profileId, individualId)))
      .limit(1);

    const counterpartId = isOrgAction ? individualId : orgRepId;

    if (match) {
      const vector = (match.vector as Record<string, unknown>) || {};
      const subscores = (vector.subscores as Record<string, number>) || {};
      const pacScore = subscores.purpose_alignment || subscores.pac || 0;
      const score = Number(match.score);
      const qualificationMet = score >= 0.7;

      await emitMatchActioned(user.id, match.id, {
        match_id: match.id,
        action: 'introduce',
        match_score: score,
        pac_value: pacScore,
      });

      if (counterpartId !== user.id) {
        await emitMatchActioned(counterpartId, match.id, {
          match_id: match.id,
          action: 'introduce',
          match_score: score,
          pac_value: pacScore,
        });
      }

      if (qualificationMet) {
        const { emitFirstQualifiedIntroAsync } = await import('@/lib/analytics/events');
        emitFirstQualifiedIntroAsync(user.id, match.id, assignmentId);
      }

      try {
        const [actorProfile, counterpartProfile] = await Promise.all([
          db.query.profiles.findFirst({ where: eq(profiles.id, user.id) }),
          db.query.profiles.findFirst({ where: eq(profiles.id, counterpartId) }),
        ]);

        const actorName = actorProfile?.displayName || actorProfile?.handle || 'Someone';
        const counterpartName =
          counterpartProfile?.displayName || counterpartProfile?.handle || 'Someone';

        await notifyIntroAccepted(user.id, match.id, counterpartName);
        if (counterpartId !== user.id) {
          await notifyIntroAccepted(counterpartId, match.id, actorName);
        }
      } catch (notifError) {
        log.error('mutual-interest-notification.failed', {
          error: notifError instanceof Error ? notifError.message : 'Unknown error',
        });
      }
    }

    try {
      const existingConversation = await db.query.conversations.findFirst({
        where: and(
          eq(conversations.assignmentId, assignmentId),
          or(
            and(
              eq(conversations.participantOneId, individualId),
              eq(conversations.participantTwoId, orgRepId)
            ),
            and(
              eq(conversations.participantOneId, orgRepId),
              eq(conversations.participantTwoId, individualId)
            )
          )
        ),
      });

      let conversationId: string;

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        const [newConversation] = await db
          .insert(conversations)
          .values({
            matchId: match?.id ?? null,
            assignmentId,
            participantOneId: individualId,
            participantTwoId: orgRepId,
            stage: 'masked',
            maskedHandleOne: `Candidate #${nanoid(6).toUpperCase()}`,
            maskedHandleTwo: `Organization #${nanoid(6).toUpperCase()}`,
            lastMessageAt: new Date(),
          })
          .returning();

        conversationId = newConversation.id;
      }

      return NextResponse.json({
        revealed: true,
        conversationId,
        ...(match ? { matchId: match.id } : {}),
      });
    } catch (convError) {
      log.error('conversation.creation.failed', {
        assignmentId,
        userId: user.id,
        error: convError instanceof Error ? convError.message : 'Unknown error',
      });

      return NextResponse.json({
        revealed: true,
        ...(match ? { matchId: match.id } : {}),
      });
    }
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
