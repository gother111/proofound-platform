import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { assignments, matchingProfiles, skills } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/log';
import { scrubDisallowedFields } from '@/lib/core/matching/firewall';
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
import { getPreset, normalizeWeights, type PresetKey } from '@/lib/core/matching/presets';

export const dynamic = 'force-dynamic';

// Validation schema
const NearMatchRequestSchema = z.object({
  weights: z.record(z.number()).optional(),
  mode: z.enum(['mission-first', 'skills-first', 'balanced']).optional(),
  k: z.number().positive().max(100).optional(), // Top k results
  threshold: z.number().min(0).max(1).optional(), // Minimum score threshold (default 0.3)
});

interface NearMatchResult {
  assignmentId: string;
  score: number;
  subscores: Record<string, number>;
  contributions: Record<string, number>;
  gaps: Array<{ id: string; required: number; have: number }>;
  missing: string[];
  assignment: unknown;
  reason: string; // Why this is a near match
}

/**
 * POST /api/core/matching/near-matches
 *
 * Returns "near matches" - assignments that don't perfectly fit but are close enough
 * to be interesting. Used for cold-start and when a user has few perfect matches.
 *
 * Differences from regular matching:
 * - Lower threshold (30% vs 60%)
 * - Relaxed hard filters (shows matches even if missing some must-have skills)
 * - Provides detailed gap analysis
 * - Explains why each match is "near" but not perfect
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = NearMatchRequestSchema.parse(body);
    const { mode, k = 10, threshold = 0.3 } = validatedData;

    // Fetch user's matching profile
    const profile = await db.query.matchingProfiles.findFirst({
      where: eq(matchingProfiles.profileId, user.id),
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Matching profile not found. Please set up your matching profile first.' },
        { status: 404 }
      );
    }

    // Fetch user's skills
    const userSkills = await db.query.skills.findMany({
      where: eq(skills.profileId, user.id),
    });

    const skillsMap: Record<string, Skill> = {};
    for (const skill of userSkills) {
      skillsMap[skill.skillId] = {
        id: skill.skillId,
        level: skill.level,
        months: skill.monthsExperience,
      };
    }

    // Determine weights
    const weights = validatedData.weights
      ? normalizeWeights(validatedData.weights)
      : mode
        ? getPreset(mode as PresetKey)
        : profile.weights
          ? normalizeWeights(profile.weights as Record<string, number>)
          : getPreset('balanced');

    // Fetch all active assignments
    const activeAssignments = await db.query.assignments.findMany({
      where: eq(assignments.status, 'active'),
    });

    // Compute scores (with relaxed filters)
    const results: NearMatchResult[] = [];

    for (const assignment of activeAssignments) {
      const mustHaveSkills = (assignment.mustHaveSkills as Skill[]) || [];
      const niceToHaveSkills = (assignment.niceToHaveSkills as Skill[]) || [];

      const skillScore = scoreSkills(mustHaveSkills, niceToHaveSkills, skillsMap);

      // For near matches, we DON'T skip on hard fail
      // Instead, we include it but mark the reason

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

      // Only include if score meets threshold
      if (composed.total < threshold) {
        continue;
      }

      // Determine why this is a "near" match
      let reason = 'Good partial match';

      if (skillScore.hardFail) {
        reason = `Missing ${skillScore.missing.length} required skill(s)`;
      } else if (skillScore.gaps.length > 0) {
        reason = `Skill gaps in ${skillScore.gaps.length} area(s)`;
      } else if (subscores.location < 0.5) {
        reason = 'Location preference mismatch';
      } else if (subscores.availability < 0.5) {
        reason = 'Availability timing mismatch';
      } else if (subscores.compensation < 0.5) {
        reason = 'Compensation range mismatch';
      } else if (subscores.values < 0.5) {
        reason = 'Some values alignment differences';
      }

      // Scrub org-identifying info
      const scrubbedAssignment = scrubDisallowedFields(assignment);

      results.push({
        assignmentId: assignment.id,
        score: composed.total,
        subscores,
        contributions: composed.contributions,
        gaps: skillScore.gaps,
        missing: skillScore.missing,
        assignment: scrubbedAssignment,
        reason,
      });
    }

    // Sort by score (descending)
    results.sort((a, b) =>
      compareMatches(
        { score: a.score, assignmentId: a.assignmentId, profileId: user.id },
        { score: b.score, assignmentId: b.assignmentId, profileId: user.id }
      )
    );

    // Return top k
    const topK = results.slice(0, k);

    const duration = Date.now() - startTime;

    log.info('match.near-matches.computed', {
      userId: user.id,
      poolSize: activeAssignments.length,
      resultCount: topK.length,
      threshold,
      durationMs: duration,
    });

    return NextResponse.json({
      items: topK,
      meta: {
        total: results.length,
        returned: topK.length,
        threshold,
        durationMs: duration,
        weights: weights,
        message:
          topK.length === 0
            ? 'No near matches found. Try adjusting your matching profile or reducing requirements.'
            : 'Near matches found. These assignments are not perfect fits but might be worth exploring.',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('match.near-matches.validation.failed', {
        errors: error.errors,
      });
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: error.errors,
          message: 'Invalid matching parameters. Please check your request.',
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
      log.error('match.near-matches.db.connection.failed', {
        error: error.message,
      });
      return NextResponse.json(
        {
          error: 'Database connection failed',
          message: 'Unable to fetch matches. Please try again.',
        },
        { status: 503 }
      );
    }

    log.error('match.near-matches.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'Matching failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
