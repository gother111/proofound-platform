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
import { triggerFirstAssignmentSurvey } from '@/lib/surveys/sus-triggers';
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

// Validation schemas
const SkillRequirementSchema = z.object({
  id: z.string(),
  level: z.number().min(0).max(5),
});

const LanguageRequirementSchema = z.object({
  code: z.string(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
});

const AssignmentSchema = z.object({
  role: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'closed']).optional(),
  valuesRequired: z.array(z.string()).optional(),
  causeTags: z.array(z.string()).optional(),
  mustHaveSkills: z.array(SkillRequirementSchema).optional(),
  niceToHaveSkills: z.array(SkillRequirementSchema).optional(),
  minLanguage: LanguageRequirementSchema.optional(),
  locationMode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  radiusKm: z.number().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  compMin: z.number().optional(),
  compMax: z.number().optional(),
  currency: z.string().optional(),
  hoursMin: z.number().optional(),
  hoursMax: z.number().optional(),
  startEarliest: z.string().optional(), // ISO date string
  startLatest: z.string().optional(),
  verificationGates: z.array(z.string()).optional(),
  weights: z.record(z.number()).optional(),
});

/**
 * Helper to get user's organization ID
 */
async function getUserOrgId(userId: string): Promise<string | null> {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(eq(organizationMembers.userId, userId), eq(organizationMembers.status, 'active')),
  });

  return membership?.orgId || null;
}

/**
 * Generate matches for a newly created assignment
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
 * GET /api/assignments
 *
 * Returns assignments for the current user's organization with pagination.
 * Query params:
 * - limit: Number of items to return (default: 20, max: 100)
 * - offset: Number of items to skip (default: 0)
 * - status: Filter by status (draft, active, paused, closed)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check if user is a member of an organization
    const orgId = await getUserOrgId(user.id);

    if (!orgId) {
      return NextResponse.json({ items: [], hasMore: false });
    }

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const statusFilter = searchParams.get('status');

    // Build query
    let query = db.select().from(assignments).where(eq(assignments.orgId, orgId)).$dynamic();

    // Add status filter if provided
    if (statusFilter && ['draft', 'active', 'paused', 'closed'].includes(statusFilter)) {
      query = query.where(
        and(eq(assignments.orgId, orgId), eq(assignments.status, statusFilter as any))
      );
    }

    // Fetch assignments with pagination (fetch one extra to check if there are more)
    const orgAssignments = await query
      .orderBy((t: any) => t.createdAt)
      .limit(limit + 1)
      .offset(offset);

    // Check if there are more results
    const hasMore = orgAssignments.length > limit;
    const assignmentsToReturn = hasMore ? orgAssignments.slice(0, limit) : orgAssignments;

    return NextResponse.json({
      items: assignmentsToReturn,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (error) {
    log.error('assignments.list.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

/**
 * POST /api/assignments
 *
 * Creates a new assignment for the current user's organization.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check if user is a member of an organization
    const orgId = await getUserOrgId(user.id);

    if (!orgId) {
      return NextResponse.json(
        { error: 'You must be a member of an organization to create assignments' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = AssignmentSchema.parse(body);

    // Convert date strings to Date objects
    const assignmentData = {
      orgId,
      ...validatedData,
      startEarliest: validatedData.startEarliest,
      startLatest: validatedData.startLatest,
    };

    // Insert assignment in a transaction (though this is a single operation,
    // we wrap it for consistency and potential future multi-step operations)
    const [newAssignment] = await db.insert(assignments).values(assignmentData).returning();

    log.info('assignment.created', {
      assignmentId: newAssignment.id,
      orgId,
      role: newAssignment.role,
    });

    // Check if this is the organization's first assignment and trigger SUS survey
    try {
      const existingAssignments = await db
        .select({ id: assignments.id })
        .from(assignments)
        .where(eq(assignments.orgId, orgId))
        .limit(2); // Just need to know if there are 1 or more

      if (existingAssignments.length === 1) {
        // This is the first assignment - trigger SUS survey for the user who created it
        await triggerFirstAssignmentSurvey(user.id);
      }
    } catch (error) {
      log.error('sus_survey.first_assignment_check_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: user.id,
        orgId,
      });
      // Don't let survey trigger failure break assignment creation
    }

    // Check if assignment was created with 'active' status and meets activation criteria
    if (newAssignment.status === 'active') {
      const hasCompleteDetails = !!newAssignment.role && !!newAssignment.description;
      const mustHaveSkills = (newAssignment.mustHaveSkills as any[]) || [];
      const hasMinimumSkills = mustHaveSkills.length >= 5;
      const hasLocationAndComp =
        (newAssignment.locationMode || newAssignment.country) &&
        (newAssignment.compMin !== null || newAssignment.compMax !== null);

      if (hasCompleteDetails && hasMinimumSkills && hasLocationAndComp) {
        const publishTimeMinutes = 0; // Created and published simultaneously
        await emitAssignmentPublished(orgId, newAssignment.id, {
          hasCompleteDetails,
          hasMinimumSkills,
          mustHaveSkillsCount: mustHaveSkills.length,
          hasLocationAndComp,
          publishTimeMinutes,
          publishedWithinTimeTarget: true, // Immediate publish
        });

        // Generate matches for this assignment
        const matchesGenerated = await generateMatchesForAssignment(newAssignment.id);

        // Get organization name for notifications
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.id, orgId),
        });
        const orgName = org?.displayName || 'An organization';

        // Send notifications to top 10 matching candidates
        if (matchesGenerated > 0) {
          const topMatches = await db.query.matches.findMany({
            where: eq(matches.assignmentId, newAssignment.id),
            orderBy: (t: any, { desc }) => [desc(t.score)],
            limit: 10,
          });

          for (const match of topMatches) {
            try {
              await notifyAssignmentPublished(
                match.profileId,
                newAssignment.id,
                newAssignment.role,
                orgName
              );
            } catch (notifyError) {
              log.error('assignment.notification.failed', {
                profileId: match.profileId,
                assignmentId: newAssignment.id,
                error: notifyError instanceof Error ? notifyError.message : 'Unknown error',
              });
              // Continue with other notifications even if one fails
            }
          }

          log.info('assignment.notifications.sent', {
            assignmentId: newAssignment.id,
            notificationsSent: topMatches.length,
          });
        }
      }
    }

    return NextResponse.json({ assignment: newAssignment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('assignment.validation.failed', {
        errors: error.errors,
      });
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: error.errors,
          message:
            'Some required fields are missing or invalid. Please review your assignment details.',
        },
        { status: 400 }
      );
    }

    // Database connection errors
    if (
      error instanceof Error &&
      (error.message.includes('connect') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('timeout'))
    ) {
      log.error('assignment.db.connection.failed', {
        error: error.message,
        stack: error.stack,
      });
      return NextResponse.json(
        {
          error: 'Database connection failed',
          message: 'Unable to save assignment. Please check your connection and try again.',
        },
        { status: 503 }
      );
    }

    log.error('assignment.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Failed to create assignment',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.',
      },
      { status: 500 }
    );
  }
}
