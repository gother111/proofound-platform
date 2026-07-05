import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  assignmentExpertiseMatrix,
  assignments,
  consentObligations,
  matchingProfiles,
  matches,
  skills,
  skillsTaxonomy,
} from '@/db/schema';
import { emitFirstMatchShown } from '@/lib/analytics/events';
import { isTrustedInternalRequest, requireApiAuth } from '@/lib/api/auth';
import { deriveRequirementsFromMatrix } from '@/lib/assignments/expertise-matrix';
import { getRows } from '@/lib/db/rows';
import { scrubDisallowedFields } from '@/lib/core/matching/firewall';
import type { Skill } from '@/lib/core/matching/scorers';
import {
  deriveAtlasLanguageLevels,
  parseLegacyLanguageLevels,
  resolveLanguageLevel,
} from '@/lib/core/matching/language-resolution';
import { log } from '@/lib/log';
import { toAnnualCompensationRange } from '@/lib/matching/compensation';
import { evaluateIndividualMatchability, toSoftGatedPayload } from '@/lib/matching/eligibility';
import { MATCHING_ENABLED } from '@/lib/featureFlags';
import {
  buildCanonicalMatchScoreArtifact,
  compareCanonicalMatchOrder,
} from '@/lib/matching/match-score-contract';
import { buildCanonicalMatchPersistenceFields } from '@/lib/matching/review-contract';
import { CONSENT_TYPES } from '@/lib/privacy/consent-contract';

// Shared handler imported by the kept launch corridor routes.
export const dynamic = 'force-dynamic';

const DEFAULT_ASSIGNMENT_SCAN_MULTIPLIER = 10;
const MIN_ASSIGNMENT_SCAN_LIMIT = 50;
const MAX_ASSIGNMENT_SCAN_LIMIT = 500;

const MatchRequestSchema = z.object({
  weights: z.record(z.number()).optional(),
  mode: z.string().optional(),
  useSemanticMatching: z.boolean().optional(),
  k: z.number().positive().max(100).optional(),
});

const ServiceMatchRequestSchema = MatchRequestSchema.extend({
  userId: z.string().uuid(),
});

interface MatchResult {
  id?: string;
  assignmentId: string;
  score: number;
  scoreTotal: number;
  subscores: Record<string, number>;
  contributions: Record<string, number>;
  gaps: Array<{ id: string; required: number; have: number }>;
  missing: string[];
  assignment: unknown;
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
  artifact: NonNullable<ReturnType<typeof buildCanonicalMatchScoreArtifact>>;
}

type CandidatePoolSource = 'full_scan';

function resolveAssignmentScanLimit(k: number): number {
  return Math.min(
    MAX_ASSIGNMENT_SCAN_LIMIT,
    Math.max(MIN_ASSIGNMENT_SCAN_LIMIT, k * DEFAULT_ASSIGNMENT_SCAN_MULTIPLIER)
  );
}

function parseVector(vector: unknown) {
  if (!vector) return {};
  if (typeof vector === 'string') {
    try {
      return JSON.parse(vector);
    } catch {
      return {};
    }
  }
  return vector as Record<string, unknown>;
}

function toLegacySubscores(subscoresJson: Record<string, unknown>): Record<string, number> {
  const skillsFit = Number(subscoresJson.skills_fit ?? 0) / 10000;
  const constraintsFit = Number(subscoresJson.constraints_fit ?? 0) / 10000;
  const verificationFit = Number(subscoresJson.verification_fit ?? 0) / 10000;
  const proofFit = Number(subscoresJson.proof_fit ?? 0) / 10000;
  return {
    skills: skillsFit,
    constraints: constraintsFit,
    verifications: verificationFit,
    recency: proofFit,
    evidence: proofFit,
    availability: Number(subscoresJson.availability ?? 0) / 10000,
    location: Number(subscoresJson.location ?? 0) / 10000,
    compensation: Number(subscoresJson.compensation ?? 0) / 10000,
    language: Number(subscoresJson.language ?? 0) / 10000,
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const isInternalCall = isTrustedInternalRequest(request);
    const rawBody = await request.text();
    let body: unknown = {};
    if (rawBody.trim()) {
      try {
        body = JSON.parse(rawBody) as unknown;
      } catch {
        return NextResponse.json(
          { error: 'Invalid input', message: 'Request body must be valid JSON.' },
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

    if (!MATCHING_ENABLED) {
      return NextResponse.json(
        { error: 'Matching disabled', message: 'Matching is temporarily unavailable.' },
        { status: 503 }
      );
    }

    const { k = 20 } = validatedData;
    const assignmentScanLimit = resolveAssignmentScanLimit(k);
    const twoStageEnabled = false;

    const eligibility = await evaluateIndividualMatchability(user.id);
    if (!eligibility.eligible) {
      return NextResponse.json(toSoftGatedPayload(eligibility), { status: 200 });
    }

    const profile = await db.query.matchingProfiles.findFirst({
      where: eq(matchingProfiles.profileId, user.id),
    });
    if (!profile) {
      return NextResponse.json(
        { error: 'Matching profile not found. Please set up your matching profile first.' },
        { status: 404 }
      );
    }

    const userSkills = await db.query.skills.findMany({
      where: eq(skills.profileId, user.id),
    });
    const skillsMap: Record<string, Skill> = {};
    for (const row of userSkills) {
      skillsMap[row.skillId] = {
        id: row.skillId,
        level: row.level,
        months: row.monthsExperience,
        evidenceStrength: row.evidenceStrength ? parseFloat(row.evidenceStrength) : undefined,
        recencyMultiplier: row.recencyMultiplier ? parseFloat(row.recencyMultiplier) : undefined,
        impactScore: row.impactScore ? parseFloat(row.impactScore) : undefined,
        lastUsedAt: row.lastUsedAt || undefined,
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

    const activeMatchingConsent = await db.query.consentObligations.findFirst({
      where: and(
        eq(consentObligations.profileId, user.id),
        eq(consentObligations.consentType, CONSENT_TYPES.ML_MATCHING),
        eq(consentObligations.state, 'active')
      ),
    });

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
      canSponsorVisa: assignments.canSponsorVisa,
      updatedAt: assignments.updatedAt,
    };

    let activeAssignments: Array<any> = [];
    let candidatePoolSource: CandidatePoolSource = 'full_scan';

    if (activeAssignments.length === 0) {
      activeAssignments = await db
        .select(assignmentSelect)
        .from(assignments)
        .where(eq(assignments.status, 'active'))
        .limit(assignmentScanLimit);
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

    const existingMatches = await db.query.matches.findMany({
      where: eq(matches.profileId, user.id),
    });
    const hadMatchesBefore = existingMatches.length > 0;
    const matchByAssignmentId = new Map(
      existingMatches.map((match) => [match.assignmentId, match])
    );
    const snoozedAssignmentIds = new Set(
      existingMatches
        .filter((match) => match.snoozedUntil && new Date(match.snoozedUntil) >= new Date())
        .map((match) => match.assignmentId)
    );
    const hiddenAssignmentIds = new Set(
      existingMatches
        .filter((match) => Boolean(parseVector(match.vector).hidden))
        .map((match) => match.assignmentId)
    );

    const results: MatchResult[] = [];
    for (const assignment of activeAssignments) {
      if (snoozedAssignmentIds.has(assignment.id) || hiddenAssignmentIds.has(assignment.id)) {
        continue;
      }

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

      const minLanguage = assignment.minLanguage as { code: string; level: string } | null;
      const candidateLanguageLevel = minLanguage
        ? resolveLanguageLevel(minLanguage.code, atlasLanguageLevels, legacyLanguageLevels)
        : null;
      const profileAnnualComp = toAnnualCompensationRange({
        min: profile.compMin,
        max: profile.compMax,
        period: profile.compPeriod,
      });

      const previousMatch = matchByAssignmentId.get(assignment.id);
      const artifact = buildCanonicalMatchScoreArtifact({
        assignmentId: assignment.id,
        profileId: user.id,
        assignmentOrgId: assignment.orgId,
        assignmentStatus: assignment.status,
        matchabilityEligible: eligibility.eligible,
        matchingConsentActive: Boolean(activeMatchingConsent),
        requiredSkills: mustHaveSkills.map((entry) => ({ id: entry.id, level: entry.level })),
        niceToHaveSkills: niceToHaveSkills.map((entry) => ({ id: entry.id, level: entry.level })),
        candidateSkills: skillsMap,
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
        assignmentMinLanguage: minLanguage,
        candidateLanguageLevel,
        assignmentCanSponsorVisa: assignment.canSponsorVisa,
        profileNeedsSponsorship: profile.needsSponsorship,
        profileWishesSponsorship: profile.wishesSponsorship,
        verificationGates: assignment.verificationGates || [],
        verifiedFlags: (profile.verified as Record<string, boolean> | null) || {},
        previousScoreState: previousMatch?.scoreState ?? null,
        sourceRefs: {
          assignmentUpdatedAt: assignment.updatedAt?.toISOString?.() ?? null,
          profileUpdatedAt: profile.updatedAt?.toISOString?.() ?? null,
        },
      });

      if (!artifact) {
        continue;
      }

      const legacySubscores = toLegacySubscores(artifact.subscoresJson);
      results.push({
        ...(previousMatch ? { id: previousMatch.id } : {}),
        assignmentId: assignment.id,
        score: artifact.scoreNormalized,
        scoreTotal: artifact.scoreTotal,
        subscores: legacySubscores,
        contributions: {
          skills_fit: Number(artifact.subscoresJson.skills_fit ?? 0) / 10000,
          proof_fit: Number(artifact.subscoresJson.proof_fit ?? 0) / 10000,
          constraints_fit: Number(artifact.subscoresJson.constraints_fit ?? 0) / 10000,
          verification_fit: Number(artifact.subscoresJson.verification_fit ?? 0) / 10000,
        },
        gaps: [],
        missing: [],
        assignment: scrubDisallowedFields(assignment),
        focusBoost: {
          total: 0,
          matched: {
            role: false,
            industry: false,
            orgType: false,
          },
          contributions: {
            role: 0,
            industry: 0,
            orgType: 0,
          },
        },
        artifact,
      });
    }

    results.sort((left, right) =>
      compareCanonicalMatchOrder(
        {
          scoreTotal: left.scoreTotal,
          subscoresJson: left.artifact?.subscoresJson ?? {},
          counterpartId: left.assignmentId,
        },
        {
          scoreTotal: right.scoreTotal,
          subscoresJson: right.artifact?.subscoresJson ?? {},
          counterpartId: right.assignmentId,
        }
      )
    );

    const topK = results.slice(0, k);
    const upsertedMatches =
      topK.length > 0
        ? await db
            .insert(matches)
            .values(
              topK.map((match) => ({
                assignmentId: match.assignmentId,
                profileId: user.id,
                ...buildCanonicalMatchPersistenceFields({
                  artifact: match.artifact,
                }),
                vector: {
                  hidden: Boolean(
                    parseVector(matchByAssignmentId.get(match.assignmentId)?.vector).hidden
                  ),
                },
                weights: {},
              }))
            )
            .onConflictDoUpdate({
              target: [matches.assignmentId, matches.profileId],
              set: {
                score: sql`excluded.score`,
                scoreTotal: sql`excluded.score_total`,
                scoreState: sql`excluded.score_state`,
                scoreVersion: sql`excluded.score_version`,
                modelVersion: sql`excluded.model_version`,
                explanationVersion: sql`excluded.explanation_version`,
                fairnessCheckVersion: sql`excluded.fairness_check_version`,
                fairnessStatus: sql`excluded.fairness_status`,
                fairnessEvaluatedAt: sql`excluded.fairness_evaluated_at`,
                inputsHash: sql`excluded.inputs_hash`,
                reasonCodes: sql`excluded.reason_codes`,
                staleReasonCodes: sql`excluded.stale_reason_codes`,
                generatedAt: sql`excluded.generated_at`,
                staleAt: sql`excluded.stale_at`,
                recomputedAt: sql`excluded.recomputed_at`,
                hiddenDueToPolicyAt: sql`excluded.hidden_due_to_policy_at`,
                hiddenDueToPolicyReasonCodes: sql`excluded.hidden_due_to_policy_reason_codes`,
                subscoresJson: sql`excluded.subscores_json`,
                scoreSnapshotJson: sql`excluded.score_snapshot_json`,
                vector: sql`excluded.vector`,
                weights: sql`excluded.weights`,
              },
            })
            .returning({ id: matches.id, assignmentId: matches.assignmentId })
        : [];

    upsertedMatches.forEach((row) => {
      matchByAssignmentId.set(row.assignmentId, {
        ...(matchByAssignmentId.get(row.assignmentId) || {}),
        id: row.id,
      } as (typeof existingMatches)[number]);
    });

    const topKWithIds = topK.map((match) => ({
      ...match,
      id: match.id || matchByAssignmentId.get(match.assignmentId)?.id,
    }));

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
          if (getRows(existingEventResult).length === 0) {
            await emitFirstMatchShown(user.id, firstMatch.id, {
              assignment_id: firstMatch.assignmentId,
              score: firstMatch.score,
              score_total: firstMatch.scoreTotal,
              idempotency_key: idempotencyKey,
            });
          }
        }
      } catch (analyticsError) {
        console.error('Failed to emit first match shown event:', analyticsError);
      }
    }

    const duration = Date.now() - startTime;
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
      items: topKWithIds.map((item) => ({
        id: item.id,
        assignmentId: item.assignmentId,
        score: item.score,
        scoreTotal: item.scoreTotal,
        subscores: item.subscores,
        contributions: item.contributions,
        gaps: item.gaps,
        missing: item.missing,
        assignment: item.assignment,
        focusBoost: item.focusBoost,
        reasonCodes: item.artifact.reasonCodes,
      })),
      meta: {
        total: results.length,
        returned: topKWithIds.length,
        durationMs: duration,
        weights: {},
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
    log.error('match.profile.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to compute matches' }, { status: 500 });
  }
}
