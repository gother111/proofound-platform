import { describe, expect, it } from 'vitest';

import {
  getConversationParticipantInitials,
  getConversationParticipantLabel,
} from '@/lib/messaging/participant-label';

describe('conversation participant labels', () => {
  it('keeps masked proof-submission handles readable without leaking identity', () => {
    expect(
      getConversationParticipantLabel({
        stage: 'masked',
        displayName: 'Submission #ABC123',
      })
    ).toBe('Submission #ABC123');

    expect(getConversationParticipantInitials('Submission #ABC123', 'masked')).toBe('S');
    expect(getConversationParticipantInitials('Organization #XYZ789', 'masked')).toBe('O');
  });

  it('falls back to generic masked participant copy for missing masked names', () => {
    expect(
      getConversationParticipantLabel({
        stage: 'masked',
        displayName: 'Unknown',
      })
    ).toBe('Masked participant');
    expect(getConversationParticipantInitials('Masked participant', 'masked')).toBe('MP');
  });
});
