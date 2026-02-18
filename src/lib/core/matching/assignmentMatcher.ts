import { inArray } from 'drizzle-orm';

import { db } from '@/db';
import type { Assignment } from '@/db/schema';
import { matchingProfiles, skills } from '@/db/schema';
import { log } from '@/lib/log';
import { scrubDisallowedFields } from '@/lib/core/matching/firewall';
import {
  scorePAC,
  scoreAvailability,
  scoreCompensation,
  scoreExperience,
  scoreLanguage,
  scoreLocation,
  scoreSkillsEnhanced,
  scoreVerifications,
  scoreWorkAuthorization,
  composeWeighted,
  compareMatches,
  type Skill,
  type DateWindow,
  type Range,
  type LocationMode,
} from '@/lib/core/matching/scorers';
import { annRetrieveSimilarProfiles, batchGetMissionVisionScores } from '@/lib/matching/semantic';

export type AssignmentMatchResult = {
  profileId: string;
  score: number;
  subscores: Record<string, number>;
  contributions: Record<string, number>;
  gaps: Array<{ id: string; required: number; have: number }>;
  missing: string[];
  profile: unknown; // Scrubbed profile data (blind-first)
  pac: {
    total: number;
    valuesScore: number;
    causesScore: number;
    missionVisionScore: number;
  };
};

export type AssignmentMatchMeta = {
  total: number;
  returned: number;
  durationMs: number;
  weights: Record<string, number>;
  twoStage: boolean;
  stage1Count?: number;
  hasMissionVisionScores: boolean;
};

export type ComputeAssignmentMatchesInput = {
  assignmentId: string;
  assignment: Assignment;
  weights: Record<string, number>;
  k: number;
  useTwoStage: boolean;
  annLimit: number;
  startTime?: number;
};

/**
 * Shared assignment-matching engine used by both web and mobile routes.
 *
 * Notes:
 * - Caller is responsible for auth and org membership checks.
 * - Returns blind-first results with PII scrubbed via matching firewall.
 */
export async function computeAssignmentMatches(input: ComputeAssignmentMatchesInput): Promise<{
  items: AssignmentMatchResult[];
  meta: AssignmentMatchMeta;
}> {
  const startTime = input.startTime ?? Date.now();
  const { assignmentId, assignment, weights, k, useTwoStage, annLimit } = input;

  // ========================================================================
  // TWO-STAGE MATCHING (PRD: Proofound_Matching_Conversation.md)
  // Stage 1: ANN retrieval using pgvector HNSW index
  // Stage 2: Precise multi-factor re-ranking
  // ========================================================================

  let candidateProfiles: (typeof matchingProfiles.$inferSelect)[];
  let stage1Count = 0;

  if (useTwoStage) {
    log.info('match.assignment.stage1.start', { assignmentId, limit: annLimit });

    const annResults = await annRetrieveSimilarProfiles(assignmentId, annLimit);
    stage1Count = annResults.length;

    if (annResults.length > 0) {
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
  const candidateSkills = profileIds.length
    ? await db.query.skills.findMany({
        where: inArray(skills.profileId, profileIds),
      })
    : [];

  const skillsByProfile: Record<string, Record<string, Skill>> = {};

  for (const skill of candidateSkills) {
    if (!skillsByProfile[skill.profileId]) {
      skillsByProfile[skill.profileId] = {};
    }
    skillsByProfile[skill.profileId][skill.skillId] = {
      id: skill.skillId,
      level: skill.level,
      months: skill.monthsExperience,
      evidenceStrength: skill.evidenceStrength ? parseFloat(skill.evidenceStrength) : undefined,
      recencyMultiplier: skill.recencyMultiplier ? parseFloat(skill.recencyMultiplier) : undefined,
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
  const results: AssignmentMatchResult[] = [];

  for (const profile of candidateProfiles) {
    const candidateSkillSet = skillsByProfile[profile.profileId] || {};

    // Apply hard filters with enhanced scoring
    const mustHaveSkills = (assignment.mustHaveSkills as Skill[]) || [];
    const niceToHaveSkills = (assignment.niceToHaveSkills as Skill[]) || [];

    const enhancedSkillScore = scoreSkillsEnhanced(
      mustHaveSkills,
      niceToHaveSkills,
      candidateSkillSet
    );

    if (enhancedSkillScore.hardFail) {
      continue; // Skip candidates who don't meet must-haves
    }

    // Use mission/vision score from embeddings if available (two-stage mode)
    const missionVisionScore = missionVisionScores.get(profile.profileId);
    const pacScore = scorePAC(
      profile.valuesTags || [],
      profile.causeTags || [],
      assignment.valuesRequired || [],
      assignment.causeTags || [],
      missionVisionScore
    );

    const workAuthScore = scoreWorkAuthorization({
      candidateNeedsSponsorship: profile.needsSponsorship ?? false,
      candidateWishesSponsorship: profile.wishesSponsorship ?? false,
      orgCanSponsor: assignment.canSponsorVisa ?? false,
    });

    const subscores: Record<string, number> = {
      // Legacy classes (kept for backward compatibility with existing presets)
      values: pacScore.valuesScore,
      causes: pacScore.causesScore,
      // Core skills (enhanced weighted score)
      skills: enhancedSkillScore.weightedScore,
      experience: scoreExperience(
        Object.values(candidateSkillSet).reduce((sum, s) => sum + (s.months || 0), 0) /
          Math.max(Object.keys(candidateSkillSet).length, 1)
      ),
      verifications: scoreVerifications(
        assignment.verificationGates || [],
        (profile.verified as Record<string, boolean>) || {}
      ),
      // PRD aligned classes
      pac: pacScore.total,
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

    // Scrub PII from profile (blind-first for org-side candidate lists)
    const scrubbedProfile = scrubDisallowedFields(profile);

    results.push({
      profileId: profile.profileId,
      score: composed.total,
      subscores,
      contributions: composed.contributions,
      gaps: enhancedSkillScore.gaps,
      missing: enhancedSkillScore.missing,
      profile: scrubbedProfile,
      pac: {
        total: pacScore.total,
        valuesScore: pacScore.valuesScore,
        causesScore: pacScore.causesScore,
        missionVisionScore: pacScore.missionVisionScore,
      },
    });
  }

  results.sort((a, b) =>
    compareMatches(
      { score: a.score, assignmentId, profileId: a.profileId },
      { score: b.score, assignmentId, profileId: b.profileId }
    )
  );

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

  return {
    items: topK,
    meta: {
      total: results.length,
      returned: topK.length,
      durationMs: duration,
      weights,
      twoStage: useTwoStage,
      stage1Count: useTwoStage ? stage1Count : undefined,
      hasMissionVisionScores: missionVisionScores.size > 0,
    },
  };
}
