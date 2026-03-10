import { describe, expect, it } from 'vitest';

import {
  AUTHZ_MATRIX,
  AUTHZ_RESOURCE_VALUES,
  assertExplicitPrincipalContext,
  authorize,
  getAuditMetadataVisibility,
  getEffectiveReviewRevealScope,
  getEffectiveShortlistRevealScope,
  getVerificationSummaryVisibility,
} from '@/lib/authz';

describe('canonical authz policy', () => {
  it('defines explicit actions for every protected resource family', () => {
    for (const resource of AUTHZ_RESOURCE_VALUES) {
      expect(Object.keys(AUTHZ_MATRIX[resource]).length).toBeGreaterThan(0);
    }
  });

  it('keeps the matrix shape stable for regression coverage', () => {
    const summary = Object.fromEntries(
      AUTHZ_RESOURCE_VALUES.map((resource) => [
        resource,
        Object.keys(AUTHZ_MATRIX[resource]).sort(),
      ])
    );

    expect(summary).toMatchInlineSnapshot(`
      {
        "admin_audit_logs": [
          "export",
          "read",
        ],
        "assignments": [
          "archive",
          "create",
          "export",
          "read",
          "update",
        ],
        "candidate_full_review": [
          "read",
          "update",
        ],
        "candidate_shortlist_cards": [
          "read",
        ],
        "exports": [
          "export",
          "export_sensitive",
        ],
        "interviews": [
          "read",
          "schedule",
          "update",
        ],
        "intros_decisions_feedback": [
          "create",
          "decide",
          "read",
        ],
        "org_audit_logs": [
          "break_glass",
          "export",
          "read",
        ],
        "org_profile": [
          "read",
          "update",
          "update_governance",
        ],
        "org_trust_fields": [
          "read_detailed",
          "read_redacted",
          "update",
        ],
        "reveal_actions": [
          "break_glass",
          "reveal",
        ],
        "settings_privacy_defaults": [
          "read",
          "update",
        ],
        "team_invites_memberships": [
          "invite",
          "manage",
          "read",
        ],
        "verification_summaries": [
          "read_detailed",
          "read_redacted",
        ],
      }
    `);
  });

  it('keeps reviewer access narrow and non-exporting', () => {
    expect(
      authorize({
        resource: 'candidate_shortlist_cards',
        action: 'read',
        orgRole: 'org_reviewer',
      }).allowed
    ).toBe(true);
    expect(
      authorize({
        resource: 'candidate_full_review',
        action: 'read',
        orgRole: 'org_reviewer',
      }).allowed
    ).toBe(true);
    expect(
      authorize({
        resource: 'exports',
        action: 'export',
        orgRole: 'org_reviewer',
      }).allowed
    ).toBe(false);
    expect(getEffectiveShortlistRevealScope('org_reviewer', 'full_identity')).toBe(
      'shortlist_identity'
    );
    expect(getVerificationSummaryVisibility('org_reviewer')).toBe('redacted');
    expect(getAuditMetadataVisibility('org_reviewer')).toBe('none');
  });

  it('keeps manager access operational but not ownership privileged', () => {
    expect(
      authorize({
        resource: 'candidate_full_review',
        action: 'update',
        orgRole: 'org_manager',
      }).allowed
    ).toBe(true);
    expect(
      authorize({
        resource: 'team_invites_memberships',
        action: 'invite',
        orgRole: 'org_manager',
      }).allowed
    ).toBe(true);
    expect(
      authorize({
        resource: 'org_audit_logs',
        action: 'read',
        orgRole: 'org_manager',
      }).allowed
    ).toBe(true);
    expect(
      authorize({
        resource: 'team_invites_memberships',
        action: 'manage',
        orgRole: 'org_manager',
      }).allowed
    ).toBe(false);
    expect(getEffectiveReviewRevealScope('org_manager', 'shortlist_identity')).toBe(
      'shortlist_identity'
    );
    expect(getVerificationSummaryVisibility('org_manager')).toBe('detailed');
  });

  it('rejects mutating org actions without explicit organization principal context', () => {
    expect(assertExplicitPrincipalContext(undefined).ok).toBe(false);
    expect(
      assertExplicitPrincipalContext({
        principalType: 'organization',
      } as any).ok
    ).toBe(false);
    expect(
      assertExplicitPrincipalContext({
        principalType: 'organization',
        orgId: '11111111-1111-4111-8111-111111111111',
      }).ok
    ).toBe(true);
  });

  it('requires break-glass for platform admins on org-scoped sensitive access', () => {
    expect(
      authorize({
        resource: 'exports',
        action: 'export_sensitive',
        platformRole: 'platform_admin',
      }).allowed
    ).toBe(false);
    expect(
      authorize({
        resource: 'exports',
        action: 'export_sensitive',
        platformRole: 'platform_admin',
        breakGlass: true,
      }).allowed
    ).toBe(true);
    expect(
      authorize({
        resource: 'reveal_actions',
        action: 'break_glass',
        platformRole: 'super_admin',
        breakGlass: true,
      }).allowed
    ).toBe(true);
  });
});
