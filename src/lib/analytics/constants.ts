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
  PURPOSE_UPDATED: 'purpose_updated',

  // Expertise & Skills
  L4_SKILL_ADDED: 'l4_skill_added',
  PROOF_UPLOADED: 'proof_uploaded',
  CV_IMPORTED: 'cv_imported',

  // Matching
  MATCH_GENERATED: 'match_generated',
  MATCHING_PROFILE_CREATED: 'matching_profile_created',
  SHORTLIST_GENERATED: 'shortlist_generated',
  MATCH_VIEWED: 'match_viewed',
  MATCH_ACTIONED: 'match_actioned', // intro, pass, snooze
  MATCH_INTRODUCED: 'match_introduced',
  MATCH_SNOOZED: 'match_snoozed',
  MATCH_UNSNOOZED: 'match_unsnoozed',
  FIRST_MATCH_SHOWN: 'first_match_shown',
  MATCHING_FOCUS_UPDATED: 'matching_focus_updated',
  MATCHING_WEIGHT_BIAS_CHANGED: 'matching_weight_bias_changed',
  MATCHING_GATED_NOT_MATCHABLE: 'matching_gated_not_matchable',

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

  // Decisions
  DECISION_MADE: 'decision_made',

  // Organizations
  ASSIGNMENT_CREATED: 'assignment_created',
  ASSIGNMENT_PUBLISHED: 'assignment_published',
  TTFQI_WARNING_EMITTED: 'ttfqi_warning_emitted',
  CANDIDATE_INVITE_SENT: 'candidate_invite_sent',
  CANDIDATE_INVITE_OPENED: 'candidate_invite_opened',
  CANDIDATE_INVITE_CLAIMED: 'candidate_invite_claimed',
  CANDIDATE_PROOF_CARD_SUBMITTED: 'candidate_proof_card_submitted',

  // Well-being (Zen Hub)
  WELLBEING_OPT_IN: 'wellbeing_opt_in',
  WELLBEING_CHECKIN: 'wellbeing_checkin',
  WELLBEING_REFLECTION: 'wellbeing_reflection',
  WELLBEING_CHECKIN_SUBMITTED: 'wellbeing_checkin_submitted',
  WELLBEING_OPT_IN_CHANGED: 'wellbeing_opt_in_changed',
  REFLECTION_ADDED: 'reflection_added',

  // Usability
  SUS_SURVEY_COMPLETED: 'sus_survey_completed',
  TOUR_STARTED: 'tour_started',
  TOUR_COMPLETED: 'tour_completed',
  TOUR_SKIPPED: 'tour_skipped',
  PRIVACY_BANNER_ACKNOWLEDGED: 'privacy_banner_acknowledged',

  // Verification & attestations
  ATTESTATION_REQUESTED: 'attestation_requested',
  ATTESTATION_PROVIDED: 'attestation_provided',

  // Skill proof events
  SKILL_PROOF_ADDED: 'skill_proof_added',
  SKILL_PROOF_DELETED: 'skill_proof_deleted',

  // Privacy
  VISIBILITY_CHANGED: 'visibility_changed',
  REDACT_MODE_TOGGLED: 'redact_mode_toggled',
  PRIVACY_SETTINGS_UPDATED: 'privacy_settings_updated',
  // Performance and diagnostics
  PERFORMANCE_METRIC: 'performance_metric',
  PAGE_VIEW: 'page',
  API_EVENT: 'api',
  WEB_VITAL: 'web_vital',
  CUSTOM_EVENT: 'custom',
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
export function isLifecycleEvent(eventType: EventTypeValue): boolean {
  const lifecycleEvents: EventTypeValue[] = [
    EventType.PROFILE_ACTIVATED,
    EventType.FIRST_QUALIFIED_INTRO,
    EventType.INTERVIEW_SCHEDULED,
    EventType.CONTRACT_SIGNED,
  ];
  return lifecycleEvents.includes(eventType);
}

/**
 * Get human-readable event name
 */
export function getEventDisplayName(eventType: EventTypeValue): string {
  const names: Record<EventTypeValue, string> = {
    [EventType.PROFILE_CREATED]: 'Profile Created',
    [EventType.PROFILE_ACTIVATED]: 'Profile Activated',
    [EventType.PROFILE_UPDATED]: 'Profile Updated',
    [EventType.PURPOSE_UPDATED]: 'Purpose Updated',
    [EventType.L4_SKILL_ADDED]: 'Skill Added',
    [EventType.PROOF_UPLOADED]: 'Proof Uploaded',
    [EventType.CV_IMPORTED]: 'CV Imported',
    [EventType.MATCH_GENERATED]: 'Match Generated',
    [EventType.MATCHING_PROFILE_CREATED]: 'Matching Profile Created',
    [EventType.SHORTLIST_GENERATED]: 'Shortlist Generated',
    [EventType.MATCH_VIEWED]: 'Match Viewed',
    [EventType.MATCH_ACTIONED]: 'Match Actioned',
    [EventType.MATCH_INTRODUCED]: 'Match Introduced',
    [EventType.MATCH_SNOOZED]: 'Match Snoozed',
    [EventType.MATCH_UNSNOOZED]: 'Match Unsnoozed',
    [EventType.FIRST_MATCH_SHOWN]: 'First Match Shown',
    [EventType.MATCHING_FOCUS_UPDATED]: 'Matching Focus Updated',
    [EventType.MATCHING_WEIGHT_BIAS_CHANGED]: 'Matching Weight Bias Changed',
    [EventType.MATCHING_GATED_NOT_MATCHABLE]: 'Matching Gated Not Matchable',
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
    [EventType.DECISION_MADE]: 'Decision Made',
    [EventType.ASSIGNMENT_CREATED]: 'Assignment Created',
    [EventType.ASSIGNMENT_PUBLISHED]: 'Assignment Published',
    [EventType.TTFQI_WARNING_EMITTED]: 'TTFQI Warning Emitted',
    [EventType.WELLBEING_OPT_IN]: 'Well-being Opt-In',
    [EventType.WELLBEING_CHECKIN]: 'Well-being Check-In',
    [EventType.WELLBEING_REFLECTION]: 'Well-being Reflection',
    [EventType.WELLBEING_CHECKIN_SUBMITTED]: 'Well-being Check-In Submitted',
    [EventType.WELLBEING_OPT_IN_CHANGED]: 'Well-being Opt-In Changed',
    [EventType.REFLECTION_ADDED]: 'Reflection Added',
    [EventType.SUS_SURVEY_COMPLETED]: 'SUS Survey Completed',
    [EventType.TOUR_STARTED]: 'Tour Started',
    [EventType.TOUR_COMPLETED]: 'Tour Completed',
    [EventType.TOUR_SKIPPED]: 'Tour Skipped',
    [EventType.PRIVACY_BANNER_ACKNOWLEDGED]: 'Privacy Banner Acknowledged',
    [EventType.ATTESTATION_REQUESTED]: 'Attestation Requested',
    [EventType.ATTESTATION_PROVIDED]: 'Attestation Provided',
    [EventType.SKILL_PROOF_ADDED]: 'Skill Proof Added',
    [EventType.SKILL_PROOF_DELETED]: 'Skill Proof Deleted',
    [EventType.CANDIDATE_INVITE_SENT]: 'Candidate Invite Sent',
    [EventType.CANDIDATE_INVITE_OPENED]: 'Candidate Invite Opened',
    [EventType.CANDIDATE_INVITE_CLAIMED]: 'Candidate Invite Claimed',
    [EventType.CANDIDATE_PROOF_CARD_SUBMITTED]: 'Candidate Proof Card Submitted',
    [EventType.VISIBILITY_CHANGED]: 'Visibility Changed',
    [EventType.REDACT_MODE_TOGGLED]: 'Redact Mode Toggled',
    [EventType.PRIVACY_SETTINGS_UPDATED]: 'Privacy Settings Updated',
    [EventType.PERFORMANCE_METRIC]: 'Performance Metric',
    [EventType.PAGE_VIEW]: 'Page View',
    [EventType.API_EVENT]: 'API Event',
    [EventType.WEB_VITAL]: 'Web Vital',
    [EventType.CUSTOM_EVENT]: 'Custom Event',
  };

  return names[eventType] || eventType;
}
