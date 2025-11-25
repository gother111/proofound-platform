import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { assignments, matchingProfiles, skills, organizationMembers } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { log } from '@/lib/log';
import { scrubDisallowedFields } from '@/lib/core/matching/firewall';
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
  scoreWorkAuthorization,
  composeWeighted,
  compareMatches,
  type Skill,
  type DateWindow,
  type Range,
  type LocationMode,
} from '@/lib/core/matching/scorers';
import { getPreset, normalizeWeights, type PresetKey } from '@/lib/core/matching/presets';
import { annRetrieveSimilarProfiles, batchGetMissionVisionScores } from '@/lib/matching/semantic';

export const dynamic = 'force-dynamic';

// Validation schema
const MatchRequestSchema = z.object({
  assignmentId: z.string().uuid(),
  weights: z.record(z.number()).optional(),
  mode: z.enum(['mission-first', 'skills-first', 'balanced']).optional(),
  k: z.number().positive().max(100).optional(), // Top k results
  useTwoStage: z.boolean().optional(), // Enable two-stage matching (ANN + re-rank)
  annLimit: z.number().positive().max(1000).optional(), // Stage-1 ANN retrieval limit
});

interface MatchResult {
  profileId: string;
  score: number;
  subscores: Record<string, number>;
  contributions: Record<string, number>;
  gaps: Array<{ id: string; required: number; have: number }>;
  missing: string[];
  profile: unknown; // Scrubbed profile data
  // PRD: PAC for analytics and transparency
  pac: {
    total: number;
    valuesScore: number;
    causesScore: number;
    missionVisionScore: number;
  };
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
    const { assignmentId, mode, k = 20, useTwoStage = false, annLimit = 500 } = validatedData;

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

    // ========================================================================
    // TWO-STAGE MATCHING (PRD: Proofound_Matching_Conversation.md)
    // Stage 1: ANN retrieval using pgvector HNSW index
    // Stage 2: Precise multi-factor re-ranking
    // ========================================================================

    let candidateProfiles: (typeof matchingProfiles.$inferSelect)[];
    let annSimilarityScores: Map<string, number> = new Map();
    let stage1Count = 0;

    if (useTwoStage) {
      // Stage 1: ANN retrieval - get top candidates by semantic similarity
      log.info('match.assignment.stage1.start', { assignmentId, limit: annLimit });

      const annResults = await annRetrieveSimilarProfiles(assignmentId, annLimit);
      stage1Count = annResults.length;

      if (annResults.length > 0) {
        // Store ANN similarity scores for later use
        for (const result of annResults) {
          annSimilarityScores.set(result.id, result.similarity);
        }

        // Fetch only the profiles from ANN results
        const profileIds = annResults.map((r) => r.id);
        candidateProfiles = await db.query.matchingProfiles.findMany({
          where: inArray(matchingProfiles.profileId, profileIds),
        });

        log.info('match.assignment.stage1.complete', {
          assignmentId,
          annResultCount: annResults.length,
          profilesFetched: candidateProfiles.length,
        });
      } else {
        // Fallback to full scan if ANN returns no results (embeddings not ready)
        log.warn('match.assignment.stage1.fallback', {
          assignmentId,
          reason: 'No ANN results, falling back to full scan',
        });
        candidateProfiles = await db.query.matchingProfiles.findMany();
      }
    } else {
      // Traditional full scan
      candidateProfiles = await db.query.matchingProfiles.findMany();
    }

    // Fetch skills for candidates with enhanced attributes
    const profileIds = candidateProfiles.map((p) => p.profileId);
    const candidateSkills = await db.query.skills.findMany({
      where: inArray(skills.profileId, profileIds),
    });

    const skillsByProfile: Record<string, Record<string, Skill>> = {};

    for (const skill of candidateSkills) {
      if (!skillsByProfile[skill.profileId]) {
        skillsByProfile[skill.profileId] = {};
      }
      skillsByProfile[skill.profileId][skill.skillId] = {
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

    // Batch fetch mission/vision scores for PAC (if using semantic matching)
    let missionVisionScores: Map<string, number> = new Map();
    if (useTwoStage && profileIds.length > 0) {
      missionVisionScores = await batchGetMissionVisionScores(profileIds, assignmentId);
    }

    // Compute scores
    const results: MatchResult[] = [];

    for (const profile of candidateProfiles) {
      const candidateSkills = skillsByProfile[profile.profileId] || {};

      // Apply hard filters with enhanced scoring
      const mustHaveSkills = (assignment.mustHaveSkills as Skill[]) || [];
      const niceToHaveSkills = (assignment.niceToHaveSkills as Skill[]) || [];

      const enhancedSkillScore = scoreSkillsEnhanced(
        mustHaveSkills,
        niceToHaveSkills,
        candidateSkills
      );

      if (enhancedSkillScore.hardFail) {
        continue; // Skip candidates who don't meet must-haves
      }

      // Calculate PAC (Purpose-Alignment Contribution) with semantic matching
      // Use mission/vision score from embeddings if available (two-stage mode)
      const missionVisionScore = missionVisionScores.get(profile.profileId);
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
          Object.values(candidateSkills).reduce((sum, s) => sum + (s.months || 0), 0) /
            Math.max(Object.keys(candidateSkills).length, 1)
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
        gaps: enhancedSkillScore.gaps,
        missing: enhancedSkillScore.missing,
        profile: scrubbedProfile,
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
        { score: a.score, assignmentId, profileId: a.profileId },
        { score: b.score, assignmentId, profileId: b.profileId }
      )
    );

    // Return top k (Stage 2 re-ranking complete)
    const topK = results.slice(0, k);

    const duration = Date.now() - startTime;

    log.info('match.assignment.computed', {
      assignmentId,
      poolSize: candidateProfiles.length,
      resultCount: topK.length,
      durationMs: duration,
      twoStage: useTwoStage,
      stage1Count: useTwoStage ? stage1Count : undefined,
    });

    return NextResponse.json({
      items: topK,
      meta: {
        total: results.length,
        returned: topK.length,
        durationMs: duration,
        weights: weights,
        // Two-stage matching metadata
        twoStage: useTwoStage,
        stage1Count: useTwoStage ? stage1Count : undefined,
        hasMissionVisionScores: missionVisionScores.size > 0,
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
