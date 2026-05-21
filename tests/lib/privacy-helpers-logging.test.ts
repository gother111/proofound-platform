import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkPolicyConsent } from '@/lib/privacy/policy-versions';
import { hasMatchedRelationship } from '@/lib/privacy/visibility';
import { log } from '@/lib/log';
import { getConsentCheck } from '@/lib/workflow/service';

vi.mock('@/lib/workflow/service', () => ({
  getConsentCheck: vi.fn(),
  syncConsentObligation: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

describe('privacy helper structured logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails closed and logs structured diagnostics when policy consent lookup fails', async () => {
    vi.mocked(getConsentCheck).mockRejectedValueOnce(new Error('workflow unavailable'));

    const result = await checkPolicyConsent('user-1');

    expect(result).toEqual({
      needsConsent: true,
      tosUpToDate: false,
      privacyUpToDate: false,
      missingConsents: ['Terms of Service', 'Privacy Policy'],
    });
    expect(log.error).toHaveBeenCalledWith('privacy.policy_consent.check_failed', {
      userId: 'user-1',
      error: expect.any(Error),
    });
  });

  it('returns false and logs structured diagnostics when matched relationship lookup fails', async () => {
    const db = {
      select: vi.fn(() => {
        throw new Error('match lookup failed');
      }),
    };

    const result = await hasMatchedRelationship('user-a', 'user-b', db);

    expect(result).toBe(false);
    expect(log.error).toHaveBeenCalledWith('privacy.visibility.matched_relationship_check_failed', {
      userId1: 'user-a',
      userId2: 'user-b',
      error: expect.any(Error),
    });
  });
});
