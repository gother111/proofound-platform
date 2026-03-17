import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/verification/integrity', () => ({
  writeVerificationAuditLog: vi.fn(),
}));

vi.mock('@/lib/verification/canonical-bundles', () => ({
  cancelCanonicalBundleItems: vi.fn(),
  getCanonicalBundleById: vi.fn(),
}));

import { requireApiAuthContext } from '@/lib/auth';
import { writeVerificationAuditLog } from '@/lib/verification/integrity';
import {
  cancelCanonicalBundleItems,
  getCanonicalBundleById,
} from '@/lib/verification/canonical-bundles';
import { PATCH } from '@/app/api/verification/requests/bundles/[requestId]/route';

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
    items: [
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

describe('PATCH /api/verification/requests/bundles/[requestId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiAuthContext).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
    } as any);
  });

  it('cancels selected pending canonical bundle items', async () => {
    vi.mocked(getCanonicalBundleById).mockResolvedValue(makeBundleRequest() as any);
    vi.mocked(cancelCanonicalBundleItems).mockResolvedValue({
      removedSkillRequestIds: ['skill-request-1'],
      requestExpired: true,
    } as any);

    const response = await PATCH(
      new NextRequest('http://localhost/api/verification/requests/bundles/bundle-1', {
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
    expect(cancelCanonicalBundleItems).toHaveBeenCalledWith('bundle-1', [
      '11111111-1111-4111-8111-111111111111',
    ]);
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });

  it('rejects cancellation when selected artifacts are not pending', async () => {
    vi.mocked(getCanonicalBundleById).mockResolvedValue(
      makeBundleRequest({
        items: [
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
      }) as any
    );

    const response = await PATCH(
      new NextRequest('http://localhost/api/verification/requests/bundles/bundle-1', {
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
    expect(cancelCanonicalBundleItems).not.toHaveBeenCalled();
  });
});
