import { describe, expect, it } from 'vitest';

import { GET, POST } from '@/app/api/dashboard/layout/route';

describe('dashboard layout API route', () => {
  it('returns a launch gate by default on GET', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(410);
    expect(payload.error).toContain('Dashboard layout API');
  });

  it('returns a launch gate by default on POST', async () => {
    const response = await POST(
      new Request('http://localhost/api/dashboard/layout', {
        method: 'POST',
        body: JSON.stringify({ widgets: [] }),
        headers: { 'Content-Type': 'application/json' },
      }) as any
    );
    const payload = await response.json();

    expect(response.status).toBe(410);
    expect(payload.error).toContain('Dashboard layout API');
  });
});
