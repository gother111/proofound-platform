import { describe, expect, it } from 'vitest';

import {
  isActiveMembershipState,
  normalizeAuthorizedOrgRole,
  normalizeMembershipState,
} from '@/lib/authz';

describe('membership normalization', () => {
  it('treats only active memberships as granting org access', () => {
    expect(isActiveMembershipState('active')).toBe(true);
    expect(isActiveMembershipState('inactive')).toBe(false);
    expect(isActiveMembershipState('suspended')).toBe(false);
    expect(isActiveMembershipState('removed')).toBe(false);
  });

  it('accepts only canonical roles while still normalizing legacy states', () => {
    expect(normalizeAuthorizedOrgRole('org_owner')).toBe('org_owner');
    expect(normalizeAuthorizedOrgRole('org_manager')).toBe('org_manager');
    expect(normalizeAuthorizedOrgRole('org_reviewer')).toBe('org_reviewer');
    expect(normalizeAuthorizedOrgRole('owner')).toBeNull();
    expect(normalizeAuthorizedOrgRole('admin')).toBeNull();
    expect(normalizeAuthorizedOrgRole('member')).toBeNull();
    expect(normalizeAuthorizedOrgRole('viewer')).toBeNull();
    expect(normalizeMembershipState('invited')).toBe('invited_pending');
    expect(normalizeAuthorizedOrgRole('trust_admin')).toBeNull();
    expect(normalizeAuthorizedOrgRole('individual')).toBeNull();
    expect(normalizeAuthorizedOrgRole('mystery_role')).toBeNull();
  });
});
