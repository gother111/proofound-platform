/**
 * Interview Constraints (PRD I-21)
 *
 * Enforces:
 * - 30-minute maximum duration
 * - Must be scheduled within 7 days of match agreement
 * - Maximum 1 reschedule allowed
 */

export const INTERVIEW_CONSTRAINTS = {
  MAX_DURATION_MINUTES: 30,
  MAX_DAYS_FROM_MATCH: 7,
  ALLOWED_RESCHEDULES: 1,
} as const;

export interface InterviewValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validates interview scheduling against PRD constraints
 */
export function validateInterviewSchedule(
  matchAgreementDate: Date,
  proposedStart: Date,
  duration: number
): InterviewValidation {
  const errors: string[] = [];

  // Check duration (must be ≤ 30 minutes)
  if (duration > INTERVIEW_CONSTRAINTS.MAX_DURATION_MINUTES) {
    errors.push(
      `Interview duration cannot exceed ${INTERVIEW_CONSTRAINTS.MAX_DURATION_MINUTES} minutes (PRD requirement)`
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
      `Interview must be scheduled within ${INTERVIEW_CONSTRAINTS.MAX_DAYS_FROM_MATCH} days of match agreement (currently ${daysSinceMatch} days)`
    );
  }

  // Check if interview is in the past
  if (proposedStart < new Date()) {
    errors.push('Interview cannot be scheduled in the past');
  }

  // Check if interview is too far in future (beyond 30 days)
  const daysInFuture = Math.floor(
    (proposedStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysInFuture > 30) {
    errors.push('Interview cannot be scheduled more than 30 days in advance');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if a reschedule is allowed based on previous attempts
 */
export function canReschedule(rescheduleCount: number): InterviewValidation {
  if (rescheduleCount >= INTERVIEW_CONSTRAINTS.ALLOWED_RESCHEDULES) {
    return {
      valid: false,
      errors: [
        `Maximum ${INTERVIEW_CONSTRAINTS.ALLOWED_RESCHEDULES} reschedule(s) allowed (PRD requirement)`,
      ],
    };
  }

  return {
    valid: true,
    errors: [],
  };
}

/**
 * Calculates the deadline for scheduling an interview after match
 */
export function getSchedulingDeadline(matchAgreementDate: Date): Date {
  const deadline = new Date(matchAgreementDate);
  deadline.setDate(deadline.getDate() + INTERVIEW_CONSTRAINTS.MAX_DAYS_FROM_MATCH);
  return deadline;
}

/**
 * Formats the validation errors for user-friendly display
 */
export function formatValidationErrors(validation: InterviewValidation): string {
  if (validation.valid) {
    return '';
  }

  return validation.errors.join('\n');
}
