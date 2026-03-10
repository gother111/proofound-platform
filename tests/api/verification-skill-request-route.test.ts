/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendSkillVerificationRequest: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  notifyVerificationRequested: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkVerificationRateLimit: vi.fn(),
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  CAPABILITY_BINDINGS: {
    EMAIL_HASH: 'email_hash',
  },
  CAPABILITY_TOKEN_CLASSES: {
    SKILL_VERIFICATION_RESPONSE: 'skill_verification_response',
  },
  issueCapabilityToken: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/launch/trace', () => ({
  startLaunchTrace: vi.fn(() => ({
    objectRefs: {},
    startedAtMs: 0,
  })),
  emitLaunchTrace: vi.fn(),
}));

import { POST } from '@/app/api/verification/skill/request/route';
import { createClient } from '@/lib/supabase/server';
import { sendSkillVerificationRequest } from '@/lib/email';
import { checkVerificationRateLimit } from '@/lib/rate-limit';
import { issueCapabilityToken } from '@/lib/security/capability-tokens';
import { emitLaunchTrace } from '@/lib/launch/trace';

function createSupabaseMock() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            email: 'owner@example.com',
          },
        },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { display_name: 'Owner', handle: 'owner' },
                error: null,
              }),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
        };
      }

      if (table === 'skills') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    skill_id: 'skill-1',
                    custom_skill_name: 'Systems Design',
                  },
                  error: null,
                }),
              })),
            })),
          })),
        };
      }

      if (table === 'skill_verification_requests') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  })),
                })),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: 'request-1' },
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === 'skills_taxonomy') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: { name: 'Systems Design' } }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  };
}

describe('/api/verification/skill/request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockResolvedValue(createSupabaseMock());
    (checkVerificationRateLimit as any).mockResolvedValue({
      allowed: true,
      hourlyRemaining: 4,
      dailyRemaining: 19,
    });
    (issueCapabilityToken as any).mockResolvedValue({
      rawToken: 'token-raw',
      token: {
        id: 'token-1',
      },
    });
    (sendSkillVerificationRequest as any).mockResolvedValue(undefined);
  });

  it('creates a verification request and emits a launch trace', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/verification/skill/request', {
        method: 'POST',
        body: JSON.stringify({
          skillId: '11111111-1111-1111-1111-111111111111',
          verifierEmail: 'verifier@example.com',
          message: 'Please verify this skill.',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.requestId).toBe('request-1');
    expect(emitLaunchTrace).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        outcome: 'success',
        state: 'verification_request_created',
      })
    );
  });
});
