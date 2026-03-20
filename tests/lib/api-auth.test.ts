import { describe, expect, it, vi } from 'vitest';

import { getCanonicalActiveOrgMembership, isActiveOrgMember } from '@/lib/api/auth';

function createSupabaseMembershipStub(result: {
  data: { role: string; state?: string | null; status?: string | null } | null;
  error: unknown;
}) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eqUser = vi.fn().mockReturnValue({ maybeSingle });
  const eqOrg = vi.fn().mockReturnValue({ eq: eqUser });
  const select = vi.fn().mockReturnValue({ eq: eqOrg });

  return {
    from: vi.fn().mockReturnValue({ select }),
  } as any;
}

describe('api auth org membership boundary', () => {
  it('accepts canonical persisted org roles at the API boundary', async () => {
    await expect(
      getCanonicalActiveOrgMembership(
        createSupabaseMembershipStub({
          data: { role: 'org_owner', state: 'active' },
          error: null,
        }),
        'user-1',
        'org-1'
      )
    ).resolves.toEqual({
      role: 'org_owner',
      state: 'active',
      status: null,
    });

    await expect(
      getCanonicalActiveOrgMembership(
        createSupabaseMembershipStub({
          data: { role: 'org_manager', status: 'active' },
          error: null,
        }),
        'user-1',
        'org-1'
      )
    ).resolves.toEqual({
      role: 'org_manager',
      state: 'active',
      status: 'active',
    });

    await expect(
      getCanonicalActiveOrgMembership(
        createSupabaseMembershipStub({
          data: { role: 'org_reviewer', state: 'active' },
          error: null,
        }),
        'user-1',
        'org-1'
      )
    ).resolves.toEqual({
      role: 'org_reviewer',
      state: 'active',
      status: null,
    });
  });

  it('rejects inactive, legacy, or unknown memberships at the API boundary', async () => {
    await expect(
      getCanonicalActiveOrgMembership(
        createSupabaseMembershipStub({
          data: { role: 'org_owner', state: 'inactive' },
          error: null,
        }),
        'user-1',
        'org-1'
      )
    ).resolves.toBeNull();

    await expect(
      getCanonicalActiveOrgMembership(
        createSupabaseMembershipStub({
          data: { role: 'owner', state: 'active' },
          error: null,
        }),
        'user-1',
        'org-1'
      )
    ).resolves.toBeNull();

    await expect(
      isActiveOrgMember(
        createSupabaseMembershipStub({
          data: { role: 'mystery_role', state: 'active' },
          error: null,
        }),
        'user-1',
        'org-1'
      )
    ).resolves.toBe(false);
  });
});
