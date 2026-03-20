import { describe, expect, it } from 'vitest';

import {
  buildHiringCorridorSnapshot,
  type HiringCorridorSource,
} from '@/lib/hiring-corridor/snapshot';

function buildSource(overrides: Partial<HiringCorridorSource> = {}): HiringCorridorSource {
  return {
    matchId: 'match-1',
    assignmentTitle: 'Founding Engineer',
    organizationName: 'Northwind',
    candidateDisplayName: 'Alex Candidate',
    candidateProfileId: 'candidate-1',
    reviewStage: 'shortlisted',
    revealScope: null,
    shortlistedAt: new Date('2026-03-10T10:00:00.000Z'),
    fullIdentityUnlockedAt: null,
    introId: null,
    introState: null,
    introUpdatedAt: null,
    introLastActivityAt: null,
    conversationId: null,
    conversationStage: null,
    participantOneId: 'org-user-1',
    participantTwoId: 'candidate-1',
    participantOneWantsReveal: false,
    participantTwoWantsReveal: false,
    participantOneRevealRequestedAt: null,
    participantTwoRevealRequestedAt: null,
    revealedAt: null,
    maskedHandleOne: 'northwind-team',
    maskedHandleTwo: 'candidate-42',
    interviewId: null,
    interviewStatus: null,
    interviewScheduledAt: null,
    interviewDurationMinutes: null,
    interviewPlatform: null,
    interviewMeetingUrl: null,
    interviewManualMeetingProvider: null,
    interviewRescheduleCount: null,
    interviewCompletedAt: null,
    interviewCancelledAt: null,
    interviewNoShowAt: null,
    decisionId: null,
    decisionState: null,
    decisionUpdatedAt: null,
    decisionHoldUntil: null,
    engagementVerification: null,
    ...overrides,
  };
}

describe('buildHiringCorridorSnapshot', () => {
  it('maps reveal approval to interview scheduling for the organization view', () => {
    const snapshot = buildHiringCorridorSnapshot({
      source: buildSource({
        introId: 'intro-1',
        introState: 'mutual',
        introUpdatedAt: new Date('2026-03-11T10:00:00.000Z'),
        introLastActivityAt: new Date('2026-03-11T10:15:00.000Z'),
        conversationId: 'conversation-1',
        conversationStage: 'revealed',
        revealScope: 'full_identity',
        fullIdentityUnlockedAt: new Date('2026-03-12T09:00:00.000Z'),
        revealedAt: new Date('2026-03-12T09:00:00.000Z'),
      }),
      viewerUserId: 'org-user-1',
      perspective: 'organization',
    });

    expect(snapshot).toEqual(
      expect.objectContaining({
        currentStep: 'reveal_approved',
        nextAction: expect.objectContaining({
          id: 'schedule_interview',
        }),
        privacyStage: 'stage3_intro_approved',
      })
    );
  });

  it('keeps blind review in place for an individual responding to a reveal request', () => {
    const snapshot = buildHiringCorridorSnapshot({
      source: buildSource({
        introId: 'intro-1',
        introState: 'mutual',
        introUpdatedAt: new Date('2026-03-11T10:00:00.000Z'),
        introLastActivityAt: new Date('2026-03-11T10:15:00.000Z'),
        conversationId: 'conversation-1',
        conversationStage: 'masked',
        participantOneWantsReveal: true,
        participantOneRevealRequestedAt: new Date('2026-03-12T11:00:00.000Z'),
      }),
      viewerUserId: 'candidate-1',
      perspective: 'individual',
    });

    expect(snapshot).toEqual(
      expect.objectContaining({
        currentStep: 'reveal_requested',
        nextAction: expect.objectContaining({
          id: 'respond_to_reveal',
        }),
        subjectLabel: 'Northwind',
        privacyStage: 'stage1_capability_and_proof',
      })
    );
  });

  it('keeps hire distinct from engagement verification until verification is complete', () => {
    const snapshot = buildHiringCorridorSnapshot({
      source: buildSource({
        introId: 'intro-1',
        introState: 'interview_handoff',
        introUpdatedAt: new Date('2026-03-11T10:00:00.000Z'),
        introLastActivityAt: new Date('2026-03-11T10:15:00.000Z'),
        conversationId: 'conversation-1',
        conversationStage: 'revealed',
        interviewId: 'interview-1',
        interviewStatus: 'completed',
        interviewScheduledAt: new Date('2026-03-13T09:00:00.000Z'),
        interviewCompletedAt: new Date('2026-03-13T09:30:00.000Z'),
        decisionId: 'decision-1',
        decisionState: 'hire',
        decisionUpdatedAt: new Date('2026-03-13T11:00:00.000Z'),
        engagementVerification: {
          id: 'engagement-1',
          decisionId: 'decision-1',
          status: 'pending_candidate_confirmation',
          statusLabel: 'Waiting for candidate confirmation',
          engagementType: 'full_time',
          createdAt: '2026-03-13T11:00:00.000Z',
          candidateConfirmedAt: null,
          organizationConfirmedAt: '2026-03-13T11:05:00.000Z',
          uploadedEvidencePresent: false,
          proofHookStatus: 'not_ready',
          verifiedAt: null,
          workflow: {
            state: 'pending_candidate_confirmation',
            displayState: 'Waiting for candidate confirmation',
            allowedActions: [],
          },
        },
      }),
      viewerUserId: 'candidate-1',
      perspective: 'individual',
    });

    expect(snapshot).toEqual(
      expect.objectContaining({
        currentStep: 'engagement_recorded',
        nextAction: expect.objectContaining({
          id: 'confirm_engagement',
        }),
      })
    );
  });

  it('keeps an active scheduled interview ahead of a completed advance decision', () => {
    const snapshot = buildHiringCorridorSnapshot({
      source: buildSource({
        introId: 'intro-1',
        introState: 'interview_handoff',
        introUpdatedAt: new Date('2026-03-11T10:00:00.000Z'),
        introLastActivityAt: new Date('2026-03-11T10:15:00.000Z'),
        conversationId: 'conversation-1',
        conversationStage: 'revealed',
        interviewId: 'interview-2',
        interviewStatus: 'scheduled',
        interviewScheduledAt: new Date('2026-03-18T09:00:00.000Z'),
        decisionId: 'decision-1',
        decisionState: 'advance',
        decisionUpdatedAt: new Date('2026-03-14T11:00:00.000Z'),
      }),
      viewerUserId: 'org-user-1',
      perspective: 'organization',
    });

    expect(snapshot).toEqual(
      expect.objectContaining({
        currentStep: 'interviews',
        nextAction: expect.objectContaining({
          id: 'prepare_for_interview',
        }),
      })
    );
  });
});
