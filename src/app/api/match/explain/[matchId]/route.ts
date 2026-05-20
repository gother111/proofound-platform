/**
 * Match explanation API for the launch review corridor.
 *
 * GET /api/match/explain/[matchId]
 * Returns proof-first, privacy-safe explanation data for blind-by-default review.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { getRows } from '@/lib/db/rows';
import { isActiveOrgMember, requireApiAuth } from '@/lib/api/auth';
import {
  buildProofFirstReviewCard,
  buildFairnessUiContract,
  getRankBand,
  getReviewCardProofPackMapForMatchedOrg,
  getReviewCardProofPackMapForOwner,
  getReasonLedgerEntries,
  normalizeFairnessStatus,
  renderExplanationFromReasonCodes,
  sanitizeMatchReasonCodes,
} from '@/lib/matching/review-contract';
import { buildMatchExplainerContract } from '@/lib/matching/explainer-contract';
import { resolveEffectiveScoreState } from '@/lib/matching/match-score-contract';

type SkillRequirement = {
  id?: string;
  skillCode?: string;
  skill_id?: string;
  minLevel?: number;
  desiredLevel?: number;
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toSkillKey(skill: SkillRequirement): string {
  return skill.id || skill.skillCode || skill.skill_id || '';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { matchId } = await params;

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID required' }, { status: 400 });
    }

    const matchResult = await db.execute(sql`
      SELECT
        m.id,
        m.assignment_id,
        m.profile_id,
        m.score,
        m.score_total,
        m.score_state,
        m.score_version,
        m.model_version,
        m.explanation_version,
        m.fairness_check_version,
        m.fairness_status,
        m.fairness_evaluated_at,
        m.inputs_hash,
        m.reason_codes,
        m.generated_at,
        m.stale_at,
        m.subscores_json,
        m.score_snapshot_json,
        m.weights,
        a.role,
        a.must_have_skills,
        a.nice_to_have_skills,
        a.location_mode,
        a.country,
        a.comp_min,
        a.comp_max,
        a.currency,
        a.hours_min,
        a.hours_max,
        a.org_id
      FROM matches m
      INNER JOIN assignments a ON a.id = m.assignment_id
      WHERE m.id = ${matchId}
      LIMIT 1
    `);

    const matchRows = getRows(matchResult) as Array<{
      id: string;
      assignment_id: string;
      profile_id: string;
      score: string | number;
      score_total: number | null;
      score_state: string | null;
      score_version: string | null;
      model_version: string | null;
      explanation_version: string | null;
      fairness_check_version: string | null;
      fairness_status: string | null;
      fairness_evaluated_at: string | null;
      inputs_hash: string | null;
      reason_codes: string[] | null;
      generated_at: string | null;
      stale_at: string | null;
      subscores_json: Record<string, unknown> | null;
      score_snapshot_json: Record<string, unknown> | null;
      weights: unknown;
      role: string | null;
      must_have_skills: unknown;
      nice_to_have_skills: unknown;
      location_mode: string | null;
      country: string | null;
      comp_min: number | null;
      comp_max: number | null;
      currency: string | null;
      hours_min: number | null;
      hours_max: number | null;
      org_id: string;
    }>;

    const match = matchRows[0];

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const canViewAsOrgMember = await isActiveOrgMember(
      authResult.supabase,
      authResult.user.id,
      match.org_id,
      ['org_owner', 'org_manager', 'org_reviewer']
    );

    if (match.profile_id !== authResult.user.id && !canViewAsOrgMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userSkillsResult = await db.execute(sql`
      SELECT skill_code, skill_id, level, months_experience, evidence_strength
      FROM skills
      WHERE profile_id = ${match.profile_id}
    `);

    const userSkills = getRows(userSkillsResult) as Array<{
      skill_code: string | null;
      skill_id: string | null;
      level: number;
      months_experience: number;
      evidence_strength: string | number | null;
    }>;

    const requiredSkills = asArray<SkillRequirement>(match.must_have_skills);
    const niceSkills = asArray<SkillRequirement>(match.nice_to_have_skills);

    const skillCodes = new Set<string>();
    for (const skill of requiredSkills) {
      const key = toSkillKey(skill);
      if (key) skillCodes.add(key);
    }
    for (const skill of niceSkills) {
      const key = toSkillKey(skill);
      if (key) skillCodes.add(key);
    }
    for (const skill of userSkills) {
      if (skill.skill_code) skillCodes.add(skill.skill_code);
      else if (skill.skill_id) skillCodes.add(skill.skill_id);
    }

    const skillCodeList = Array.from(skillCodes);
    const taxonomyRows =
      skillCodeList.length > 0
        ? (getRows(
            await db.execute(sql`
              SELECT code, COALESCE(name_i18n ->> 'en', slug, code) AS name
              FROM skills_taxonomy
              WHERE code IN (${sql.join(
                skillCodeList.map((skillCode) => sql`${skillCode}`),
                sql`, `
              )})
            `)
          ) as Array<{ code: string; name: string }>)
        : [];

    const skillMap = new Map(taxonomyRows.map((row) => [row.code, row.name]));

    const skillsMatch = {
      required: requiredSkills.map((required) => {
        const requiredKey = toSkillKey(required);
        const userSkill = userSkills.find(
          (skill) => (skill.skill_code || skill.skill_id) === requiredKey
        );

        return {
          skillName: skillMap.get(requiredKey) || requiredKey,
          requiredLevel: required.minLevel ?? 0,
          yourLevel: userSkill?.level || 0,
          met: (userSkill?.level || 0) >= (required.minLevel ?? 0),
        };
      }),
      nice: niceSkills.map((nice) => {
        const niceKey = toSkillKey(nice);
        const userSkill = userSkills.find(
          (skill) => (skill.skill_code || skill.skill_id) === niceKey
        );

        return {
          skillName: skillMap.get(niceKey) || niceKey,
          desiredLevel: nice.desiredLevel,
          yourLevel: userSkill?.level || 0,
          met: userSkill !== undefined,
        };
      }),
    };

    const constraints = {
      location: {
        match: true,
        details: `${match.location_mode || 'Not specified'}`,
      },
      salary: {
        match: true,
        details:
          match.comp_min != null
            ? `${match.currency || 'USD'} ${match.comp_min}-${match.comp_max ?? match.comp_min}`
            : 'Not specified',
      },
      hours: {
        match: true,
        details:
          match.hours_min != null
            ? `${match.hours_min}-${match.hours_max ?? match.hours_min} hours/week`
            : 'Not specified',
      },
      workMode: {
        match: true,
        details: match.location_mode || 'Not specified',
      },
    };

    const allMatchesResult = await db.execute(sql`
      SELECT id, score
      FROM matches
      WHERE assignment_id = ${match.assignment_id}
      ORDER BY score_total DESC NULLS LAST, score DESC
    `);

    const allMatches = getRows(allMatchesResult) as Array<{ id: string; score: string | number }>;
    const rank = allMatches.findIndex((candidate) => candidate.id === matchId) + 1;
    const totalCandidates = allMatches.length;

    const rankBand =
      rank > 0 && totalCandidates > 0 ? getRankBand(rank, totalCandidates) : 'Competitive';
    const fairnessStatus = normalizeFairnessStatus(match.fairness_status);
    const fairnessUi = buildFairnessUiContract(fairnessStatus);
    // Locked launch corridor: keep exact ranking hidden even for org owners.
    // Review stays proof-first and reason-coded through rank bands only.
    const exactRankAvailable = false;
    const ledgerEntries = await getReasonLedgerEntries(match.id);
    const reasonCodes = sanitizeMatchReasonCodes(
      Array.isArray(match.reason_codes) ? match.reason_codes : []
    );
    const renderedExplanation = renderExplanationFromReasonCodes({
      reasonCodes,
      ledgerEntries: ledgerEntries.map((entry) => ({
        category: entry.category,
        reasonCode: entry.reasonCode,
        source: entry.source,
        payloadJson:
          entry.payloadJson && typeof entry.payloadJson === 'object'
            ? (entry.payloadJson as Record<string, unknown>)
            : {},
        createdAt: entry.createdAt,
        noteHash: entry.noteHash,
      })),
      fairnessStatus,
      audience: match.profile_id === authResult.user.id ? 'candidate' : 'org',
    });
    const proofPackByProfileId =
      match.profile_id === authResult.user.id
        ? await getReviewCardProofPackMapForOwner([match.profile_id])
        : await getReviewCardProofPackMapForMatchedOrg([match.profile_id]);
    const reviewCard = buildProofFirstReviewCard({
      profileId: match.profile_id,
      reasonCodes,
      fairnessStatus,
      verificationCount: userSkills.filter(
        (skill) =>
          skill.evidence_strength != null &&
          String(skill.evidence_strength).trim().toLowerCase() !== 'none'
      ).length,
      proofPack: proofPackByProfileId.get(match.profile_id) ?? null,
      fallbackHeadline: renderedExplanation.summary[0] ?? null,
      fitBand: rankBand,
    });

    const subscores = (match.subscores_json as Record<string, number> | null) || {};

    const explanation = {
      explainer: buildMatchExplainerContract(),
      matchId: match.id,
      compositeScore: Number(match.score) || 0,
      scoreTotal: match.score_total,
      scoreState: resolveEffectiveScoreState({
        scoreState: match.score_state as any,
        generatedAt: match.generated_at,
        staleAt: match.stale_at,
      }),
      scoreVersion: match.score_version,
      modelVersion: match.model_version,
      explanationVersion: match.explanation_version,
      fairnessCheckVersion: match.fairness_check_version,
      inputsHash: match.inputs_hash,
      reasonCodes,
      generatedAt: match.generated_at,
      fairness: {
        status: fairnessStatus,
        evaluatedAt: match.fairness_evaluated_at,
        warning: fairnessUi.warning,
      },
      reviewCard,
      reasonSummary: renderedExplanation.summary,
      reasonSections: renderedExplanation.sections,
      rank: undefined,
      totalCandidates,
      rankBand,
      rankMode: 'band',
      exactRankAvailable,
      subscores: {
        skills: Number(subscores.skills_fit ?? 0) / 10000,
        constraints: Number(subscores.constraints_fit ?? 0) / 10000,
        recency: Number(subscores.proof_fit ?? 0) / 10000,
        evidence: Number(subscores.proof_fit ?? 0) / 10000,
      },
      skillsMatch,
      constraints,
    };

    return NextResponse.json(explanation);
  } catch (error) {
    console.error('Match explanation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
