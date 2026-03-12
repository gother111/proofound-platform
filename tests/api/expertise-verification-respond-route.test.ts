import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  notifyVerificationCompleted: vi.fn(),
}));

vi.mock('@/lib/canonical/repository', () => ({
  CANONICAL_PROOFS_WRITE_ENABLED: true,
  upsertCanonicalVerificationRecord: vi.fn(async () => ({ id: 'canonical-1' })),
}));

vi.mock('@/lib/contracts/canonical-domain', () => ({
  hashOpaqueToken: vi.fn(() => 'hashed-email'),
}));

vi.mock('@/lib/verification/canonical-requests', () => ({
  getCanonicalSkillVerificationRequestById: vi.fn(),
  mapCanonicalSkillVerificationRequestRecord: vi.fn((record: any) => record),
  updateCanonicalSkillVerificationRequest: vi.fn(),
}));

import { requireApiAuthContext } from '@/lib/auth';
import { notifyVerificationCompleted } from '@/lib/notifications';
import { POST } from '@/app/api/expertise/verification/[requestId]/respond/route';

describe('POST /api/expertise/verification/[requestId]/respond', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses requester_profile_id and authorizes verifier email case-insensitively', async () => {
    const requestId = '11111111-1111-4111-8111-111111111111';
    const requesterProfileId = '22222222-2222-4222-8222-222222222222';
    const verificationRequest = {
      id: requestId,
      requester_profile_id: requesterProfileId,
      verifier_profile_id: null,
      verifier_email: 'Verifier@Example.com',
      status: 'pending',
    };

    let requestedProfileId = '';
    let updatePayload: Record<string, unknown> | null = null;

    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: 'verifier@example.com',
            },
          },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'skill_verification_requests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: verificationRequest,
                  error: null,
                }),
              }),
            }),
            update: vi.fn((payload: Record<string, unknown>) => {
              updatePayload = payload;
              return {
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { ...verificationRequest, ...payload },
                      error: null,
                    }),
                  }),
                }),
              };
            }),
          };
        }

        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn((_: string, id: string) => {
                requestedProfileId = id;
                return {
                  single: vi.fn().mockResolvedValue({
                    data: {
                      display_name: 'Requester Person',
                      handle: 'requester-person',
                    },
                    error: null,
                  }),
                };
              }),
            }),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    (requireApiAuthContext as any).mockResolvedValue({
      user: {
        id: '33333333-3333-4333-8333-333333333333',
      },
      supabase,
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/expertise/verification/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'accept',
          responseMessage: 'Approved based on recent collaboration.',
        }),
      }),
      { params: Promise.resolve({ requestId }) }
    );

    expect(response.status).toBe(200);
    expect(requestedProfileId).toBe(requesterProfileId);
    expect(updatePayload?.verifier_profile_id).toBe('33333333-3333-4333-8333-333333333333');
    expect(updatePayload?.response_auth_method).toBe('authenticated');
    expect(updatePayload?.response_actor_email).toBe('verifier@example.com');
    expect(notifyVerificationCompleted).toHaveBeenCalledWith(
      requesterProfileId,
      requestId,
      'Requester Person',
      true
    );
  });

  it('requires structured attestation payloads for human-observed requests', async () => {
    const requestId = '11111111-1111-4111-8111-111111111111';
    const verificationRequest = {
      id: requestId,
      requester_profile_id: '22222222-2222-4222-8222-222222222222',
      verifier_profile_id: null,
      verifier_email: 'verifier@example.com',
      verifier_relationship: 'manager',
      request_kind: 'human_observed_attestation',
      attestation_request: {
        requestKind: 'human_observed_attestation',
        skillIds: ['33333333-3333-4333-8333-333333333333'],
        skillLabels: ['Leadership'],
        skillFamilies: ['leadership'],
      },
      status: 'pending',
    };

    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: 'verifier@example.com',
            },
          },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'skill_verification_requests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: verificationRequest,
                  error: null,
                }),
              }),
            }),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: '44444444-4444-4444-8444-444444444444' },
      supabase,
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/expertise/verification/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'accept',
        }),
      }),
      { params: Promise.resolve({ requestId }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Validation failed',
    });
  });
});
