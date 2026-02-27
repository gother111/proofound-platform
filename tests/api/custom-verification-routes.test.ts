import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { GET as getArtifacts } from '@/app/api/expertise/verifications/custom/artifacts/route';
import { POST as postCustomRequest } from '@/app/api/expertise/verifications/custom/request/route';
import { GET as getEmailHint } from '@/app/api/expertise/verifications/email-hint/route';
import {
  GET as getVerifyCustom,
  POST as postVerifyCustom,
} from '@/app/api/verify/custom/[token]/route';

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

describe('custom verification API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-1' } as any);
  });

  it('returns 500 when artifact loading fails', async () => {
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'skills') {
          return {
            select: vi.fn(() =>
              thenableResult({
                data: null,
                error: { message: 'boom' },
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
    expect(response.status).toBe(500);
  });

  it('returns 400 for invalid custom request payload', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any);

    const response = await postCustomRequest(
      new NextRequest('http://localhost/api/expertise/verifications/custom/request', {
        method: 'POST',
        body: JSON.stringify({
          verifierEmail: 'not-an-email',
          relationship: 'peer',
          artifacts: [],
        }),
      })
    );

    expect(response.status).toBe(400);
  });

  it('returns 409 when linked skill verification rows hit active duplicate constraint', async () => {
    const skillId = '11111111-1111-4111-8111-111111111111';

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
                    id: skillId,
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

        if (table === 'skill_verification_requests') {
          return {
            select: vi.fn(() => thenableResult({ data: [], error: null })),
            insert: vi.fn().mockResolvedValue({
              error: {
                code: '23505',
                message:
                  'duplicate key value violates unique constraint "idx_skill_verification_active_unique_verifier"',
              },
            }),
          };
        }

        if (table === 'custom_verification_requests') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'custom-request-1',
                    status: 'pending',
                    verifier_email: 'mentor@example.com',
                    verifier_relationship: 'peer',
                    created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 86400000).toISOString(),
                  },
                  error: null,
                }),
              })),
            })),
          };
        }

        if (table === 'custom_verification_request_items') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
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

        throw new Error(`Unexpected table: ${table}`);
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

    const response = await postCustomRequest(
      new NextRequest('http://localhost/api/expertise/verifications/custom/request', {
        method: 'POST',
        body: JSON.stringify({
          verifierEmail: 'mentor@example.com',
          relationship: 'peer',
          artifacts: [{ type: 'skill', id: skillId }],
        }),
      })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'DUPLICATE_VERIFICATION_REQUEST',
    });
  });

  it('returns proofound user email hint when account exists', async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'profile-1' }, error: null }),
          })),
        })),
      })),
    } as any);

    const response = await getEmailHint(
      new NextRequest(
        'http://localhost/api/expertise/verifications/email-hint?email=founder@example.com'
      )
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ kind: 'proofound_user' });
  });

  it('returns 400 for invalid custom verify token on GET', async () => {
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn() } as any);

    const response = await getVerifyCustom(
      new NextRequest('http://localhost/api/verify/custom/abc'),
      {
        params: Promise.resolve({ token: 'short' }),
      }
    );

    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid custom verify token on POST', async () => {
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn() } as any);

    const response = await postVerifyCustom(
      new NextRequest('http://localhost/api/verify/custom/abc', {
        method: 'POST',
        body: JSON.stringify({ action: 'accept' }),
      }),
      {
        params: Promise.resolve({ token: 'short' }),
      }
    );

    expect(response.status).toBe(400);
  });
});
