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
import { discoverPossibleMatches } from '@/lib/matching/discovery';
import { evaluateMatchEvidence } from '@/lib/matching/evidence-evaluation';
import { evaluateIndividualMatchabilityForProfiles } from '@/lib/matching/eligibility';
import {
  buildCanonicalMatchScoreArtifact,
  compareCanonicalMatchOrder,
  MATCH_SCORE_CONTRACT_VERSION,
  MATCH_SCORE_MAX_BPS,
  MATCH_SCORE_MODEL_VERSION,
  type CanonicalMatchScoreArtifact,
} from '@/lib/matching/match-score-contract';
import { sortReasonCodeStrings } from '@/lib/matching/reason-codes';
import { annRetrieveSimilarProfiles } from '@/lib/matching/semantic';
import { CONSENT_TYPES } from '@/lib/privacy/consent-contract';
import {
  hasPrimaryAnchorContext,
  listCanonicalProofPackAggregatesForOwner,
  type CanonicalProofPackAggregate,
} from '@/lib/proofs/canonical-pack';

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
const DISCOVERY_ONLY_SCORE_CEILING = 6400;
const LOW_SUPPLY_INTRO_READY_THRESHOLD = 3;
const NON_SELF_TRUST_KINDS = new Set([
  'skill_attestation_peer',
  'skill_attestation_manager',
  'impact_attestation',
]);

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

function hasActiveNonSelfTrustAnchor(
  record: CanonicalProofPackAggregate['verificationReferences'][number],
  seenRecordIds: Set<string>
) {
  if (seenRecordIds.has(record.id)) return false;
  if (!NON_SELF_TRUST_KINDS.has(record.verificationKind)) return false;
  if (record.status !== 'verified' || record.integrityStatus !== 'clear') return false;
  if (record.disputeState === 'open' || record.disputeState === 'under_review') return false;
  seenRecordIds.add(record.id);
  return true;
}

function collectAggregateSkillIds(aggregate: CanonicalProofPackAggregate) {
  const skillIds = new Set<string>();

  for (const item of aggregate.items) {
    if (item.artifact.subjectType === 'skill' && typeof item.artifact.subjectId === 'string') {
      skillIds.add(item.artifact.subjectId);
    }
  }

  for (const record of aggregate.verificationReferences) {
    if (record.subjectType === 'skill' && typeof record.subjectId === 'string') {
      skillIds.add(record.subjectId);
    }
  }

  return [...skillIds];
}

function buildDiscoveryProofPacks(
  aggregates: CanonicalProofPackAggregate[],
  seenRecordIds: Set<string>
) {
  return aggregates
    .filter((aggregate) => aggregate.pack.packKind === 'verification_bundle')
    .map((aggregate) => {
      const contract = aggregate.ownerFull.contract;
      return {
        id: aggregate.pack.id,
        title: aggregate.pack.title,
        claim: contract.primaryClaim.statement,
        summary: aggregate.pack.summary,
        outcome: contract.outcomeSummary ?? aggregate.pack.outcomesSummary,
        ownership: contract.ownershipStatement ?? aggregate.pack.ownershipStatement,
        freshnessState: aggregate.freshnessState,
        verificationStatus: aggregate.verificationStatus,
        hasPrimaryAnchor: hasPrimaryAnchorContext(aggregate.pack),
        hasActiveNonSelfTrustAnchor: aggregate.verificationReferences.some((record) =>
          hasActiveNonSelfTrustAnchor(record, seenRecordIds)
        ),
        linkedSkillIds: collectAggregateSkillIds(aggregate),
        visibility: aggregate.pack.visibility,
        revealGate: aggregate.pack.revealGate,
      };
    });
}

function buildDiscoveryAssignmentInput(params: {
  assignment: Assignment;
  mustHaveSkills: Skill[];
  niceToHaveSkills: Skill[];
}) {
  return {
    id: params.assignment.id,
    role: params.assignment.role,
    description: params.assignment.description,
    businessValue: params.assignment.businessValue,
    expectedImpact: params.assignment.expectedImpact,
    mustHaveSkills: params.mustHaveSkills,
    niceToHaveSkills: params.niceToHaveSkills,
    proofExpectations: [
      params.assignment.expectedImpact,
      params.assignment.businessValue,
      ...(params.assignment.verificationGates ?? []),
    ]
      .filter(Boolean)
      .join(' '),
  };
}

function buildDiscoveryScoreArtifact(input: {
  assignmentId: string;
  profileId: string;
  evaluation: ReturnType<typeof evaluateMatchEvidence>;
  gates: Array<Record<string, unknown>>;
}): CanonicalMatchScoreArtifact {
  const now = new Date();
  const scoreTotal = Math.min(
    DISCOVERY_ONLY_SCORE_CEILING,
    Math.max(900, Math.round(input.evaluation.internalOrder * 100))
  );
  const reasonCodes = sortReasonCodeStrings(
    input.evaluation.reasonDetails.map((reason) => reason.code)
  ) as CanonicalMatchScoreArtifact['reasonCodes'];

  return {
    scoreVersion: MATCH_SCORE_CONTRACT_VERSION,
    modelVersion: MATCH_SCORE_MODEL_VERSION,
    scoreState: 'generated',
    scoreTotal,
    scoreNormalized: Number((scoreTotal / MATCH_SCORE_MAX_BPS).toFixed(4)),
    inputsHash: `${input.assignmentId}:${input.profileId}:discovery-v1`,
    reasonCodes,
    generatedAt: now,
    staleAt: null,
    recomputedAt: null,
    hiddenDueToPolicyAt: null,
    hiddenDueToPolicyReasonCodes: [],
    subscoresJson: {
      discovery_fit: scoreTotal,
      skills_fit: null,
      proof_fit: null,
      constraints_fit: null,
      verification_fit: null,
      purpose_fit: null,
      confidence_total: null,
    },
    scoreSnapshotJson: {
      contract_version: MATCH_SCORE_CONTRACT_VERSION,
      model_version: MATCH_SCORE_MODEL_VERSION,
      discovery_status: input.evaluation.discoveryStatus,
      fit_band: input.evaluation.fitBand,
      reason_codes: reasonCodes,
      gates: input.gates,
      score_visibility: 'internal_ordering_only',
    },
  };
}

function augmentArtifactWithDiscovery(
  artifact: CanonicalMatchScoreArtifact,
  evaluation: ReturnType<typeof evaluateMatchEvidence> | null
): CanonicalMatchScoreArtifact {
  if (!evaluation) return artifact;

  const reasonCodes = sortReasonCodeStrings([
    ...artifact.reasonCodes,
    ...evaluation.reasonDetails.map((reason) => reason.code),
  ]) as CanonicalMatchScoreArtifact['reasonCodes'];

  return {
    ...artifact,
    reasonCodes,
    scoreSnapshotJson: {
      ...artifact.scoreSnapshotJson,
      discovery_status: evaluation.discoveryStatus,
      fit_band: evaluation.fitBand,
      discovery_reason_codes: evaluation.reasonDetails.map((reason) => reason.code),
      score_visibility: 'internal_ordering_only',
    },
  };
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
  const proofAggregatesByProfileId = new Map<string, CanonicalProofPackAggregate[]>();
  await Promise.all(
    profileIds.map(async (profileId) => {
      proofAggregatesByProfileId.set(
        profileId,
        await listCanonicalProofPackAggregatesForOwner('individual_profile', profileId)
      );
    })
  );
  const discoveryAssignment = buildDiscoveryAssignmentInput({
    assignment,
    mustHaveSkills,
    niceToHaveSkills,
  });
  const discoveryCandidateProfiles = candidateProfiles.filter((profile) => {
    const matchingConsentActive = activeMatchingConsentIds.has(profile.profileId);
    const matchabilityEligible = eligibilityByProfileId.get(profile.profileId) ?? false;
    return matchingConsentActive && matchabilityEligible;
  });
  const discoveryCandidates = discoveryCandidateProfiles.map((profile) => {
    const seenTrustRecordIds = new Set<string>();
    const aggregates = proofAggregatesByProfileId.get(profile.profileId) ?? [];
    const proofPacks = buildDiscoveryProofPacks(aggregates, seenTrustRecordIds);
    const profileSkills = profileSkillRows.get(profile.profileId) ?? [];
    return {
      id: profile.profileId,
      profileId: profile.profileId,
      skills: profileSkills.map((skill) => skill.skillCode || skill.skillId).filter(Boolean),
      customWording: [
        ...(profile.desiredRoles ?? []),
        ...(profile.desiredIndustries ?? []),
        ...(profile.preferredIndustryLabels ?? []),
      ],
      proofPacks,
      readiness: {
        discoverable: eligibilityByProfileId.get(profile.profileId) ?? false,
      },
      trustSignals: {
        activeNonSelfTrustAnchorCount: proofPacks.filter(
          (proof) => proof.hasActiveNonSelfTrustAnchor
        ).length,
        hasFreshRoleRelevantProof: proofPacks.some((proof) => proof.freshnessState === 'fresh'),
        orphanRelevantProofCount: proofPacks.filter((proof) => proof.hasPrimaryAnchor === false)
          .length,
      },
      constraints: {
        hardConstraintsSatisfied: !(
          Boolean(profile.needsSponsorship) && assignment.canSponsorVisa === false
        ),
        constraintMismatchCodes:
          Boolean(profile.needsSponsorship) && assignment.canSponsorVisa === false
            ? ['work_authorization_possible']
            : [],
      },
      privacy: {
        privacySafeForStage: true,
      },
    };
  });

  const results: AssignmentMatchResult[] = [];
  const assignmentLanguageRequirement = assignment.minLanguage as {
    code: string;
    level: string;
  } | null;
  const scoredByProfileId = new Map<string, CanonicalMatchScoreArtifact>();

  for (const profile of candidateProfiles) {
    const matchingConsentActive = activeMatchingConsentIds.has(profile.profileId);
    const matchabilityEligible = eligibilityByProfileId.get(profile.profileId) ?? false;
    if (!matchingConsentActive || !matchabilityEligible) {
      continue;
    }

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
      matchabilityEligible,
      matchingConsentActive,
      requiredSkills: mustHaveSkills.map((entry) => ({ id: entry.id, level: entry.level })),
      niceToHaveSkills: niceToHaveSkills.map((entry) => ({ id: entry.id, level: entry.level })),
      candidateSkills: candidateSkillSet,
      assignmentValuesTags: assignment.valuesRequired || [],
      assignmentCauseTags: assignment.causeTags || [],
      profileValuesTags: [],
      profileCauseTags: [],
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

    if (artifact) {
      scoredByProfileId.set(profile.profileId, artifact);
    }
  }

  const introReadyEstimate = [...scoredByProfileId.values()].filter((artifact) =>
    artifact.reasonCodes.includes('verification_ready')
  ).length;
  const discoveredMatches = discoverPossibleMatches({
    assignment: discoveryAssignment,
    candidates: discoveryCandidates,
    lowSupply: {
      introReadyCount: introReadyEstimate,
      introReadyThreshold: LOW_SUPPLY_INTRO_READY_THRESHOLD,
    },
  });
  const discoveryEvaluationByProfileId = new Map(
    discoveredMatches.map((candidate) => [
      candidate.profileId,
      evaluateMatchEvidence({ discoveredCandidate: candidate }),
    ])
  );

  for (const profile of candidateProfiles) {
    const matchingConsentActive = activeMatchingConsentIds.has(profile.profileId);
    const matchabilityEligible = eligibilityByProfileId.get(profile.profileId) ?? false;
    if (!matchingConsentActive || !matchabilityEligible) {
      continue;
    }

    const artifact = scoredByProfileId.get(profile.profileId) ?? null;
    const evaluation = discoveryEvaluationByProfileId.get(profile.profileId) ?? null;
    if (!artifact && !evaluation) {
      continue;
    }

    const finalArtifact = artifact
      ? augmentArtifactWithDiscovery(artifact, evaluation)
      : buildDiscoveryScoreArtifact({
          assignmentId,
          profileId: profile.profileId,
          evaluation: evaluation as NonNullable<typeof evaluation>,
          gates: [
            {
              gate: 'required_skills_met',
              passed: false,
              blocking: true,
              detail: 'discovery_only',
            },
          ],
        });

    results.push({
      profileId: profile.profileId,
      score: finalArtifact.scoreNormalized,
      scoreTotal: finalArtifact.scoreTotal,
      subscoresJson: finalArtifact.subscoresJson,
      scoreSnapshotJson: finalArtifact.scoreSnapshotJson,
      reasonCodes: finalArtifact.reasonCodes,
      profile: scrubDisallowedFields(profile),
      artifact: finalArtifact,
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
