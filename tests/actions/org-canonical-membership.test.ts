import { beforeEach, describe, expect, it, vi } from 'vitest';

import { acceptOwnershipTransfer, initiateOwnershipTransfer } from '@/actions/org';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';
import { createClient } from '@/lib/supabase/server';

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

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  CAPABILITY_BINDINGS: {},
  CAPABILITY_TOKEN_CLASSES: {},
  issueCapabilityToken: vi.fn(),
  redeemCapabilityToken: vi.fn(),
}));

function buildSupabaseMock(config: {
  membershipLookups?: Array<any>;
  membershipLists?: Array<any>;
  membershipListErrors?: Array<any>;
  updates?: Array<{ error: any }>;
}) {
  let membershipLookupIndex = 0;
  let membershipListIndex = 0;
  let updateIndex = 0;

  return {
    from(table: string) {
      if (table === 'organization_members') {
        return {
          select() {
            return {
              eq(_column: string, _value: unknown) {
                return {
                  eq(_column2: string, _value2: unknown) {
                    return {
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: config.membershipLookups?.[membershipLookupIndex++] ?? null,
                        error: null,
                      }),
                    };
                  },
                  in: vi.fn().mockImplementation(() => {
                    const index = membershipListIndex++;
                    return Promise.resolve({
                      data: config.membershipLists?.[index] ?? [],
                      error: config.membershipListErrors?.[index] ?? null,
                    });
                  }),
                };
              },
            };
          },
          update() {
            return {
              eq() {
                return {
                  eq: vi.fn().mockResolvedValue(config.updates?.[updateIndex++] ?? { error: null }),
                };
              },
            };
          },
        };
      }

      if (table === 'audit_logs') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };
}

describe('canonical organization membership actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects ownership transfer when the actor is not the org owner', async () => {
    (requireAuth as any).mockResolvedValue({ id: 'reviewer-user' });
    vi.mocked(createClient).mockResolvedValue(
      buildSupabaseMock({
        membershipLookups: [{ id: 'reviewer-membership', role: 'org_reviewer', state: 'active' }],
      }) as any
    );

    const result = await initiateOwnershipTransfer('org-1', 'target-user');

    expect(result).toEqual({ error: 'Only organization owners can transfer ownership' });
  });

  it('logs ownership transfer membership load failures structurally', async () => {
    (requireAuth as any).mockResolvedValue({ id: 'owner-user' });
    vi.mocked(createClient).mockResolvedValue(
      buildSupabaseMock({
        membershipLookups: [{ id: 'owner-membership', role: 'org_owner', state: 'active' }],
        membershipListErrors: [{ message: 'membership query failed' }],
      }) as any
    );

    const result = await initiateOwnershipTransfer('org-1', 'target-user');

    expect(result).toEqual({ error: 'Failed to initiate ownership transfer' });
    expect(log.error).toHaveBeenCalledWith(
      'organization.ownership_transfer.memberships_load_failed',
      {
        orgId: 'org-1',
        targetUserId: 'target-user',
        error: { message: 'membership query failed' },
      }
    );
  });

  it('accepts ownership transfer and activates the pending owner', async () => {
    (requireAuth as any).mockResolvedValue({ id: 'target-user' });
    vi.mocked(createClient).mockResolvedValue(
      buildSupabaseMock({
        membershipLookups: [
          {
            id: 'target-membership',
            user_id: 'target-user',
            role: 'org_owner',
            state: 'ownership_transfer_pending',
            ownership_transfer_from_membership_id: 'owner-membership',
            ownership_transfer_target_user_id: 'target-user',
          },
        ],
        updates: [{ error: null }, { error: null }],
      }) as any
    );

    const result = await acceptOwnershipTransfer('org-1');

    expect(result).toEqual({ success: true });
  });
});
