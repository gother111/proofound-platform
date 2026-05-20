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
import { isMockSupabaseEnabled, visualFixturesRuntimeAllowed } from '@/lib/env';
import { buildVisualOrgMatches } from '@/lib/matching/visual-fixtures';

const visualAssignmentFixturesEnabled = () =>
  isMockSupabaseEnabled() &&
  process.env.PROOFOUND_VISUAL_FIXTURES === 'true' &&
  visualFixturesRuntimeAllowed();

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

function proofSignalLabel(value: unknown) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return 'Not available';
  if (normalized >= 0.85) return 'Strong proof support';
  if (normalized >= 0.65) return 'Clear support';
  if (normalized >= 0.4) return 'Needs reviewer judgment';
  return 'Limited signal';
}

function toProofSignals(subscores: Record<string, unknown> | null | undefined) {
  const normalizeBps = (value: unknown) => Number(value ?? 0) / 10000;

  return {
    skills: proofSignalLabel(normalizeBps(subscores?.skills_fit)),
    constraints: proofSignalLabel(normalizeBps(subscores?.constraints_fit)),
    recency: proofSignalLabel(normalizeBps(subscores?.proof_fit)),
    evidence: proofSignalLabel(normalizeBps(subscores?.proof_fit)),
  };
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

    if (visualAssignmentFixturesEnabled() && matchId.startsWith('visual-match-')) {
      const mockMatches = buildVisualOrgMatches('11111111-1111-4111-8111-111111111111');
      const foundMock = mockMatches.find((m) => m.id === matchId);
      if (!foundMock) {
        return NextResponse.json({ error: 'Mock match not found' }, { status: 404 });
      }

      // Format skillsMatch
      const required = Object.entries(foundMock.profile.skills).map(
        ([name, detail]: [string, any]) => ({
          skillName: name.replace(/-/g, ' '),
          requiredLevel: 3,
          yourLevel: detail.level,
          met: detail.level >= 3,
        })
      );

      const explanation = {
        explainer: {
          version: '1.0.0',
          title: 'Visual Explainer',
        },
        matchId: foundMock.id,
        reasonCodes: foundMock.reasonCodes,
        generatedAt: new Date().toISOString(),
        fairness: {
          status: 'pass',
          evaluatedAt: new Date().toISOString(),
          warning: null,
        },
        reviewCard: foundMock.reviewCard,
        reasonSummary: foundMock.why.summary,
        reasonSections: foundMock.why.sections,
        rank: undefined,
        totalCandidates: mockMatches.length,
        rankBand: foundMock.rankBand,
        rankMode: 'band',
        exactRankAvailable: false,
        scoreVisibility: 'internal_ordering_only',
        proofSignals: {
          skills: 'Strong proof support',
          constraints: 'Strong proof support',
          recency: 'Strong proof support',
          evidence: 'Strong proof support',
        },
        skillsMatch: {
          required: required,
          nice: [],
        },
        constraints: {
          location: { match: true, details: foundMock.profile.workMode },
          timezone: { match: true, details: foundMock.profile.timezone },
          workMode: { match: true, details: foundMock.profile.workMode },
        },
      };

      return NextResponse.json(explanation);
    }

    const matchResult = await db.execute(sql`
      SELECT
        m.id,
        m.assignment_id,
        m.profile_id,
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

    const explanation = {
      explainer: buildMatchExplainerContract(),
      matchId: match.id,
      modelVersion: match.model_version,
      explanationVersion: match.explanation_version,
      fairnessCheckVersion: match.fairness_check_version,
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
      scoreVisibility: 'internal_ordering_only',
      proofSignals: toProofSignals(match.subscores_json),
      skillsMatch,
      constraints,
    };

    return NextResponse.json(explanation);
  } catch (error) {
    console.error('Match explanation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
