import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { PATCH } from '@/app/api/expertise/user-skills/[id]/route';
import { requireApiAuthContext } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitSkillUpdatedAsync: vi.fn(),
  emitSkillDeletedAsync: vi.fn(),
}));

const params = { params: Promise.resolve({ id: 'skill-1' }) };

function createPatchRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/expertise/user-skills/skill-1', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function createSupabaseMock() {
  let updatePayload: Record<string, unknown> | null = null;

  const verifySkillQuery = {
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { id: 'skill-1' },
      error: null,
    }),
  };

  const updateSkillQuery = {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        id: 'skill-1',
        taxonomy: {
          name_i18n: { en: 'TypeScript' },
        },
      },
      error: null,
    }),
  };

  const skillsTable = {
    select: vi.fn().mockReturnValue(verifySkillQuery),
    update: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      updatePayload = payload;
      return updateSkillQuery;
    }),
  };

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'skills') {
        return skillsTable;
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };

  return {
    supabase,
    skillsTable,
    getUpdatePayload: () => updatePayload,
  };
}

describe('PATCH /api/expertise/user-skills/[id]', () => {
  const authContext: { user: { id: string }; supabase: unknown } = {
    user: { id: 'user-1' },
    supabase: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiAuthContext).mockImplementation(async () => authContext as any);
  });

  it('accepts date-only last_used_at values and normalizes to ISO datetime', async () => {
    const { supabase, skillsTable, getUpdatePayload } = createSupabaseMock();
    authContext.supabase = supabase;

    const response = await PATCH(
      createPatchRequest({
        level: 4,
        last_used_at: '2026-02-26',
      }),
      params
    );

    expect(response.status).toBe(200);
    expect(skillsTable.update).toHaveBeenCalledTimes(1);
    expect(getUpdatePayload()).toEqual(
      expect.objectContaining({
        level: 4,
        last_used_at: '2026-02-26T00:00:00.000Z',
      })
    );
  });

  it('accepts ISO datetime last_used_at values without altering timestamp semantics', async () => {
    const { supabase, skillsTable, getUpdatePayload } = createSupabaseMock();
    authContext.supabase = supabase;

    const response = await PATCH(
      createPatchRequest({
        level: 3,
        last_used_at: '2026-02-26T12:34:56.000Z',
      }),
      params
    );

    expect(response.status).toBe(200);
    expect(skillsTable.update).toHaveBeenCalledTimes(1);
    expect(getUpdatePayload()).toEqual(
      expect.objectContaining({
        level: 3,
        last_used_at: '2026-02-26T12:34:56.000Z',
      })
    );
  });

  it('rejects invalid last_used_at values with validation error', async () => {
    const { supabase, skillsTable } = createSupabaseMock();
    authContext.supabase = supabase;

    const response = await PATCH(
      createPatchRequest({
        level: 3,
        last_used_at: '2026-02-30',
      }),
      params
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Validation failed',
    });
    expect(skillsTable.update).not.toHaveBeenCalled();
  });
});
