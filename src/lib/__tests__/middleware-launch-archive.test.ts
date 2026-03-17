import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { middleware } from '@/middleware';

describe('middleware launch archive behavior', () => {
  beforeEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.KV_REST_API_READ_ONLY_TOKEN;
  });

  it('returns 410 for archived wellbeing APIs', async () => {
    const response = await middleware(
      new NextRequest('http://localhost/api/wellbeing/checkin', { method: 'GET' })
    );
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.surface).toBe('Wellbeing API');
    expect(body.launchState).toBe('non_launch');
  });

  it('returns 410 for archived mobile APIs', async () => {
    const response = await middleware(
      new NextRequest('http://localhost/api/mobile/v1/bootstrap', { method: 'GET' })
    );
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.surface).toBe('Mobile API');
    expect(body.launchState).toBe('non_launch');
  });

  it('returns 410 for archived legacy verification transports', async () => {
    const archivedPaths = [
      'http://localhost/api/expertise/user-skills/skill-1/verification-request',
      'http://localhost/api/expertise/verifications/incoming',
      'http://localhost/api/expertise/verifications/custom/request',
      'http://localhost/api/expertise/verification/request-1/respond',
      'http://localhost/api/verification/skill/request',
      'http://localhost/api/verification/skill/respond',
    ];

    for (const path of archivedPaths) {
      const response = await middleware(new NextRequest(path, { method: 'GET' }));
      const body = await response.json();

      expect(response.status).toBe(410);
      expect(body.surface).toBe('Legacy Verification API');
      expect(body.launchState).toBe('non_launch');
    }
  });

  it('returns 410 for archived admin analytics and fairness APIs', async () => {
    const archivedPaths = [
      'http://localhost/api/admin/analytics/overview',
      'http://localhost/api/admin/fairness/notes',
      'http://localhost/api/admin/users/user-1/role',
      'http://localhost/api/admin/organizations',
    ];

    for (const path of archivedPaths) {
      const response = await middleware(new NextRequest(path, { method: 'GET' }));
      const body = await response.json();

      expect(response.status).toBe(410);
      expect(body.surface).toBe('Admin API');
      expect(body.launchState).toBe('non_launch');
    }
  });

  it('returns 410 for newly archived non-MVP launch-surface APIs', async () => {
    const archivedPaths = [
      'http://localhost/api/analytics/fairness',
      'http://localhost/api/analytics/org/next-actions',
      'http://localhost/api/dashboard/layout',
      'http://localhost/api/momentum/summary',
      'http://localhost/api/impact/snapshot',
      'http://localhost/api/metrics',
      'http://localhost/api/org/org-1/dashboard',
      'http://localhost/api/org/org-1/coverage',
      'http://localhost/api/organizations/org-1/culture',
      'http://localhost/api/organizations/org-1/impact/story-1',
      'http://localhost/api/organizations/org-1/projects/project-1',
      'http://localhost/api/organizations/org-1/structure/export',
      'http://localhost/api/assignment-templates',
      'http://localhost/api/goals',
      'http://localhost/api/evidence-pack/candidate-1',
      'http://localhost/api/organizations/evidence-pack',
      'http://localhost/api/organizations/org-1/evidence-pack',
    ];

    for (const path of archivedPaths) {
      const response = await middleware(new NextRequest(path, { method: 'GET' }));
      const body = await response.json();

      expect(response.status).toBe(410);
      expect(body.launchState).toBe('non_launch');
    }
  });

  it('returns 410 for HEAD requests on archived non-MVP APIs before auth checks run', async () => {
    const response = await middleware(
      new NextRequest('http://localhost/api/analytics/fairness', { method: 'HEAD' })
    );

    expect(response.status).toBe(410);
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('still passes through preserved internal ops admin endpoints', async () => {
    const preservedPaths = [
      'http://localhost/api/admin/audit?limit=10',
      'http://localhost/api/admin/verification/linkedin/queue',
      'http://localhost/api/admin/verification/linkedin/user-1/review',
      'http://localhost/api/admin/organizations/org-1/audit?reason=test',
      'http://localhost/api/admin/organizations/org-1/verify',
    ];

    for (const path of preservedPaths) {
      const response = await middleware(new NextRequest(path, { method: 'GET' }));
      expect(response.status).toBe(200);
      expect(response.headers.get('x-request-id')).toBeTruthy();
    }
  });

  it('still passes through preserved launch telemetry endpoints', async () => {
    const preservedPaths = [
      'http://localhost/api/analytics/events',
      'http://localhost/api/analytics/track',
      'http://localhost/api/analytics/tour-event',
      'http://localhost/api/analytics/web-vitals',
      'http://localhost/api/performance/track',
      'http://localhost/api/feature-flags',
      'http://localhost/api/monitoring/launch-status',
      'http://localhost/api/monitoring/perf-status',
    ];

    for (const path of preservedPaths) {
      const response = await middleware(new NextRequest(path, { method: 'GET' }));
      expect(response.status).toBe(200);
      expect(response.headers.get('x-request-id')).toBeTruthy();
    }
  });

  it('archives broader admin list surfaces while preserving nested trust endpoints', async () => {
    const archivedPaths = [
      'http://localhost/api/admin/organizations',
      'http://localhost/api/admin/feature-flags',
      'http://localhost/api/admin/metrics/rollout',
    ];

    for (const path of archivedPaths) {
      const response = await middleware(new NextRequest(path, { method: 'GET' }));
      const body = await response.json();

      expect(response.status).toBe(410);
      expect(body.surface).toBe('Admin API');
    }
  });
});
