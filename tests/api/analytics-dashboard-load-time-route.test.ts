import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/analytics/dashboard-load-time/route';

describe('POST /api/analytics/dashboard-load-time', () => {
  it('returns a launch gate by default', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/analytics/dashboard-load-time', {
        method: 'POST',
        body: JSON.stringify({ dashboardType: 'org', loadTimeMs: 850 }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(410);
    expect(payload.error).toContain('Dashboard load telemetry API');
  });
});
