import { describe, expect, it } from 'vitest';

import { buildOrgTrustReadiness, countReadyTrustItems } from '@/lib/organizations/trust-readiness';

describe('organization trust readiness', () => {
  it('keeps verified-domain fallback copy consistent with ready state', () => {
    const items = buildOrgTrustReadiness({
      displayName: 'Acme Proof Review',
      whyWorkMatters: 'Proof-first review needs context.',
      mission: 'Review work through proof.',
      operatingContext: 'Remote-first review team.',
      domainPathDetail: null,
      domainReady: true,
    });

    expect(countReadyTrustItems(items)).toBe(5);
    expect(items.find((item) => item.key === 'domainPath')).toMatchObject({
      ready: true,
      detail: 'Verified organization signal is present.',
    });
  });

  it('still asks for a domain signal when no verification path is ready', () => {
    const items = buildOrgTrustReadiness({
      displayName: 'Acme Proof Review',
      whyWorkMatters: 'Proof-first review needs context.',
      mission: 'Review work through proof.',
      operatingContext: 'Remote-first review team.',
      domainPathDetail: null,
      domainReady: false,
    });

    expect(countReadyTrustItems(items)).toBe(4);
    expect(items.find((item) => item.key === 'domainPath')).toMatchObject({
      ready: false,
      detail: 'Needs verified domain signal.',
    });
  });
});
