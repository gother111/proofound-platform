import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/match/test/route';

describe('GET /api/match/test', () => {
  it('returns 410 before auth or database access', async () => {
    const response = await GET(new NextRequest('http://localhost/api/match/test'));
    const payload = await response.json();

    expect(response.status).toBe(410);
    expect(payload).toMatchObject({
      surface: 'Core Matching API',
      launchState: 'non_launch',
    });
  });
});
