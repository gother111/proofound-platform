import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import {
  assignmentExpertiseMatrix,
  assignments,
  matchingProfiles,
  matches,
  organizations,
  skills,
  skillsTaxonomy,
} from '@/db/schema';
import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { scrubDisallowedFields } from '@/lib/core/matching/firewall';
import { getOrSet, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { emitAnalyticsEventAsync, emitFirstMatchShown } from '@/lib/analytics/events';
import { getRows } from '@/lib/db/rows';
import { deriveRequirementsFromMatrix } from '@/lib/assignments/expertise-matrix';
import {
  scoreSkillsEnhanced,
  scoreExperience,
  scoreVerifications,
  scoreAvailability,
  scoreLocation,
  scoreCompensation,
  scoreLanguage,
  scorePAC,
  scoreWorkAuthorization,
  composeWeighted,
  compareMatches,
  type Skill,
  type DateWindow,
  type Range,
  type LocationMode,
} from '@/lib/core/matching/scorers';
import { getPreset, normalizeWeights, type PresetKey } from '@/lib/core/matching/presets';
import {
  annRetrieveSimilarAssignments,
  batchGetMissionVisionScoresForProfile,
} from '@/lib/matching/semantic';
import { isTrustedInternalRequest, requireApiAuth } from '@/lib/api/auth';
import { evaluateIndividualMatchability, toNotMatchablePayload } from '@/lib/matching/eligibility';
import { calculateFocusBoost, isIndustryAvoided } from '@/lib/core/matching/focus';
import {
  deriveAtlasLanguageLevels,
  parseLegacyLanguageLevels,
  resolveLanguageLevel,
} from '@/lib/core/matching/language-resolution';
import { toAnnualCompensationRange } from '@/lib/matching/compensation';

export const dynamic = 'force-dynamic';

const DEFAULT_ASSIGNMENT_SCAN_MULTIPLIER = 10;
const MIN_ASSIGNMENT_SCAN_LIMIT = 50;
const MAX_ASSIGNMENT_SCAN_LIMIT = 500;
type CandidatePoolSource = 'full_scan' | 'ann_hybrid';

function resolveAssignmentScanLimit(k: number): number {
  return Math.min(
    MAX_ASSIGNMENT_SCAN_LIMIT,
    Math.max(MIN_ASSIGNMENT_SCAN_LIMIT, k * DEFAULT_ASSIGNMENT_SCAN_MULTIPLIER)
  );
}

function resolveTwoStageEnabled(requestedSemanticFlag: boolean): boolean {
  if (requestedSemanticFlag) {
    return true;
  }
  const raw = process.env.MATCHING_TWO_STAGE_ENABLED?.trim().toLowerCase();
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  return true;
}

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
  focusBoost: {
    total: number;
    matched: {
      role: boolean;
      industry: boolean;
      orgType: boolean;
    };
    contributions: {
      role: number;
      industry: number;
      orgType: number;
    };
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
    // Allow internal cron calls to compute matches for a specific userId.
    const isInternalCall = isTrustedInternalRequest(request);
    const rawBody = await request.text();
    let body: unknown = {};
    if (rawBody.trim().length > 0) {
      try {
        body = JSON.parse(rawBody) as unknown;
      } catch {
        return NextResponse.json(
          {
            error: 'Invalid input',
            message: 'Request body must be valid JSON.',
          },
          { status: 400 }
        );
      }
    }

    let validatedData:
      | z.infer<typeof MatchRequestSchema>
      | z.infer<typeof ServiceMatchRequestSchema>;
    let user: { id: string };

    if (isInternalCall) {
      const serviceValidated = ServiceMatchRequestSchema.parse(body);
      validatedData = serviceValidated;
      user = { id: serviceValidated.userId };
    } else {
      validatedData = MatchRequestSchema.parse(body);
      const authResult = await requireApiAuth();
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      user = { id: authResult.user.id };
    }

    const { mode, k = 20, useSemanticMatching = false } = validatedData;
    const assignmentScanLimit = resolveAssignmentScanLimit(k);
    const twoStageEnabled = resolveTwoStageEnabled(useSemanticMatching);

    const eligibility = await evaluateIndividualMatchability(user.id);
    if (!eligibility.eligible) {
      log.info('matching.gated.not_matchable', {
        userId: user.id,
        endpoint: '/api/core/matching/profile',
        tier: eligibility.tier,
        unmetCriteria: eligibility.unmetCriteria,
        counts: eligibility.counts,
      });

      emitAnalyticsEventAsync({
        eventType: 'matching_gated_not_matchable',
        userId: user.id,
        profileId: user.id,
        entityType: 'api',
        entityId: '/api/core/matching/profile',
        properties: {
          unmetCriteria: eligibility.unmetCriteria,
          unmetCriteriaCount: eligibility.unmetCriteria.length,
          tier: eligibility.tier,
          nextTierTarget: eligibility.nextTierTarget?.tier || null,
          counts: eligibility.counts,
        },
      });

      return NextResponse.json(toNotMatchablePayload(eligibility), { status: 200 });
    }

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

    const userSkillCodes = Array.from(
      new Set(
        userSkills
          .map((skill) => skill.skillCode || skill.skillId)
          .filter((code): code is string => Boolean(code))
      )
    );
    const userSkillTaxonomyRows =
      userSkillCodes.length > 0
        ? await db
            .select({
              code: skillsTaxonomy.code,
              catId: skillsTaxonomy.catId,
              subcatId: skillsTaxonomy.subcatId,
              l3Id: skillsTaxonomy.l3Id,
              slug: skillsTaxonomy.slug,
              nameI18n: skillsTaxonomy.nameI18n,
              tags: skillsTaxonomy.tags,
            })
            .from(skillsTaxonomy)
            .where(inArray(skillsTaxonomy.code, userSkillCodes))
        : [];
    const atlasLanguageLevels = deriveAtlasLanguageLevels(userSkills, userSkillTaxonomyRows);
    const legacyLanguageLevels = parseLegacyLanguageLevels(profile.languages);

    // Determine weights
    const weights = validatedData.weights
      ? normalizeWeights(validatedData.weights)
      : mode
        ? getPreset(mode as PresetKey)
        : profile.weights
          ? normalizeWeights(profile.weights as Record<string, number>)
          : getPreset('balanced');

    // Fetch active assignments with a safe column subset (skip columns that may not exist in older DBs)
    const assignmentSelect = {
      id: assignments.id,
      orgId: assignments.orgId,
      role: assignments.role,
      description: assignments.description,
      status: assignments.status,
      valuesRequired: assignments.valuesRequired,
      causeTags: assignments.causeTags,
      mustHaveSkills: assignments.mustHaveSkills,
      niceToHaveSkills: assignments.niceToHaveSkills,
      minLanguage: assignments.minLanguage,
      locationMode: assignments.locationMode,
      country: assignments.country,
      compMin: assignments.compMin,
      compMax: assignments.compMax,
      currency: assignments.currency,
      hoursMin: assignments.hoursMin,
      hoursMax: assignments.hoursMax,
      startEarliest: assignments.startEarliest,
      startLatest: assignments.startLatest,
      verificationGates: assignments.verificationGates,
      weights: assignments.weights,
      canSponsorVisa: assignments.canSponsorVisa,
      sponsorshipCountries: assignments.sponsorshipCountries,
    };

    let activeAssignments: Array<{
      id: string;
      orgId: string;
      role: string;
      description: string | null;
      status: 'draft' | 'active' | 'paused' | 'closed';
      valuesRequired: string[] | null;
      causeTags: string[] | null;
      mustHaveSkills: unknown;
      niceToHaveSkills: unknown;
      minLanguage: unknown;
      locationMode: string | null;
      country: string | null;
      compMin: number | null;
      compMax: number | null;
      currency: string | null;
      hoursMin: number | null;
      hoursMax: number | null;
      startEarliest: string | Date | null;
      startLatest: string | Date | null;
      verificationGates: string[] | null;
      weights: unknown;
      canSponsorVisa: boolean | null;
      sponsorshipCountries: string[] | null;
    }> = [];
    let candidatePoolSource: CandidatePoolSource = 'full_scan';

    if (twoStageEnabled) {
      const annMatches = await annRetrieveSimilarAssignments(user.id, assignmentScanLimit);
      const annAssignmentIds = Array.from(new Set(annMatches.map((match) => match.id)));

      if (annAssignmentIds.length > 0) {
        candidatePoolSource = 'ann_hybrid';
        const annAssignments = await db
          .select(assignmentSelect)
          .from(assignments)
          .where(and(eq(assignments.status, 'active'), inArray(assignments.id, annAssignmentIds)));

        const annOrder = new Map(annAssignmentIds.map((id, index) => [id, index]));
        annAssignments.sort((a, b) => (annOrder.get(a.id) ?? 0) - (annOrder.get(b.id) ?? 0));

        activeAssignments = annAssignments.slice(0, assignmentScanLimit);

        const remaining = assignmentScanLimit - activeAssignments.length;
        if (remaining > 0) {
          const existingIds = activeAssignments.map((assignment) => assignment.id);
          const fallbackAssignments = await db
            .select(assignmentSelect)
            .from(assignments)
            .where(
              existingIds.length > 0
                ? and(eq(assignments.status, 'active'), notInArray(assignments.id, existingIds))
                : eq(assignments.status, 'active')
            )
            .limit(remaining);

          activeAssignments = [...activeAssignments, ...fallbackAssignments];
        }
      }
    }

    if (activeAssignments.length === 0) {
      activeAssignments = await db
        .select(assignmentSelect)
        .from(assignments)
        .where(eq(assignments.status, 'active'))
        .limit(assignmentScanLimit);
      candidatePoolSource = 'full_scan';
    }

    const matrixRows = activeAssignments.length
      ? await db.query.assignmentExpertiseMatrix.findMany({
          where: inArray(
            assignmentExpertiseMatrix.assignmentId,
            activeAssignments.map((assignment) => assignment.id)
          ),
        })
      : [];
    const matrixRowsByAssignment = new Map<string, typeof matrixRows>();
    for (const row of matrixRows) {
      const existing = matrixRowsByAssignment.get(row.assignmentId) || [];
      existing.push(row);
      matrixRowsByAssignment.set(row.assignmentId, existing);
    }

    const orgIds = Array.from(new Set(activeAssignments.map((assignment) => assignment.orgId)));
    const orgRows =
      orgIds.length > 0
        ? await db
            .select({
              id: organizations.id,
              type: organizations.type,
              industryKey: organizations.industryKey,
              industry: organizations.industry,
            })
            .from(organizations)
            .where(inArray(organizations.id, orgIds))
        : [];
    const orgById = new Map(orgRows.map((row) => [row.id, row]));

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
    const hadMatchesBefore = existingMatches.length > 0;

    // Map assignmentId to matchId for returning with results
    const matchIdMap = new Map(existingMatches.map((m) => [m.assignmentId, m.id]));

    // Filter snoozed or hidden matches
    const snoozedAssignmentIds = new Set(
      existingMatches
        .filter((m) => m.snoozedUntil && new Date(m.snoozedUntil) >= new Date())
        .map((m) => m.assignmentId)
    );
    const hiddenAssignmentIds = new Set(
      existingMatches
        .filter((m: any) => {
          const vector = (m as any).vector as any;
          return vector && vector.hidden;
        })
        .map((m) => m.assignmentId)
    );
    const focusPreferences = {
      desiredRoles: (profile.desiredRoles as string[] | null) || [],
      desiredIndustries: (profile.desiredIndustries as string[] | null) || [],
      preferredIndustryKeys: (profile.preferredIndustryKeys as string[] | null) || [],
      avoidIndustryKeys: (profile.avoidIndustryKeys as string[] | null) || [],
      orgTypes: (profile.orgTypes as string[] | null) || [],
    };

    for (const assignment of activeAssignments) {
      // Skip snoozed matches
      if (snoozedAssignmentIds.has(assignment.id)) {
        continue;
      }
      // Skip hidden matches
      if (hiddenAssignmentIds.has(assignment.id)) {
        continue;
      }
      const organization = orgById.get(assignment.orgId);
      if (
        isIndustryAvoided(focusPreferences, {
          orgIndustryKey: organization?.industryKey,
          orgIndustry: organization?.industry,
        })
      ) {
        continue;
      }

      // Apply hard filters
      const matrixRowsForAssignment = matrixRowsByAssignment.get(assignment.id) || [];
      const matrixRequirements =
        matrixRowsForAssignment.length > 0
          ? deriveRequirementsFromMatrix(
              matrixRowsForAssignment.map((row) => ({
                skillCode: row.skillCode,
                requiredLevel: row.requiredLevel,
                stakeholderRole: row.stakeholderRole,
              }))
            )
          : null;
      const mustHaveSkills = matrixRequirements
        ? (matrixRequirements.mustHaveSkills as Skill[])
        : (assignment.mustHaveSkills as Skill[]) || [];
      const niceToHaveSkills = matrixRequirements
        ? (matrixRequirements.niceToHaveSkills as Skill[])
        : (assignment.niceToHaveSkills as Skill[]) || [];

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
      const profileAnnualComp = toAnnualCompensationRange({
        min: profile.compMin,
        max: profile.compMax,
        period: profile.compPeriod,
      });
      if (assignment.compMin && assignment.compMax && profileAnnualComp) {
        subscores.compensation = scoreCompensation(
          { min: assignment.compMin, max: assignment.compMax } as Range,
          profileAnnualComp as Range
        );
      } else {
        subscores.compensation = 1.0;
      }

      // Language
      if (assignment.minLanguage) {
        const minLang = assignment.minLanguage as { code: string; level: string };
        const candidateLevel = resolveLanguageLevel(
          minLang.code,
          atlasLanguageLevels,
          legacyLanguageLevels
        );
        subscores.language = candidateLevel ? scoreLanguage(minLang.level, candidateLevel) : 0;
      } else {
        subscores.language = 1.0;
      }

      // Compose weighted score
      const composed = composeWeighted(subscores, weights);
      const focusBoost = calculateFocusBoost(focusPreferences, {
        assignmentRole: assignment.role,
        orgIndustryKey: organization?.industryKey,
        orgIndustry: organization?.industry,
        orgType: organization?.type,
      });
      const finalScore = Math.min(1, composed.total + focusBoost.boost);

      // Scrub org-identifying info from assignment
      const scrubbedAssignment = scrubDisallowedFields(assignment);

      // Include match ID if one exists in the database
      const existingMatchId = matchIdMap.get(assignment.id);

      results.push({
        ...(existingMatchId && { id: existingMatchId }),
        assignmentId: assignment.id,
        score: finalScore,
        subscores,
        contributions: {
          ...composed.contributions,
          focusBoost: focusBoost.boost,
        },
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
        focusBoost: {
          total: focusBoost.boost,
          matched: focusBoost.matched,
          contributions: focusBoost.contributions,
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

    // Ensure returned matches exist in DB and capture their IDs
    const upsertPayload = topK.map((match) => ({
      assignmentId: match.assignmentId,
      profileId: user.id,
      score: match.score.toString(),
      vector: {
        subscores: match.subscores,
        contributions: match.contributions,
        gaps: match.gaps,
        missing: match.missing,
      },
      weights,
    }));

    const upsertedMatches =
      upsertPayload.length > 0
        ? await db
            .insert(matches)
            .values(upsertPayload)
            .onConflictDoUpdate({
              target: [matches.assignmentId, matches.profileId],
              set: {
                score: sql`excluded.score`,
                vector: sql`excluded.vector`,
                weights: sql`excluded.weights`,
              },
            })
            .returning({ id: matches.id, assignmentId: matches.assignmentId })
        : [];

    // Merge returned IDs into response payload
    upsertedMatches.forEach((row) => {
      matchIdMap.set(row.assignmentId, row.id);
    });

    const topKWithIds = topK.map((match) => ({
      ...match,
      id: match.id || matchIdMap.get(match.assignmentId),
    }));

    const duration = Date.now() - startTime;

    // Emit first match shown event for TTFQI tracking (only if there are matches)
    if (topKWithIds.length > 0) {
      try {
        const firstMatch = topKWithIds[0];
        if (!hadMatchesBefore && firstMatch.id) {
          const idempotencyKey = `first_match_shown:${user.id}`;
          const existingEventResult = await db.execute(sql`
            SELECT id
            FROM analytics_events
            WHERE event_type = 'first_match_shown'
              AND user_id = ${user.id}
              AND COALESCE(properties->>'idempotency_key', '') = ${idempotencyKey}
            LIMIT 1
          `);
          const alreadyEmitted = getRows(existingEventResult).length > 0;

          if (!alreadyEmitted) {
            await emitFirstMatchShown(user.id, firstMatch.id, {
              assignment_id: firstMatch.assignmentId,
              score: firstMatch.score,
              mode,
              pac_contribution: firstMatch.pac.total,
              idempotency_key: idempotencyKey,
            });
          }
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
      assignmentScanLimit,
      candidatePoolSource,
      twoStageEnabled,
    });

    return NextResponse.json({
      items: topKWithIds,
      meta: {
        total: results.length,
        returned: topKWithIds.length,
        durationMs: duration,
        weights: weights,
        candidatePoolSource,
        candidatePoolSize: activeAssignments.length,
        twoStageEnabled,
        eligibility: {
          tier: eligibility.tier,
          nextTierTarget: eligibility.nextTierTarget,
        },
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
