import { describe, expect, it } from 'vitest';

import { buildBlindSafeVerificationRequestEmail } from '@/lib/email/privacy';

describe('workflow email privacy helper', () => {
  it('builds pre-reveal verification emails without requester or artifact details', () => {
    const email = buildBlindSafeVerificationRequestEmail({
      verifyUrl: 'https://proofound.io/verify/token-123',
      expiresInDays: 7,
      ctaLabel: 'Review Request',
      requestKind: 'generic_verification',
    });

    expect(email.subject).toBe('Proofound verification request');
    expect(email.html).toContain('secure review flow');
    expect(email.html).toContain('https://proofound.io/verify/token-123');
    expect(email.html).not.toContain('Alice');
    expect(email.html).not.toContain('TypeScript');
    expect(email.text).not.toContain('Alice');
    expect(email.text).not.toContain('TypeScript');
  });
});
