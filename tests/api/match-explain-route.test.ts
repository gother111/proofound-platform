import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  dbExecute: vi.fn(),
  requireApiAuth: vi.fn(),
  isActiveOrgMember: vi.fn(),
  getRows: vi.fn((result: unknown) => result),
  buildFairnessUiContract: vi.fn(),
  canRevealExactRank: vi.fn(),
  getOrgMembershipRole: vi.fn(),
  getRankBand: vi.fn(),
  getReasonLedgerEntries: vi.fn(),
  normalizeFairnessStatus: vi.fn(),
  renderExplanationFromReasonCodes: vi.fn(),
  resolveEffectiveScoreState: vi.fn(),
  getReviewCardProofPackMap: vi.fn(),
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
  canRevealExactRank: mocks.canRevealExactRank,
  getOrgMembershipRole: mocks.getOrgMembershipRole,
  getRankBand: mocks.getRankBand,
  getReasonLedgerEntries: mocks.getReasonLedgerEntries,
  getReviewCardProofPackMap: mocks.getReviewCardProofPackMap,
  normalizeFairnessStatus: mocks.normalizeFairnessStatus,
  renderExplanationFromReasonCodes: mocks.renderExplanationFromReasonCodes,
  buildProofFirstReviewCard: mocks.buildProofFirstReviewCard,
}));

vi.mock('@/lib/matching/match-score-contract', () => ({
  resolveEffectiveScoreState: mocks.resolveEffectiveScoreState,
}));

import { GET } from '@/app/api/match/explain/[matchId]/route';

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
    purpose_fit: 8800,
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
  profile_values: ['clarity'],
  profile_causes: ['climate'],
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
    mocks.canRevealExactRank.mockImplementation(
      (role: string | null | undefined) => role !== 'org_reviewer'
    );
    mocks.getOrgMembershipRole.mockResolvedValue('org_owner');
    mocks.getRankBand.mockReturnValue('Top tier');
    mocks.getReasonLedgerEntries.mockResolvedValue([]);
    mocks.getReviewCardProofPackMap.mockResolvedValue(new Map([['candidate-1', null]]));
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
      candidateLabel: 'Candidate A7F2',
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

  it('returns exact rank for owners when the fairness contract allows it', async () => {
    const response = await GET(
      new NextRequest('https://example.com/api/match/explain/match-1?rankMode=exact'),
      {
        params: Promise.resolve({ matchId: 'match-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.rank).toBe(1);
    expect(body.rankMode).toBe('exact');
    expect(body.exactRankAvailable).toBe(true);
    expect(body.rankBand).toBe('Top tier');
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
        candidateLabel: 'Candidate A7F2',
        strongestProof: expect.objectContaining({
          summary: 'Proof-backed delivery signal.',
          outcome: 'Improved a launch corridor.',
          ownership: 'Owned the implementation.',
        }),
        verification: expect.objectContaining({
          summaryLabel: 'Verified proof signal present',
        }),
      })
    );
    expect(body.reviewCard).not.toHaveProperty('displayName');
    expect(body.reviewCard).not.toHaveProperty('avatarUrl');
    expect(JSON.stringify(body.reviewCard)).not.toContain('http');
    expect(body.rank).toBeUndefined();
    expect(body.rankMode).toBe('band');
    expect(body.exactRankAvailable).toBe(false);
  });
});
