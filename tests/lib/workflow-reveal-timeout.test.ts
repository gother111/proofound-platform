import { describe, expect, it } from 'vitest';

import { getRevealRequestTimeoutSnapshot } from '@/lib/workflow/service';

describe('getRevealRequestTimeoutSnapshot', () => {
  it('treats a single pending reveal request as expired after 72 hours', () => {
    const requestedAt = new Date('2026-03-10T09:00:00.000Z');
    const snapshot = getRevealRequestTimeoutSnapshot(
      {
        id: 'conversation-1',
        stage: 'masked',
        participantOneId: 'org-user-1',
        participantTwoId: 'candidate-1',
        participantOneWantsReveal: true,
        participantTwoWantsReveal: false,
        participantOneRevealRequestedAt: requestedAt,
        participantTwoRevealRequestedAt: null,
      },
      new Date('2026-03-13T09:00:00.001Z')
    );

    expect(snapshot.pending).toBe(true);
    expect(snapshot.expired).toBe(true);
    expect(snapshot.requestedBy).toBe('participant_one');
    expect(snapshot.expiresAt?.toISOString()).toBe('2026-03-13T09:00:00.000Z');
    expect(snapshot.timedOutParticipantId).toBe('org-user-1');
  });

  it('does not treat non-pending or revealed conversations as timed out', () => {
    const maskedSnapshot = getRevealRequestTimeoutSnapshot(
      {
        id: 'conversation-1',
        stage: 'masked',
        participantOneId: 'org-user-1',
        participantTwoId: 'candidate-1',
        participantOneWantsReveal: false,
        participantTwoWantsReveal: false,
        participantOneRevealRequestedAt: null,
        participantTwoRevealRequestedAt: null,
      },
      new Date('2026-03-20T09:00:00.000Z')
    );
    const revealedSnapshot = getRevealRequestTimeoutSnapshot(
      {
        id: 'conversation-2',
        stage: 'revealed',
        participantOneId: 'org-user-1',
        participantTwoId: 'candidate-1',
        participantOneWantsReveal: true,
        participantTwoWantsReveal: true,
        participantOneRevealRequestedAt: new Date('2026-03-10T09:00:00.000Z'),
        participantTwoRevealRequestedAt: new Date('2026-03-10T09:05:00.000Z'),
      },
      new Date('2026-03-20T09:00:00.000Z')
    );

    expect(maskedSnapshot).toEqual({
      pending: false,
      expired: false,
      requestedBy: null,
      requestedAt: null,
      expiresAt: null,
      timedOutParticipantId: null,
    });
    expect(revealedSnapshot).toEqual({
      pending: false,
      expired: false,
      requestedBy: null,
      requestedAt: null,
      expiresAt: null,
      timedOutParticipantId: null,
    });
  });
});
