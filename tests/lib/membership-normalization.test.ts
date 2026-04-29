import { describe, expect, it } from 'vitest';

import {
  isActiveMembershipState,
  normalizeAuthorizedOrgRole,
  normalizeMembershipState,
} from '@/lib/authz';

describe('membership normalization', () => {
  it('normalizes every canonical membership state without granting ambiguous access', () => {
    const expected = {
      invited_pending: false,
      active: true,
      inactive: false,
      ownership_transfer_pending: false,
      suspended: false,
      removed: false,
      declined: false,
      expired: false,
      revoked: false,
    } as const;

    for (const [state, active] of Object.entries(expected)) {
      expect(normalizeMembershipState(state)).toBe(state);
      expect(isActiveMembershipState(state)).toBe(active);
    }
  });

  it('treats only active memberships as granting org access', () => {
    expect(isActiveMembershipState('active')).toBe(true);
    expect(isActiveMembershipState('inactive')).toBe(false);
    expect(isActiveMembershipState('suspended')).toBe(false);
    expect(isActiveMembershipState('removed')).toBe(false);
  });

  it('fails closed for missing, empty, unknown, and malformed membership states', () => {
    expect(normalizeMembershipState(null)).toBe('inactive');
    expect(normalizeMembershipState(undefined)).toBe('inactive');
    expect(normalizeMembershipState('')).toBe('inactive');
    expect(normalizeMembershipState('unknown_state')).toBe('inactive');
    expect(normalizeMembershipState(' active ')).toBe('inactive');
    expect(normalizeMembershipState({ state: 'active' })).toBe('inactive');
    expect(isActiveMembershipState(null)).toBe(false);
    expect(isActiveMembershipState(undefined)).toBe(false);
    expect(isActiveMembershipState('unknown_state')).toBe(false);
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
