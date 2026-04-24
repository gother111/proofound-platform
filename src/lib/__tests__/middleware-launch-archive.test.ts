import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { middleware } from '@/middleware';

describe('middleware launch archive behavior', () => {
  beforeEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.KV_REST_API_READ_ONLY_TOKEN;
  });

  it('returns 410 for archived non-MVP APIs', async () => {
    const archivedPaths = [
      ['http://localhost/api/contracts', 'Contracts API'],
      ['http://localhost/api/projects', 'Projects API'],
      ['http://localhost/api/skill-gaps', 'Skill Gap API'],
      ['http://localhost/api/assignments/invite', 'Assignments API'],
      ['http://localhost/api/messages', 'Messages API'],
      ['http://localhost/api/notifications', 'Notifications API'],
      ['http://localhost/api/moderation/report', 'Moderation API'],
      ['http://localhost/api/feedback/why-not-shortlisted', 'Feedback API'],
      ['http://localhost/api/verification/veriff/session', 'Legacy Verification API'],
      ['http://localhost/api/organizations/org-1/projects/project-1', 'Organization Suite API'],
      ['http://localhost/api/admin/organizations', 'Admin API'],
      ['http://localhost/api/admin/verification/linkedin/queue', 'Admin API'],
      ['http://localhost/api/admin/verification/linkedin/user-1/review', 'Admin API'],
    ] as const;

    for (const [path, surface] of archivedPaths) {
      const response = await middleware(new NextRequest(path, { method: 'GET' }));
      const body = await response.json();

      expect(response.status).toBe(410);
      expect(body.surface).toBe(surface);
      expect(body.launchState).toBe('non_launch');
    }
  });

  it('returns 410 for HEAD requests on archived APIs before auth checks run', async () => {
    const response = await middleware(
      new NextRequest('http://localhost/api/notifications', { method: 'HEAD' })
    );

    expect(response.status).toBe(410);
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('returns 404 for archived page routes before they become reachable', async () => {
    const archivedPaths = [
      'http://localhost/app/i/notifications',
      'http://localhost/app/i/settings/notifications',
      'http://localhost/app/o/acme/candidates',
      'http://localhost/app/o/acme/settings/profile',
      'http://localhost/fairness',
      'http://localhost/docs/expertise-atlas',
      'http://localhost/p/token-value',
      'http://localhost/assign/token-value',
      'http://localhost/o/acme/assignments/new',
      'http://localhost/admin/users',
    ];

    for (const path of archivedPaths) {
      const response = await middleware(new NextRequest(path, { method: 'GET' }));
      const body = await response.text();

      expect(response.status).toBe(404);
      expect(body).toContain('Not found');
    }
  });

  it('returns 404 for hard-gated page routes before auth checks run', async () => {
    const hardGatedPaths = [
      'http://localhost/app/i/opportunities',
      'http://localhost/app/o/acme/settings',
      'http://localhost/app/o/acme/settings/team',
      'http://localhost/app/o/acme/team',
    ];

    for (const path of hardGatedPaths) {
      const response = await middleware(new NextRequest(path, { method: 'GET' }));
      const body = await response.text();

      expect(response.status).toBe(404);
      expect(body).toContain('Not found');
    }
  });

  it('still passes through preserved internal ops admin endpoints', async () => {
    const preservedPaths = [
      'http://localhost/api/admin/audit?limit=10',
      'http://localhost/api/admin/internal-ops/queues',
      'http://localhost/api/admin/internal-ops/queues/11111111-1111-1111-1111-111111111111',
      'http://localhost/api/admin/organizations/org-1/audit?reason=test',
      'http://localhost/api/admin/organizations/org-1/verify',
      'http://localhost/admin',
      'http://localhost/admin/verification',
      'http://localhost/admin/audit',
    ];

    for (const path of preservedPaths) {
      const response = await middleware(new NextRequest(path, { method: 'GET' }));
      expect(response.status).toBe(200);
      expect(response.headers.get('x-request-id')).toBeTruthy();
    }
  });

  it('still passes through preserved launch telemetry and corridor endpoints', async () => {
    const preservedPaths = [
      'http://localhost/api/analytics/events',
      'http://localhost/api/analytics/track',
      'http://localhost/api/analytics/tour-event',
      'http://localhost/api/analytics/web-vitals',
      'http://localhost/api/assignments',
      'http://localhost/api/candidate-invites/token',
      'http://localhost/api/conversations',
      'http://localhost/api/interviews/schedule',
      'http://localhost/api/matching-profile',
      'http://localhost/api/match/profile',
      'http://localhost/api/org/org-1/shortlist',
      'http://localhost/api/monitoring/launch-status',
      'http://localhost/api/monitoring/perf-status',
      'http://localhost/api/portfolio/visibility',
      'http://localhost/api/user/export',
      'http://localhost/api/verification/requests/skill',
      'http://localhost/api/verify/token-1',
      'http://localhost/app/i/home',
      'http://localhost/app/i/messages',
      'http://localhost/app/o/acme/matching',
      'http://localhost/app/o/acme/shortlist',
      'http://localhost/auth/callback?type=email&token_hash=test-token',
      'http://localhost/portfolio/alex',
      'http://localhost/verify/token-1',
      'http://localhost/candidate-invite/token-1',
    ];

    for (const path of preservedPaths) {
      const response = await middleware(new NextRequest(path, { method: 'GET' }));
      expect(response.status).toBe(200);
      expect(response.headers.get('x-request-id')).toBeTruthy();
    }
  });
});
