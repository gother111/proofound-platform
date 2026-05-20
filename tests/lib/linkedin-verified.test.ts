import { describe, expect, it } from 'vitest';

import {
  resolveHasLinkedInIdentityVerification,
  resolveHasLinkedInWorkplaceVerification,
} from '@/lib/linkedin-verified';

describe('linkedin-verified helpers', () => {
  it('treats GOVERNMENT_ID labels as identity verification', () => {
    const result = resolveHasLinkedInIdentityVerification({
      apiReport: {
        verifications: ['WORKPLACE', 'GOVERNMENT_ID'],
      },
    });

    expect(result).toBe(true);
  });

  it('does not treat WORKPLACE-only verification as identity verification', () => {
    const result = resolveHasLinkedInIdentityVerification({
      apiReport: {
        verifications: ['WORKPLACE'],
      },
    });

    expect(result).toBe(false);
  });

  it('detects WORKPLACE labels as workplace verification', () => {
    const result = resolveHasLinkedInWorkplaceVerification({
      apiReport: {
        verifications: ['WORKPLACE'],
      },
    });

    expect(result).toBe(true);
  });
});
