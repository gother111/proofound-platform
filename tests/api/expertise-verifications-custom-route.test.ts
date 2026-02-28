import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/verification/integrity', () => ({
  writeVerificationAuditLog: vi.fn(),
}));

import { requireApiAuthContext } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeVerificationAuditLog } from '@/lib/verification/integrity';
import { PATCH } from '@/app/api/expertise/verifications/custom/[requestId]/route';

function makeThenableBuilder(result: unknown) {
  const builder: any = {
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
  };
  builder.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return builder;
}

function makeBundleRequest(overrides?: Partial<any>) {
  return {
    id: 'bundle-1',
    requester_profile_id: 'user-1',
    verifier_email: 'verifier@example.com',
    verifier_relationship: 'peer',
    message: null,
    status: 'pending',
    created_at: '2026-02-27T10:00:00.000Z',
    expires_at: '2026-03-12T10:00:00.000Z',
    responded_at: null,
    response_message: null,
    custom_verification_request_items: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        artifact_type: 'skill',
        artifact_id: 'skill-1',
        display_label: 'TypeScript',
        status: 'pending',
        created_at: '2026-02-27T10:00:00.000Z',
        updated_at: '2026-02-27T10:00:00.000Z',
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        artifact_type: 'experience',
        artifact_id: 'exp-1',
        display_label: 'Staff Engineer',
        status: 'pending',
        created_at: '2026-02-27T10:00:00.000Z',
        updated_at: '2026-02-27T10:00:00.000Z',
      },
    ],
    ...overrides,
  };
}

describe('PATCH /api/expertise/verifications/custom/[requestId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiAuthContext).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
    } as any);
  });

  it('cancels selected pending artifacts and removes linked pending skill requests', async () => {
    const customRequestTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: makeBundleRequest(),
            error: null,
          }),
        })),
      })),
      update: vi.fn(() => makeThenableBuilder({ error: null })),
    };

    const customRequestItemsTable = {
      update: vi.fn(() => makeThenableBuilder({ error: null })),
      select: vi.fn(() => makeThenableBuilder({ count: 0, error: null })),
    };

    const skillVerificationTable = {
      select: vi
        .fn()
        .mockImplementation(() =>
          makeThenableBuilder({
            data: [{ id: 'skill-request-1', skill_id: 'skill-1' }],
            error: null,
          })
        ),
      delete: vi.fn(() => makeThenableBuilder({ error: null })),
    };

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'custom_verification_requests') return customRequestTable as any;
        if (table === 'custom_verification_request_items') return customRequestItemsTable as any;
        if (table === 'skill_verification_requests') return skillVerificationTable as any;
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as any);

    const response = await PATCH(
      new NextRequest('http://localhost/api/expertise/verifications/custom/bundle-1', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'cancel_selected',
          itemIds: ['11111111-1111-4111-8111-111111111111'],
        }),
      }),
      { params: Promise.resolve({ requestId: 'bundle-1' }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      requestId: 'bundle-1',
      canceledItemIds: ['11111111-1111-4111-8111-111111111111'],
      removedSkillRequestIds: ['skill-request-1'],
      requestExpired: true,
    });
    expect(customRequestItemsTable.update).toHaveBeenCalledTimes(1);
    expect(skillVerificationTable.delete).toHaveBeenCalledTimes(1);
    expect(customRequestTable.update).toHaveBeenCalledTimes(1);
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });

  it('rejects cancellation when selected artifacts are not pending', async () => {
    const customRequestTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: makeBundleRequest({
              custom_verification_request_items: [
                {
                  id: '11111111-1111-4111-8111-111111111111',
                  artifact_type: 'skill',
                  artifact_id: 'skill-1',
                  display_label: 'TypeScript',
                  status: 'accepted',
                  created_at: '2026-02-27T10:00:00.000Z',
                  updated_at: '2026-02-27T10:00:00.000Z',
                },
              ],
            }),
            error: null,
          }),
        })),
      })),
      update: vi.fn(() => makeThenableBuilder({ error: null })),
    };

    const customRequestItemsTable = {
      update: vi.fn(() => makeThenableBuilder({ error: null })),
      select: vi.fn(() => makeThenableBuilder({ count: 1, error: null })),
    };

    const skillVerificationTable = {
      select: vi.fn(() => makeThenableBuilder({ data: [], error: null })),
      delete: vi.fn(() => makeThenableBuilder({ error: null })),
    };

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'custom_verification_requests') return customRequestTable as any;
        if (table === 'custom_verification_request_items') return customRequestItemsTable as any;
        if (table === 'skill_verification_requests') return skillVerificationTable as any;
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as any);

    const response = await PATCH(
      new NextRequest('http://localhost/api/expertise/verifications/custom/bundle-1', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'cancel_selected',
          itemIds: ['11111111-1111-4111-8111-111111111111'],
        }),
      }),
      { params: Promise.resolve({ requestId: 'bundle-1' }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Only pending artifacts can be canceled.',
    });
    expect(customRequestItemsTable.update).not.toHaveBeenCalled();
    expect(skillVerificationTable.delete).not.toHaveBeenCalled();
  });

  it('expires the bundle after cancelling the final pending artifact', async () => {
    const customRequestTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: makeBundleRequest({
              custom_verification_request_items: [
                {
                  id: '22222222-2222-4222-8222-222222222222',
                  artifact_type: 'experience',
                  artifact_id: 'exp-1',
                  display_label: 'Staff Engineer',
                  status: 'pending',
                  created_at: '2026-02-27T10:00:00.000Z',
                  updated_at: '2026-02-27T10:00:00.000Z',
                },
              ],
            }),
            error: null,
          }),
        })),
      })),
      update: vi.fn(() => makeThenableBuilder({ error: null })),
    };

    const customRequestItemsTable = {
      update: vi.fn(() => makeThenableBuilder({ error: null })),
      select: vi.fn(() => makeThenableBuilder({ count: 0, error: null })),
    };

    const skillVerificationTable = {
      select: vi.fn(() => makeThenableBuilder({ data: [], error: null })),
      delete: vi.fn(() => makeThenableBuilder({ error: null })),
    };

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'custom_verification_requests') return customRequestTable as any;
        if (table === 'custom_verification_request_items') return customRequestItemsTable as any;
        if (table === 'skill_verification_requests') return skillVerificationTable as any;
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as any);

    const response = await PATCH(
      new NextRequest('http://localhost/api/expertise/verifications/custom/bundle-1', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'cancel_selected',
          itemIds: ['22222222-2222-4222-8222-222222222222'],
        }),
      }),
      { params: Promise.resolve({ requestId: 'bundle-1' }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      requestExpired: true,
    });
    expect(customRequestTable.update).toHaveBeenCalledTimes(1);
  });
});
