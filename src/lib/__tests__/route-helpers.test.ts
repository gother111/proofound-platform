import { describe, it, expect } from 'vitest';
import { jsonError, parsePagination } from '@/lib/api/route-helpers';

describe('route-helpers', () => {
  it('jsonError returns expected status and payload', async () => {
    const res = jsonError('oops', 418, { info: 'details' });
    expect(res.status).toBe(418);
    const body = await res.json();
    expect(body).toEqual({ error: 'oops', details: { info: 'details' } });
  });

  it('parsePagination returns defaults when params are missing', () => {
    const result = parsePagination(new URLSearchParams());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        page: 1,
        limit: 10,
        search: '',
        sortField: 'createdAt',
        sortDir: 'desc',
      });
    }
  });

  it('parsePagination respects provided params and maxLimit', () => {
    const params = new URLSearchParams({
      page: '2',
      limit: '25',
      search: 'abc',
      sortField: 'displayName',
      sortDir: 'asc',
    });
    const result = parsePagination(params, { maxLimit: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        page: 2,
        limit: 25,
        search: 'abc',
        sortField: 'displayName',
        sortDir: 'asc',
      });
    }
  });

  it('parsePagination fails when limit exceeds maxLimit', () => {
    const params = new URLSearchParams({ limit: '200' });
    const result = parsePagination(params, { maxLimit: 50 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Number must be less than or equal to 50');
    }
  });
});

