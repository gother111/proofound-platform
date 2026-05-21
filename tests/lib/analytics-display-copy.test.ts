import { describe, expect, it } from 'vitest';

import {
  EventType,
  getEventDisplayName,
  type MatchActionedProperties,
  type MatchViewedProperties,
} from '@/lib/analytics/constants';

describe('analytics display copy', () => {
  it('keeps submission invite display labels distinct from stable candidate event keys', () => {
    expect(EventType.CANDIDATE_INVITE_SENT).toBe('candidate_invite_sent');
    expect(EventType.CANDIDATE_PROOF_CARD_SUBMITTED).toBe('candidate_proof_card_submitted');

    expect(getEventDisplayName(EventType.CANDIDATE_INVITE_SENT)).toBe('Submission Invite Sent');
    expect(getEventDisplayName(EventType.CANDIDATE_INVITE_OPENED)).toBe('Submission Invite Opened');
    expect(getEventDisplayName(EventType.CANDIDATE_INVITE_CLAIMED)).toBe(
      'Submission Invite Claimed'
    );
    expect(getEventDisplayName(EventType.CANDIDATE_PROOF_CARD_SUBMITTED)).toBe(
      'Submission Proof Card Submitted'
    );
  });

  it('keeps active match analytics qualitative instead of score-led', () => {
    const viewedProperties: MatchViewedProperties = {
      match_id: 'match_123',
      assignment_id: 'assignment_123',
      proof_signals: [
        { key: 'proof', support: 'primary_reason' },
        { key: 'constraints', support: 'needs_review' },
      ],
      review_mode: 'reason_coded',
      score_visibility: 'internal_ordering_only',
    };
    const actionedProperties: MatchActionedProperties = {
      match_id: 'match_123',
      action: 'introduce',
      reason: 'proof evidence fits the assignment review brief',
      review_mode: 'reason_coded',
      score_visibility: 'internal_ordering_only',
    };
    const serializedProperties = JSON.stringify({ viewedProperties, actionedProperties });

    expect(viewedProperties.proof_signals).toEqual([
      { key: 'proof', support: 'primary_reason' },
      { key: 'constraints', support: 'needs_review' },
    ]);
    expect(viewedProperties.review_mode).toBe('reason_coded');
    expect(actionedProperties.score_visibility).toBe('internal_ordering_only');
    expect(serializedProperties).not.toContain('match_score');
    expect(serializedProperties).not.toContain('pac_value');
    expect(serializedProperties).not.toContain('skills_score');
    expect(serializedProperties).not.toContain('constraints_score');
    expect(serializedProperties).not.toContain('verification_score');
  });
});
