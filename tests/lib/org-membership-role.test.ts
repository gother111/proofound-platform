import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      organizationMembers: {
        findFirst: mocks.findFirst,
      },
    },
  },
}));

import { getOrgMembershipRole } from '@/lib/matching/review-contract';

describe('organization review membership role resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(['org_owner', 'org_manager', 'org_reviewer'] as const)(
    'returns canonical role %s only when state is explicitly active',
    async (role) => {
      mocks.findFirst.mockResolvedValue({ role, state: 'active' });

      await expect(getOrgMembershipRole('user-1', 'org-1')).resolves.toBe(role);
    }
  );

  it.each([
    { role: 'org_owner', state: null },
    { role: 'org_owner', state: undefined },
    { role: 'org_owner', state: 'inactive' },
    { role: 'org_owner', state: 'suspended' },
    { role: 'org_owner', state: 'unknown_state' },
    { role: 'owner', state: 'active' },
  ])('returns null for non-active or malformed membership %#', async (membership) => {
    mocks.findFirst.mockResolvedValue(membership);

    await expect(getOrgMembershipRole('user-1', 'org-1')).resolves.toBeNull();
  });
});
