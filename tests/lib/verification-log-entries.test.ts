/** @vitest-environment node */

import { describe, expect, it } from 'vitest';

import { deriveVerificationLogEntryType } from '@/lib/verification/log-entries';

describe('deriveVerificationLogEntryType', () => {
  it('maps initial pending creation to record_created', () => {
    expect(
      deriveVerificationLogEntryType({
        fromState: null,
        toState: 'pending',
        trigger: 'verification_requested',
      })
    ).toBe('record_created');
  });

  it('maps pending refresh requests without a status change', () => {
    expect(
      deriveVerificationLogEntryType({
        fromState: 'pending',
        toState: 'pending',
        trigger: 'verification_requested',
      })
    ).toBe('refresh_requested');
  });

  it('maps special audit states to explicit entry types', () => {
    expect(
      deriveVerificationLogEntryType({
        fromState: 'verified',
        toState: 'expired',
        trigger: 'verification_state_change',
      })
    ).toBe('expired');

    expect(
      deriveVerificationLogEntryType({
        fromState: 'expired',
        toState: 'verified',
        trigger: 'verification_state_change',
      })
    ).toBe('restored');
  });
});
