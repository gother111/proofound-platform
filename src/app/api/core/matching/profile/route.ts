import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { assignments, matchingProfiles, skills, matches } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { log } from '@/lib/log';
import { scrubDisallowedFields } from '@/lib/core/matching/firewall';
import { getOrSet, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { emitFirstMatchShown } from '@/lib/analytics/events';
import {
  scoreValues,
  scoreCauses,
  scoreSkills,
  scoreSkillsEnhanced,
  scoreExperience,
  scoreVerifications,
  scoreAvailability,
  scoreLocation,
  scoreCompensation,
  scoreLanguage,
  scorePAC,
  scoreSkillsRecency,
  scoreSkillsEvidence,
  scoreWorkAuthorization,
  composeWeighted,
  compareMatches,
  type Skill,
  type DateWindow,
  type Range,
  type LocationMode,
} from '@/lib/core/matching/scorers';
import { getPreset, normalizeWeights, type PresetKey } from '@/lib/core/matching/presets';
import { batchGetMissionVisionScoresForProfile } from '@/lib/matching/semantic';

export const dynamic = 'force-dynamic';

// Validation schemas
const MatchRequestSchema = z.object({
  weights: z.record(z.number()).optional(),
  mode: z.enum(['mission-first', 'skills-first', 'balanced']).optional(),
  useSemanticMatching: z.boolean().optional(), // Enable semantic PAC scoring
  k: z.number().positive().max(100).optional(), // Top k results
});

// Extended schema for service-role calls (cron refresh) that pass a target userId
const ServiceMatchRequestSchema = MatchRequestSchema.extend({
  userId: z.string().uuid(),
});

interface MatchResult {
  id?: string; // Match ID from database if exists
  assignmentId: string;
  score: number;
  subscores: Record<string, number>;
  contributions: Record<string, number>;
  gaps: Array<{ id: string; required: number; have: number }>;
  missing: string[];
  assignment: unknown; // Scrubbed assignment data
  // PRD: PAC for analytics and transparency
  pac: {
    total: number;
    valuesScore: number;
    causesScore: number;
    missionVisionScore: number;
  };
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
    // Allow service-role cron calls to compute matches for a specific userId
    const authHeader = request.headers.get('authorization');
    const isServiceRoleCall =
      authHeader && process.env.SUPABASE_SERVICE_ROLE_KEY
        ? authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        : false;

    const body = await request.json();
    const validatedData = (isServiceRoleCall ? ServiceMatchRequestSchema : MatchRequestSchema).parse(body);
    const user = isServiceRoleCall ? { id: validatedData.userId } : await requireAuth();
    const { mode, k = 20, useSemanticMatching = false } = validatedData;

    // Fetch user's matching profile (with caching)
    const cacheKeyProfile = `${CACHE_KEYS.PROFILE}matching:${user.id}`;
    const profile = await getOrSet(
      cacheKeyProfile,
      async () => {
        return await db.query.matchingProfiles.findFirst({
          where: eq(matchingProfiles.profileId, user.id),
        });
      },
      CACHE_TTL.PROFILE
    );

    if (!profile) {
      return NextResponse.json(
        { error: 'Matching profile not found. Please set up your matching profile first.' },
        { status: 404 }
      );
    }

    // Fetch user's skills (with caching)
    const cacheKeySkills = `${CACHE_KEYS.USER_SKILLS}${user.id}`;
    const userSkills = await getOrSet(
      cacheKeySkills,
      async () => {
        return await db.query.skills.findMany({
          where: eq(skills.profileId, user.id),
        });
      },
      CACHE_TTL.USER_SKILLS
    );

    const skillsMap: Record<string, Skill> = {};
    for (const skill of userSkills) {
      skillsMap[skill.skillId] = {
        id: skill.skillId,
        level: skill.level,
        months: skill.monthsExperience,
        // Enhanced attributes for PRD-compliant scoring
        evidenceStrength: skill.evidenceStrength ? parseFloat(skill.evidenceStrength) : undefined,
        recencyMultiplier: skill.recencyMultiplier
          ? parseFloat(skill.recencyMultiplier)
          : undefined,
        impactScore: skill.impactScore ? parseFloat(skill.impactScore) : undefined,
        lastUsedAt: skill.lastUsedAt || undefined,
      };
    }

    // Pre-compute aggregate skill quality metrics
    const userSkillsList = Object.values(skillsMap);

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

    // Batch fetch mission/vision scores for PAC (if using semantic matching)
    let missionVisionScores: Map<string, number> = new Map();
    if (useSemanticMatching && activeAssignments.length > 0) {
      const assignmentIds = activeAssignments.map((a) => a.id);
      missionVisionScores = await batchGetMissionVisionScoresForProfile(user.id, assignmentIds);
    }

    // Compute scores
    const results: MatchResult[] = [];

    // Fetch all existing matches for this user (for IDs and snooze status)
    const existingMatches = await db.query.matches.findMany({
      where: eq(matches.profileId, user.id),
    });

    // Map assignmentId to matchId for returning with results
    const matchIdMap = new Map(existingMatches.map((m) => [m.assignmentId, m.id]));

    // Filter snoozed matches
    const snoozedAssignmentIds = new Set(
      existingMatches
        .filter((m) => m.snoozedUntil && new Date(m.snoozedUntil) >= new Date())
        .map((m) => m.assignmentId)
    );

    for (const assignment of activeAssignments) {
      // Skip snoozed matches
      if (snoozedAssignmentIds.has(assignment.id)) {
        continue;
      }

      // Apply hard filters
      const mustHaveSkills = (assignment.mustHaveSkills as Skill[]) || [];
      const niceToHaveSkills = (assignment.niceToHaveSkills as Skill[]) || [];

      // Use enhanced skills scoring with recency/evidence/impact
      const enhancedSkillScore = scoreSkillsEnhanced(mustHaveSkills, niceToHaveSkills, skillsMap);

      if (enhancedSkillScore.hardFail) {
        continue; // Skip assignments where user doesn't meet must-haves
      }

      // Calculate PAC (Purpose-Alignment Contribution) with semantic matching
      // Use mission/vision score from embeddings if available
      const missionVisionScore = missionVisionScores.get(assignment.id);
      const pacScore = scorePAC(
        profile.valuesTags || [],
        profile.causeTags || [],
        assignment.valuesRequired || [],
        assignment.causeTags || [],
        missionVisionScore // Semantic similarity from embeddings (Phase 3)
      );

      // Calculate work authorization score
      const workAuthScore = scoreWorkAuthorization({
        candidateNeedsSponsorship: profile.needsSponsorship ?? false,
        candidateWishesSponsorship: profile.wishesSponsorship ?? false,
        orgCanSponsor: (assignment as any).canSponsor ?? true, // Default to true if not specified
      });

      // Compute subscores with new PRD-aligned metrics
      const subscores: Record<string, number> = {
        // Legacy scores (for backward compatibility)
        values: pacScore.valuesScore,
        causes: pacScore.causesScore,
        // Core skills (using enhanced weighted score)
        skills: enhancedSkillScore.weightedScore,
        experience: scoreExperience(
          Object.values(skillsMap).reduce((sum, s) => sum + (s.months || 0), 0) /
            Math.max(Object.keys(skillsMap).length, 1)
        ),
        verifications: scoreVerifications(
          assignment.verificationGates || [],
          (profile.verified as Record<string, boolean>) || {}
        ),
        // New PRD-aligned scores
        pac: pacScore.total, // Purpose-Alignment Contribution
        recency: enhancedSkillScore.recencyScore,
        evidence: enhancedSkillScore.evidenceScore,
        workAuthorization: workAuthScore,
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

      // Include match ID if one exists in the database
      const existingMatchId = matchIdMap.get(assignment.id);

      results.push({
        ...(existingMatchId && { id: existingMatchId }),
        assignmentId: assignment.id,
        score: composed.total,
        subscores,
        contributions: composed.contributions,
        gaps: enhancedSkillScore.gaps,
        missing: enhancedSkillScore.missing,
        assignment: scrubbedAssignment,
        // PRD: Include PAC breakdown for analytics and "Why this match" transparency
        pac: {
          total: pacScore.total,
          valuesScore: pacScore.valuesScore,
          causesScore: pacScore.causesScore,
          missionVisionScore: pacScore.missionVisionScore,
        },
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

    // Emit first match shown event for TTFQI tracking (only if there are matches)
    if (topK.length > 0) {
      try {
        // Check if this is the user's first match ever
        const hasSeenMatchesBefore = await db.query.matches.findFirst({
          where: eq(matches.profileId, user.id),
        });

        if (!hasSeenMatchesBefore) {
          await emitFirstMatchShown(user.id, topK[0].assignmentId, {
            score: topK[0].score,
            mode,
            // PRD: Include PAC for analytics
            pac_contribution: topK[0].pac.total,
          });
        }
      } catch (analyticsError) {
        console.error('Failed to emit first match shown event:', analyticsError);
        // Don't fail the request if analytics fails
      }
    }

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
      log.error('match.profile.validation.failed', {
        errors: error.errors,
      });
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: error.errors,
          message: 'Invalid matching parameters. Please check your matching profile settings.',
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
      log.error('match.profile.db.connection.failed', {
        error: error.message,
        stack: error.stack,
      });
      return NextResponse.json(
        {
          error: 'Database connection failed',
          message: 'Unable to connect to database. Please try again later.',
        },
        { status: 503 }
      );
    }

    log.error('match.profile.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Failed to compute matches',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while computing matches.',
      },
      { status: 500 }
    );
  }
}
