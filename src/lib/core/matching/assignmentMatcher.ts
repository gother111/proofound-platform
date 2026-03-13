import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/db';
import type { Assignment } from '@/db/schema';
import {
  assignmentExpertiseMatrix,
  consentObligations,
  matchingProfiles,
  skills,
  skillsTaxonomy,
} from '@/db/schema';
import { deriveRequirementsFromMatrix } from '@/lib/assignments/expertise-matrix';
import { scrubDisallowedFields } from '@/lib/core/matching/firewall';
import type { Skill } from '@/lib/core/matching/scorers';
import {
  deriveAtlasLanguageLevels,
  parseLegacyLanguageLevels,
  resolveLanguageLevel,
} from '@/lib/core/matching/language-resolution';
import { log } from '@/lib/log';
import { toAnnualCompensationRange } from '@/lib/matching/compensation';
import { evaluateIndividualMatchabilityForProfiles } from '@/lib/matching/eligibility';
import {
  buildCanonicalMatchScoreArtifact,
  compareCanonicalMatchOrder,
  type CanonicalMatchScoreArtifact,
} from '@/lib/matching/match-score-contract';
import { annRetrieveSimilarProfiles } from '@/lib/matching/semantic';
import { CONSENT_TYPES } from '@/lib/privacy/consent-contract';

export type AssignmentMatchResult = {
  profileId: string;
  score: number;
  scoreTotal: number;
  subscoresJson: Record<string, unknown>;
  scoreSnapshotJson: Record<string, unknown>;
  reasonCodes: CanonicalMatchScoreArtifact['reasonCodes'];
  profile: unknown;
  artifact: CanonicalMatchScoreArtifact;
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

const DEFAULT_FULL_SCAN_MULTIPLIER = 10;
const MIN_FULL_SCAN_LIMIT = 50;
const MAX_FULL_SCAN_LIMIT = 500;

function resolveCandidateScanLimit(k: number, annLimit?: number): number {
  const fullScanTarget = Math.min(
    MAX_FULL_SCAN_LIMIT,
    Math.max(MIN_FULL_SCAN_LIMIT, k * DEFAULT_FULL_SCAN_MULTIPLIER)
  );

  if (annLimit && Number.isFinite(annLimit) && annLimit > 0) {
    return Math.min(MAX_FULL_SCAN_LIMIT, Math.max(fullScanTarget, annLimit));
  }

  return fullScanTarget;
}

export async function computeAssignmentMatches(input: ComputeAssignmentMatchesInput): Promise<{
  items: AssignmentMatchResult[];
  meta: AssignmentMatchMeta;
}> {
  const startTime = input.startTime ?? Date.now();
  const { assignmentId, assignment, weights, k, useTwoStage, annLimit } = input;
  const candidateScanLimit = resolveCandidateScanLimit(k, annLimit);

  let candidateProfiles: (typeof matchingProfiles.$inferSelect)[];
  let stage1Count = 0;

  if (useTwoStage) {
    log.info('match.assignment.stage1.start', { assignmentId, limit: annLimit });

    const annResults = await annRetrieveSimilarProfiles(assignmentId, annLimit);
    stage1Count = annResults.length;

    if (annResults.length > 0) {
      const profileIds = annResults.map((row) => row.id);
      candidateProfiles = await db.query.matchingProfiles.findMany({
        where: inArray(matchingProfiles.profileId, profileIds),
      });
    } else {
      candidateProfiles = await db.query.matchingProfiles.findMany({
        limit: candidateScanLimit,
      });
    }
  } else {
    candidateProfiles = await db.query.matchingProfiles.findMany({
      limit: candidateScanLimit,
    });
  }

  const profileIds = candidateProfiles.map((profile) => profile.profileId);
  const candidateSkills = profileIds.length
    ? await db.query.skills.findMany({
        where: inArray(skills.profileId, profileIds),
      })
    : [];

  const matrixRows = await db.query.assignmentExpertiseMatrix.findMany({
    where: eq(assignmentExpertiseMatrix.assignmentId, assignment.id),
  });
  const matrixRequirements =
    matrixRows.length > 0
      ? deriveRequirementsFromMatrix(
          matrixRows.map((row) => ({
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

  const skillsByProfile: Record<string, Record<string, Skill>> = {};
  const profileSkillRows = new Map<string, typeof candidateSkills>();
  for (const row of candidateSkills) {
    if (!skillsByProfile[row.profileId]) {
      skillsByProfile[row.profileId] = {};
    }
    skillsByProfile[row.profileId][row.skillId] = {
      id: row.skillId,
      level: row.level,
      months: row.monthsExperience,
      evidenceStrength: row.evidenceStrength ? parseFloat(row.evidenceStrength) : undefined,
      recencyMultiplier: row.recencyMultiplier ? parseFloat(row.recencyMultiplier) : undefined,
      impactScore: row.impactScore ? parseFloat(row.impactScore) : undefined,
      lastUsedAt: row.lastUsedAt || undefined,
    };

    const existing = profileSkillRows.get(row.profileId) || [];
    existing.push(row);
    profileSkillRows.set(row.profileId, existing);
  }

  const skillTaxonomyCodes = Array.from(
    new Set(
      candidateSkills
        .map((row) => row.skillCode || row.skillId)
        .filter((code): code is string => Boolean(code))
    )
  );
  const skillTaxonomyRows =
    skillTaxonomyCodes.length > 0
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
          .where(inArray(skillsTaxonomy.code, skillTaxonomyCodes))
      : [];
  const atlasLanguagesByProfile = new Map<string, ReturnType<typeof deriveAtlasLanguageLevels>>();
  for (const [profileId, rows] of profileSkillRows.entries()) {
    atlasLanguagesByProfile.set(profileId, deriveAtlasLanguageLevels(rows, skillTaxonomyRows));
  }

  const activeMatchingConsentRows = profileIds.length
    ? await db
        .select({ profileId: consentObligations.profileId })
        .from(consentObligations)
        .where(
          and(
            inArray(consentObligations.profileId, profileIds),
            eq(consentObligations.consentType, CONSENT_TYPES.ML_MATCHING),
            eq(consentObligations.state, 'active')
          )
        )
    : [];
  const activeMatchingConsentIds = new Set(activeMatchingConsentRows.map((row) => row.profileId));
  const eligibilityByProfileId = await evaluateIndividualMatchabilityForProfiles(profileIds);

  const results: AssignmentMatchResult[] = [];
  const assignmentLanguageRequirement = assignment.minLanguage as {
    code: string;
    level: string;
  } | null;

  for (const profile of candidateProfiles) {
    const candidateSkillSet = skillsByProfile[profile.profileId] || {};
    const atlasLanguageLevels = atlasLanguagesByProfile.get(profile.profileId) || {};
    const legacyLanguageLevels = parseLegacyLanguageLevels(profile.languages);
    const candidateLanguageLevel = assignmentLanguageRequirement
      ? resolveLanguageLevel(
          assignmentLanguageRequirement.code,
          atlasLanguageLevels,
          legacyLanguageLevels
        )
      : null;
    const profileAnnualComp = toAnnualCompensationRange({
      min: profile.compMin,
      max: profile.compMax,
      period: profile.compPeriod,
    });

    const artifact = buildCanonicalMatchScoreArtifact({
      assignmentId,
      profileId: profile.profileId,
      assignmentOrgId: assignment.orgId,
      assignmentStatus: assignment.status,
      matchabilityEligible: eligibilityByProfileId.get(profile.profileId) ?? false,
      matchingConsentActive: activeMatchingConsentIds.has(profile.profileId),
      requiredSkills: mustHaveSkills.map((entry) => ({ id: entry.id, level: entry.level })),
      niceToHaveSkills: niceToHaveSkills.map((entry) => ({ id: entry.id, level: entry.level })),
      candidateSkills: candidateSkillSet,
      assignmentValuesTags: assignment.valuesRequired || [],
      assignmentCauseTags: assignment.causeTags || [],
      profileValuesTags: profile.valuesTags || [],
      profileCauseTags: profile.causeTags || [],
      assignmentStartEarliest: assignment.startEarliest,
      assignmentStartLatest: assignment.startLatest,
      profileAvailabilityEarliest: profile.availabilityEarliest,
      assignmentHoursMin: assignment.hoursMin,
      assignmentHoursMax: assignment.hoursMax,
      profileHoursMin: profile.hoursMin,
      profileHoursMax: profile.hoursMax,
      assignmentLocationMode: assignment.locationMode,
      profileWorkMode: profile.workMode,
      assignmentCountry: assignment.country,
      profileCountry: profile.country,
      assignmentCompMin: assignment.compMin,
      assignmentCompMax: assignment.compMax,
      profileCompAnnualRange: profileAnnualComp,
      assignmentMinLanguage: assignmentLanguageRequirement,
      candidateLanguageLevel,
      assignmentCanSponsorVisa: assignment.canSponsorVisa,
      profileNeedsSponsorship: profile.needsSponsorship,
      profileWishesSponsorship: profile.wishesSponsorship,
      verificationGates: assignment.verificationGates || [],
      verifiedFlags: (profile.verified as Record<string, boolean> | null) || {},
      sourceRefs: {
        assignmentUpdatedAt: assignment.updatedAt?.toISOString?.() ?? null,
        profileUpdatedAt: profile.updatedAt?.toISOString?.() ?? null,
      },
    });

    if (!artifact) {
      continue;
    }

    results.push({
      profileId: profile.profileId,
      score: artifact.scoreNormalized,
      scoreTotal: artifact.scoreTotal,
      subscoresJson: artifact.subscoresJson,
      scoreSnapshotJson: artifact.scoreSnapshotJson,
      reasonCodes: artifact.reasonCodes,
      profile: scrubDisallowedFields(profile),
      artifact,
    });
  }

  results.sort((left, right) =>
    compareCanonicalMatchOrder(
      {
        scoreTotal: left.scoreTotal,
        subscoresJson: left.subscoresJson,
        counterpartId: left.profileId,
      },
      {
        scoreTotal: right.scoreTotal,
        subscoresJson: right.subscoresJson,
        counterpartId: right.profileId,
      }
    )
  );

  const topK = results.slice(0, k);
  const duration = Date.now() - startTime;

  log.info('match.assignment.computed', {
    assignmentId,
    poolSize: candidateProfiles.length,
    resultCount: topK.length,
    durationMs: duration,
    candidateScanLimit,
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
      hasMissionVisionScores: false,
    },
  };
}
