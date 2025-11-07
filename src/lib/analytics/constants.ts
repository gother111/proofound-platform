/**
 * Analytics Constants
 *
 * Event types, metric thresholds, and cohort definitions per PRD Part 2.
 *
 * PRD References:
 * - Part 2: Goals & Success Metrics
 * - Part 7: Functional Requirements
 * - Part 12: Acceptance Criteria
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Core lifecycle events for tracking user journey
 * Per PRD Part 7 (Functional Requirements)
 */
export const EventType = {
  // Profile & Activation
  PROFILE_CREATED: 'profile_created',
  PROFILE_ACTIVATED: 'profile_activated', // Minimum L4 skills + matchable
  PROFILE_UPDATED: 'profile_updated',

  // Expertise & Skills
  L4_SKILL_ADDED: 'l4_skill_added',
  PROOF_UPLOADED: 'proof_uploaded',
  CV_IMPORTED: 'cv_imported',

  // Matching
  MATCHING_PROFILE_CREATED: 'matching_profile_created',
  SHORTLIST_GENERATED: 'shortlist_generated',
  MATCH_VIEWED: 'match_viewed',
  MATCH_ACTIONED: 'match_actioned', // intro, pass, snooze
  MATCH_SNOOZED: 'match_snoozed',
  MATCH_UNSNOOZED: 'match_unsnoozed',

  // Introductions & Applications
  FIRST_QUALIFIED_INTRO: 'first_qualified_intro', // TTFQI endpoint
  APPLICATION_SUBMITTED: 'application_submitted',
  APPLICATION_ACCEPTED: 'application_accepted',
  APPLICATION_REJECTED: 'application_rejected',

  // Interviews
  INTERVIEW_REQUESTED: 'interview_requested',
  INTERVIEW_SCHEDULED: 'interview_scheduled', // TTV endpoint
  INTERVIEW_COMPLETED: 'interview_completed',
  INTERVIEW_NO_SHOW: 'interview_no_show',

  // Contracts
  OFFER_SENT: 'offer_sent',
  OFFER_ACCEPTED: 'offer_accepted',
  CONTRACT_SIGNED: 'contract_signed', // TTSC endpoint

  // Organizations
  ASSIGNMENT_CREATED: 'assignment_created',
  ASSIGNMENT_PUBLISHED: 'assignment_published',

  // Well-being (Zen Hub)
  WELLBEING_OPT_IN: 'wellbeing_opt_in',
  WELLBEING_CHECKIN: 'wellbeing_checkin',
  WELLBEING_REFLECTION: 'wellbeing_reflection',

  // Usability
  SUS_SURVEY_COMPLETED: 'sus_survey_completed',
  TOUR_STARTED: 'tour_started',
  TOUR_COMPLETED: 'tour_completed',
  TOUR_SKIPPED: 'tour_skipped',

  // Privacy
  VISIBILITY_CHANGED: 'visibility_changed',
  REDACT_MODE_TOGGLED: 'redact_mode_toggled',
} as const;

export type EventTypeValue = (typeof EventType)[keyof typeof EventType];

// ============================================================================
// METRIC THRESHOLDS (PRD Part 2)
// ============================================================================

/**
 * North Star Metric: TTSC (Time-to-Signed-Contract)
 * Target: Median ≤30 days for entry/mid roles
 */
export const TTSC_TARGET_DAYS = 30;

/**
 * TTFQI (Time-to-First Qualified Introduction)
 * Target: Median ≤72 hours post-activation
 */
export const TTFQI_TARGET_HOURS = 72;

/**
 * TTV (Time-to-Value)
 * Target: Median ≤7 days (activation → interview)
 */
export const TTV_TARGET_DAYS = 7;

/**
 * SUS (System Usability Scale)
 * Target: ≥75
 */
export const SUS_TARGET_SCORE = 75;

/**
 * Well-Being Delta
 * Target: ≥60% show ≥+1 improvement on stress or control
 */
export const WELLBEING_DELTA_TARGET_PERCENT = 60;

/**
 * PAC (Purpose-Alignment Contribution) Lift
 * Target: Top-decile PAC matches show ≥20% higher intro acceptance
 */
export const PAC_LIFT_TARGET_PERCENT = 20;

/**
 * Fairness Gap
 * Target: No statistically significant negative gap
 */
export const FAIRNESS_GAP_SIGNIFICANCE_LEVEL = 0.05; // p-value threshold

// ============================================================================
// COHORT DEFINITIONS
// ============================================================================

/**
 * Role families for cohort analysis
 */
export const RoleFamily = {
  ENGINEERING: 'engineering',
  DESIGN: 'design',
  PRODUCT: 'product',
  DATA: 'data',
  OPERATIONS: 'operations',
  MARKETING: 'marketing',
  SALES: 'sales',
  HR: 'hr',
  FINANCE: 'finance',
  LEGAL: 'legal',
  OTHER: 'other',
} as const;

/**
 * Seniority levels for cohort analysis
 */
export const Seniority = {
  ENTRY: 'entry', // 0-2 years
  MID: 'mid', // 2-5 years
  SENIOR: 'senior', // 5-10 years
  LEAD: 'lead', // 10+ years
  EXECUTIVE: 'executive', // C-suite
} as const;

/**
 * Geography buckets for cohort analysis
 */
export const Geography = {
  NORTH_AMERICA: 'north_america',
  EUROPE: 'europe',
  ASIA_PACIFIC: 'asia_pacific',
  LATIN_AMERICA: 'latin_america',
  MIDDLE_EAST_AFRICA: 'middle_east_africa',
  REMOTE_GLOBAL: 'remote_global',
} as const;

// ============================================================================
// EVENT PROPERTIES SCHEMAS
// ============================================================================

/**
 * Standard properties for profile activation event
 */
export interface ProfileActivatedProperties {
  l4_count: number;
  has_proofs: boolean;
  has_mission: boolean;
  has_vision: boolean;
  has_values: boolean;
  has_causes: boolean;
  activation_duration_seconds?: number; // Time from signup to activation
}

/**
 * Standard properties for match viewed event
 */
export interface MatchViewedProperties {
  match_id: string;
  match_score: number;
  pac_value: number; // Purpose-Alignment Contribution
  skills_score: number;
  constraints_score: number;
  verification_score: number;
  assignment_id?: string;
}

/**
 * Standard properties for match actioned event
 */
export interface MatchActionedProperties {
  match_id: string;
  action: 'introduce' | 'pass' | 'snooze';
  reason?: string; // For pass/snooze
  match_score: number;
  pac_value: number;
}

/**
 * Standard properties for interview scheduled event
 */
export interface InterviewScheduledProperties {
  interview_id: string;
  assignment_id: string;
  match_id?: string;
  duration_minutes: number;
  platform: 'zoom' | 'google_meet' | 'other';
  days_since_match: number;
}

/**
 * Standard properties for contract signed event
 */
export interface ContractSignedProperties {
  assignment_id: string;
  match_id?: string;
  interview_id?: string;
  contract_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'volunteer';
  days_since_activation: number;
  days_since_first_intro: number;
}

/**
 * Standard properties for well-being check-in event
 */
export interface WellbeingCheckinProperties {
  stress_level: 1 | 2 | 3 | 4 | 5; // 1=low, 5=high
  control_level: 1 | 2 | 3 | 4 | 5; // 1=low, 5=high
  milestone?: 'rejection' | 'interview' | 'offer' | 'contract' | null;
  checkin_number: number; // Sequential count for user
}

/**
 * Standard properties for SUS survey completion
 */
export interface SUSSurveyProperties {
  score: number; // 0-100
  responses: number[]; // 10 responses, each 1-5
  trigger_point: 'post_activation' | 'post_match' | 'post_contract' | 'periodic';
}

// ============================================================================
// CACHE KEYS
// ============================================================================

/**
 * Cache keys for metric calculations
 * TTL: 1 hour per PRD Part 7
 */
export const CacheKey = {
  TTFQI_MEDIAN: 'metrics:ttfqi:median',
  TTV_MEDIAN: 'metrics:ttv:median',
  TTSC_MEDIAN: 'metrics:ttsc:median',
  WELLBEING_DELTA: 'metrics:wellbeing:delta',
  PAC_LIFT: 'metrics:pac:lift',
  FAIRNESS_GAP: 'metrics:fairness:gap',
  SUS_AVERAGE: 'metrics:sus:average',
} as const;

/**
 * Cache TTL in seconds (1 hour)
 */
export const CACHE_TTL_SECONDS = 3600;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if an event type is a lifecycle milestone
 */
export function isLifecycleEvent(eventType: string): boolean {
  return [
    EventType.PROFILE_ACTIVATED,
    EventType.FIRST_QUALIFIED_INTRO,
    EventType.INTERVIEW_SCHEDULED,
    EventType.CONTRACT_SIGNED,
  ].includes(eventType as EventTypeValue);
}

/**
 * Get human-readable event name
 */
export function getEventDisplayName(eventType: EventTypeValue): string {
  const names: Record<EventTypeValue, string> = {
    [EventType.PROFILE_CREATED]: 'Profile Created',
    [EventType.PROFILE_ACTIVATED]: 'Profile Activated',
    [EventType.PROFILE_UPDATED]: 'Profile Updated',
    [EventType.L4_SKILL_ADDED]: 'Skill Added',
    [EventType.PROOF_UPLOADED]: 'Proof Uploaded',
    [EventType.CV_IMPORTED]: 'CV Imported',
    [EventType.MATCHING_PROFILE_CREATED]: 'Matching Profile Created',
    [EventType.SHORTLIST_GENERATED]: 'Shortlist Generated',
    [EventType.MATCH_VIEWED]: 'Match Viewed',
    [EventType.MATCH_ACTIONED]: 'Match Actioned',
    [EventType.MATCH_SNOOZED]: 'Match Snoozed',
    [EventType.MATCH_UNSNOOZED]: 'Match Unsnoozed',
    [EventType.FIRST_QUALIFIED_INTRO]: 'First Qualified Introduction',
    [EventType.APPLICATION_SUBMITTED]: 'Application Submitted',
    [EventType.APPLICATION_ACCEPTED]: 'Application Accepted',
    [EventType.APPLICATION_REJECTED]: 'Application Rejected',
    [EventType.INTERVIEW_REQUESTED]: 'Interview Requested',
    [EventType.INTERVIEW_SCHEDULED]: 'Interview Scheduled',
    [EventType.INTERVIEW_COMPLETED]: 'Interview Completed',
    [EventType.INTERVIEW_NO_SHOW]: 'Interview No-Show',
    [EventType.OFFER_SENT]: 'Offer Sent',
    [EventType.OFFER_ACCEPTED]: 'Offer Accepted',
    [EventType.CONTRACT_SIGNED]: 'Contract Signed',
    [EventType.ASSIGNMENT_CREATED]: 'Assignment Created',
    [EventType.ASSIGNMENT_PUBLISHED]: 'Assignment Published',
    [EventType.WELLBEING_OPT_IN]: 'Well-being Opt-In',
    [EventType.WELLBEING_CHECKIN]: 'Well-being Check-In',
    [EventType.WELLBEING_REFLECTION]: 'Well-being Reflection',
    [EventType.SUS_SURVEY_COMPLETED]: 'SUS Survey Completed',
    [EventType.TOUR_STARTED]: 'Tour Started',
    [EventType.TOUR_COMPLETED]: 'Tour Completed',
    [EventType.TOUR_SKIPPED]: 'Tour Skipped',
    [EventType.VISIBILITY_CHANGED]: 'Visibility Changed',
    [EventType.REDACT_MODE_TOGGLED]: 'Redact Mode Toggled',
  };

  return names[eventType] || eventType;
}
