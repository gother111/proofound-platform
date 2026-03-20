import { describe, expect, it } from 'vitest';

import {
  ACTIVE_LAUNCH_ANALYTICS_API_PATHS,
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
    expect(getArchivedApiPolicy('/api/skill-gaps/overview')).toMatchObject({
      surfaceLabel: 'Skill Gap API',
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
    expect(getArchivedApiPolicy('/api/verification/skill/request')).toMatchObject({
      surfaceLabel: 'Legacy Verification API',
    });
    expect(getArchivedApiPolicy('/api/organizations/org-1/projects/project-1')).toMatchObject({
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
    expect(getArchivedApiPolicy('/api/admin/verification/linkedin/queue')).toBeNull();
    expect(getArchivedApiPolicy('/api/admin/verification/linkedin/user-1/review')).toBeNull();
    expect(getArchivedApiPolicy('/api/admin/organizations/org-1/audit')).toBeNull();
    expect(getArchivedApiPolicy('/api/admin/organizations/org-1/verify')).toBeNull();
    expect(getArchivedApiPolicy('/api/cron/launch-synthetic-checks')).toBeNull();
    expect(getArchivedApiPolicy('/api/cron/process-deletions')).toBeNull();
  });

  it('keeps representative corridor APIs active', () => {
    for (const path of ACTIVE_LAUNCH_ANALYTICS_API_PATHS) {
      expect(classifyLaunchApiPath(path)).toBe('active_launch_path');
      expect(getArchivedApiPolicy(path)).toBeNull();
    }

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
      '/api/profile/privacy-settings',
      '/api/upload/document',
      '/api/user/export',
      '/api/verification/requests/skill',
      '/api/verify/token-1',
    ];

    for (const path of activePaths) {
      expect(classifyLaunchApiPath(path)).toBe('active_launch_path');
      expect(getArchivedApiPolicy(path)).toBeNull();
    }
  });

  it('classifies archived and active page surfaces explicitly', () => {
    expect(classifyLaunchPagePath('/')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/portfolio/alex')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/verify/token-1')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/candidate-invite/token-1')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/app/i/home')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/app/i/matching/preferences')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/app/o/acme/shortlist')).toBe('active_launch_path');
    expect(classifyLaunchPagePath('/admin')).toBe('internal_only_launch_ops');

    expect(classifyLaunchPagePath('/app/i/notifications')).toBe('archived');
    expect(classifyLaunchPagePath('/app/i/settings/notifications')).toBe('archived');
    expect(classifyLaunchPagePath('/app/o/acme/settings')).toBe('archived');
    expect(classifyLaunchPagePath('/app/o/acme/candidates')).toBe('archived');
    expect(classifyLaunchPagePath('/fairness')).toBe('archived');
    expect(classifyLaunchPagePath('/docs/expertise-atlas')).toBe('archived');
    expect(classifyLaunchPagePath('/p/token')).toBe('archived');
    expect(classifyLaunchPagePath('/assign/token')).toBe('archived');
    expect(classifyLaunchPagePath('/admin/users')).toBe('archived');
  });

  it('returns archived metadata for representative page surfaces', () => {
    expect(getArchivedPagePolicy('/app/i/notifications')).toMatchObject({
      surfaceLabel: 'Individual Pages',
    });
    expect(getArchivedPagePolicy('/app/o/acme/settings')).toMatchObject({
      surfaceLabel: 'Organization Pages',
    });
    expect(getArchivedPagePolicy('/fairness')).toMatchObject({
      surfaceLabel: 'Public Pages',
    });
    expect(getArchivedPagePolicy('/admin/users')).toMatchObject({
      surfaceLabel: 'Internal Ops Pages',
    });
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
});
