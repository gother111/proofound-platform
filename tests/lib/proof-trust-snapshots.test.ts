import { describe, expect, it } from 'vitest';

import { getProofFreshnessState } from '@/lib/proof-trust/snapshots';

describe('getProofFreshnessState', () => {
  it('treats recently updated proof as fresh', () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 20);

    expect(
      getProofFreshnessState({
        updatedAt: recent,
      })
    ).toBe('fresh');
  });

  it('treats old proof as stale before expiry', () => {
    const old = new Date();
    old.setDate(old.getDate() - 250);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    expect(
      getProofFreshnessState({
        updatedAt: old,
        expiresAt,
      })
    ).toBe('stale');
  });

  it('treats expired proof as expired even if recently updated', () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 10);
    const expired = new Date();
    expired.setDate(expired.getDate() - 1);

    expect(
      getProofFreshnessState({
        updatedAt: recent,
        expiresAt: expired,
      })
    ).toBe('expired');
  });
});
