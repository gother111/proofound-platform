import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAssignment, updateAssignment } from '@/actions/assignment';
import { requireAuth, assertOrgRole } from '@/lib/auth';
import { log } from '@/lib/log';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

vi.mock('@/lib/auth', () => ({
  assertOrgRole: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

function validAssignmentData() {
  return {
    role: 'Proof review lead',
    description: 'Run a proof-backed assignment review loop.',
    status: 'draft' as const,
    businessValue: 'Improve assignment review quality with proof-backed decisions.',
    expectedImpact: 'Clearer review decisions.',
    valuesRequired: ['ownership'],
    causeTags: ['trust'],
    outcomes: [{ metric: 'review cycle time', target: '20% faster', timeframe: '30 days' }],
    mustHaveSkills: [{ id: 'skill-1', level: 4, label: 'Evidence review' }],
    niceToHaveSkills: [{ id: 'skill-2', level: 3, label: 'Stakeholder updates' }],
    verificationGates: ['work_sample'],
    minLanguage: { code: 'en', level: 'C1' as const },
    weights: { proof: 0.7, context: 0.3 },
    locationMode: 'remote' as const,
    radiusKm: 25,
    country: 'SE',
    city: 'Stockholm',
    compMin: 1000,
    compMax: 2000,
    currency: 'SEK',
    hoursMin: 10,
    hoursMax: 20,
    startEarliest: '2026-06-01',
    startLatest: '2026-07-01',
  };
}

describe('assignment server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(assertOrgRole).mockResolvedValue(undefined as any);
  });

  it('creates assignments with database column names for Supabase writes', async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'assignment-1' },
          error: null,
        }),
      }),
    });

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'assignments') {
          return { insert };
        }

        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { slug: 'proofound' },
                  error: null,
                }),
              }),
            }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const result = await createAssignment('org-1', validAssignmentData());

    expect(result).toEqual({ success: true, assignmentId: 'assignment-1' });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        business_value: 'Improve assignment review quality with proof-backed decisions.',
        expected_impact: 'Clearer review decisions.',
        values_required: ['ownership'],
        cause_tags: ['trust'],
        must_have_skills: [{ id: 'skill-1', level: 4, label: 'Evidence review' }],
        nice_to_have_skills: [{ id: 'skill-2', level: 3, label: 'Stakeholder updates' }],
        verification_gates: ['work_sample'],
        min_language: { code: 'en', level: 'C1' },
        location_mode: 'remote',
        radius_km: 25,
        comp_min: 1000,
        comp_max: 2000,
        hours_min: 10,
        hours_max: 20,
        start_earliest: '2026-06-01',
        start_latest: '2026-07-01',
      })
    );
    expect(insert.mock.calls[0][0]).not.toHaveProperty('orgId');
    expect(insert.mock.calls[0][0]).not.toHaveProperty('businessValue');
    expect(revalidatePath).toHaveBeenCalledWith('/app/o/proofound/assignments');
  });

  it('logs assignment creation failures structurally', async () => {
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'assignments') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'insert failed' },
                }),
              }),
            }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const result = await createAssignment('org-1', validAssignmentData());

    expect(result).toEqual({ error: 'Failed to create assignment' });
    expect(log.error).toHaveBeenCalledWith('assignment.action.create_failed', {
      orgId: 'org-1',
      error: { message: 'insert failed' },
    });
  });

  it('updates assignments with database column names and structured failure logs', async () => {
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'update failed' } }),
      }),
    });

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'assignments') {
          return { update };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const result = await updateAssignment('assignment-1', 'org-1', {
      businessValue: 'Improve assignment review quality with proof-backed decisions.',
      locationMode: 'hybrid',
    });

    expect(result).toEqual({ error: 'Failed to update assignment' });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        business_value: 'Improve assignment review quality with proof-backed decisions.',
        location_mode: 'hybrid',
        updated_at: expect.any(String),
      })
    );
    expect(update.mock.calls[0][0]).not.toHaveProperty('businessValue');
    expect(log.error).toHaveBeenCalledWith('assignment.action.update_failed', {
      assignmentId: 'assignment-1',
      orgId: 'org-1',
      error: { message: 'update failed' },
    });
  });
});
