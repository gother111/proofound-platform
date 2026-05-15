import {
  scoreAvailability,
  scoreCompensation,
  scoreLanguage,
  scoreLocation,
  scoreWorkAuthorization,
  type LocationMode,
  type Range,
  type Skill,
} from '@/lib/core/matching/scorers';
import { stableHashPayload, type MatchReasonCode } from '@/lib/contracts/canonical-domain';

export const MATCH_SCORE_CONTRACT_VERSION = 'match-score-contract/v1';
export const MATCH_SCORE_MODEL_VERSION =
  process.env.MATCHING_MODEL_VERSION?.trim() || 'core-rules/v1';
export const MATCH_SCORE_STALE_TTL_HOURS = 24;
export const MATCH_SCORE_STALE_GRACE_HOURS = 6;
export const MATCH_SCORE_MAX_BPS = 10_000;
export const MATCH_SCORE_COMPONENT_WEIGHTS = {
  skills_fit: 3500,
  proof_fit: 2000,
  constraints_fit: 2500,
  verification_fit: 2000,
  purpose_fit: 0,
} as const;
export const MATCH_SCORE_CONSTRAINT_LEAF_WEIGHTS = {
  availability: 3500,
  location: 2500,
  compensation: 2000,
  language: 1000,
  work_authorization: 1000,
} as const;
export type MatchScoreState = 'generated' | 'stale' | 'recomputed' | 'hidden_due_to_policy';
export type MatchScoreComponent =
  | 'skills_fit'
  | 'proof_fit'
  | 'constraints_fit'
  | 'verification_fit'
  | 'purpose_fit';
export type MatchScoreStatus = 'applicable' | 'not_applicable' | 'missing_candidate_data';

type SkillRequirement = {
  id: string;
  level: number;
  type: 'required' | 'nice_to_have';
};

type VerificationGateStatus = {
  gate: string;
  satisfied: boolean;
};

type CanonicalDateLike = Date | string | null | undefined;

export type CanonicalMatchScoreInput = {
  assignmentId: string;
  profileId: string;
  assignmentOrgId?: string | null;
  profileOrgId?: string | null;
  assignmentStatus?: string | null;
  matchabilityEligible: boolean;
  matchingConsentActive: boolean;
  policyAllowed?: boolean;
  requiredSkills: Array<{ id: string; level: number }>;
  niceToHaveSkills: Array<{ id: string; level: number }>;
  candidateSkills: Record<string, Skill>;
  assignmentValuesTags?: string[] | null;
  assignmentCauseTags?: string[] | null;
  profileValuesTags?: string[] | null;
  profileCauseTags?: string[] | null;
  assignmentStartEarliest?: CanonicalDateLike;
  assignmentStartLatest?: CanonicalDateLike;
  profileAvailabilityEarliest?: CanonicalDateLike;
  assignmentHoursMin?: number | null;
  assignmentHoursMax?: number | null;
  profileHoursMin?: number | null;
  profileHoursMax?: number | null;
  assignmentLocationMode?: LocationMode | string | null;
  profileWorkMode?: LocationMode | string | null;
  assignmentCountry?: string | null;
  profileCountry?: string | null;
  assignmentCompMin?: number | null;
  assignmentCompMax?: number | null;
  profileCompMin?: number | null;
  profileCompMax?: number | null;
  profileCompAnnualRange?: Range | null;
  assignmentMinLanguage?: { code: string; level: string } | null;
  candidateLanguageLevel?: string | null;
  assignmentCanSponsorVisa?: boolean | null;
  profileNeedsSponsorship?: boolean | null;
  profileWishesSponsorship?: boolean | null;
  verificationGates?: string[] | null;
  verifiedFlags?: Record<string, boolean> | null;
  verificationStatuses?: VerificationGateStatus[] | null;
  sourceRefs?: Record<string, unknown>;
  previousScoreState?: MatchScoreState | null;
  generatedAt?: Date | null;
};

export type CanonicalMatchScoreArtifact = {
  scoreVersion: string;
  modelVersion: string;
  scoreState: MatchScoreState;
  scoreTotal: number;
  scoreNormalized: number;
  inputsHash: string;
  reasonCodes: MatchReasonCode[];
  generatedAt: Date;
  staleAt: Date | null;
  recomputedAt: Date | null;
  hiddenDueToPolicyAt: Date | null;
  hiddenDueToPolicyReasonCodes: string[];
  subscoresJson: Record<string, unknown>;
  scoreSnapshotJson: Record<string, unknown>;
};

type GateResult = {
  gate: string;
  passed: boolean;
  blocking: boolean;
  detail?: string;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function toBps(value: number): number {
  return Math.round(clamp01(value) * MATCH_SCORE_MAX_BPS);
}

function normalizedArray(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry): entry is string => typeof entry === 'string'))].sort();
}

function normalizeDate(value: CanonicalDateLike): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeRange(
  min: number | null | undefined,
  max: number | null | undefined
): Range | null {
  if (min == null && max == null) return null;
  if (min == null && max != null) return { min: max, max };
  if (min != null && max == null) return { min, max: min };
  if ((min as number) <= (max as number)) {
    return { min: min as number, max: max as number };
  }
  return { min: max as number, max: min as number };
}

function normalizeHours(
  min: number | null | undefined,
  max: number | null | undefined
): Range | null {
  const normalized = normalizeRange(min, max);
  if (!normalized) return null;
  return {
    min: Math.max(0, normalized.min),
    max: Math.max(Math.max(0, normalized.min), normalized.max || 0),
  };
}

function averageWeighted(values: Array<{ score: number; weight: number }>): number {
  const totalWeight = values.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) return 0;
  const weighted = values.reduce((sum, entry) => sum + entry.score * entry.weight, 0);
  return Math.round(weighted / totalWeight);
}

function sortReasonCodes(codes: Set<MatchReasonCode>): MatchReasonCode[] {
  const order: MatchReasonCode[] = [
    'skills_strong',
    'skills_gap',
    'purpose_alignment_strong',
    'purpose_alignment_partial',
    'verification_ready',
    'verification_gap',
    'logistics_fit',
    'compensation_fit',
    'language_fit',
    'focus_role',
    'focus_industry',
    'focus_org_type',
    'shortlist_selected',
    'passed_for_now',
    'rejected_constraints',
    'override_keep_under_review',
    'override_shortlist_manual',
    'override_reject_manual',
    'fairness_warning_active',
    'fairness_ranking_suppressed',
    'reveal_shortlist_identity',
    'reveal_full_identity',
  ];
  return order.filter((entry) => codes.has(entry));
}

function buildSkillRequirements(
  requiredSkills: Array<{ id: string; level: number }>,
  niceToHaveSkills: Array<{ id: string; level: number }>
): SkillRequirement[] {
  const required = requiredSkills
    .filter((entry) => entry?.id && Number.isFinite(entry.level))
    .map((entry) => ({
      id: entry.id,
      level: Math.max(1, entry.level),
      type: 'required' as const,
    }));
  const optional = niceToHaveSkills
    .filter((entry) => entry?.id && Number.isFinite(entry.level))
    .map((entry) => ({
      id: entry.id,
      level: Math.max(1, entry.level),
      type: 'nice_to_have' as const,
    }));
  return [...required, ...optional];
}

function deriveVerificationStatuses(input: CanonicalMatchScoreInput): VerificationGateStatus[] {
  if (Array.isArray(input.verificationStatuses) && input.verificationStatuses.length > 0) {
    return input.verificationStatuses.map((entry) => ({
      gate: entry.gate,
      satisfied: Boolean(entry.satisfied),
    }));
  }

  const verifiedFlags = input.verifiedFlags ?? {};
  return normalizedArray(input.verificationGates).map((gate) => ({
    gate,
    satisfied: Boolean(verifiedFlags[gate]),
  }));
}

function deriveGateResults(
  input: CanonicalMatchScoreInput,
  requirements: SkillRequirement[]
): GateResult[] {
  const gates: GateResult[] = [];
  const requiredSkillGaps = requirements
    .filter((entry) => entry.type === 'required')
    .filter((entry) => {
      const candidate = input.candidateSkills[entry.id];
      return !candidate || candidate.level < entry.level;
    });

  gates.push({
    gate: 'assignment_active',
    passed: input.assignmentStatus === 'active',
    blocking: true,
    detail: input.assignmentStatus ?? 'unknown',
  });
  gates.push({
    gate: 'matchability',
    passed: input.matchabilityEligible,
    blocking: true,
  });
  gates.push({
    gate: 'matching_consent',
    passed: input.matchingConsentActive,
    blocking: true,
  });
  gates.push({
    gate: 'policy_allowed',
    passed: input.policyAllowed !== false,
    blocking: true,
  });
  gates.push({
    gate: 'different_org',
    passed:
      !input.assignmentOrgId || !input.profileOrgId || input.assignmentOrgId !== input.profileOrgId,
    blocking: true,
  });
  gates.push({
    gate: 'required_skills_met',
    passed: requiredSkillGaps.length === 0,
    blocking: true,
    detail: requiredSkillGaps.map((entry) => entry.id).join(',') || undefined,
  });
  const workAuthorizationHardFail =
    Boolean(input.profileNeedsSponsorship) && input.assignmentCanSponsorVisa === false;
  gates.push({
    gate: 'work_authorization_possible',
    passed: !workAuthorizationHardFail,
    blocking: true,
  });
  return gates;
}

export function buildCanonicalMatchScoreArtifact(
  input: CanonicalMatchScoreInput
): CanonicalMatchScoreArtifact | null {
  const now = new Date();
  const skillRequirements = buildSkillRequirements(input.requiredSkills, input.niceToHaveSkills);
  const gates = deriveGateResults(input, skillRequirements);
  if (gates.some((gate) => gate.blocking && !gate.passed)) {
    return null;
  }

  const componentScores: Partial<Record<MatchScoreComponent, number>> = {};
  const componentStatus: Partial<Record<MatchScoreComponent, MatchScoreStatus>> = {};
  const leafScores: Record<string, number | null> = {};
  const leafStatus: Record<string, MatchScoreStatus> = {};
  const reasonCodeInputs: Record<string, unknown> = {};
  const confidenceWeights: Array<{ weight: number; present: boolean }> = [];

  const verificationStatuses = deriveVerificationStatuses(input);

  const componentEntries: Array<{ key: MatchScoreComponent; weight: number }> = [];

  if (skillRequirements.length > 0) {
    const skillEntries = skillRequirements.map((entry) => {
      const candidate = input.candidateSkills[entry.id];
      const weight = entry.type === 'required' ? 3 : 1;
      const candidatePresent = Boolean(candidate);
      const candidateLevel = candidate?.level ?? 0;
      const score = toBps(candidateLevel / entry.level);
      leafScores[`skill:${entry.id}`] = score;
      leafStatus[`skill:${entry.id}`] = candidatePresent ? 'applicable' : 'missing_candidate_data';
      confidenceWeights.push({ weight, present: candidatePresent });
      return { score, weight };
    });
    componentScores.skills_fit = averageWeighted(skillEntries);
    componentStatus.skills_fit = skillEntries.some((entry) => entry.weight > 0)
      ? skillEntries.every((entry) => entry.score > 0)
        ? 'applicable'
        : skillEntries.some((entry) => entry.score === 0)
          ? 'missing_candidate_data'
          : 'applicable'
      : 'not_applicable';
    componentEntries.push({
      key: 'skills_fit',
      weight: MATCH_SCORE_COMPONENT_WEIGHTS.skills_fit,
    });

    const proofEntries = skillRequirements.map((entry) => {
      const candidate = input.candidateSkills[entry.id];
      const weight = entry.type === 'required' ? 3 : 1;
      const hasProofInputs =
        candidate &&
        candidate.evidenceStrength != null &&
        candidate.recencyMultiplier != null &&
        candidate.impactScore != null;
      const proofScore = hasProofInputs
        ? Math.round(
            MATCH_SCORE_MAX_BPS *
              (0.5 * clamp01(candidate.evidenceStrength ?? 0) +
                0.3 * clamp01(candidate.recencyMultiplier ?? 0) +
                0.2 * clamp01(candidate.impactScore ?? 0))
          )
        : 0;
      leafScores[`proof:${entry.id}`] = proofScore;
      leafStatus[`proof:${entry.id}`] = hasProofInputs ? 'applicable' : 'missing_candidate_data';
      confidenceWeights.push({ weight, present: hasProofInputs });
      return { score: proofScore, weight };
    });
    componentScores.proof_fit = averageWeighted(proofEntries);
    componentStatus.proof_fit = proofEntries.every((entry) => entry.score > 0)
      ? 'applicable'
      : 'missing_candidate_data';
    componentEntries.push({
      key: 'proof_fit',
      weight: MATCH_SCORE_COMPONENT_WEIGHTS.proof_fit,
    });
  } else {
    componentScores.skills_fit = null as never;
    componentScores.proof_fit = null as never;
    componentStatus.skills_fit = 'not_applicable';
    componentStatus.proof_fit = 'not_applicable';
  }

  const constraintLeaves: Array<{
    name: keyof typeof MATCH_SCORE_CONSTRAINT_LEAF_WEIGHTS;
    score: number;
    status: MatchScoreStatus;
    applicable: boolean;
  }> = [];

  const assignmentDateWindow =
    input.assignmentStartEarliest || input.assignmentStartLatest
      ? {
          earliest:
            normalizeDate(input.assignmentStartEarliest) ??
            normalizeDate(input.assignmentStartLatest),
          latest:
            normalizeDate(input.assignmentStartLatest) ??
            normalizeDate(input.assignmentStartEarliest),
        }
      : null;
  const assignmentHours = normalizeHours(input.assignmentHoursMin, input.assignmentHoursMax);
  const profileHours = normalizeHours(input.profileHoursMin, input.profileHoursMax);
  const availabilityApplicable = Boolean(assignmentDateWindow || assignmentHours);
  if (availabilityApplicable) {
    const candidateDate = normalizeDate(input.profileAvailabilityEarliest);
    const assignmentWindowEarliest = assignmentDateWindow?.earliest ?? null;
    const assignmentWindowLatest = assignmentDateWindow?.latest ?? null;
    const canScore: boolean = Boolean(
      candidateDate &&
        assignmentWindowEarliest &&
        assignmentWindowLatest &&
        assignmentHours &&
        profileHours
    );
    const score = canScore
      ? toBps(
          scoreAvailability(
            {
              earliest: assignmentWindowEarliest as Date,
              latest: assignmentWindowLatest as Date,
            },
            candidateDate as Date,
            assignmentHours as Range,
            profileHours as Range
          )
        )
      : 0;
    const status: MatchScoreStatus = canScore ? 'applicable' : 'missing_candidate_data';
    leafScores.availability = score;
    leafStatus.availability = status;
    confidenceWeights.push({
      weight: MATCH_SCORE_CONSTRAINT_LEAF_WEIGHTS.availability,
      present: canScore,
    });
    constraintLeaves.push({ name: 'availability', score, status, applicable: true });
  } else {
    leafScores.availability = null;
    leafStatus.availability = 'not_applicable';
  }

  const locationApplicable = Boolean(input.assignmentLocationMode || input.assignmentCountry);
  if (locationApplicable) {
    const candidateModePresent = Boolean(input.profileWorkMode);
    const candidateCountryPresent =
      input.assignmentLocationMode === 'onsite' && input.assignmentCountry
        ? Boolean(input.profileCountry)
        : true;
    const canScore = candidateModePresent && candidateCountryPresent;
    const score = canScore
      ? toBps(
          scoreLocation(
            (input.assignmentLocationMode || 'remote') as LocationMode,
            (input.profileWorkMode || 'remote') as LocationMode,
            input.assignmentCountry || undefined,
            input.profileCountry || undefined
          )
        )
      : 0;
    const status: MatchScoreStatus = canScore ? 'applicable' : 'missing_candidate_data';
    leafScores.location = score;
    leafStatus.location = status;
    confidenceWeights.push({
      weight: MATCH_SCORE_CONSTRAINT_LEAF_WEIGHTS.location,
      present: canScore,
    });
    constraintLeaves.push({ name: 'location', score, status, applicable: true });
  } else {
    leafScores.location = null;
    leafStatus.location = 'not_applicable';
  }

  const assignmentCompRange = normalizeRange(input.assignmentCompMin, input.assignmentCompMax);
  const profileCompRange =
    input.profileCompAnnualRange ?? normalizeRange(input.profileCompMin, input.profileCompMax);
  const compensationApplicable = Boolean(assignmentCompRange);
  if (compensationApplicable) {
    const canScore = Boolean(assignmentCompRange && profileCompRange);
    const score = canScore
      ? toBps(scoreCompensation(assignmentCompRange as Range, profileCompRange as Range))
      : 0;
    const status: MatchScoreStatus = canScore ? 'applicable' : 'missing_candidate_data';
    leafScores.compensation = score;
    leafStatus.compensation = status;
    confidenceWeights.push({
      weight: MATCH_SCORE_CONSTRAINT_LEAF_WEIGHTS.compensation,
      present: canScore,
    });
    constraintLeaves.push({ name: 'compensation', score, status, applicable: true });
  } else {
    leafScores.compensation = null;
    leafStatus.compensation = 'not_applicable';
  }

  const languageApplicable = Boolean(
    input.assignmentMinLanguage?.code && input.assignmentMinLanguage?.level
  );
  if (languageApplicable) {
    const canScore = Boolean(input.candidateLanguageLevel);
    const score = canScore
      ? toBps(
          scoreLanguage(
            input.assignmentMinLanguage?.level || 'A1',
            input.candidateLanguageLevel || 'A1'
          )
        )
      : 0;
    const status: MatchScoreStatus = canScore ? 'applicable' : 'missing_candidate_data';
    leafScores.language = score;
    leafStatus.language = status;
    confidenceWeights.push({
      weight: MATCH_SCORE_CONSTRAINT_LEAF_WEIGHTS.language,
      present: canScore,
    });
    constraintLeaves.push({ name: 'language', score, status, applicable: true });
  } else {
    leafScores.language = null;
    leafStatus.language = 'not_applicable';
  }

  const workAuthorizationApplicable = input.assignmentCanSponsorVisa != null;
  if (workAuthorizationApplicable) {
    const score = toBps(
      scoreWorkAuthorization({
        candidateNeedsSponsorship: Boolean(input.profileNeedsSponsorship),
        candidateWishesSponsorship: Boolean(input.profileWishesSponsorship),
        orgCanSponsor: Boolean(input.assignmentCanSponsorVisa),
      })
    );
    leafScores.work_authorization = score;
    leafStatus.work_authorization = 'applicable';
    confidenceWeights.push({
      weight: MATCH_SCORE_CONSTRAINT_LEAF_WEIGHTS.work_authorization,
      present: true,
    });
    constraintLeaves.push({
      name: 'work_authorization',
      score,
      status: 'applicable',
      applicable: true,
    });
  } else {
    leafScores.work_authorization = null;
    leafStatus.work_authorization = 'not_applicable';
  }

  const applicableConstraintLeaves = constraintLeaves.filter((entry) => entry.applicable);
  if (applicableConstraintLeaves.length > 0) {
    componentScores.constraints_fit = averageWeighted(
      applicableConstraintLeaves.map((entry) => ({
        score: entry.score,
        weight: MATCH_SCORE_CONSTRAINT_LEAF_WEIGHTS[entry.name],
      }))
    );
    componentStatus.constraints_fit = applicableConstraintLeaves.some(
      (entry) => entry.status === 'missing_candidate_data'
    )
      ? 'missing_candidate_data'
      : 'applicable';
    componentEntries.push({
      key: 'constraints_fit',
      weight: MATCH_SCORE_COMPONENT_WEIGHTS.constraints_fit,
    });
  } else {
    componentScores.constraints_fit = null as never;
    componentStatus.constraints_fit = 'not_applicable';
  }

  if (verificationStatuses.length > 0) {
    const gateScores = verificationStatuses.map((entry) => ({
      score: entry.satisfied ? MATCH_SCORE_MAX_BPS : 0,
      weight: 1,
    }));
    componentScores.verification_fit = averageWeighted(gateScores);
    componentStatus.verification_fit = gateScores.every((entry) => entry.score > 0)
      ? 'applicable'
      : 'missing_candidate_data';
    componentEntries.push({
      key: 'verification_fit',
      weight: MATCH_SCORE_COMPONENT_WEIGHTS.verification_fit,
    });
    confidenceWeights.push({
      weight: MATCH_SCORE_COMPONENT_WEIGHTS.verification_fit,
      present: verificationStatuses.every((entry) => entry.satisfied),
    });
  } else {
    componentScores.verification_fit = null as never;
    componentStatus.verification_fit = 'not_applicable';
  }

  leafScores.values_fit = null;
  leafStatus.values_fit = 'not_applicable';
  leafScores.causes_fit = null;
  leafStatus.causes_fit = 'not_applicable';
  componentScores.purpose_fit = null as never;
  componentStatus.purpose_fit = 'not_applicable';

  const totalWeight = componentEntries.reduce((sum, entry) => sum + entry.weight, 0);
  const scoreTotal =
    totalWeight > 0
      ? Math.round(
          componentEntries.reduce(
            (sum, entry) => sum + entry.weight * Number(componentScores[entry.key] ?? 0),
            0
          ) / totalWeight
        )
      : 0;

  const confidenceTotal = confidenceWeights.length
    ? Math.round(
        MATCH_SCORE_MAX_BPS *
          (confidenceWeights.reduce((sum, entry) => sum + (entry.present ? entry.weight : 0), 0) /
            confidenceWeights.reduce((sum, entry) => sum + entry.weight, 0))
      )
    : MATCH_SCORE_MAX_BPS;

  const reasonCodes = new Set<MatchReasonCode>();
  const skillsFit = Number(componentScores.skills_fit ?? 0);
  const verificationFit = Number(componentScores.verification_fit ?? 0);
  const constraintsFit = Number(componentScores.constraints_fit ?? 0);

  if (skillsFit >= 8000) reasonCodes.add('skills_strong');
  if (skillsFit < 6500) reasonCodes.add('skills_gap');
  if (verificationStatuses.length > 0 && verificationFit === 10000) {
    reasonCodes.add('verification_ready');
  } else if (verificationStatuses.length > 0) {
    reasonCodes.add('verification_gap');
  }
  if (constraintsFit >= 7000) reasonCodes.add('logistics_fit');
  if (Number(leafScores.compensation ?? 0) >= 7000) reasonCodes.add('compensation_fit');
  if (Number(leafScores.language ?? 0) >= 7000) reasonCodes.add('language_fit');

  reasonCodeInputs.skills_fit = skillsFit;
  reasonCodeInputs.proof_fit = componentScores.proof_fit ?? null;
  reasonCodeInputs.constraints_fit = constraintsFit;
  reasonCodeInputs.verification_fit = verificationFit;
  reasonCodeInputs.compensation = leafScores.compensation ?? null;
  reasonCodeInputs.language = leafScores.language ?? null;

  const inputSnapshot = {
    assignment: {
      id: input.assignmentId,
      orgId: input.assignmentOrgId ?? null,
      status: input.assignmentStatus ?? null,
      startEarliest: normalizeDate(input.assignmentStartEarliest)?.toISOString() ?? null,
      startLatest: normalizeDate(input.assignmentStartLatest)?.toISOString() ?? null,
      hours: assignmentHours,
      locationMode: input.assignmentLocationMode ?? null,
      country: input.assignmentCountry ?? null,
      compensation: assignmentCompRange,
      minLanguage: input.assignmentMinLanguage ?? null,
      canSponsorVisa: input.assignmentCanSponsorVisa ?? null,
      verificationGates: normalizedArray(input.verificationGates),
      requiredSkills: skillRequirements.filter((entry) => entry.type === 'required'),
      niceToHaveSkills: skillRequirements.filter((entry) => entry.type === 'nice_to_have'),
    },
    profile: {
      id: input.profileId,
      orgId: input.profileOrgId ?? null,
      availabilityEarliest: normalizeDate(input.profileAvailabilityEarliest)?.toISOString() ?? null,
      hours: profileHours,
      workMode: input.profileWorkMode ?? null,
      country: input.profileCountry ?? null,
      compensation: profileCompRange,
      needsSponsorship: Boolean(input.profileNeedsSponsorship),
      wishesSponsorship: Boolean(input.profileWishesSponsorship),
      candidateLanguageLevel: input.candidateLanguageLevel ?? null,
      verifiedFlags: input.verifiedFlags ?? {},
      skills: skillRequirements
        .map((entry) => ({
          id: entry.id,
          type: entry.type,
          requirementLevel: entry.level,
          candidate: input.candidateSkills[entry.id]
            ? {
                level: input.candidateSkills[entry.id]?.level ?? 0,
                months: input.candidateSkills[entry.id]?.months ?? 0,
                evidenceStrength: input.candidateSkills[entry.id]?.evidenceStrength ?? null,
                recencyMultiplier: input.candidateSkills[entry.id]?.recencyMultiplier ?? null,
                impactScore: input.candidateSkills[entry.id]?.impactScore ?? null,
                lastUsedAt:
                  normalizeDate(input.candidateSkills[entry.id]?.lastUsedAt)?.toISOString() ?? null,
              }
            : null,
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    },
    gates: gates.map((entry) => ({
      gate: entry.gate,
      passed: entry.passed,
      blocking: entry.blocking,
      detail: entry.detail ?? null,
    })),
  };

  const tieBreakVector = {
    score_total: scoreTotal,
    skills_fit: skillsFit,
    constraints_fit: constraintsFit,
    proof_fit: Number(componentScores.proof_fit ?? 0),
    verification_fit: verificationFit,
    confidence_total: confidenceTotal,
    counterpart_id: input.assignmentId,
  };

  const inputsHash = stableHashPayload({
    contractVersion: MATCH_SCORE_CONTRACT_VERSION,
    modelVersion: MATCH_SCORE_MODEL_VERSION,
    inputSnapshot,
  });

  const generatedAt = input.generatedAt ?? now;
  const scoreState: MatchScoreState =
    input.previousScoreState && input.previousScoreState !== 'generated'
      ? 'recomputed'
      : 'generated';

  return {
    scoreVersion: MATCH_SCORE_CONTRACT_VERSION,
    modelVersion: MATCH_SCORE_MODEL_VERSION,
    scoreState,
    scoreTotal,
    scoreNormalized: Number((scoreTotal / MATCH_SCORE_MAX_BPS).toFixed(4)),
    inputsHash,
    reasonCodes: sortReasonCodes(reasonCodes),
    generatedAt,
    staleAt: null,
    recomputedAt: scoreState === 'recomputed' ? now : null,
    hiddenDueToPolicyAt: null,
    hiddenDueToPolicyReasonCodes: [],
    subscoresJson: {
      skills_fit: componentScores.skills_fit ?? null,
      proof_fit: componentScores.proof_fit ?? null,
      constraints_fit: componentScores.constraints_fit ?? null,
      verification_fit: componentScores.verification_fit ?? null,
      purpose_fit: componentScores.purpose_fit ?? null,
      confidence_total: confidenceTotal,
      availability: leafScores.availability ?? null,
      location: leafScores.location ?? null,
      compensation: leafScores.compensation ?? null,
      language: leafScores.language ?? null,
      work_authorization: leafScores.work_authorization ?? null,
      values_fit: leafScores.values_fit ?? null,
      causes_fit: leafScores.causes_fit ?? null,
    },
    scoreSnapshotJson: {
      contract_version: MATCH_SCORE_CONTRACT_VERSION,
      model_version: MATCH_SCORE_MODEL_VERSION,
      input_snapshot: inputSnapshot,
      input_source_refs: input.sourceRefs ?? {},
      gates: inputSnapshot.gates,
      component_weights: MATCH_SCORE_COMPONENT_WEIGHTS,
      component_scores: {
        ...componentScores,
      },
      component_status: componentStatus,
      leaf_scores: leafScores,
      leaf_status: leafStatus,
      confidence_total: confidenceTotal,
      tie_break_vector: tieBreakVector,
      reason_code_inputs: reasonCodeInputs,
    },
  };
}

export function compareCanonicalMatchOrder<
  T extends {
    scoreTotal: number;
    subscoresJson?: Record<string, unknown> | null;
    counterpartId: string;
  },
>(left: T, right: T): number {
  const leftSubscores = left.subscoresJson ?? {};
  const rightSubscores = right.subscoresJson ?? {};
  const orderedKeys = [
    ['scoreTotal', left.scoreTotal, right.scoreTotal],
    [
      'skills_fit',
      Number(leftSubscores['skills_fit'] ?? 0),
      Number(rightSubscores['skills_fit'] ?? 0),
    ],
    [
      'constraints_fit',
      Number(leftSubscores['constraints_fit'] ?? 0),
      Number(rightSubscores['constraints_fit'] ?? 0),
    ],
    [
      'proof_fit',
      Number(leftSubscores['proof_fit'] ?? 0),
      Number(rightSubscores['proof_fit'] ?? 0),
    ],
    [
      'verification_fit',
      Number(leftSubscores['verification_fit'] ?? 0),
      Number(rightSubscores['verification_fit'] ?? 0),
    ],
    [
      'confidence_total',
      Number(leftSubscores['confidence_total'] ?? 0),
      Number(rightSubscores['confidence_total'] ?? 0),
    ],
  ] as const;

  for (const [, leftValue, rightValue] of orderedKeys) {
    if (leftValue !== rightValue) {
      return rightValue - leftValue;
    }
  }

  return left.counterpartId.localeCompare(right.counterpartId);
}

export function isMatchPastStaleTtl(
  generatedAt: Date | string | null | undefined,
  now = new Date()
) {
  const generated = normalizeDate(generatedAt);
  if (!generated) return true;
  return now.getTime() - generated.getTime() >= MATCH_SCORE_STALE_TTL_HOURS * 60 * 60 * 1000;
}

export function isWithinStaleGraceWindow(
  staleAt: Date | string | null | undefined,
  now = new Date()
) {
  const stale = normalizeDate(staleAt);
  if (!stale) return false;
  return now.getTime() - stale.getTime() <= MATCH_SCORE_STALE_GRACE_HOURS * 60 * 60 * 1000;
}

export function resolveEffectiveScoreState(input: {
  scoreState?: MatchScoreState | null;
  generatedAt?: Date | string | null;
  staleAt?: Date | string | null;
  now?: Date;
}): MatchScoreState {
  if (input.scoreState === 'hidden_due_to_policy') {
    return 'hidden_due_to_policy';
  }
  if (input.scoreState === 'stale') {
    return 'stale';
  }
  if (isMatchPastStaleTtl(input.generatedAt, input.now)) {
    return 'stale';
  }
  return input.scoreState ?? 'generated';
}
