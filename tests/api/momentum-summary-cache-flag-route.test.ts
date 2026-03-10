import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from '@/app/api/momentum/summary/route';

describe('GET /api/momentum/summary launch gate', () => {
  it('returns a 410 launch gate by default', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/momentum/summary?persona=organization&org=acme')
    );
    const payload = await response.json();

    expect(response.status).toBe(410);
    expect(payload.error).toContain('Momentum summary API');
  });
});
