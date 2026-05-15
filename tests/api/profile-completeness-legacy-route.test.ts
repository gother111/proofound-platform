import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/profile/completeness/route';

describe('legacy profile completeness route', () => {
  it('returns a launch-safe gone response instead of profile scoring', async () => {
    const response = await GET();

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      replacement: '/api/individual/readiness',
    });
  });
});
