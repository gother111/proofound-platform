/**
 * SLA Constraints and Enforcement
 *
 * Enforces all time-based constraints from the PRD:
 * - I-21: Interview scheduling (30 min max, within 7 days)
 * - I-22: Decision window (48 hours after interview)
 * - I-23: Matching window (72 hours to review proof submissions)
 */

/**
 * Interview Constraints (PRD I-21)
 */
export const INTERVIEW_CONSTRAINTS = {
  MAX_DURATION_MINUTES: 30,
  MAX_DAYS_FROM_MATCH: 7,
  ALLOWED_RESCHEDULES: 1,
} as const;

/**
 * Decision Window Constraints (PRD I-22)
 */
export const DECISION_CONSTRAINTS = {
  WINDOW_HOURS: 48,
} as const;

/**
 * Matching Window Constraints (PRD I-23)
 */
export const MATCHING_CONSTRAINTS = {
  REVIEW_WINDOW_HOURS: 72,
  DEFAULT_SNOOZE_HOURS: 24,
  MAX_SNOOZE_HOURS: 168, // 7 days
} as const;

export interface SLAValidation {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validates interview scheduling against PRD constraints
 */
export function validateInterviewSchedule(
  matchAgreementDate: Date,
  proposedStart: Date,
  duration: number
): SLAValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check duration (must be ≤ 30 minutes)
  if (duration > INTERVIEW_CONSTRAINTS.MAX_DURATION_MINUTES) {
    errors.push(
      `Interview duration cannot exceed ${INTERVIEW_CONSTRAINTS.MAX_DURATION_MINUTES} minutes (PRD I-21)`
    );
  }

  if (duration <= 0) {
    errors.push('Interview duration must be greater than 0 minutes');
  }

  // Check scheduling window (must be within 7 days of match)
  const daysSinceMatch = Math.floor(
    (proposedStart.getTime() - matchAgreementDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceMatch > INTERVIEW_CONSTRAINTS.MAX_DAYS_FROM_MATCH) {
    errors.push(
      `Interview must be scheduled within ${INTERVIEW_CONSTRAINTS.MAX_DAYS_FROM_MATCH} days of match agreement (currently ${daysSinceMatch} days) (PRD I-21)`
    );
  }

  // Check if interview is in the past
  if (proposedStart < new Date()) {
    errors.push('Interview cannot be scheduled in the past');
  }

  // Check if interview is too far in future (beyond 30 days)
  const daysInFuture = Math.floor((proposedStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysInFuture > 30) {
    warnings.push('Interview is scheduled more than 30 days in advance');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks if a reschedule is allowed based on previous attempts
 */
export function canReschedule(rescheduleCount: number): SLAValidation {
  if (rescheduleCount >= INTERVIEW_CONSTRAINTS.ALLOWED_RESCHEDULES) {
    return {
      valid: false,
      errors: [
        `Maximum ${INTERVIEW_CONSTRAINTS.ALLOWED_RESCHEDULES} reschedule(s) allowed (PRD I-21)`,
      ],
    };
  }

  return {
    valid: true,
    errors: [],
  };
}

/**
 * Validates decision timing (PRD I-22)
 */
export function validateDecisionWindow(interviewCompletedAt: Date): SLAValidation {
  const hoursSinceInterview = (Date.now() - interviewCompletedAt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceInterview > DECISION_CONSTRAINTS.WINDOW_HOURS) {
    return {
      valid: false,
      errors: [
        `Decision window expired. Decisions must be made within ${DECISION_CONSTRAINTS.WINDOW_HOURS} hours of interview completion (PRD I-22)`,
      ],
    };
  }

  const warnings: string[] = [];
  const hoursRemaining = DECISION_CONSTRAINTS.WINDOW_HOURS - hoursSinceInterview;

  if (hoursRemaining <= 6) {
    warnings.push(`Decision window expires in ${Math.round(hoursRemaining)} hours`);
  }

  return {
    valid: true,
    errors: [],
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validates match review window (PRD I-23)
 */
export function validateMatchReviewWindow(matchCreatedAt: Date): SLAValidation {
  const hoursSinceMatch = (Date.now() - matchCreatedAt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceMatch > MATCHING_CONSTRAINTS.REVIEW_WINDOW_HOURS) {
    return {
      valid: false,
      errors: [
        `Match review window expired. Matches should be reviewed within ${MATCHING_CONSTRAINTS.REVIEW_WINDOW_HOURS} hours (PRD I-23)`,
      ],
    };
  }

  const warnings: string[] = [];
  const hoursRemaining = MATCHING_CONSTRAINTS.REVIEW_WINDOW_HOURS - hoursSinceMatch;

  if (hoursRemaining <= 12) {
    warnings.push(`Match review window expires in ${Math.round(hoursRemaining)} hours`);
  }

  return {
    valid: true,
    errors: [],
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validates snooze duration
 */
export function validateSnoozeDuration(hours: number): SLAValidation {
  const errors: string[] = [];

  if (hours <= 0) {
    errors.push('Snooze duration must be greater than 0 hours');
  }

  if (hours > MATCHING_CONSTRAINTS.MAX_SNOOZE_HOURS) {
    errors.push(
      `Snooze duration cannot exceed ${MATCHING_CONSTRAINTS.MAX_SNOOZE_HOURS} hours (${MATCHING_CONSTRAINTS.MAX_SNOOZE_HOURS / 24} days)`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate deadlines
 */
export function getInterviewSchedulingDeadline(matchAgreementDate: Date): Date {
  const deadline = new Date(matchAgreementDate);
  deadline.setDate(deadline.getDate() + INTERVIEW_CONSTRAINTS.MAX_DAYS_FROM_MATCH);
  return deadline;
}

export function getDecisionDeadline(interviewCompletedAt: Date): Date {
  const deadline = new Date(interviewCompletedAt);
  deadline.setHours(deadline.getHours() + DECISION_CONSTRAINTS.WINDOW_HOURS);
  return deadline;
}

export function getMatchReviewDeadline(matchCreatedAt: Date): Date {
  const deadline = new Date(matchCreatedAt);
  deadline.setHours(deadline.getHours() + MATCHING_CONSTRAINTS.REVIEW_WINDOW_HOURS);
  return deadline;
}

/**
 * Check if any SLA is about to expire
 */
export function getUpcomingSLAExpirations(data: {
  matchCreatedAt?: Date;
  interviewCompletedAt?: Date;
}): Array<{ type: string; deadline: Date; hoursRemaining: number }> {
  const expirations: Array<{ type: string; deadline: Date; hoursRemaining: number }> = [];

  if (data.matchCreatedAt) {
    const deadline = getMatchReviewDeadline(data.matchCreatedAt);
    const hoursRemaining = (deadline.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursRemaining > 0 && hoursRemaining <= 12) {
      expirations.push({
        type: 'match_review',
        deadline,
        hoursRemaining: Math.round(hoursRemaining),
      });
    }
  }

  if (data.interviewCompletedAt) {
    const deadline = getDecisionDeadline(data.interviewCompletedAt);
    const hoursRemaining = (deadline.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursRemaining > 0 && hoursRemaining <= 6) {
      expirations.push({
        type: 'decision',
        deadline,
        hoursRemaining: Math.round(hoursRemaining),
      });
    }
  }

  return expirations;
}

/**
 * Format validation errors for user-friendly display
 */
export function formatSLAErrors(validation: SLAValidation): string {
  if (validation.valid && !validation.warnings) {
    return '';
  }

  const messages: string[] = [];

  if (validation.errors.length > 0) {
    messages.push('Errors:', ...validation.errors.map((e) => `  - ${e}`));
  }

  if (validation.warnings && validation.warnings.length > 0) {
    messages.push('Warnings:', ...validation.warnings.map((w) => `  - ${w}`));
  }

  return messages.join('\n');
}
