import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  notifyVerificationCompleted: vi.fn(),
}));

vi.mock('@/lib/verification/canonical-requests', () => ({
  getCanonicalSkillVerificationRequestById: vi.fn(),
  mapCanonicalSkillVerificationRequestRecord: vi.fn((record: any) => record),
  updateCanonicalSkillVerificationRequest: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { requireApiAuthContext } from '@/lib/auth';
import { log } from '@/lib/log';
import { notifyVerificationCompleted } from '@/lib/notifications';
import {
  getCanonicalSkillVerificationRequestById,
  updateCanonicalSkillVerificationRequest,
} from '@/lib/verification/canonical-requests';
import { POST } from '@/app/api/verification/requests/skill/[requestId]/respond/route';

describe('POST /api/verification/requests/skill/[requestId]/respond', () => {
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
      verifier_relationship: 'manager',
      request_kind: 'generic_verification',
      attestation_request: null,
      status: 'pending',
      integrity_status: 'clear',
      integrity_reason: null,
      integrity_meta: {},
      integrity_flagged_at: null,
      risk_signals: {},
      requester_ip_hash: null,
      requester_user_agent_hash: null,
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

    (getCanonicalSkillVerificationRequestById as any).mockResolvedValue(verificationRequest);
    (updateCanonicalSkillVerificationRequest as any).mockImplementation(
      async (payload: Record<string, unknown>) => {
        updatePayload = payload;
        return {
          ...verificationRequest,
          status: payload.status,
          response_message: payload.responseMessage,
          verifier_profile_id: payload.verifierProfileId,
          response_auth_method: payload.responseAuthMethod,
          response_actor_email: payload.responseActorEmail,
          responded_at: payload.respondedAt,
        };
      }
    );

    (requireApiAuthContext as any).mockResolvedValue({
      user: {
        id: '33333333-3333-4333-8333-333333333333',
      },
      supabase,
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verification/requests/skill/${requestId}/respond`, {
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
    expect(updatePayload?.verifierProfileId).toBe('33333333-3333-4333-8333-333333333333');
    expect(updatePayload?.responseAuthMethod).toBe('authenticated');
    expect(updatePayload?.responseActorEmail).toBe('verifier@example.com');
    expect(notifyVerificationCompleted).toHaveBeenCalledWith(
      requesterProfileId,
      requestId,
      'Requester Person',
      true
    );
    await expect(response.json()).resolves.toMatchObject({
      canonical_record_id: requestId,
    });
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
      from: vi.fn(() => {
        throw new Error('profiles lookup should not run for invalid attestation payloads');
      }),
    };

    (getCanonicalSkillVerificationRequestById as any).mockResolvedValue(verificationRequest);
    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: '44444444-4444-4444-8444-444444444444' },
      supabase,
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verification/requests/skill/${requestId}/respond`, {
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

  it('rejects malformed JSON before loading the verification request', async () => {
    const requestId = '11111111-1111-4111-8111-111111111111';

    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: '44444444-4444-4444-8444-444444444444' },
      supabase: {},
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verification/requests/skill/${requestId}/respond`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"action":',
      }),
      { params: Promise.resolve({ requestId }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(getCanonicalSkillVerificationRequestById).not.toHaveBeenCalled();
    expect(updateCanonicalSkillVerificationRequest).not.toHaveBeenCalled();
    expect(notifyVerificationCompleted).not.toHaveBeenCalled();
  });

  it('records structured no verdicts for human-observed declines', async () => {
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
      integrity_status: 'clear',
      integrity_reason: null,
      integrity_meta: {},
      integrity_flagged_at: null,
      risk_signals: {},
      requester_ip_hash: null,
      requester_user_agent_hash: null,
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
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                display_name: 'Requester Person',
                handle: 'requester-person',
              },
              error: null,
            }),
          }),
        }),
      })),
    };

    (getCanonicalSkillVerificationRequestById as any).mockResolvedValue(verificationRequest);
    (updateCanonicalSkillVerificationRequest as any).mockImplementation(
      async (payload: Record<string, unknown>) => ({
        ...verificationRequest,
        status: payload.status,
        attestation_response: payload.attestationResponse,
        response_message: payload.responseMessage,
        verifier_profile_id: payload.verifierProfileId,
        response_auth_method: payload.responseAuthMethod,
        response_actor_email: payload.responseActorEmail,
        responded_at: payload.respondedAt,
      })
    );
    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: '44444444-4444-4444-8444-444444444444' },
      supabase,
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verification/requests/skill/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'decline',
          responseMessage: 'I did not directly observe this scope.',
          attestation: {
            verdict: 'no',
            relationshipToSubject: 'Manager',
            workedTogetherWhere: 'We worked together in one delivery team.',
            observationDuration: '3 months',
            observationRecency: 'Most recently observed in March 2026',
            skillIds: ['33333333-3333-4333-8333-333333333333'],
            observedBehaviorNote:
              'I did not directly observe the leadership behaviors requested, so I cannot confirm this scope.',
            confidenceLevel: 'medium',
            conflictBiasDisclosure: 'Direct manager for one sprint.',
          },
        }),
      }),
      { params: Promise.resolve({ requestId }) }
    );

    expect(response.status).toBe(200);
    expect(updateCanonicalSkillVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId,
        status: 'declined',
        attestationResponse: expect.objectContaining({
          verdict: 'no',
        }),
      })
    );
  });

  it('logs update failures structurally while keeping the public response generic', async () => {
    const requestId = '11111111-1111-4111-8111-111111111111';
    const verificationRequest = {
      id: requestId,
      requester_profile_id: '22222222-2222-4222-8222-222222222222',
      verifier_profile_id: null,
      verifier_email: 'verifier@example.com',
      verifier_relationship: 'peer',
      request_kind: 'generic_verification',
      attestation_request: null,
      status: 'pending',
      integrity_status: 'clear',
      integrity_reason: null,
      integrity_meta: {},
      integrity_flagged_at: null,
      risk_signals: {},
      requester_ip_hash: null,
      requester_user_agent_hash: null,
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
    };

    (getCanonicalSkillVerificationRequestById as any).mockResolvedValue(verificationRequest);
    (updateCanonicalSkillVerificationRequest as any).mockRejectedValueOnce(
      new Error('canonical update failed')
    );
    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: '44444444-4444-4444-8444-444444444444' },
      supabase,
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verification/requests/skill/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'accept',
        }),
      }),
      { params: Promise.resolve({ requestId }) }
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to update verification request',
    });
    expect(log.error).toHaveBeenCalledWith('verification.skill_response.update_failed', {
      requestId,
      error: 'canonical update failed',
    });
  });

  it('logs notification failures without failing a recorded response', async () => {
    const requestId = '11111111-1111-4111-8111-111111111111';
    const verificationRequest = {
      id: requestId,
      requester_profile_id: '22222222-2222-4222-8222-222222222222',
      verifier_profile_id: null,
      verifier_email: 'verifier@example.com',
      verifier_relationship: 'peer',
      request_kind: 'generic_verification',
      attestation_request: null,
      status: 'pending',
      integrity_status: 'clear',
      integrity_reason: null,
      integrity_meta: {},
      integrity_flagged_at: null,
      risk_signals: {},
      requester_ip_hash: null,
      requester_user_agent_hash: null,
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
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                display_name: 'Requester Person',
                handle: 'requester-person',
              },
              error: null,
            }),
          }),
        }),
      })),
    };

    (getCanonicalSkillVerificationRequestById as any).mockResolvedValue(verificationRequest);
    (updateCanonicalSkillVerificationRequest as any).mockResolvedValue({
      ...verificationRequest,
      status: 'accepted',
      response_auth_method: 'authenticated',
      response_actor_email: 'verifier@example.com',
    });
    (notifyVerificationCompleted as any).mockRejectedValueOnce(
      new Error('notification delivery failed')
    );
    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: '44444444-4444-4444-8444-444444444444' },
      supabase,
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verification/requests/skill/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'accept',
        }),
      }),
      { params: Promise.resolve({ requestId }) }
    );

    expect(response.status).toBe(200);
    expect(log.error).toHaveBeenCalledWith('verification.skill_response.notification_failed', {
      requestId,
      error: 'notification delivery failed',
    });
  });
});
