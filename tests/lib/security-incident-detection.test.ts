import { describe, expect, it, vi } from 'vitest';

import { withSecurityMonitoring } from '@/lib/security/incident-detection';

describe('withSecurityMonitoring', () => {
  it('passes through when no enforcement options are requested', async () => {
    const handler = vi.fn(async () => 'ok');
    const wrapped = withSecurityMonitoring(handler);

    await expect(wrapped()).resolves.toBe('ok');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('fails closed when callers request auth or rate-limit enforcement', async () => {
    const handler = vi.fn(async () => 'ok');

    await expect(withSecurityMonitoring(handler, { requireAuth: true })()).rejects.toThrow(
      'does not enforce auth or rate limits'
    );
    await expect(
      withSecurityMonitoring(handler, { rateLimit: { requests: 10, windowMinutes: 1 } })()
    ).rejects.toThrow('does not enforce auth or rate limits');
    expect(handler).not.toHaveBeenCalled();
  });
});
