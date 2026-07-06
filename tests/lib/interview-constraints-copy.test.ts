import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  canReschedule as canEditReschedule,
  validateInterviewSchedule as validateEditInterviewSchedule,
} from '@/lib/interview-constraints';
import {
  canReschedule as canSlaReschedule,
  validateDecisionWindow,
  validateInterviewSchedule as validateSlaInterviewSchedule,
  validateMatchReviewWindow,
} from '@/lib/sla/constraints';

describe('interview constraint copy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-12T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps edit validation errors plain-language for interview scheduling', () => {
    const validation = validateEditInterviewSchedule(
      new Date('2026-06-12T12:00:00.000Z'),
      new Date('2026-06-13T12:00:00.000Z'),
      45
    );

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Interview duration cannot exceed 30 minutes');
    expect(validation.errors.join(' ')).not.toContain('PRD');
  });

  it('keeps edit reschedule errors free of internal requirement labels', () => {
    const validation = canEditReschedule(1);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toEqual([
      'Maximum 1 reschedule allowed. This interview has already used its reschedule.',
    ]);
    expect(validation.errors.join(' ')).not.toContain('PRD');
  });

  it('keeps SLA interview scheduling errors plain-language', () => {
    const validation = validateSlaInterviewSchedule(
      new Date('2026-06-12T12:00:00.000Z'),
      new Date('2026-06-21T12:00:00.000Z'),
      45
    );

    expect(validation.valid).toBe(false);
    expect(validation.errors).toEqual([
      'Interview duration cannot exceed 30 minutes',
      'Interview must be scheduled within 7 days of match agreement; this time is 9 days after agreement',
    ]);
    expect(validation.errors.join(' ')).not.toContain('PRD');
  });

  it('keeps SLA reschedule and decision-window errors free of internal codes', () => {
    const rescheduleValidation = canSlaReschedule(1);
    const decisionValidation = validateDecisionWindow(new Date('2026-06-10T10:00:00.000Z'));
    const matchValidation = validateMatchReviewWindow(new Date('2026-06-08T10:00:00.000Z'));

    expect(rescheduleValidation.errors).toEqual([
      'Maximum 1 reschedule allowed. This interview has already used its reschedule.',
    ]);
    expect(decisionValidation.errors).toEqual([
      'Decision window expired. Decisions must be made within 48 hours of interview completion.',
    ]);
    expect(matchValidation.errors).toEqual([
      'Match review window expired. Matches should be reviewed within 72 hours.',
    ]);
    expect(
      [
        ...rescheduleValidation.errors,
        ...decisionValidation.errors,
        ...matchValidation.errors,
      ].join(' ')
    ).not.toContain('PRD');
  });
});
