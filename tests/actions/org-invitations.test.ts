import { beforeEach, describe, expect, it, vi } from 'vitest';

import { acceptInvitation, inviteMember } from '@/actions/org';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrgInviteEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';
import { issueCapabilityToken, redeemCapabilityToken } from '@/lib/security/capability-tokens';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendOrgInviteEmail: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  CAPABILITY_BINDINGS: {
    EMAIL_HASH: 'email_hash',
  },
  CAPABILITY_TOKEN_CLASSES: {
    ORG_MEMBER_INVITE: 'org_member_invite',
  },
  issueCapabilityToken: vi.fn(),
  redeemCapabilityToken: vi.fn(),
}));

function createMembershipLookup(role: string, state = 'active') {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'membership-1',
              role,
              state,
            },
            error: null,
          }),
        }),
      }),
    }),
  };
}

describe('organization invitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks reviewers from creating collaborator invites', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: 'reviewer-user' } as any);
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(),
    } as any);
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'organization_members') {
          return createMembershipLookup('org_reviewer');
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const formData = new FormData();
    formData.set('email', 'reviewer@proofound.test');
    formData.set('role', 'org_manager');

    const result = await inviteMember('org-1', formData);

    expect(result).toEqual({ error: 'Insufficient permissions' });
    expect(issueCapabilityToken).not.toHaveBeenCalled();
  });

  it('creates a pending collaborator invite for canonical launch roles only', async () => {
    const invitationInsert = vi.fn().mockResolvedValue({ error: null });
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(requireAuth).mockResolvedValue({ id: 'owner-user' } as any);
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'org_invitations') {
          return {
            insert: invitationInsert,
          };
        }

        throw new Error(`Unexpected admin table ${table}`);
      }),
    } as any);
    vi.mocked(issueCapabilityToken).mockResolvedValue({
      rawToken: 'invite-token',
      tokenHash: 'hashed-token',
      token: { id: 'capability-1', source_id: 'invite-1' },
    } as any);
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'organization_members') {
          return createMembershipLookup('org_owner');
        }

        if (table === 'org_invitations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                ilike: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    gt: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                          data: null,
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
            insert: invitationInsert,
          };
        }

        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    display_name: 'Proofound Org',
                    slug: 'proofound',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'audit_logs') {
          return {
            insert: auditInsert,
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const formData = new FormData();
    formData.set('email', 'manager@proofound.test');
    formData.set('role', 'org_manager');

    const result = await inviteMember('org-1', formData);

    expect(result).toEqual({ success: true });
    expect(issueCapabilityToken).toHaveBeenCalledWith(
      expect.objectContaining({
        subjectId: 'org-1',
        actorEmail: 'manager@proofound.test',
        metadata: { role: 'org_manager' },
      })
    );
    expect(invitationInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        email: 'manager@proofound.test',
        role: 'org_manager',
        status: 'pending',
      })
    );
    expect(sendOrgInviteEmail).toHaveBeenCalledWith(
      'manager@proofound.test',
      'Proofound Org',
      'org_manager',
      'invite-token',
      'proofound'
    );
    expect(revalidatePath).toHaveBeenCalledWith('/app/o/proofound/members');
  });

  it('keeps the invite live when email delivery cannot be confirmed', async () => {
    const invitationInsert = vi.fn().mockResolvedValue({ error: null });
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(requireAuth).mockResolvedValue({ id: 'owner-user' } as any);
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'org_invitations') {
          return {
            insert: invitationInsert,
          };
        }

        throw new Error(`Unexpected admin table ${table}`);
      }),
    } as any);
    vi.mocked(issueCapabilityToken).mockResolvedValue({
      rawToken: 'invite-token',
      tokenHash: 'hashed-token',
      token: { id: 'capability-1', source_id: 'invite-1' },
    } as any);
    vi.mocked(sendOrgInviteEmail).mockRejectedValue(new Error('provider timeout'));
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'organization_members') {
          return createMembershipLookup('org_owner');
        }

        if (table === 'org_invitations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                ilike: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    gt: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                          data: null,
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
            insert: invitationInsert,
          };
        }

        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    display_name: 'Proofound Org',
                    slug: 'proofound',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'audit_logs') {
          return {
            insert: auditInsert,
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const formData = new FormData();
    formData.set('email', 'reviewer@proofound.test');
    formData.set('role', 'org_reviewer');

    const result = await inviteMember('org-1', formData);

    expect(result).toEqual({
      success: true,
      warning:
        'Invitation saved, but email delivery could not be confirmed. Ask the collaborator to use the latest invite link before expecting access.',
    });
    expect(invitationInsert).toHaveBeenCalled();
    expect(auditInsert).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/app/o/proofound/members');
  });

  it('rejects org_owner invites so launch roles stay canonical', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: 'owner-user' } as any);
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(),
    } as any);
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'organization_members') {
          return createMembershipLookup('org_owner');
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const formData = new FormData();
    formData.set('email', 'owner@proofound.test');
    formData.set('role', 'org_owner');

    const result = await inviteMember('org-1', formData);

    expect(result).toEqual({ error: 'Invalid invitation data' });
    expect(issueCapabilityToken).not.toHaveBeenCalled();
  });

  it('accepts a tokenized invitation and canonicalizes a persisted legacy invite role', async () => {
    const invitationUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const memberInsertSingle = vi.fn().mockResolvedValue({
      data: { id: 'membership-2' },
      error: null,
    });
    const memberInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: memberInsertSingle,
      }),
    });
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(requireAuth).mockResolvedValue({ id: 'candidate-user' } as any);
    vi.mocked(redeemCapabilityToken).mockResolvedValue({
      ok: true,
      token: { source_id: 'invite-1' },
    } as any);
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: 'candidate@proofound.test',
            },
          },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: 'org-1',
                    slug: 'proofound',
                    display_name: 'Proofound Org',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'audit_logs') {
          return {
            insert: auditInsert,
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'org_invitations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: 'invite-1',
                    org_id: 'org-1',
                    membership_id: null,
                    email: 'candidate@proofound.test',
                    role: 'org_manager',
                    status: 'pending',
                    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                    accepted_at: null,
                    revoked_at: null,
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: invitationUpdateEq,
            }),
          };
        }

        if (table === 'organization_members') {
          return {
            insert: memberInsert,
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const result = await acceptInvitation('raw-token');

    expect(result).toEqual({ success: true, orgSlug: 'proofound' });
    expect(redeemCapabilityToken).toHaveBeenCalledWith(
      'raw-token',
      expect.objectContaining({
        actor: expect.objectContaining({
          email: 'candidate@proofound.test',
          profileId: 'candidate-user',
        }),
      })
    );
    expect(memberInsertSingle).toHaveBeenCalled();
    expect(memberInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        role: 'org_manager',
      })
    );
    expect(invitationUpdateEq).toHaveBeenCalledWith('id', 'invite-1');
    expect(revalidatePath).toHaveBeenCalledWith('/app/o/proofound');
  });
});
