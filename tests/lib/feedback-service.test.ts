import { describe, expect, it } from 'vitest';

import {
  getFeedbackDueAt,
  getFeedbackReminderSchedule,
  resolveFeedbackFollowUpState,
} from '@/lib/feedback/service';

describe('feedback follow-up service', () => {
  it('marks follow-up as due before the 48-hour deadline', () => {
    const completedAt = '2026-03-08T10:00:00.000Z';
    const state = resolveFeedbackFollowUpState({
      completedAt,
      now: new Date('2026-03-09T09:00:00.000Z'),
    });

    expect(getFeedbackDueAt(completedAt).toISOString()).toBe('2026-03-10T10:00:00.000Z');
    expect(state.overallState).toBe('due');
    expect(state.candidateToOrg).toBe('due');
    expect(state.orgToCandidate).toBe('due');
    expect(state.slaBreached).toBe(false);
  });

  it('marks follow-up as breached after the 48-hour deadline if one side is still missing', () => {
    const state = resolveFeedbackFollowUpState({
      completedAt: '2026-03-08T10:00:00.000Z',
      candidateSubmittedAt: '2026-03-08T15:00:00.000Z',
      now: new Date('2026-03-10T12:00:00.000Z'),
    });

    expect(state.overallState).toBe('breached');
    expect(state.candidateToOrg).toBe('submitted');
    expect(state.orgToCandidate).toBe('breached');
    expect(state.slaBreached).toBe(true);
  });

  it('marks follow-up as delivered only after both sides submit feedback', () => {
    const state = resolveFeedbackFollowUpState({
      completedAt: '2026-03-08T10:00:00.000Z',
      candidateSubmittedAt: '2026-03-08T15:00:00.000Z',
      organizationSubmittedAt: '2026-03-09T11:00:00.000Z',
      now: new Date('2026-03-09T11:05:00.000Z'),
    });

    expect(state.overallState).toBe('feedback_delivered');
    expect(state.slaBreached).toBe(false);
  });

  it('returns canonical reminder checkpoints for the SLA window', () => {
    const reminders = getFeedbackReminderSchedule('2026-03-08T10:00:00.000Z');

    expect(reminders.map((entry) => entry.checkpoint)).toEqual(['24h', '40h', '48h']);
    expect(reminders[2].scheduledAt.toISOString()).toBe('2026-03-10T10:00:00.000Z');
  });
});
