import { describe, expect, it } from 'vitest';

import { GET as getLlmsAlias } from '@/app/llms/route';
import { GET as getLlms } from '@/app/llms.txt/route';
import { GET as getLlmsFull } from '@/app/llms-full.txt/route';

describe('llms routes', () => {
  it('serves llms.txt as deterministic plaintext', async () => {
    const response = await getLlms();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(response.headers.get('cache-control')).toContain('stale-while-revalidate');
    expect(body).toContain('# Proofound');
    expect(body).toContain('## Core Pages');
    expect(body).toContain('privacy-safe review');
    expect(body).toContain('/privacy');
    expect(body).not.toContain('/about');
    expect(body).toContain('hello@proofound.io');
  });

  it('serves /llms as an alias of llms.txt', async () => {
    const response = await getLlmsAlias();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(body).toContain('# Proofound');
    expect(body).toContain('## Core Pages');
  });

  it('serves llms-full.txt with technical surfaces included', async () => {
    const response = await getLlmsFull();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('## Technical Surfaces');
    expect(body).toContain('/robots.txt');
    expect(body).toContain('/sitemap.xml');
  });
});
