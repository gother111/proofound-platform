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

  it('returns 410 for archived admin analytics and fairness APIs', async () => {
    const analyticsResponse = await middleware(
      new NextRequest('http://localhost/api/admin/analytics/overview', { method: 'GET' })
    );
    const analyticsBody = await analyticsResponse.json();

    expect(analyticsResponse.status).toBe(410);
    expect(analyticsBody.surface).toBe('Admin API');

    const fairnessResponse = await middleware(
      new NextRequest('http://localhost/api/admin/fairness/notes', { method: 'GET' })
    );
    const fairnessBody = await fairnessResponse.json();

    expect(fairnessResponse.status).toBe(410);
    expect(fairnessBody.surface).toBe('Admin API');
  });

  it('still passes through preserved internal ops admin endpoints', async () => {
    const preservedPaths = [
      'http://localhost/api/admin/verification/linkedin/queue',
      'http://localhost/api/admin/moderation/queue',
      'http://localhost/api/admin/metrics/rollout',
      'http://localhost/api/admin/feature-flags',
      'http://localhost/api/admin/organizations/org-1/audit?reason=test',
    ];

    for (const path of preservedPaths) {
      const response = await middleware(new NextRequest(path, { method: 'GET' }));
      expect(response.status).toBe(200);
      expect(response.headers.get('x-request-id')).toBeTruthy();
    }
  });

  it('archives broader admin list surfaces while preserving nested trust endpoints', async () => {
    const response = await middleware(
      new NextRequest('http://localhost/api/admin/organizations', { method: 'GET' })
    );
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.surface).toBe('Admin API');
  });
});
