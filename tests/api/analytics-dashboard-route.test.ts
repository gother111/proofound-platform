import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/analytics/dashboard/route';

describe('POST /api/analytics/dashboard', () => {
  it('returns a launch gate by default', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/analytics/dashboard', {
        method: 'POST',
        body: JSON.stringify({ eventType: 'dashboard_viewed', properties: {} }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(410);
    expect(payload.error).toContain('Dashboard analytics API');
  });
});
