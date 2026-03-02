import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email/sender';
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
    vi.mocked(sendEmail).mockResolvedValue({ success: true });
  });

  it('returns partial artifacts with 200 when one source fails', async () => {
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

        if (table === 'experiences') {
          return {
            select: vi.fn(() =>
              thenableResult({
                data: [{ id: 'exp-1', title: 'Experience One', org_description: 'Org' }],
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
        skill: [],
        experience: [{ id: 'exp-1', type: 'experience', label: 'Experience One' }],
      },
    });
  });

  it('returns 500 when all artifact sources fail', async () => {
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() =>
          thenableResult({
            data: null,
            error: { message: 'all failed' },
          })
        ),
      })),
    } as any);

    const response = await getArtifacts();
    expect(response.status).toBe(500);
  });

  it('returns skills when accepted-skill lookup fails', async () => {
    const skillId = '22222222-2222-4222-8222-222222222222';

    vi.mocked(createClient).mockResolvedValue({
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

        if (table === 'skill_verification_requests') {
          return {
            select: vi.fn(() =>
              thenableResult({
                data: null,
                error: { message: 'accepted query failed' },
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
        skill: [
          {
            id: skillId,
            type: 'skill',
            label: 'TypeScript',
            subtitle: 'Level C3',
          },
        ],
      },
    });
  });

  it('returns skill artifacts when accepted requests are integrity flagged', async () => {
    const skillId = '5d3cae7c-0734-4268-8bfd-072f5649efed';

    vi.mocked(createClient).mockResolvedValue({
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

        if (table === 'skill_verification_requests') {
          return {
            select: vi.fn(() =>
              thenableResult({
                data: [{ skill_id: skillId, integrity_status: 'flagged' }],
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
        skill: [
          {
            id: skillId,
            type: 'skill',
            label: 'TypeScript',
            subtitle: 'Level C3',
          },
        ],
      },
    });
  });

  it.each([null, 'unknown'])(
    'returns skill artifacts when accepted requests have non-clear integrity (%s)',
    async (integrityStatus) => {
      const skillId = '93ce44db-8459-4cfe-a9af-27daf1f49ca0';

      vi.mocked(createClient).mockResolvedValue({
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

          if (table === 'skill_verification_requests') {
            return {
              select: vi.fn(() =>
                thenableResult({
                  data: [{ skill_id: skillId, integrity_status: integrityStatus }],
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
          skill: [
            {
              id: skillId,
              type: 'skill',
              label: 'TypeScript',
              subtitle: 'Level C3',
            },
          ],
        },
      });
    }
  );

  it('excludes skill artifacts when accepted requests are integrity clear', async () => {
    const skillId = 'f6fcbf09-5ca0-42e7-89b4-bb2c2f1d1af1';

    vi.mocked(createClient).mockResolvedValue({
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

        if (table === 'skill_verification_requests') {
          return {
            select: vi.fn(() =>
              thenableResult({
                data: [{ skill_id: skillId, integrity_status: 'clear' }],
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
      total: 0,
      artifacts: {
        skill: [],
      },
    });
  });

  it('returns skills when skill relation join fails but taxonomy fallback succeeds', async () => {
    const skillId = '33333333-3333-4333-8333-333333333333';
    const skillCode = '01.02.03.004';

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'skills') {
          return {
            select: vi.fn((columns?: string) => {
              if (String(columns).includes('skills_taxonomy!skills_skill_code_fkey')) {
                return thenableResult({
                  data: null,
                  error: { message: 'Could not find relation skills_skill_code_fkey' },
                });
              }

              return thenableResult({
                data: [
                  {
                    id: skillId,
                    skill_id: 'custom-1-2-3-typescript',
                    skill_code: skillCode,
                    competency_label: 'C4',
                    name_i18n: null,
                  },
                ],
                error: null,
              });
            }),
          };
        }

        if (table === 'skills_taxonomy') {
          return {
            select: vi.fn(() =>
              thenableResult({
                data: [{ code: skillCode, name_i18n: { en: 'Taxonomy TypeScript' } }],
                error: null,
              })
            ),
          };
        }

        if (table === 'skill_verification_requests') {
          return {
            select: vi.fn(() => thenableResult({ data: [], error: null })),
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
        skill: [
          {
            id: skillId,
            type: 'skill',
            label: 'Taxonomy TypeScript',
            subtitle: 'Level C4',
          },
        ],
      },
    });
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

  it('accepts expanded relationship options and maps client relationship to external skill source', async () => {
    const skillId = '99999999-1111-4111-8111-111111111111';
    const skillInsertSpy = vi.fn().mockResolvedValue({ error: null });

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
            insert: skillInsertSpy,
          };
        }

        if (table === 'custom_verification_requests') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'custom-request-2',
                    status: 'pending',
                    verifier_email: 'client@example.com',
                    verifier_relationship: 'client',
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
          verifierEmail: 'client@example.com',
          relationship: 'client',
          artifacts: [{ type: 'skill', id: skillId }],
        }),
      })
    );

    expect(response.status).toBe(201);
    expect(skillInsertSpy).toHaveBeenCalledTimes(1);
    expect(skillInsertSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          skill_id: skillId,
          verifier_source: 'external',
        }),
      ])
    );
  });

  it('creates custom request when selected-skill relation join fails but fallback succeeds', async () => {
    const skillId = '44444444-4444-4444-8444-444444444444';
    const skillCode = '02.03.04.005';
    const linkedSkillInsertSpy = vi.fn().mockResolvedValue({ error: null });

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
            select: vi.fn((columns?: string) => {
              if (String(columns).includes('skills_taxonomy!skills_skill_code_fkey')) {
                return thenableResult({
                  data: null,
                  error: { message: 'relation skills_skill_code_fkey not found' },
                });
              }

              return thenableResult({
                data: [
                  {
                    id: skillId,
                    skill_id: 'custom-1-2-3-typescript',
                    skill_code: skillCode,
                    name_i18n: null,
                  },
                ],
                error: null,
              });
            }),
          };
        }

        if (table === 'skills_taxonomy') {
          return {
            select: vi.fn(() =>
              thenableResult({
                data: [{ code: skillCode, name_i18n: { en: 'Taxonomy Skill' } }],
                error: null,
              })
            ),
          };
        }

        if (table === 'skill_verification_requests') {
          return {
            select: vi.fn(() => thenableResult({ data: [], error: null })),
            insert: linkedSkillInsertSpy,
          };
        }

        if (table === 'custom_verification_requests') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'custom-request-fallback',
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

    expect(response.status).toBe(201);
    expect(linkedSkillInsertSpy).toHaveBeenCalledTimes(1);
    expect(linkedSkillInsertSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          skill_id: skillId,
        }),
      ])
    );
  });

  it('creates custom request when accepted selected-skill requests are integrity flagged', async () => {
    const skillId = 'c376e312-9a4b-4f14-ac8a-981dcb7288e3';
    const linkedSkillInsertSpy = vi.fn().mockResolvedValue({ error: null });

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
            select: vi.fn(() =>
              thenableResult({
                data: [{ skill_id: skillId, integrity_status: 'flagged' }],
                error: null,
              })
            ),
            insert: linkedSkillInsertSpy,
          };
        }

        if (table === 'custom_verification_requests') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'custom-request-flagged',
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

    expect(response.status).toBe(201);
    expect(linkedSkillInsertSpy).toHaveBeenCalledTimes(1);
    expect(linkedSkillInsertSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          skill_id: skillId,
        }),
      ])
    );
  });

  it.each([null, 'unknown'])(
    'creates custom request when accepted selected-skill requests have non-clear integrity (%s)',
    async (integrityStatus) => {
      const skillId = '65442b53-5e8d-4028-b39c-d5abf6f16453';
      const linkedSkillInsertSpy = vi.fn().mockResolvedValue({ error: null });

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
              select: vi.fn(() =>
                thenableResult({
                  data: [{ skill_id: skillId, integrity_status: integrityStatus }],
                  error: null,
                })
              ),
              insert: linkedSkillInsertSpy,
            };
          }

          if (table === 'custom_verification_requests') {
            return {
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'custom-request-non-clear',
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

      expect(response.status).toBe(201);
      expect(linkedSkillInsertSpy).toHaveBeenCalledTimes(1);
      expect(linkedSkillInsertSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            skill_id: skillId,
          }),
        ])
      );
    }
  );

  it('blocks custom request when accepted selected-skill requests are integrity clear', async () => {
    const skillId = '8f40c827-d042-4e96-b0be-b79497af7692';

    const customRequestInsertSpy = vi.fn();
    const linkedSkillInsertSpy = vi.fn();

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
            select: vi.fn(() =>
              thenableResult({
                data: [{ skill_id: skillId, integrity_status: 'clear' }],
                error: null,
              })
            ),
            insert: linkedSkillInsertSpy,
          };
        }

        if (table === 'custom_verification_requests') {
          return {
            insert: customRequestInsertSpy,
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

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Some selected skills are already verified',
    });
    expect(customRequestInsertSpy).not.toHaveBeenCalled();
    expect(linkedSkillInsertSpy).not.toHaveBeenCalled();
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
