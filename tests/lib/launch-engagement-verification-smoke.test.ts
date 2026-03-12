import { describe, expect, it } from 'vitest';

import { WORKFLOW_TRANSITIONS, assertAllowedTransition } from '@/lib/workflow/contracts';

describe('launch engagement verification smoke', () => {
  it('keeps engagement verification explicit and separate from decision closure', () => {
    expect(WORKFLOW_TRANSITIONS.engagement_verification.pending_both_confirmations).toEqual([
      'pending_candidate_confirmation',
      'pending_organization_confirmation',
      'verified',
    ]);
    expect(WORKFLOW_TRANSITIONS.engagement_verification.verified).toEqual([]);
    expect(() =>
      assertAllowedTransition('engagement_verification', 'verified', 'pending_both_confirmations')
    ).toThrow(/Forbidden engagement_verification transition/i);
  });
});
