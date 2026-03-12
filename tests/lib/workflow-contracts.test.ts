import { describe, expect, it } from 'vitest';

import { WORKFLOW_TRANSITIONS, assertAllowedTransition } from '@/lib/workflow/contracts';

describe('workflow contracts', () => {
  it('keeps withdrawn intros terminal on the same record', () => {
    expect(WORKFLOW_TRANSITIONS.intro.withdrawn).toEqual([]);
    expect(() =>
      assertAllowedTransition('intro', 'withdrawn', 'pending_candidate_interest')
    ).toThrow(/Forbidden intro transition/i);
  });

  it('keeps no-show interviews terminal on the same record', () => {
    expect(WORKFLOW_TRANSITIONS.interview.no_show).toEqual([]);
    expect(() => assertAllowedTransition('interview', 'no_show', 'scheduled')).toThrow(
      /Forbidden interview transition/i
    );
  });

  it('keeps withdrawn decisions terminal on the same record', () => {
    expect(WORKFLOW_TRANSITIONS.decision.withdrawn).toEqual([]);
    expect(() => assertAllowedTransition('decision', 'withdrawn', 'pending')).toThrow(
      /Forbidden decision transition/i
    );
  });

  it('keeps engagement verification separate from decision state progression', () => {
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
