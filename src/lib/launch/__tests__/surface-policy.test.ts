import { describe, expect, it } from 'vitest';

import {
  INTERNAL_OPS_AUDIT_HREF,
  INTERNAL_OPS_HREF,
  INTERNAL_OPS_VERIFICATION_HREF,
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
  });

  it('preserves the narrow internal admin ops allowlist', () => {
    expect(getArchivedApiPolicy('/api/admin/audit')).toBeNull();
    expect(getArchivedApiPolicy('/api/admin/verification/linkedin/queue')).toBeNull();
    expect(getArchivedApiPolicy('/api/admin/verification/linkedin/user-1/review')).toBeNull();
    expect(getArchivedApiPolicy('/api/admin/moderation/queue')).toBeNull();
    expect(getArchivedApiPolicy('/api/admin/feature-flags/launch')).toBeNull();
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
  });

  it('classifies only non-MVP families as archived', () => {
    expect(classifyLaunchApiPath('/api/mobile/v1/bootstrap')).toBe('archived');
    expect(classifyLaunchApiPath('/api/admin/analytics/overview')).toBe('archived');
    expect(classifyLaunchApiPath('/api/admin/audit')).toBe('internal_only_launch_ops');
    expect(classifyLaunchApiPath('/api/assignments')).toBe('active_launch_path');
  });

  it('keeps preserved internal ops hrefs inside the allowed admin corridor', () => {
    expect([INTERNAL_OPS_HREF, INTERNAL_OPS_VERIFICATION_HREF, INTERNAL_OPS_AUDIT_HREF]).toEqual([
      '/admin',
      '/admin/verification',
      '/admin/audit',
    ]);
  });
});
