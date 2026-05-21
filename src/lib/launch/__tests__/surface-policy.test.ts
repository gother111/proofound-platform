import { describe, expect, it } from 'vitest';

import {
  INTERNAL_OPS_AUDIT_HREF,
  INTERNAL_OPS_HREF,
  INTERNAL_OPS_VERIFICATION_HREF,
  LAUNCH_API_SURFACE_POLICIES,
  LAUNCH_PAGE_SURFACE_POLICIES,
  classifyLaunchApiPath,
  classifyLaunchPagePath,
  getArchivedApiPolicy,
  getArchivedPagePolicy,
} from '@/lib/launch/surface-policy';

describe('launch surface policy', () => {
  it('archives representative non-MVP API families', () => {
    expect(getArchivedApiPolicy('/api/mobile/v1/bootstrap')).toMatchObject({
      surfaceLabel: 'Mobile API',
    });
    expect(getArchivedApiPolicy('/api/wellbeing/checkin')).toMatchObject({
      surfaceLabel: 'Wellbeing API',
    });
    expect(getArchivedApiPolicy('/api/contracts')).toMatchObject({
      surfaceLabel: 'Contracts API',
    });
    expect(getArchivedApiPolicy('/api/projects/project-1')).toMatchObject({
      surfaceLabel: 'Projects API',
    });
    expect(getArchivedApiPolicy('/api/portfolio/view')).toMatchObject({
      surfaceLabel: 'Portfolio API',
    });
    expect(getArchivedApiPolicy('/api/matching/profile')).toMatchObject({
      surfaceLabel: 'Matching API',
    });
    expect(getArchivedApiPolicy('/api/matching/profile/profile-1')).toMatchObject({
      surfaceLabel: 'Matching API',
    });
    expect(getArchivedApiPolicy('/api/match/test')).toMatchObject({
      surfaceLabel: 'Core Matching API',
    });
    expect(getArchivedApiPolicy('/api/skill-gaps/overview')).toMatchObject({
      surfaceLabel: 'Skill Gap API',
    });
    expect(getArchivedApiPolicy('/api/analytics/track')).toMatchObject({
      surfaceLabel: 'Analytics API',
    });
    expect(getArchivedApiPolicy('/api/analytics/web-vitals')).toMatchObject({
      surfaceLabel: 'Analytics API',
    });
    expect(getArchivedApiPolicy('/api/performance/track')).toMatchObject({
      surfaceLabel: 'Performance API',
    });
    expect(getArchivedApiPolicy('/api/expertise/cv-import/wizard-suggest')).toMatchObject({
      surfaceLabel: 'Legacy Expertise API',
    });
    expect(getArchivedApiPolicy('/api/assignments/invite')).toMatchObject({
      surfaceLabel: 'Assignments API',
    });
    expect(getArchivedApiPolicy('/api/messages')).toMatchObject({
      surfaceLabel: 'Messages API',
    });
    expect(getArchivedApiPolicy('/api/notifications')).toMatchObject({
      surfaceLabel: 'Notifications API',
    });
    expect(getArchivedApiPolicy('/api/moderation/report')).toMatchObject({
      surfaceLabel: 'Moderation API',
    });
    expect(getArchivedApiPolicy('/api/profile/snippet')).toMatchObject({
      surfaceLabel: 'Profiles API',
    });
    expect(getArchivedApiPolicy('/api/profile/completeness')).toMatchObject({
      surfaceLabel: 'Profiles API',
    });
    expect(classifyLaunchApiPath('/api/people')).toBe('archived');
    expect(classifyLaunchApiPath('/api/candidates')).toBe('archived');
    expect(classifyLaunchApiPath('/api/directory')).toBe('archived');
    expect(classifyLaunchApiPath('/api/marketplace')).toBe('archived');
    expect(getArchivedApiPolicy('/api/verification/skill/request')).toMatchObject({
      surfaceLabel: 'Legacy Verification API',
    });
    expect(getArchivedApiPolicy('/api/organizations/org-1/projects/project-1')).toMatchObject({
      surfaceLabel: 'Organization Suite API',
    });
    expect(getArchivedApiPolicy('/api/organizations/org-1/goals')).toMatchObject({
      surfaceLabel: 'Organization Suite API',
    });
    expect(getArchivedApiPolicy('/api/organizations/org-1/partnerships')).toMatchObject({
      surfaceLabel: 'Organization Suite API',
    });
    expect(getArchivedApiPolicy('/api/organizations/org-1/structure')).toMatchObject({
      surfaceLabel: 'Organization Suite API',
    });
    expect(getArchivedApiPolicy('/api/organizations/org-1/culture')).toMatchObject({
      surfaceLabel: 'Organization Suite API',
    });
    expect(getArchivedApiPolicy('/api/organizations/org-1/impact')).toMatchObject({
      surfaceLabel: 'Organization Suite API',
    });
    expect(getArchivedApiPolicy('/api/org/org-1/dashboard')).toMatchObject({
      surfaceLabel: 'Organization Suite API',
    });
    expect(getArchivedApiPolicy('/api/org/org-1/coverage')).toMatchObject({
      surfaceLabel: 'Organization Suite API',
    });
    expect(getArchivedApiPolicy('/api/admin/users/user-1/role')).toMatchObject({
      surfaceLabel: 'Admin API',
    });
    expect(getArchivedApiPolicy('/api/sandbox/future-surface')).toMatchObject({
      surfaceLabel: 'Archived API',
    });
  });

  it('preserves the narrow internal admin and cron ops allowlist', () => {
    expect(getArchivedApiPolicy('/api/admin/audit')).toBeNull();
    expect(getArchivedApiPolicy('/api/admin/internal-ops/queues')).toBeNull();
    expect(
      getArchivedApiPolicy('/api/admin/internal-ops/queues/11111111-1111-1111-1111-111111111111')
    ).toBeNull();
    expect(getArchivedApiPolicy('/api/admin/organizations/org-1/audit')).toBeNull();
    expect(getArchivedApiPolicy('/api/admin/organizations/org-1/verify')).toBeNull();
    expect(getArchivedApiPolicy('/api/cron/launch-synthetic-checks')).toBeNull();
    expect(classifyLaunchApiPath('/api/monitoring/health-diagnostics')).toBe(
      'internal_only_launch_ops'
    );
    expect(classifyLaunchApiPath('/api/monitoring/launch-status')).toBe('internal_only_launch_ops');
    expect(classifyLaunchApiPath('/api/monitoring/perf-status')).toBe('internal_only_launch_ops');
  });

  it('archives retired cron routes', () => {
    expect(getArchivedApiPolicy('/api/cron/account-deletion-workflow')).toMatchObject({
      surfaceLabel: 'Workflow Cron API',
    });
    expect(getArchivedApiPolicy('/api/cron/process-deletions')).toMatchObject({
      surfaceLabel: 'Workflow Cron API',
    });
    expect(getArchivedApiPolicy('/api/cron/send-deletion-reminders')).toMatchObject({
      surfaceLabel: 'Workflow Cron API',
    });
  });

  it('archives stale linkedin-flavored internal queue routes', () => {
    expect(getArchivedApiPolicy('/api/admin/verification/linkedin/queue')).toMatchObject({
      surfaceLabel: 'Admin API',
    });
    expect(getArchivedApiPolicy('/api/admin/verification/linkedin/user-1/review')).toMatchObject({
      surfaceLabel: 'Admin API',
    });
  });

  it('keeps representative corridor APIs active', () => {
    const activePaths = [
      '/api/assignments',
      '/api/candidate-invites/token',
      '/api/conversations',
      '/api/decisions',
      '/api/engagement-verifications/engagement-1',
      '/api/feedback/interview-1',
      '/api/feedback/submit',
      '/api/interviews/schedule',
      '/api/matching-profile',
      '/api/match/profile',
      '/api/matches/match-1/snooze',
      '/api/org/org-1/shortlist',
      '/api/org/org-1/matches/match-1/review',
      '/api/organizations/org-1/team',
      '/api/portfolio/visibility',
      '/api/profile',
      '/api/profile/privacy-settings',
      '/api/upload/document',
      '/api/user/data-inventory',
      '/api/user/export',
      '/api/verification/requests/skill',
      '/api/verify/token-1',
    ];

    for (const path of activePaths) {
      expect(classifyLaunchApiPath(path)).toBe('active_launch_path');
      expect(getArchivedApiPolicy(path)).toBeNull();
    }
  });

  it('keeps active invite surface labels proof-submission scoped', () => {
    const invitePolicy = LAUNCH_API_SURFACE_POLICIES.find((policy) =>
      policy.matches('/api/candidate-invites/token')
    );

    expect(invitePolicy).toMatchObject({
      classification: 'active_launch_path',
      surfaceLabel: 'Submission Invite API',
      detail: 'Submission invite and claim flows remain active in the launch corridor.',
    });
    expect(invitePolicy?.surfaceLabel).not.toContain('Candidate Invite');
    expect(invitePolicy?.detail).not.toContain('Candidate invite');
  });

  it('classifies archived and active page surfaces explicitly', () => {
    expect(classifyLaunchPagePath('/')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/portfolio/alex')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/verify/token-1')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/candidate-invite/token-1')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/auth/callback')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/auth/logout')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/app/i/home')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/app/i/matching/preferences')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/app/o/acme/shortlist')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/admin')).toBe('internal_only_launch_ops');

    expect(classifyLaunchPagePath('/app/i/opportunities')).toBe('gated_non_mvp');
    expect(classifyLaunchPagePath('/app/o/acme/settings')).toBe('gated_non_mvp');
    expect(classifyLaunchPagePath('/app/o/acme/settings/team')).toBe('gated_non_mvp');
    expect(classifyLaunchPagePath('/app/o/acme/team')).toBe('gated_non_mvp');

    expect(classifyLaunchPagePath('/app/i/notifications')).toBe('archived');
    expect(classifyLaunchPagePath('/app/i/settings/notifications')).toBe('archived');
    expect(classifyLaunchPagePath('/app/o/acme/candidates')).toBe('archived');
    expect(classifyLaunchPagePath('/app/o/acme/projects')).toBe('archived');
    expect(classifyLaunchPagePath('/app/o/acme/goals')).toBe('archived');
    expect(classifyLaunchPagePath('/app/o/acme/culture')).toBe('archived');
    expect(classifyLaunchPagePath('/app/o/acme/impact')).toBe('archived');
    expect(classifyLaunchPagePath('/app/o/acme/structure')).toBe('archived');
    expect(classifyLaunchPagePath('/app/o/acme/partnerships')).toBe('archived');
    expect(classifyLaunchPagePath('/app/o/acme/analytics/fairness')).toBe('archived');
    expect(classifyLaunchPagePath('/app/o/acme/settings/profile')).toBe('archived');
    expect(classifyLaunchPagePath('/app/o/acme/settings/goals')).toBe('archived');
    expect(classifyLaunchPagePath('/people')).toBe('archived');
    expect(classifyLaunchPagePath('/candidates')).toBe('archived');
    expect(classifyLaunchPagePath('/directory')).toBe('archived');
    expect(classifyLaunchPagePath('/marketplace')).toBe('archived');
    expect(classifyLaunchPagePath('/portfolio')).toBe('archived');
    expect(classifyLaunchPagePath('/o/acme/assignments/new')).toBe('archived');
    expect(classifyLaunchPagePath('/about')).toBe('archived');
    expect(classifyLaunchPagePath('/contact')).toBe('archived');
    expect(classifyLaunchPagePath('/support')).toBe('archived');
    expect(classifyLaunchPagePath('/fairness')).toBe('archived');
    expect(classifyLaunchPagePath('/docs/expertise-atlas')).toBe('archived');
    expect(classifyLaunchPagePath('/p/token')).toBe('archived');
    expect(classifyLaunchPagePath('/assign/token')).toBe('archived');
    expect(classifyLaunchPagePath('/admin/users')).toBe('archived');
    expect(classifyLaunchPagePath('/dev/resolve-home')).toBe('archived');
  });

  it('returns archived metadata for representative page surfaces', () => {
    expect(getArchivedPagePolicy('/app/i/opportunities')).toMatchObject({
      surfaceLabel: 'Individual Pages',
    });
    expect(getArchivedPagePolicy('/app/o/acme/settings')).toMatchObject({
      surfaceLabel: 'Organization Pages',
    });
    expect(getArchivedPagePolicy('/app/i/notifications')).toMatchObject({
      surfaceLabel: 'Individual Pages',
    });
    expect(getArchivedPagePolicy('/app/o/acme/culture')).toMatchObject({
      surfaceLabel: 'Organization Pages',
    });
    expect(getArchivedPagePolicy('/app/o/acme/partnerships')).toMatchObject({
      surfaceLabel: 'Organization Pages',
    });
    expect(getArchivedPagePolicy('/app/o/acme/analytics/fairness')).toMatchObject({
      surfaceLabel: 'Organization Pages',
    });
    expect(getArchivedPagePolicy('/o/acme/assignments/new')).toMatchObject({
      surfaceLabel: 'Compatibility Pages',
    });
    expect(getArchivedPagePolicy('/fairness')).toMatchObject({
      surfaceLabel: 'Public Pages',
    });
    expect(getArchivedPagePolicy('/admin/users')).toMatchObject({
      surfaceLabel: 'Internal Ops Pages',
    });
    expect(getArchivedPagePolicy('/dev/resolve-home')).toMatchObject({
      surfaceLabel: 'Development Route Handler',
    });
    expect(getArchivedPagePolicy('/auth/callback')).toBeNull();
    expect(getArchivedPagePolicy('/app/i/home')).toBeNull();
  });

  it('keeps the registries explicit enough to audit the locked MVP boundary', () => {
    expect(LAUNCH_API_SURFACE_POLICIES.length).toBeGreaterThanOrEqual(20);
    expect(LAUNCH_PAGE_SURFACE_POLICIES.length).toBeGreaterThanOrEqual(5);
  });

  it('keeps preserved internal ops hrefs inside the allowed admin corridor', () => {
    expect([INTERNAL_OPS_HREF, INTERNAL_OPS_VERIFICATION_HREF, INTERNAL_OPS_AUDIT_HREF]).toEqual([
      '/admin',
      '/admin/verification',
      '/admin/audit',
    ]);
  });

  it('does not let retained launch-ops routes match archived policy classes', () => {
    const retainedApiPaths = [
      '/api/admin/audit',
      '/api/admin/internal-ops/queues',
      '/api/admin/internal-ops/queues/11111111-1111-1111-1111-111111111111',
      '/api/admin/organizations/org-1/audit',
      '/api/admin/organizations/org-1/verify',
      '/api/cron/decision-reminders',
      '/api/cron/health-check',
      '/api/cron/launch-synthetic-checks',
      '/api/cron/performance-check',
      '/api/cron/refresh-matches',
      '/api/cron/refresh-matches-worker',
      '/api/cron/sla-enforcement',
      '/api/monitoring/launch-status',
      '/api/organizations/org-1/audit/export',
    ];
    const retainedPagePaths = ['/admin', '/admin/verification', '/admin/audit'];

    for (const path of retainedApiPaths) {
      const matchedClasses = LAUNCH_API_SURFACE_POLICIES.filter((policy) =>
        policy.matches(path)
      ).map((policy) => policy.classification);
      expect(matchedClasses).toEqual(['internal_only_launch_ops']);
    }

    for (const path of retainedPagePaths) {
      const matchedClasses = LAUNCH_PAGE_SURFACE_POLICIES.filter((policy) =>
        policy.matches(path)
      ).map((policy) => policy.classification);
      expect(matchedClasses).toEqual(['internal_only_launch_ops']);
    }
  });
});
