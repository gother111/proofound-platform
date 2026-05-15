import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/user/audit-log/purpose/route';

describe('user purpose audit log route', () => {
  it('returns 410 because individual purpose history is not an active MVP surface', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body).toEqual({
      error: 'Gone',
      message: 'Retired individual purpose audit history is not an active MVP surface.',
    });
  });
});
