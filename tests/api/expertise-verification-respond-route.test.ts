import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  notifyVerificationCompleted: vi.fn(),
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
});
