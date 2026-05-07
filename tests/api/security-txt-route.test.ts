import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET as securityTxtGET } from '@/app/.well-known/security.txt/route';
import { GET as legacySecurityTxtGET } from '@/app/security.txt/route';

describe('security.txt routes', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('publishes the canonical vulnerability disclosure contact', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://proofound.io');

    const response = await securityTxtGET();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(body).toContain('Contact: mailto:security@proofound.io');
    expect(body).toContain('Expires: 2027-05-07T00:00:00Z');
    expect(body).toContain('Canonical: https://proofound.io/.well-known/security.txt');
  });

  it('serves the same disclosure file from the legacy root path', async () => {
    const response = await legacySecurityTxtGET();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('Contact: mailto:security@proofound.io');
  });
});
