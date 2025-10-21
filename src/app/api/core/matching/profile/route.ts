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
const MatchRequestSchema = z.object({
  weights: z.record(z.number()).optional(),
  mode: z.enum(['mission-first', 'skills-first', 'balanced']).optional(),
  k: z.number().positive().max(100).optional(), // Top k results
});

interface MatchResult {
  assignmentId: string;
  score: number;
  subscores: Record<string, number>;
  contributions: Record<string, number>;
  gaps: Array<{ id: string; required: number; have: number }>;
  missing: string[];
  assignment: unknown; // Scrubbed assignment data
}

/**
 * POST /api/match/profile
 *
 * Computes matches for the current user's profile.
 * Returns top k matching assignments (blind-first, org names scrubbed).
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = MatchRequestSchema.parse(body);
    const { mode, k = 20 } = validatedData;

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

    // Compute scores
    const results: MatchResult[] = [];

    for (const assignment of activeAssignments) {
      // Apply hard filters
      const mustHaveSkills = (assignment.mustHaveSkills as Skill[]) || [];
      const niceToHaveSkills = (assignment.niceToHaveSkills as Skill[]) || [];

      const skillScore = scoreSkills(mustHaveSkills, niceToHaveSkills, skillsMap);

      if (skillScore.hardFail) {
        continue; // Skip assignments where user doesn't meet must-haves
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

      // Scrub org-identifying info from assignment
      const scrubbedAssignment = scrubDisallowedFields(assignment);

      results.push({
        assignmentId: assignment.id,
        score: composed.total,
        subscores,
        contributions: composed.contributions,
        gaps: skillScore.gaps,
        missing: skillScore.missing,
        assignment: scrubbedAssignment,
      });
    }

    // Sort by score (descending) with tie-breaking
    results.sort((a, b) =>
      compareMatches(
        { score: a.score, assignmentId: a.assignmentId, profileId: user.id },
        { score: b.score, assignmentId: b.assignmentId, profileId: user.id }
      )
    );

    // Return top k
    const topK = results.slice(0, k);

    const duration = Date.now() - startTime;

    log.info('match.profile.computed', {
      userId: user.id,
      poolSize: activeAssignments.length,
      resultCount: topK.length,
      durationMs: duration,
    });

    return NextResponse.json({
      items: topK,
      meta: {
        total: results.length,
        returned: topK.length,
        durationMs: duration,
        weights: weights,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    log.error('match.profile.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to compute matches' }, { status: 500 });
  }
}
