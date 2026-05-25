import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { assignments, matchingProfiles, organizations, skills, skillsTaxonomy } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { log } from '@/lib/log';
import { scrubDisallowedFields } from '@/lib/core/matching/firewall';
import { emitAnalyticsEventAsync } from '@/lib/analytics/events';
import {
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
import { getPreset, normalizeWeights } from '@/lib/core/matching/presets';
import { evaluateIndividualMatchability, toSoftGatedPayload } from '@/lib/matching/eligibility';
import { calculateFocusBoost, isIndustryAvoided } from '@/lib/core/matching/focus';
import {
  deriveAtlasLanguageLevels,
  parseLegacyLanguageLevels,
  resolveLanguageLevel,
} from '@/lib/core/matching/language-resolution';
import { toAnnualCompensationRange } from '@/lib/matching/compensation';

// Shared handler imported by the kept launch corridor routes.
export const dynamic = 'force-dynamic';
const DEFAULT_NEAR_MATCH_SCAN_LIMIT = 300;
const MIN_NEAR_MATCH_SCAN_LIMIT = 50;
const MAX_NEAR_MATCH_SCAN_LIMIT = 500;

function resolveNearMatchScanLimit(): number {
  const raw = process.env.MATCHING_NEAR_SCAN_LIMIT?.trim();
  if (!raw) {
    return DEFAULT_NEAR_MATCH_SCAN_LIMIT;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_NEAR_MATCH_SCAN_LIMIT;
  }

  return Math.max(MIN_NEAR_MATCH_SCAN_LIMIT, Math.min(MAX_NEAR_MATCH_SCAN_LIMIT, parsed));
}

// Validation schema
const NearMatchRequestSchema = z.object({
  weights: z.record(z.number()).optional(),
  mode: z.string().optional(),
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

function toVisibilitySafeNearMatch(item: NearMatchResult) {
  return {
    assignmentId: item.assignmentId,
    assignment: item.assignment,
    reason: item.reason,
    gaps: item.gaps,
    missing: item.missing,
    reviewMode: 'reason_coded' as const,
  };
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
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Validate input
    const validatedData = NearMatchRequestSchema.parse(body);
    const { k = 10, threshold = 0.3 } = validatedData;

    const eligibility = await evaluateIndividualMatchability(user.id);
    if (!eligibility.eligible) {
      log.info('matching.gated.not_matchable', {
        userId: user.id,
        endpoint: '/api/core/matching/near-matches',
        tier: eligibility.tier,
        unmetCriteria: eligibility.unmetCriteria,
        counts: eligibility.counts,
      });

      emitAnalyticsEventAsync({
        eventType: 'matching_gated_not_matchable',
        userId: user.id,
        profileId: user.id,
        entityType: 'api',
        entityId: '/api/core/matching/near-matches',
        properties: {
          unmetCriteria: eligibility.unmetCriteria,
          unmetCriteriaCount: eligibility.unmetCriteria.length,
          tier: eligibility.tier,
          nextTierTarget: eligibility.nextTierTarget?.tier || null,
          counts: eligibility.counts,
          states: eligibility.readiness.states,
        },
      });

      return NextResponse.json(toSoftGatedPayload(eligibility), { status: 200 });
    }

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
      : profile.weights
        ? normalizeWeights(profile.weights as Record<string, number>)
        : getPreset('balanced');

    const assignmentScanLimit = resolveNearMatchScanLimit();

    // Fetch active assignments with bounded scan limit
    const activeAssignments = await db.query.assignments.findMany({
      where: eq(assignments.status, 'active'),
      limit: assignmentScanLimit,
    });
    const orgIds = Array.from(
      new Set(activeAssignments.map((assignment) => assignment.orgId).filter(Boolean))
    );
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
    const focusPreferences = {
      desiredRoles: (profile.desiredRoles as string[] | null) || [],
      desiredIndustries: (profile.desiredIndustries as string[] | null) || [],
      preferredIndustryKeys: (profile.preferredIndustryKeys as string[] | null) || [],
      avoidIndustryKeys: (profile.avoidIndustryKeys as string[] | null) || [],
      orgTypes: (profile.orgTypes as string[] | null) || [],
    };

    // Compute scores (with relaxed filters)
    const results: NearMatchResult[] = [];

    for (const assignment of activeAssignments) {
      const organization = orgById.get(assignment.orgId);
      if (
        isIndustryAvoided(focusPreferences, {
          orgIndustryKey: organization?.industryKey,
          orgIndustry: organization?.industry,
        })
      ) {
        continue;
      }

      const mustHaveSkills = (assignment.mustHaveSkills as Skill[]) || [];
      const niceToHaveSkills = (assignment.niceToHaveSkills as Skill[]) || [];

      const skillScore = scoreSkills(mustHaveSkills, niceToHaveSkills, skillsMap);

      // For near matches, we DON'T skip on hard fail
      // Instead, we include it but mark the reason

      // Compute subscores
      const subscores: Record<string, number> = {
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

      // Only include if score meets threshold
      if (finalScore < threshold) {
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
      }

      // Scrub org-identifying info
      const scrubbedAssignment = scrubDisallowedFields(assignment);

      results.push({
        assignmentId: assignment.id,
        score: finalScore,
        subscores,
        contributions: {
          ...composed.contributions,
          focusBoost: focusBoost.boost,
        },
        gaps: skillScore.gaps,
        missing: skillScore.missing,
        assignment: scrubbedAssignment,
        reason,
        focusBoost: {
          total: focusBoost.boost,
          matched: focusBoost.matched,
          contributions: focusBoost.contributions,
        },
      });
    }

    // Sort by score (descending)
    results.sort((a, b) =>
      compareMatches(
        { score: a.score, assignmentId: a.assignmentId, profileId: user.id },
        { score: b.score, assignmentId: b.assignmentId, profileId: user.id }
      )
    );

    // Return top k without raw scoring artifacts. Scores stay internal for ordering only.
    const topK = results.slice(0, k);
    const visibilitySafeItems = topK.map(toVisibilitySafeNearMatch);

    const duration = Date.now() - startTime;

    log.info('match.near-matches.computed', {
      userId: user.id,
      poolSize: activeAssignments.length,
      resultCount: topK.length,
      threshold,
      assignmentScanLimit,
      durationMs: duration,
    });

    return NextResponse.json({
      items: visibilitySafeItems,
      meta: {
        total: results.length,
        returned: topK.length,
        threshold,
        assignmentScanLimit,
        durationMs: duration,
        weights: {},
        scoreVisibility: 'internal_ordering_only',
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
        message: 'Unable to fetch matches. Please try again.',
      },
      { status: 500 }
    );
  }
}
