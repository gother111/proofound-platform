import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email/sender';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createCanonicalVerificationBundle,
  expireCanonicalBundle,
  getCanonicalBundleById,
  respondCanonicalBundle,
  updateCanonicalBundleDeliveryState,
} from '@/lib/verification/canonical-bundles';
import { listCanonicalSkillVerificationRequestsForOwner } from '@/lib/verification/canonical-requests';
import { GET as getArtifacts } from '@/app/api/verification/requests/custom/artifacts/route';
import { POST as postCustomRequest } from '@/app/api/verification/requests/custom/route';
import { GET as getEmailHint } from '@/app/api/verification/requests/email-hint/route';
import {
  GET as getVerifyCustom,
  POST as postVerifyCustom,
} from '@/app/api/verify/custom/[token]/route';

const ensureInternalOpsQueueItemMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/email/sender', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/verification/canonical-bundles', () => ({
  createCanonicalVerificationBundle: vi.fn(),
  updateCanonicalBundleDeliveryState: vi.fn(),
  getCanonicalBundleById: vi.fn(),
  expireCanonicalBundle: vi.fn(),
  respondCanonicalBundle: vi.fn(),
}));

vi.mock('@/lib/verification/canonical-requests', () => ({
  listCanonicalSkillVerificationRequestsForOwner: vi.fn(),
  mapCanonicalSkillVerificationRequestRecord: vi.fn((record: any) => record),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/internal-ops/queue', () => ({
  ensureInternalOpsQueueItem: (...args: any[]) => ensureInternalOpsQueueItemMock(...args),
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  CAPABILITY_BINDINGS: {
    EMAIL_HASH: 'email_hash',
    EMAIL_THEN_PROFILE_LOCK: 'email_then_profile_lock',
  },
  CAPABILITY_TOKEN_CLASSES: {
    CUSTOM_VERIFICATION_RESPONSE: 'custom_verification_response',
  },
  CAPABILITY_REDEEM_SESSION_MAX_AGE_SECONDS: 600,
  getCapabilityRedeemSessionCookieName: vi.fn(() => 'pf_rsn_custom_verification_response'),
  beginCapabilityTokenRedeemSession: vi.fn(async () => ({
    ok: true,
    token: { id: 'cap-custom-token-1', source_id: 'bundle-1' },
    redeemSessionNonce: 'nonce-123',
    maxAgeSeconds: 600,
  })),
  redeemCapabilityToken: vi.fn(async () => ({
    ok: true,
    token: { id: 'cap-custom-token-1', source_id: 'bundle-1' },
  })),
}));

import { log } from '@/lib/log';

const AUTH_USER_ID = '11111111-1111-4111-8111-111111111111';

function thenableResult<T>(result: T) {
  const query: any = {
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    select: vi.fn(() => query),
  };

  query.then = (resolve: (value: T) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);

  return query;
}

function makeCanonicalBundle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bundle-1',
    requester_profile_id: AUTH_USER_ID,
    requester_name: 'Requester Name',
    verifier_email: 'verifier@example.com',
    verifier_profile_id: null,
    verifier_relationship: 'peer',
    verifier_source: 'peer',
    request_kind: 'generic_verification',
    attestation_request: null,
    attestation_response: null,
    message: 'Please verify these artifacts.',
    status: 'pending',
    created_at: '2026-03-15T10:00:00.000Z',
    expires_at: '2099-03-20T10:00:00.000Z',
    responded_at: null,
    response_message: null,
    capability_token_id: 'cap-custom-token-1',
    email_sent: true,
    email_error: null,
    items: [
      {
        id: 'skill-request-1',
        artifact_type: 'skill',
        artifact_id: '22222222-2222-4222-8222-222222222222',
        display_label: 'TypeScript',
        claim_template: 'skill_observed_in_context',
        claim_label: 'This skill was directly observed in this context',
        support_label: 'artifact-backed',
        status: 'pending',
        created_at: '2026-03-15T10:00:00.000Z',
        updated_at: '2026-03-15T10:00:00.000Z',
      },
      {
        id: 'exp-request-1',
        artifact_type: 'experience',
        artifact_id: 'experience-1',
        display_label: 'Staff Engineer',
        claim_template: 'worked_here_in_role',
        claim_label: 'I worked here in this role',
        support_label: 'artifact-backed',
        status: 'pending',
        created_at: '2026-03-15T10:00:00.000Z',
        updated_at: '2026-03-15T10:00:00.000Z',
      },
    ],
    ...overrides,
  };
}

describe('canonical custom verification routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({ id: AUTH_USER_ID } as any);
    vi.mocked(sendEmail).mockResolvedValue({ success: true });
    vi.mocked(updateCanonicalBundleDeliveryState).mockResolvedValue(undefined as any);
    vi.mocked(respondCanonicalBundle).mockResolvedValue(makeCanonicalBundle() as any);
    vi.mocked(listCanonicalSkillVerificationRequestsForOwner).mockResolvedValue([]);
    ensureInternalOpsQueueItemMock.mockResolvedValue(undefined);
  });

  it('loads selectable artifacts from the active custom artifacts route', async () => {
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'skills') {
          return {
            select: vi.fn(() =>
              thenableResult({
                data: [
                  {
                    id: '22222222-2222-4222-8222-222222222222',
                    skill_id: 'custom-1-2-3-typescript',
                    skill_code: null,
                    competency_label: 'C3',
                    name_i18n: { en: 'TypeScript' },
                    taxonomy: null,
                  },
                ],
                error: null,
              })
            ),
          };
        }

        return {
          select: vi.fn(() => thenableResult({ data: [], error: null })),
        };
      }),
    } as any);

    const response = await getArtifacts();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      total: 1,
      artifacts: {
        skill: [{ id: '22222222-2222-4222-8222-222222222222', label: 'TypeScript' }],
      },
    });
  });

  it('rejects malformed custom verification request JSON before bundle creation', async () => {
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(() => {
        throw new Error('artifact lookup should not run for malformed JSON');
      }),
    } as any);

    const response = await postCustomRequest(
      new NextRequest('http://localhost/api/verification/requests/custom', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"verifierEmail":',
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(createCanonicalVerificationBundle).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('logs selected skill validation failures without exposing verifier email', async () => {
    const taxonomyJoinError = new Error('taxonomy join unavailable');
    const fallbackSkillError = new Error('fallback skills unavailable');
    let skillsSelectCount = 0;

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: 'requester@example.com' } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'skills') {
          return {
            select: vi.fn(() => {
              skillsSelectCount += 1;
              return thenableResult(
                skillsSelectCount === 1
                  ? { data: null, error: taxonomyJoinError }
                  : { data: null, error: fallbackSkillError }
              );
            }),
          };
        }

        return {
          select: vi.fn(() => thenableResult({ data: [], error: null })),
        };
      }),
    } as any);

    const response = await postCustomRequest(
      new NextRequest('http://localhost/api/verification/requests/custom', {
        method: 'POST',
        body: JSON.stringify({
          verifierEmail: 'verifier@example.com',
          relationship: 'peer',
          artifacts: [{ type: 'skill', id: '22222222-2222-4222-8222-222222222222' }],
        }),
      })
    );

    expect(response.status).toBe(500);
    expect(log.warn).toHaveBeenCalledWith(
      'verification.custom_request.selected_skills_taxonomy_join_failed',
      {
        error: taxonomyJoinError,
        profileId: AUTH_USER_ID,
        selectedSkillCount: 1,
      }
    );
    expect(log.error).toHaveBeenCalledWith(
      'verification.custom_request.selected_skills_load_failed',
      {
        error: fallbackSkillError,
        userId: AUTH_USER_ID,
        selectedSkillCount: 1,
      }
    );
    expect(JSON.stringify(vi.mocked(log.error).mock.calls)).not.toContain('verifier@example.com');
  });

  it('creates a canonical verification bundle and sends the public verify/custom link', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: 'requester@example.com' } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'skills') {
          return {
            select: vi.fn(() =>
              thenableResult({
                data: [
                  {
                    id: '22222222-2222-4222-8222-222222222222',
                    skill_id: 'custom-1-2-3-typescript',
                    skill_code: null,
                    name_i18n: { en: 'TypeScript' },
                    taxonomy: null,
                  },
                ],
                error: null,
              })
            ),
          };
        }

        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { display_name: 'Requester Name' },
                  error: null,
                }),
              })),
            })),
          };
        }

        return {
          select: vi.fn(() => thenableResult({ data: [], error: null })),
        };
      }),
    } as any);

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
    } as any);

    vi.mocked(createCanonicalVerificationBundle).mockResolvedValue({
      bundleId: 'bundle-1',
      rawToken: 'custom-verify-token',
      token: { id: 'cap-custom-token-1' },
      expiresAt: new Date('2099-03-20T10:00:00.000Z'),
      records: [],
    } as any);

    const response = await postCustomRequest(
      new NextRequest('http://localhost/api/verification/requests/custom', {
        method: 'POST',
        body: JSON.stringify({
          verifierEmail: 'verifier@example.com',
          relationship: 'peer',
          artifacts: [{ type: 'skill', id: '22222222-2222-4222-8222-222222222222' }],
          message: 'Please verify',
        }),
      })
    );

    expect(response.status).toBe(201);
    expect(createCanonicalVerificationBundle).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: AUTH_USER_ID,
        verifierEmail: 'verifier@example.com',
      })
    );
    expect(updateCanonicalBundleDeliveryState).toHaveBeenCalledWith('bundle-1', {
      emailSent: true,
      emailError: null,
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'verifier@example.com',
        subject: 'Proofound verification request',
        html: expect.stringContaining('/verify/custom/custom-verify-token'),
      })
    );
    const sentEmailPayload = vi.mocked(sendEmail).mock.calls[0][0];
    expect(sentEmailPayload.html).not.toContain('Requester Name');
    expect(sentEmailPayload.html).not.toContain('TypeScript');
    expect(sentEmailPayload.html).not.toContain('Please verify');
  });

  it('logs custom verification email delivery failures with bundle context', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: 'requester@example.com' } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'skills') {
          return {
            select: vi.fn(() =>
              thenableResult({
                data: [
                  {
                    id: '22222222-2222-4222-8222-222222222222',
                    skill_id: 'custom-1-2-3-typescript',
                    skill_code: null,
                    name_i18n: { en: 'TypeScript' },
                    taxonomy: null,
                  },
                ],
                error: null,
              })
            ),
          };
        }

        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { display_name: 'Requester Name' },
                  error: null,
                }),
              })),
            })),
          };
        }

        return {
          select: vi.fn(() => thenableResult({ data: [], error: null })),
        };
      }),
    } as any);

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
    } as any);
    vi.mocked(createCanonicalVerificationBundle).mockResolvedValue({
      bundleId: 'bundle-1',
      rawToken: 'custom-verify-token',
      token: { id: 'cap-custom-token-1' },
      expiresAt: new Date('2099-03-20T10:00:00.000Z'),
      records: [],
    } as any);
    vi.mocked(sendEmail).mockResolvedValue({
      success: false,
      error: 'provider_denied',
    } as any);

    const response = await postCustomRequest(
      new NextRequest('http://localhost/api/verification/requests/custom', {
        method: 'POST',
        body: JSON.stringify({
          verifierEmail: 'verifier@example.com',
          relationship: 'peer',
          artifacts: [{ type: 'skill', id: '22222222-2222-4222-8222-222222222222' }],
          message: 'Please verify',
        }),
      })
    );

    expect(response.status).toBe(201);
    expect(log.warn).toHaveBeenCalledWith('verification.custom_request.email_send_failed', {
      error: 'provider_denied',
      userId: AUTH_USER_ID,
      bundleId: 'bundle-1',
      selectedArtifactCount: 1,
    });
    expect(JSON.stringify(vi.mocked(log.warn).mock.calls)).not.toContain('verifier@example.com');
  });

  it('returns canonical bundle details for /api/verify/custom/[token]', async () => {
    vi.mocked(getCanonicalBundleById).mockResolvedValue(makeCanonicalBundle() as any);

    const response = await getVerifyCustom(
      new NextRequest('http://localhost/api/verify/custom/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
      { params: Promise.resolve({ token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      request: {
        id: 'bundle-1',
        requester_name: 'Requester Name',
        items: [
          {
            id: 'skill-request-1',
            artifact_type: 'skill',
            display_label: 'TypeScript',
            claim_label: 'This skill was directly observed in this context',
            support_label: 'artifact-backed',
          },
          {
            id: 'exp-request-1',
            artifact_type: 'experience',
            display_label: 'Staff Engineer',
            claim_label: 'I worked here in this role',
            support_label: 'artifact-backed',
          },
        ],
      },
    });
  });

  it('records canonical bundle responses and applies artifact effects without legacy tables', async () => {
    vi.mocked(getCanonicalBundleById).mockResolvedValue(makeCanonicalBundle() as any);

    const admin = {
      from: vi.fn((table: string) => {
        if (table === 'skills') {
          return {
            select: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: '22222222-2222-4222-8222-222222222222',
                    evidence_strength: '0.2',
                  },
                ],
                error: null,
              }),
            })),
            update: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            })),
          };
        }

        if (table === 'experiences') {
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn().mockResolvedValue({ error: null }),
              })),
            })),
          };
        }

        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({ error: null }),
            })),
          })),
        };
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(admin as any);

    const response = await postVerifyCustom(
      new NextRequest('http://localhost/api/verify/custom/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', {
        method: 'POST',
        body: JSON.stringify({
          action: 'accept',
          message: 'Confirmed',
        }),
      }),
      { params: Promise.resolve({ token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }) }
    );

    expect(response.status).toBe(200);
    expect(respondCanonicalBundle).toHaveBeenCalledWith(
      expect.objectContaining({
        bundleId: 'bundle-1',
        action: 'accept',
        responseAuthMethod: 'token',
      })
    );
    expect(admin.from).toHaveBeenCalledWith('skills');
    expect(admin.from).toHaveBeenCalledWith('experiences');
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      status: 'accepted',
    });
  });

  it('serves active email hints without expertise transport imports', async () => {
    const response = await getEmailHint(
      new NextRequest(
        'http://localhost/api/verification/requests/email-hint?email=founder@example.com'
      )
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      kind: 'verifier_email_ready',
    });
  });

  it('logs email hint route failures with structured diagnostics', async () => {
    const authError = new Error('auth unavailable');
    vi.mocked(requireAuth).mockRejectedValueOnce(authError);

    const response = await getEmailHint(
      new NextRequest(
        'http://localhost/api/verification/requests/email-hint?email=founder@example.com'
      )
    );

    expect(response.status).toBe(500);
    expect(log.error).toHaveBeenCalledWith('verification.email_hint.get_failed', {
      error: authError,
    });
    expect(JSON.stringify(vi.mocked(log.error).mock.calls)).not.toContain('founder@example.com');
  });

  it('expires canonical bundles when public links are stale', async () => {
    vi.mocked(getCanonicalBundleById).mockResolvedValue(
      makeCanonicalBundle({
        expires_at: '2000-01-01T00:00:00.000Z',
      }) as any
    );

    await getVerifyCustom(
      new NextRequest('http://localhost/api/verify/custom/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
      { params: Promise.resolve({ token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }) }
    );

    expect(expireCanonicalBundle).toHaveBeenCalledWith('bundle-1');
  });

  it('fails shut when a custom verification token lacks canonical bundle source linkage', async () => {
    vi.mocked(getCanonicalBundleById).mockResolvedValue(null as any);

    const response = await getVerifyCustom(
      new NextRequest('http://localhost/api/verify/custom/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
      { params: Promise.resolve({ token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }) }
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Verification request not found',
    });
  });

  it('uses the same generic response for malformed and unknown custom verification tokens', async () => {
    const malformed = await getVerifyCustom(
      new NextRequest('http://localhost/api/verify/custom/short'),
      { params: Promise.resolve({ token: 'short' }) }
    );

    vi.mocked(getCanonicalBundleById).mockResolvedValue(null as any);
    const unknown = await getVerifyCustom(
      new NextRequest('http://localhost/api/verify/custom/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
      { params: Promise.resolve({ token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }) }
    );

    expect(malformed.status).toBe(404);
    expect(unknown.status).toBe(404);
    await expect(malformed.json()).resolves.toEqual({ error: 'Verification request not found' });
    await expect(unknown.json()).resolves.toEqual({ error: 'Verification request not found' });
  });

  it('rejects malformed custom verification response JSON before token redemption', async () => {
    const response = await postVerifyCustom(
      new NextRequest('http://localhost/api/verify/custom/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', {
        method: 'POST',
        body: '{"action":',
        headers: { 'content-type': 'application/json' },
      }),
      { params: Promise.resolve({ token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(respondCanonicalBundle).not.toHaveBeenCalled();
    expect(getCanonicalBundleById).not.toHaveBeenCalled();
  });

  it('records partial custom attestation responses and queues them for manual review', async () => {
    vi.mocked(getCanonicalBundleById).mockResolvedValue(
      makeCanonicalBundle({
        request_kind: 'human_observed_attestation',
        attestation_request: {
          requestKind: 'human_observed_attestation',
          skillIds: ['22222222-2222-4222-8222-222222222222'],
          skillLabels: ['TypeScript'],
          skillFamilies: ['communication'],
        },
        items: [
          {
            id: 'skill-request-1',
            artifact_type: 'skill',
            artifact_id: '22222222-2222-4222-8222-222222222222',
            display_label: 'TypeScript',
            claim_template: 'skill_observed_in_context',
            claim_label: 'Observed in context',
            support_label: 'artifact-backed',
            status: 'pending',
            created_at: '2026-03-15T10:00:00.000Z',
            updated_at: '2026-03-15T10:00:00.000Z',
          },
        ],
      }) as any
    );
    vi.mocked(respondCanonicalBundle).mockResolvedValue(
      makeCanonicalBundle({
        status: 'accepted',
        request_kind: 'human_observed_attestation',
        attestation_response: {
          verdict: 'partly',
        },
      }) as any
    );

    const admin = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { evidence_strength: '0.3' },
              error: null,
            }),
          }),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn().mockResolvedValue({ error: null }),
          })),
        })),
      })),
    };
    vi.mocked(createAdminClient).mockReturnValue(admin as any);

    const response = await postVerifyCustom(
      new NextRequest('http://localhost/api/verify/custom/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', {
        method: 'POST',
        body: JSON.stringify({
          action: 'accept',
          message: 'Partly confirmed',
          attestation: {
            verdict: 'partly',
            relationshipToSubject: 'Peer',
            workedTogetherWhere: 'We worked together on a client migration project.',
            observationDuration: '4 months',
            observationRecency: 'Most recently observed in January 2026',
            skillIds: ['22222222-2222-4222-8222-222222222222'],
            observedBehaviorNote:
              'I observed solid communication during design reviews, but I did not directly observe the entire requested scope.',
            confidenceLevel: 'medium',
            conflictBiasDisclosure: '',
          },
        }),
      }),
      { params: Promise.resolve({ token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }) }
    );

    expect(response.status).toBe(200);
    expect(respondCanonicalBundle).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'accept',
        attestationResponse: expect.objectContaining({
          verdict: 'partly',
        }),
      })
    );
    expect(ensureInternalOpsQueueItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queueType: 'verification',
        linkedEntityType: 'verification_bundle',
        linkedEntityId: 'bundle-1',
        metadata: expect.not.objectContaining({
          verifierEmail: expect.anything(),
        }),
      })
    );
    expect(JSON.stringify(ensureInternalOpsQueueItemMock.mock.calls)).not.toContain(
      'verifier@example.com'
    );
  });
});
