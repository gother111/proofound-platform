import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  MATCH_EXPLAINER_DIALOG_DESCRIPTION,
  MATCH_EXPLAINER_TITLE,
  MATCH_EXPLAINER_TRIGGER_ARIA_LABEL,
  MATCH_EXPLAINER_TRIGGER_LABEL,
  MATCH_EXPLAINER_TEST_IDS,
} from '@/lib/matching/explainer-contract';

const mocks = vi.hoisted(() => ({
  dbExecute: vi.fn(),
  requireApiAuth: vi.fn(),
  isActiveOrgMember: vi.fn(),
  getRows: vi.fn((result: unknown) => result),
  buildFairnessUiContract: vi.fn(),
  getOrgMembershipRole: vi.fn(),
  getRankBand: vi.fn(),
  getReasonLedgerEntries: vi.fn(),
  normalizeFairnessStatus: vi.fn(),
  renderExplanationFromReasonCodes: vi.fn(),
  sanitizeMatchReasonCodes: vi.fn((reasonCodes: string[]) =>
    reasonCodes.filter(
      (reasonCode) =>
        reasonCode !== 'purpose_alignment_strong' && reasonCode !== 'purpose_alignment_partial'
    )
  ),
  resolveEffectiveScoreState: vi.fn(),
  getReviewCardProofPackMap: vi.fn(),
  getReviewCardProofPackMapForMatchedOrg: vi.fn(),
  getReviewCardProofPackMapForOwner: vi.fn(),
  buildProofFirstReviewCard: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: mocks.dbExecute,
  },
}));

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: mocks.requireApiAuth,
  isActiveOrgMember: mocks.isActiveOrgMember,
}));

vi.mock('@/lib/db/rows', () => ({
  getRows: mocks.getRows,
}));

vi.mock('@/lib/matching/review-contract', () => ({
  buildFairnessUiContract: mocks.buildFairnessUiContract,
  getOrgMembershipRole: mocks.getOrgMembershipRole,
  getRankBand: mocks.getRankBand,
  getReasonLedgerEntries: mocks.getReasonLedgerEntries,
  getReviewCardProofPackMap: mocks.getReviewCardProofPackMap,
  getReviewCardProofPackMapForMatchedOrg: mocks.getReviewCardProofPackMapForMatchedOrg,
  getReviewCardProofPackMapForOwner: mocks.getReviewCardProofPackMapForOwner,
  normalizeFairnessStatus: mocks.normalizeFairnessStatus,
  renderExplanationFromReasonCodes: mocks.renderExplanationFromReasonCodes,
  sanitizeMatchReasonCodes: mocks.sanitizeMatchReasonCodes,
  buildProofFirstReviewCard: mocks.buildProofFirstReviewCard,
}));

vi.mock('@/lib/matching/match-score-contract', () => ({
  resolveEffectiveScoreState: mocks.resolveEffectiveScoreState,
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { GET } from '@/app/api/match/explain/[matchId]/route';
import { log } from '@/lib/log';

const baseMatchRow = {
  id: 'match-1',
  assignment_id: 'assignment-1',
  profile_id: 'candidate-1',
  score: 9400,
  score_total: 94,
  score_state: 'fresh',
  score_version: 'v1',
  model_version: 'model-1',
  explanation_version: 'exp-1',
  fairness_check_version: 'fair-1',
  fairness_status: 'pass',
  fairness_evaluated_at: '2026-03-12T09:00:00.000Z',
  inputs_hash: 'hash-1',
  reason_codes: ['skills_strong'],
  generated_at: '2026-03-12T09:00:00.000Z',
  stale_at: null,
  subscores_json: {
    skills_fit: 9100,
    purpose_fit: null,
    constraints_fit: 8600,
    proof_fit: 8400,
  },
  score_snapshot_json: null,
  weights: null,
  role: 'Founding Engineer',
  values_required: ['clarity'],
  cause_tags: ['climate'],
  must_have_skills: [{ skillCode: 'typescript', minLevel: 3 }],
  nice_to_have_skills: [{ skillCode: 'sql', desiredLevel: 2 }],
  location_mode: 'remote',
  country: 'SE',
  comp_min: 100000,
  comp_max: 120000,
  currency: 'USD',
  hours_min: 40,
  hours_max: 40,
  org_id: 'org-1',
};

function buildRankRows() {
  return Array.from({ length: 30 }, (_, index) => ({
    id: index === 0 ? 'match-1' : `match-${index + 2}`,
    score: 9400 - index,
  }));
}

describe('GET /api/match/explain/[matchId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuth.mockResolvedValue({
      user: { id: 'org-user-1' },
      supabase: { id: 'supabase' },
    });
    mocks.isActiveOrgMember.mockResolvedValue(true);
    mocks.buildFairnessUiContract.mockReturnValue({
      warning: null,
      suppressExactRank: false,
    });
    mocks.getOrgMembershipRole.mockResolvedValue('org_owner');
    mocks.getRankBand.mockReturnValue('Top tier');
    mocks.getReasonLedgerEntries.mockResolvedValue([]);
    mocks.getReviewCardProofPackMap.mockResolvedValue(new Map([['candidate-1', null]]));
    mocks.getReviewCardProofPackMapForMatchedOrg.mockResolvedValue(
      new Map([['candidate-1', null]])
    );
    mocks.getReviewCardProofPackMapForOwner.mockResolvedValue(new Map([['candidate-1', null]]));
    mocks.getReviewCardProofPackMapForMatchedOrg.mockResolvedValue(
      new Map([['candidate-1', null]])
    );
    mocks.getReviewCardProofPackMapForOwner.mockResolvedValue(new Map([['candidate-1', null]]));
    mocks.normalizeFairnessStatus.mockImplementation(
      (status: string | null | undefined) => status ?? 'pass'
    );
    mocks.renderExplanationFromReasonCodes.mockReturnValue({
      summary: ['Strong skill overlap'],
      sections: {
        positive_match: ['Strong skill overlap'],
        constraint_mismatch: [],
        workflow_decision: [],
        fairness: [],
        manual_override: [],
      },
    });
    mocks.buildProofFirstReviewCard.mockReturnValue({
      candidateLabel: 'Submission A7F2',
      strongestProof: {
        summary: 'Proof-backed delivery signal.',
        outcome: 'Improved a launch corridor.',
        ownership: 'Owned the implementation.',
        anchorContext: 'Anchored in prior project work',
        freshnessLabel: 'Fresh',
      },
      verification: {
        summaryLabel: 'Verified proof signal present',
        count: 1,
      },
      trustLabels: ['Verified proof signal present'],
      fitBand: 'Top tier',
      fitSummary: {
        headline: 'Proof signals align with this role.',
        bullets: ['Strong skill overlap'],
        reasonCodes: ['skills_strong'],
      },
    });
    mocks.resolveEffectiveScoreState.mockReturnValue('fresh');
    mocks.dbExecute
      .mockResolvedValueOnce([baseMatchRow])
      .mockResolvedValueOnce([
        {
          skill_code: 'typescript',
          skill_id: null,
          level: 4,
          months_experience: 48,
          evidence_strength: 'high',
        },
      ])
      .mockResolvedValueOnce([
        { code: 'typescript', name: 'TypeScript' },
        { code: 'sql', name: 'SQL' },
      ])
      .mockResolvedValueOnce(buildRankRows());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('serves individual visual fixture explanations without touching the database', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');

    const response = await GET(
      new NextRequest('https://example.com/api/match/explain/visual-individual-match-1'),
      {
        params: Promise.resolve({ matchId: 'visual-individual-match-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.matchId).toBe('visual-individual-match-1');
    expect(body.explainer).toEqual({
      title: MATCH_EXPLAINER_TITLE,
      triggerLabel: MATCH_EXPLAINER_TRIGGER_LABEL,
      triggerAriaLabel: MATCH_EXPLAINER_TRIGGER_ARIA_LABEL,
      dialogDescription: MATCH_EXPLAINER_DIALOG_DESCRIPTION,
      testIds: MATCH_EXPLAINER_TEST_IDS,
    });
    expect(body.rank).toBeUndefined();
    expect(body.rankMode).toBe('band');
    expect(body.exactRankAvailable).toBe(false);
    expect(body.scoreVisibility).toBe('internal_ordering_only');
    expect(body.reasonSummary).toContain('Strong proof-backed alignment with the assignment.');
    expect(body.reasonSections.positive_match).toContain(
      'Core assignment skills have strong proof-backed support.'
    );
    expect(body.proofSignals).toEqual({
      skills: 'Strong proof support',
      constraints: 'Clear support',
      recency: 'Strong proof support',
      evidence: 'Strong proof support',
    });
    expect(body.skillsMatch.required).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          skillName: 'proof systems',
          requiredLevel: 4,
          yourLevel: 4,
          met: true,
        }),
      ])
    );
    expect(body.constraints).toEqual(
      expect.objectContaining({
        location: { match: true, details: 'remote' },
        workMode: { match: true, details: 'contract' },
      })
    );
    expect(mocks.dbExecute).not.toHaveBeenCalled();
  });

  it('suppresses exact rank for reviewers even when rankMode=exact is requested', async () => {
    mocks.getOrgMembershipRole.mockResolvedValue('org_reviewer');

    const response = await GET(
      new NextRequest('https://example.com/api/match/explain/match-1?rankMode=exact'),
      {
        params: Promise.resolve({ matchId: 'match-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.rank).toBeUndefined();
    expect(body.rankMode).toBe('band');
    expect(body.exactRankAvailable).toBe(false);
    expect(mocks.isActiveOrgMember).toHaveBeenCalledWith(expect.anything(), 'org-user-1', 'org-1', [
      'org_owner',
      'org_manager',
      'org_reviewer',
    ]);
  });

  it('keeps exact rank hidden for owners even when rankMode=exact is requested', async () => {
    const response = await GET(
      new NextRequest('https://example.com/api/match/explain/match-1?rankMode=exact'),
      {
        params: Promise.resolve({ matchId: 'match-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.rank).toBeUndefined();
    expect(body.rankMode).toBe('band');
    expect(body.exactRankAvailable).toBe(false);
    expect(body.rankBand).toBe('Top tier');
    expect(body.explainer).toEqual({
      title: MATCH_EXPLAINER_TITLE,
      triggerLabel: MATCH_EXPLAINER_TRIGGER_LABEL,
      triggerAriaLabel: MATCH_EXPLAINER_TRIGGER_ARIA_LABEL,
      dialogDescription: MATCH_EXPLAINER_DIALOG_DESCRIPTION,
      testIds: MATCH_EXPLAINER_TEST_IDS,
    });
  });

  it('returns a privacy-safe proof-first review card and keeps rank detail fairness-safe', async () => {
    mocks.getOrgMembershipRole.mockResolvedValue('org_reviewer');

    const response = await GET(new NextRequest('https://example.com/api/match/explain/match-1'), {
      params: Promise.resolve({ matchId: 'match-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reviewCard).toEqual(
      expect.objectContaining({
        candidateLabel: 'Submission A7F2',
        strongestProof: expect.objectContaining({
          summary: 'Proof-backed delivery signal.',
          outcome: 'Improved a launch corridor.',
          ownership: 'Owned the implementation.',
        }),
        verification: expect.objectContaining({
          summaryLabel: 'Verified proof signal present',
        }),
        trustLabels: ['Verified proof signal present'],
        fitBand: 'Top tier',
      })
    );
    expect(body.reviewCard).not.toHaveProperty('displayName');
    expect(body.reviewCard).not.toHaveProperty('avatarUrl');
    expect(body).not.toHaveProperty('pac');
    expect(body).not.toHaveProperty('compositeScore');
    expect(body).not.toHaveProperty('scoreTotal');
    expect(body).not.toHaveProperty('scoreState');
    expect(body).not.toHaveProperty('scoreVersion');
    expect(body).not.toHaveProperty('inputsHash');
    expect(body).not.toHaveProperty('subscores');
    expect(body.scoreVisibility).toBe('internal_ordering_only');
    expect(body.proofSignals).toEqual({
      skills: 'Strong proof support',
      constraints: 'Strong proof support',
      recency: 'Clear support',
      evidence: 'Clear support',
    });
    expect(JSON.stringify(body.reviewCard)).not.toContain('http');
    expect(body.rank).toBeUndefined();
    expect(body.rankMode).toBe('band');
    expect(body.exactRankAvailable).toBe(false);
  });

  it('logs unexpected explanation failures with structured diagnostics', async () => {
    const routeError = new Error('raw match explanation detail');
    mocks.dbExecute.mockReset();
    mocks.dbExecute.mockRejectedValueOnce(routeError);

    const response = await GET(new NextRequest('https://example.com/api/match/explain/match-1'), {
      params: Promise.resolve({ matchId: 'match-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error' });
    expect(log.error).toHaveBeenCalledWith('match.explain.get_failed', { error: routeError });
    expect(JSON.stringify(body)).not.toContain('raw match explanation detail');
  });
});
