import { describe, expect, it } from 'vitest';

import {
  ACTIVE_LAUNCH_ANALYTICS_API_PATHS,
  INTERNAL_OPS_AUDIT_HREF,
  INTERNAL_OPS_HREF,
  INTERNAL_OPS_VERIFICATION_HREF,
  LAUNCH_API_SURFACE_POLICIES,
  classifyLaunchApiPath,
  getArchivedApiPolicy,
} from '@/lib/launch/surface-policy';

describe('launch surface policy', () => {
  it('archives non-MVP mobile and wellbeing API families', () => {
    expect(getArchivedApiPolicy('/api/mobile/v1/bootstrap')).toMatchObject({
      surfaceLabel: 'Mobile API',
    });
    expect(getArchivedApiPolicy('/api/wellbeing/checkin')).toMatchObject({
      surfaceLabel: 'Wellbeing API',
    });
    expect(getArchivedApiPolicy('/api/analytics/fairness')).toMatchObject({
      surfaceLabel: 'Analytics API',
    });
    expect(getArchivedApiPolicy('/api/dashboard/layout')).toMatchObject({
      surfaceLabel: 'Dashboard API',
    });
    expect(getArchivedApiPolicy('/api/momentum/summary')).toMatchObject({
      surfaceLabel: 'Momentum API',
    });
    expect(getArchivedApiPolicy('/api/impact/snapshot')).toMatchObject({
      surfaceLabel: 'Impact API',
    });
    expect(getArchivedApiPolicy('/api/metrics')).toMatchObject({
      surfaceLabel: 'Metrics API',
    });
    expect(getArchivedApiPolicy('/api/org/org-1/dashboard')).toMatchObject({
      surfaceLabel: 'Organization Dashboard API',
    });
    expect(getArchivedApiPolicy('/api/org/org-1/coverage')).toMatchObject({
      surfaceLabel: 'Organization Coverage API',
    });
    expect(getArchivedApiPolicy('/api/organizations/org-1/culture')).toMatchObject({
      surfaceLabel: 'Organization Suite API',
    });
    expect(getArchivedApiPolicy('/api/organizations/org-1/impact/story-1')).toMatchObject({
      surfaceLabel: 'Organization Suite API',
    });
    expect(getArchivedApiPolicy('/api/organizations/org-1/projects/project-1')).toMatchObject({
      surfaceLabel: 'Organization Suite API',
    });
    expect(getArchivedApiPolicy('/api/organizations/org-1/structure/export')).toMatchObject({
      surfaceLabel: 'Organization Suite API',
    });
    expect(getArchivedApiPolicy('/api/assignment-templates')).toMatchObject({
      surfaceLabel: 'Assignment Templates API',
    });
    expect(getArchivedApiPolicy('/api/goals')).toMatchObject({
      surfaceLabel: 'Goals API',
    });
    expect(getArchivedApiPolicy('/api/evidence-pack/candidate-1')).toMatchObject({
      surfaceLabel: 'Evidence Pack API',
    });
    expect(getArchivedApiPolicy('/api/organizations/org-1/evidence-pack')).toMatchObject({
      surfaceLabel: 'Evidence Pack API',
    });
    expect(
      getArchivedApiPolicy(
        '/api/expertise/user-skills/11111111-1111-4111-8111-111111111111/verification-request'
      )
    ).toMatchObject({
      surfaceLabel: 'Legacy Verification API',
    });
    expect(getArchivedApiPolicy('/api/expertise/verifications/incoming')).toMatchObject({
      surfaceLabel: 'Legacy Verification API',
    });
    expect(getArchivedApiPolicy('/api/expertise/verification/request-1/respond')).toMatchObject({
      surfaceLabel: 'Legacy Verification API',
    });
    expect(getArchivedApiPolicy('/api/verification/skill/request')).toMatchObject({
      surfaceLabel: 'Legacy Verification API',
    });
    expect(getArchivedApiPolicy('/api/verification/skill/respond')).toMatchObject({
      surfaceLabel: 'Legacy Verification API',
    });
  });

  it('preserves the narrow internal admin ops allowlist', () => {
    expect(getArchivedApiPolicy('/api/admin/audit')).toBeNull();
    expect(getArchivedApiPolicy('/api/admin/verification/linkedin/queue')).toBeNull();
    expect(getArchivedApiPolicy('/api/admin/verification/linkedin/user-1/review')).toBeNull();
    expect(getArchivedApiPolicy('/api/admin/organizations/org-1/audit')).toBeNull();
    expect(getArchivedApiPolicy('/api/admin/organizations/org-1/verify')).toBeNull();
  });

  it('archives all other admin API families by default', () => {
    expect(getArchivedApiPolicy('/api/admin/analytics/overview')).toMatchObject({
      surfaceLabel: 'Admin API',
    });
    expect(getArchivedApiPolicy('/api/admin/users/user-1/role')).toMatchObject({
      surfaceLabel: 'Admin API',
    });
    expect(getArchivedApiPolicy('/api/admin/organizations')).toMatchObject({
      surfaceLabel: 'Admin API',
    });
    expect(getArchivedApiPolicy('/api/admin/feature-flags/launch')).toMatchObject({
      surfaceLabel: 'Admin API',
    });
    expect(getArchivedApiPolicy('/api/admin/metrics/rollout')).toMatchObject({
      surfaceLabel: 'Admin API',
    });
  });

  it('classifies only non-MVP families as archived', () => {
    expect(classifyLaunchApiPath('/api/mobile/v1/bootstrap')).toBe('archived');
    expect(classifyLaunchApiPath('/api/admin/analytics/overview')).toBe('archived');
    expect(classifyLaunchApiPath('/api/admin/feature-flags')).toBe('archived');
    expect(classifyLaunchApiPath('/api/analytics/fairness')).toBe('archived');
    expect(classifyLaunchApiPath('/api/dashboard/layout')).toBe('archived');
    expect(classifyLaunchApiPath('/api/momentum/summary')).toBe('archived');
    expect(classifyLaunchApiPath('/api/metrics')).toBe('archived');
    expect(classifyLaunchApiPath('/api/org/org-1/coverage')).toBe('archived');
    expect(classifyLaunchApiPath('/api/organizations/org-1/projects')).toBe('archived');
    expect(classifyLaunchApiPath('/api/admin/audit')).toBe('internal_only_launch_ops');
    expect(classifyLaunchApiPath('/api/assignments')).toBe('active_launch_path');
  });

  it('keeps launch-safe telemetry and monitoring paths active', () => {
    for (const path of ACTIVE_LAUNCH_ANALYTICS_API_PATHS) {
      expect(classifyLaunchApiPath(path)).toBe('active_launch_path');
      expect(getArchivedApiPolicy(path)).toBeNull();
    }

    expect(classifyLaunchApiPath('/api/performance/track')).toBe('active_launch_path');
    expect(classifyLaunchApiPath('/api/feature-flags')).toBe('active_launch_path');
    expect(classifyLaunchApiPath('/api/monitoring/launch-status')).toBe('active_launch_path');
    expect(classifyLaunchApiPath('/api/monitoring/perf-status')).toBe('active_launch_path');
  });

  it('keeps the registry explicit enough to audit the locked MVP boundary', () => {
    expect(LAUNCH_API_SURFACE_POLICIES.length).toBeGreaterThanOrEqual(28);
  });

  it('keeps preserved internal ops hrefs inside the allowed admin corridor', () => {
    expect([INTERNAL_OPS_HREF, INTERNAL_OPS_VERIFICATION_HREF, INTERNAL_OPS_AUDIT_HREF]).toEqual([
      '/admin',
      '/admin/verification',
      '/admin/audit',
    ]);
  });
});
