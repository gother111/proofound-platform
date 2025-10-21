import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { assignments, matchingProfiles, skills, organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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
  assignmentId: z.string().uuid(),
  weights: z.record(z.number()).optional(),
  mode: z.enum(['mission-first', 'skills-first', 'balanced']).optional(),
  k: z.number().positive().max(100).optional(), // Top k results
});

interface MatchResult {
  profileId: string;
  score: number;
  subscores: Record<string, number>;
  contributions: Record<string, number>;
  gaps: Array<{ id: string; required: number; have: number }>;
  missing: string[];
  profile: unknown; // Scrubbed profile data
}

/**
 * POST /api/match/assignment
 *
 * Computes matches for an assignment.
 * Returns top k matching profiles (blind-first, PII scrubbed).
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = MatchRequestSchema.parse(body);
    const { assignmentId, mode, k = 20 } = validatedData;

    // Fetch assignment
    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Verify user has access to this assignment
    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.orgId, assignment.orgId),
        eq(organizationMembers.status, 'active')
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Determine weights
    const weights = validatedData.weights
      ? normalizeWeights(validatedData.weights)
      : mode
        ? getPreset(mode as PresetKey)
        : getPreset('balanced');

    // Fetch all matching profiles
    const candidateProfiles = await db.query.matchingProfiles.findMany();

    // Fetch skills for all candidates
    const allSkills = await db.query.skills.findMany();
    const skillsByProfile: Record<string, Record<string, Skill>> = {};

    for (const skill of allSkills) {
      if (!skillsByProfile[skill.profileId]) {
        skillsByProfile[skill.profileId] = {};
      }
      skillsByProfile[skill.profileId][skill.skillId] = {
        id: skill.skillId,
        level: skill.level,
        months: skill.monthsExperience,
      };
    }

    // Compute scores
    const results: MatchResult[] = [];

    for (const profile of candidateProfiles) {
      const candidateSkills = skillsByProfile[profile.profileId] || {};

      // Apply hard filters
      const mustHaveSkills = (assignment.mustHaveSkills as Skill[]) || [];
      const niceToHaveSkills = (assignment.niceToHaveSkills as Skill[]) || [];

      const skillScore = scoreSkills(mustHaveSkills, niceToHaveSkills, candidateSkills);

      if (skillScore.hardFail) {
        continue; // Skip candidates who don't meet must-haves
      }

      // Compute subscores
      const subscores: Record<string, number> = {
        values: scoreValues(profile.valuesTags || [], assignment.valuesRequired || []),
        causes: scoreCauses(profile.causeTags || [], assignment.causeTags || []),
        skills: skillScore.score,
        experience: scoreExperience(
          Object.values(candidateSkills).reduce((sum, s) => sum + (s.months || 0), 0) /
            Math.max(Object.keys(candidateSkills).length, 1)
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
        subscores.availability = 1.0; // No constraint = perfect score
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

      // Scrub PII from profile
      const scrubbedProfile = scrubDisallowedFields(profile);

      results.push({
        profileId: profile.profileId,
        score: composed.total,
        subscores,
        contributions: composed.contributions,
        gaps: skillScore.gaps,
        missing: skillScore.missing,
        profile: scrubbedProfile,
      });
    }

    // Sort by score (descending) with tie-breaking
    results.sort((a, b) =>
      compareMatches(
        { score: a.score, assignmentId, profileId: a.profileId },
        { score: b.score, assignmentId, profileId: b.profileId }
      )
    );

    // Return top k
    const topK = results.slice(0, k);

    const duration = Date.now() - startTime;

    log.info('match.assignment.computed', {
      assignmentId,
      poolSize: candidateProfiles.length,
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

    log.error('match.assignment.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to compute matches' }, { status: 500 });
  }
}
