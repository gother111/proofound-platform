import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from '@/app/api/portfolio/view/route';

describe('/api/portfolio/view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns gone for public portfolio view counter writes', async () => {
    const response = await POST(
      new Request(
        'http://localhost/api/portfolio/view?subjectType=individual_profile&slugOrHandle=alice%22%7D%2C%22x%22%3A1'
      )
    );
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.error).toContain('not available in MVP');
  });

  it('requires a portfolio identifier for counter writes', async () => {
    const response = await POST(new Request('http://localhost/api/portfolio/view'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('slugOrHandle required');
  });

  it('returns gone for owner-facing public portfolio counts', async () => {
    const response = await GET(
      new Request('http://localhost/api/portfolio/view?slugOrHandle=alice')
    );
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.error).toContain('not available in MVP');
  });
});
