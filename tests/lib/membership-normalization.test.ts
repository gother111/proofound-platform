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

  it('maps legacy roles and states to canonical values', () => {
    expect(normalizeAuthorizedOrgRole('owner')).toBe('org_owner');
    expect(normalizeAuthorizedOrgRole('admin')).toBe('org_manager');
    expect(normalizeAuthorizedOrgRole('member')).toBe('org_reviewer');
    expect(normalizeMembershipState('invited')).toBe('invited_pending');
  });
});
