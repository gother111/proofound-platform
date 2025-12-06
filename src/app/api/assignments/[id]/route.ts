import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import {
  assignments,
  organizationMembers,
  matchingProfiles,
  skills,
  matches,
  organizations,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/log';
import { emitAssignmentPublished } from '@/lib/analytics/events';
import { notifyAssignmentPublished } from '@/lib/notifications';
import {
  scoreValues,
  scoreCauses,
  scoreSkills,
  scoreExperience,
  scoreVerifications,
  scoreAvailability,
  scoreLocation,
  scoreCompensation,
  scoreLanguage,
  composeWeighted,
  compareMatches,
  type Skill,
  type DateWindow,
  type Range,
  type LocationMode,
} from '@/lib/core/matching/scorers';
import { getPreset } from '@/lib/core/matching/presets';

export const dynamic = 'force-dynamic';

/**
 * Track if assignment was already activated (to avoid duplicate events)
 */
const activatedAssignments = new Set<string>();

/**
 * Generate matches for an assignment
 * Finds all matching profiles and stores top matches in database
 */
async function generateMatchesForAssignment(assignmentId: string): Promise<number> {
  try {
    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      log.error('generate.matches.assignment.not.found', { assignmentId });
      return 0;
    }

    // Delete existing matches for this assignment (in case of re-activation)
    await db.delete(matches).where(eq(matches.assignmentId, assignmentId));

    // Fetch all matching profiles
    // TODO: Add status field to matchingProfiles table and filter by active status
    const allProfiles = await db.query.matchingProfiles.findMany();

    if (allProfiles.length === 0) {
      log.info('generate.matches.no.profiles', { assignmentId });
      return 0;
    }

    // Use default weights for assignment matching
    const weights = (assignment.weights as Record<string, number>) || getPreset('balanced');

    const matchResults: Array<{
      profileId: string;
      score: number;
      vector: Record<string, any>;
    }> = [];

    // Score each profile against the assignment
    for (const profile of allProfiles) {
      // Fetch profile's skills
      const userSkills = await db.query.skills.findMany({
        where: eq(skills.profileId, profile.profileId),
      });

      const skillsMap: Record<string, Skill> = {};
      for (const skill of userSkills) {
        skillsMap[skill.skillId] = {
          id: skill.skillId,
          level: skill.level,
          months: skill.monthsExperience,
        };
      }

      // Apply hard filters
      const mustHaveSkills = (assignment.mustHaveSkills as Skill[]) || [];
      const niceToHaveSkills = (assignment.niceToHaveSkills as Skill[]) || [];

      const skillScore = scoreSkills(mustHaveSkills, niceToHaveSkills, skillsMap);

      if (skillScore.hardFail) {
        continue; // Skip profiles that don't meet must-haves
      }

      // Compute subscores
      const subscores: Record<string, number> = {
        values: scoreValues(profile.valuesTags || [], assignment.valuesRequired || []),
        causes: scoreCauses(profile.causeTags || [], assignment.causeTags || []),
        skills: skillScore.score,
        experience: scoreExperience(
          Object.values(skillsMap).reduce((sum, s) => sum + (s.months || 0), 0) /
            Math.max(Object.keys(skillsMap).length, 1)
        ),
        verifications: scoreVerifications(
          assignment.verificationGates || [],
          (profile.verified as Record<string, boolean>) || {}
        ),
      };

      // Availability
      if (assignment.startEarliest && assignment.startLatest && profile.availabilityEarliest) {
        subscores.availability = scoreAvailability(
          {
            earliest: new Date(assignment.startEarliest),
            latest: new Date(assignment.startLatest),
          } as DateWindow,
          new Date(profile.availabilityEarliest),
          {
            min: assignment.hoursMin || 0,
            max: assignment.hoursMax || 40,
          } as Range,
          {
            min: profile.hoursMin || 0,
            max: profile.hoursMax || 40,
          } as Range
        );
      } else {
        subscores.availability = 1.0;
      }

      // Location
      if (assignment.locationMode && profile.workMode) {
        subscores.location = scoreLocation(
          assignment.locationMode as LocationMode,
          profile.workMode as LocationMode,
          assignment.country || undefined,
          profile.country || undefined
        );
      } else {
        subscores.location = 1.0;
      }

      // Compensation
      if (assignment.compMin && assignment.compMax && profile.compMin && profile.compMax) {
        subscores.compensation = scoreCompensation(
          { min: assignment.compMin, max: assignment.compMax } as Range,
          { min: profile.compMin, max: profile.compMax } as Range
        );
      } else {
        subscores.compensation = 1.0;
      }

      // Language
      if (assignment.minLanguage && profile.languages) {
        const minLang = assignment.minLanguage as { code: string; level: string };
        const candidateLangs = profile.languages as Array<{ code: string; level: string }>;
        const matchingLang = candidateLangs.find((l) => l.code === minLang.code);

        subscores.language = matchingLang ? scoreLanguage(minLang.level, matchingLang.level) : 0;
      } else {
        subscores.language = 1.0;
      }

      // Compose weighted score
      const composed = composeWeighted(subscores, weights);

      matchResults.push({
        profileId: profile.profileId,
        score: composed.total,
        vector: {
          subscores,
          contributions: composed.contributions,
          gaps: skillScore.gaps,
          missing: skillScore.missing,
        },
      });
    }

    // Sort by score (descending)
    matchResults.sort((a, b) =>
      compareMatches(
        { score: a.score, assignmentId, profileId: a.profileId },
        { score: b.score, assignmentId, profileId: b.profileId }
      )
    );

    // Store top 100 matches in database
    const topMatches = matchResults.slice(0, 100);

    if (topMatches.length > 0) {
      const matchInserts = topMatches.map((match) => ({
        assignmentId,
        profileId: match.profileId,
        score: match.score.toString(),
        vector: match.vector,
        weights,
      }));

      await db.insert(matches).values(matchInserts);

      log.info('generate.matches.success', {
        assignmentId,
        totalCandidates: allProfiles.length,
        matchesGenerated: topMatches.length,
      });
    }

    return topMatches.length;
  } catch (error) {
    log.error('generate.matches.failed', {
      assignmentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 0;
  }
}

/**
 * Check if assignment meets PRD-strict activation criteria and emit event
 * Criteria:
 * - Role & description complete
 * - ≥5 must-have L4 skills defined
 * - Location & compensation set
 * - Status = 'active'
 */
async function checkAndEmitAssignmentActivation(
  assignmentId: string,
  orgId: string,
  createdAt: Date
): Promise<void> {
  if (activatedAssignments.has(assignmentId)) return;

  try {
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (!assignment || assignment.status !== 'active') return;

    // Check 1: Role & description complete
    const hasCompleteDetails = !!assignment.role && !!assignment.description;
    if (!hasCompleteDetails) return;

    // Check 2: ≥5 must-have skills defined
    const mustHaveSkills = (assignment.mustHaveSkills as any[]) || [];
    const hasMinimumSkills = mustHaveSkills.length >= 5;
    if (!hasMinimumSkills) return;

    // Check 3: Location & compensation set
    const hasLocationAndComp =
      (assignment.locationMode || assignment.country) &&
      (assignment.compMin !== null || assignment.compMax !== null);
    if (!hasLocationAndComp) return;

    // Calculate publish time (time from creation to activation)
    const publishTime = Date.now() - createdAt.getTime();
    const publishTimeMinutes = Math.floor(publishTime / (1000 * 60));
    const publishedWithinTimeTarget = publishTimeMinutes <= 15; // ≤15 minutes

    // Use assignment owner as userId for analytics; falls back to org owner if needed
    const assignmentOwnerId = assignment.ownerId ?? orgId;

    await emitAssignmentPublished(assignmentOwnerId, assignmentId, orgId, {
      hasCompleteDetails,
      hasMinimumSkills,
      mustHaveSkillsCount: mustHaveSkills.length,
      hasLocationAndComp,
      publishTimeMinutes,
      publishedWithinTimeTarget,
    });

    activatedAssignments.add(assignmentId);

    // Generate matches for this assignment
    const matchesGenerated = await generateMatchesForAssignment(assignmentId);

    // Get organization name for notifications
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });
    const orgName = org?.displayName || 'An organization';

    // Send notifications to top 10 matching candidates
    if (matchesGenerated > 0) {
      const topMatches = await db.query.matches.findMany({
        where: eq(matches.assignmentId, assignmentId),
        orderBy: (t: any, { desc }) => [desc(t.score)],
        limit: 10,
      });

      for (const match of topMatches) {
        try {
          await notifyAssignmentPublished(match.profileId, assignmentId, assignment.role, orgName);
        } catch (notifyError) {
          log.error('assignment.notification.failed', {
            profileId: match.profileId,
            assignmentId,
            error: notifyError instanceof Error ? notifyError.message : 'Unknown error',
          });
          // Continue with other notifications even if one fails
        }
      }

      log.info('assignment.notifications.sent', {
        assignmentId,
        notificationsSent: topMatches.length,
      });
    }
  } catch (error) {
    log.error('assignment-activation-check.failed', {
      assignmentId,
      orgId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Validation schema (same as POST, but all fields optional for PATCH)
const AssignmentUpdateSchema = z.object({
  role: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'closed']).optional(),
  valuesRequired: z.array(z.string()).optional(),
  causeTags: z.array(z.string()).optional(),
  mustHaveSkills: z
    .array(
      z.object({
        id: z.string(),
        level: z.number().min(0).max(5),
      })
    )
    .optional(),
  niceToHaveSkills: z
    .array(
      z.object({
        id: z.string(),
        level: z.number().min(0).max(5),
      })
    )
    .optional(),
  minLanguage: z
    .object({
      code: z.string(),
      level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    })
    .optional(),
  locationMode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  radiusKm: z.number().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  compMin: z.number().optional(),
  compMax: z.number().optional(),
  currency: z.string().optional(),
  hoursMin: z.number().optional(),
  hoursMax: z.number().optional(),
  startEarliest: z.string().optional(),
  startLatest: z.string().optional(),
  verificationGates: z.array(z.string()).optional(),
  weights: z.record(z.number()).optional(),
});

/**
 * Helper to verify user owns the assignment's organization
 */
async function verifyAssignmentAccess(userId: string, assignmentId: string): Promise<boolean> {
  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, assignmentId),
  });

  if (!assignment) {
    return false;
  }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.orgId, assignment.orgId),
      eq(organizationMembers.status, 'active')
    ),
  });

  return !!membership;
}

/**
 * PUT /api/assignments/[id]
 *
 * Updates an assignment.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let assignmentId: string | undefined;
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    assignmentId = resolvedParams.id;

    // Verify access
    const hasAccess = await verifyAssignmentAccess(user.id, assignmentId);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = AssignmentUpdateSchema.parse(body);

    // Convert date strings to Date objects
    const updateData = {
      ...validatedData,
      startEarliest: validatedData.startEarliest,
      startLatest: validatedData.startLatest,
      updatedAt: new Date(),
    };

    // Update assignment
    const [updatedAssignment] = await db
      .update(assignments)
      .set(updateData)
      .where(eq(assignments.id, assignmentId))
      .returning();

    log.info('assignment.updated', {
      assignmentId,
      userId: user.id,
    });

    // Check if assignment now meets activation criteria
    if (validatedData.status === 'active' || updatedAssignment.status === 'active') {
      await checkAndEmitAssignmentActivation(
        assignmentId,
        updatedAssignment.orgId,
        updatedAssignment.createdAt
      );
    }

    return NextResponse.json({ assignment: updatedAssignment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    log.error('assignment.update.failed', {
      assignmentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

/**
 * DELETE /api/assignments/[id]
 *
 * Deletes an assignment.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let assignmentId: string | undefined;
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    assignmentId = resolvedParams.id;

    // Verify access
    const hasAccess = await verifyAssignmentAccess(user.id, assignmentId);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
    }

    // Delete assignment (cascade will delete related matches and interests)
    await db.delete(assignments).where(eq(assignments.id, assignmentId));

    log.info('assignment.deleted', {
      assignmentId,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('assignment.delete.failed', {
      assignmentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
