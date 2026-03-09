import { describe, expect, it } from 'vitest';

import {
  AUTHZ_MATRIX,
  AUTHZ_RESOURCE_VALUES,
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

  it('keeps viewer access blind and non-exporting', () => {
    expect(
      authorize({
        resource: 'candidate_shortlist_cards',
        action: 'read',
        orgRole: 'viewer',
      }).allowed
    ).toBe(true);
    expect(
      authorize({
        resource: 'candidate_full_review',
        action: 'read',
        orgRole: 'viewer',
      }).allowed
    ).toBe(false);
    expect(
      authorize({
        resource: 'exports',
        action: 'export',
        orgRole: 'viewer',
      }).allowed
    ).toBe(false);
    expect(getEffectiveShortlistRevealScope('viewer', 'full_identity')).toBe('blind');
    expect(getVerificationSummaryVisibility('viewer')).toBe('none');
    expect(getAuditMetadataVisibility('viewer')).toBe('none');
  });

  it('keeps member access operational but not privileged', () => {
    expect(
      authorize({
        resource: 'candidate_full_review',
        action: 'update',
        orgRole: 'member',
      }).allowed
    ).toBe(true);
    expect(
      authorize({
        resource: 'team_invites_memberships',
        action: 'invite',
        orgRole: 'member',
      }).allowed
    ).toBe(false);
    expect(
      authorize({
        resource: 'org_audit_logs',
        action: 'read',
        orgRole: 'member',
      }).allowed
    ).toBe(false);
    expect(getEffectiveReviewRevealScope('member', 'shortlist_identity')).toBe(
      'shortlist_identity'
    );
    expect(getVerificationSummaryVisibility('member')).toBe('redacted');
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
