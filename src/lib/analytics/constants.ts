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
  // Onboarding
  INDIVIDUAL_ONBOARDING_COMPLETED: 'individual_onboarding_completed',
  ORGANIZATION_ONBOARDING_COMPLETED: 'organization_onboarding_completed',

  // Profile & Activation
  PROFILE_CREATED: 'profile_created',
  PROFILE_ACTIVATED: 'profile_activated', // Minimum L4 skills + matchable
  PROFILE_UPDATED: 'profile_updated',
  PURPOSE_UPDATED: 'purpose_updated',
  PORTFOLIO_SHARE_LINK_COPIED: 'portfolio_share_link_copied',
  PORTFOLIO_PREVIEW_OPENED: 'portfolio_preview_opened',
  PORTFOLIO_PDF_EXPORT_SUCCEEDED: 'portfolio_pdf_export_succeeded',
  PORTFOLIO_READY_ACHIEVED: 'portfolio_ready_achieved',
  BROWSE_READY_ACHIEVED: 'browse_ready_achieved',
  QUALIFIED_INTRO_READY_ACHIEVED: 'qualified_intro_ready_achieved',
  TRUST_LEVEL_EVALUATED: 'trust_level_evaluated',
  TRUST_LEVEL_CHANGED: 'trust_level_changed',
  INTRO_QUALIFICATION_BLOCKED: 'intro_qualification_blocked',
  INTRO_QUALIFICATION_RESTORED: 'intro_qualification_restored',
  INTRO_REQUEST_HELD_DUE_TO_REGRESSION: 'intro_request_held_due_to_regression',
  PROOF_LINKED_SKILL_COUNT_CHANGED: 'proof_linked_skill_count_changed',
  QUALIFYING_PROOF_FRESHNESS_LAPSED: 'qualifying_proof_freshness_lapsed',

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
  ASSIGNMENT_PUBLISH_SUCCEEDED: 'assignment_publish_succeeded',
  ASSIGNMENT_TEMPLATE_APPLIED: 'assignment_template_applied',
  TTFQI_WARNING_EMITTED: 'ttfqi_warning_emitted',
  CANDIDATE_INVITE_SENT: 'candidate_invite_sent',
  CANDIDATE_INVITE_OPENED: 'candidate_invite_opened',
  CANDIDATE_INVITE_CLAIMED: 'candidate_invite_claimed',
  CANDIDATE_PROOF_CARD_SUBMITTED: 'candidate_proof_card_submitted',

  // Proof, trust, and workflow lifecycle
  PROOF_ARTIFACT_CREATED: 'proof_artifact_created',
  PROOF_ARTIFACT_UPDATED: 'proof_artifact_updated',
  PROOF_ARTIFACT_DELETED: 'proof_artifact_deleted',
  PROOF_PACK_CREATED: 'proof_pack_created',
  PROOF_PACK_DELETED: 'proof_pack_deleted',
  PROOF_PACK_FRESHNESS_STATE_CHANGED: 'proof_pack_freshness_state_changed',
  PROOF_FRESHNESS_STATE_CHANGED: 'proof_freshness_state_changed',
  PROOF_FRESHNESS_NUDGE_QUEUED: 'proof_freshness_nudge_queued',
  PROOF_FRESHNESS_NUDGE_SENT: 'proof_freshness_nudge_sent',
  VERIFICATION_REQUEST_CREATED: 'verification_request_created',
  VERIFICATION_REQUEST_RESENT: 'verification_request_resent',
  VERIFICATION_REQUEST_EXPIRED: 'verification_request_expired',
  VERIFICATION_RESPONSE_RECORDED: 'verification_response_recorded',
  VERIFICATION_RECORD_COMPLETED: 'verification_record_completed',
  VERIFICATION_RECORD_FAILED: 'verification_record_failed',
  REVEAL_REQUESTED: 'reveal_requested',
  REVEAL_GRANTED: 'reveal_granted',
  REVEAL_DENIED: 'reveal_denied',
  INTRO_WORKFLOW_EXPIRED: 'intro_workflow_expired',
  INTRO_WORKFLOW_WITHDRAWN: 'intro_workflow_withdrawn',
  INTERVIEW_NO_SHOW_RECORDED: 'interview_no_show_recorded',
  REVIEW_OVERRIDE_APPLIED: 'review_override_applied',
  REVIEW_OVERRIDE_REVERTED: 'review_override_reverted',
  PORTFOLIO_PUBLICATION_STATE_CHANGED: 'portfolio_publication_state_changed',
  PORTFOLIO_INDEXING_STATE_CHANGED: 'portfolio_indexing_state_changed',
  FALLBACK_ENTERED: 'fallback_entered',
  FALLBACK_RESOLVED: 'fallback_resolved',
  INTRO_HOLD_CREATED: 'intro_hold_created',
  INTRO_HOLD_RELEASED: 'intro_hold_released',
  STRUCTURED_FEEDBACK_SUBMITTED: 'structured_feedback_submitted',
  OPERATOR_OVERRIDE_LOGGED: 'operator_override_logged',
  SYNTHETIC_CHECK_FAILED: 'synthetic_check_failed',

  // Usability
  SUS_SURVEY_COMPLETED: 'sus_survey_completed',
  TOUR_STARTED: 'tour_started',
  TOUR_COMPLETED: 'tour_completed',
  TOUR_SKIPPED: 'tour_skipped',

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
  API_LATENCY: 'api_latency',
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
 * Proof Fit Lift
 * Target: top-decile proof-fit matches show at least 20% higher intro acceptance
 */
export const PAC_LIFT_TARGET_PERCENT = 20;

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
  pac_value: number; // Legacy proof-fit lift value
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
  PAC_LIFT: 'metrics:pac:lift',
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
    [EventType.INDIVIDUAL_ONBOARDING_COMPLETED]: 'Individual Onboarding Completed',
    [EventType.ORGANIZATION_ONBOARDING_COMPLETED]: 'Organization Onboarding Completed',
    [EventType.PROFILE_CREATED]: 'Profile Created',
    [EventType.PROFILE_ACTIVATED]: 'Profile Activated',
    [EventType.PROFILE_UPDATED]: 'Profile Updated',
    [EventType.PURPOSE_UPDATED]: 'Purpose Updated',
    [EventType.PORTFOLIO_SHARE_LINK_COPIED]: 'Portfolio Share Link Copied',
    [EventType.PORTFOLIO_PREVIEW_OPENED]: 'Portfolio Preview Opened',
    [EventType.PORTFOLIO_PDF_EXPORT_SUCCEEDED]: 'Portfolio PDF Export Succeeded',
    [EventType.PORTFOLIO_READY_ACHIEVED]: 'Portfolio Ready Achieved',
    [EventType.BROWSE_READY_ACHIEVED]: 'Browse Ready Achieved',
    [EventType.QUALIFIED_INTRO_READY_ACHIEVED]: 'Qualified Intro Ready Achieved',
    [EventType.TRUST_LEVEL_EVALUATED]: 'Trust Level Evaluated',
    [EventType.TRUST_LEVEL_CHANGED]: 'Trust Level Changed',
    [EventType.INTRO_QUALIFICATION_BLOCKED]: 'Intro Qualification Blocked',
    [EventType.INTRO_QUALIFICATION_RESTORED]: 'Intro Qualification Restored',
    [EventType.INTRO_REQUEST_HELD_DUE_TO_REGRESSION]: 'Intro Request Held Due To Regression',
    [EventType.PROOF_LINKED_SKILL_COUNT_CHANGED]: 'Proof-Linked Skill Count Changed',
    [EventType.QUALIFYING_PROOF_FRESHNESS_LAPSED]: 'Qualifying Proof Freshness Lapsed',
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
    [EventType.ASSIGNMENT_PUBLISH_SUCCEEDED]: 'Assignment Publish Succeeded',
    [EventType.ASSIGNMENT_TEMPLATE_APPLIED]: 'Assignment Template Applied',
    [EventType.TTFQI_WARNING_EMITTED]: 'TTFQI Warning Emitted',
    [EventType.SUS_SURVEY_COMPLETED]: 'SUS Survey Completed',
    [EventType.TOUR_STARTED]: 'Tour Started',
    [EventType.TOUR_COMPLETED]: 'Tour Completed',
    [EventType.TOUR_SKIPPED]: 'Tour Skipped',
    [EventType.ATTESTATION_REQUESTED]: 'Attestation Requested',
    [EventType.ATTESTATION_PROVIDED]: 'Attestation Provided',
    [EventType.SKILL_PROOF_ADDED]: 'Skill Proof Added',
    [EventType.SKILL_PROOF_DELETED]: 'Skill Proof Deleted',
    [EventType.CANDIDATE_INVITE_SENT]: 'Candidate Invite Sent',
    [EventType.CANDIDATE_INVITE_OPENED]: 'Candidate Invite Opened',
    [EventType.CANDIDATE_INVITE_CLAIMED]: 'Candidate Invite Claimed',
    [EventType.CANDIDATE_PROOF_CARD_SUBMITTED]: 'Candidate Proof Card Submitted',
    [EventType.PROOF_ARTIFACT_CREATED]: 'Proof Artifact Created',
    [EventType.PROOF_ARTIFACT_UPDATED]: 'Proof Artifact Updated',
    [EventType.PROOF_ARTIFACT_DELETED]: 'Proof Artifact Deleted',
    [EventType.PROOF_PACK_CREATED]: 'Proof Pack Created',
    [EventType.PROOF_PACK_DELETED]: 'Proof Pack Deleted',
    [EventType.PROOF_PACK_FRESHNESS_STATE_CHANGED]: 'Proof Pack Freshness State Changed',
    [EventType.PROOF_FRESHNESS_STATE_CHANGED]: 'Proof Freshness State Changed',
    [EventType.PROOF_FRESHNESS_NUDGE_QUEUED]: 'Proof Freshness Nudge Queued',
    [EventType.PROOF_FRESHNESS_NUDGE_SENT]: 'Proof Freshness Nudge Sent',
    [EventType.VERIFICATION_REQUEST_CREATED]: 'Verification Request Created',
    [EventType.VERIFICATION_REQUEST_RESENT]: 'Verification Request Resent',
    [EventType.VERIFICATION_REQUEST_EXPIRED]: 'Verification Request Expired',
    [EventType.VERIFICATION_RESPONSE_RECORDED]: 'Verification Response Recorded',
    [EventType.VERIFICATION_RECORD_COMPLETED]: 'Verification Record Completed',
    [EventType.VERIFICATION_RECORD_FAILED]: 'Verification Record Failed',
    [EventType.REVEAL_REQUESTED]: 'Reveal Requested',
    [EventType.REVEAL_GRANTED]: 'Reveal Granted',
    [EventType.REVEAL_DENIED]: 'Reveal Denied',
    [EventType.INTRO_WORKFLOW_EXPIRED]: 'Intro Workflow Expired',
    [EventType.INTRO_WORKFLOW_WITHDRAWN]: 'Intro Workflow Withdrawn',
    [EventType.INTERVIEW_NO_SHOW_RECORDED]: 'Interview No-Show Recorded',
    [EventType.REVIEW_OVERRIDE_APPLIED]: 'Review Override Applied',
    [EventType.REVIEW_OVERRIDE_REVERTED]: 'Review Override Reverted',
    [EventType.PORTFOLIO_PUBLICATION_STATE_CHANGED]: 'Portfolio Publication State Changed',
    [EventType.PORTFOLIO_INDEXING_STATE_CHANGED]: 'Portfolio Indexing State Changed',
    [EventType.FALLBACK_ENTERED]: 'Fallback Entered',
    [EventType.FALLBACK_RESOLVED]: 'Fallback Resolved',
    [EventType.INTRO_HOLD_CREATED]: 'Intro Hold Created',
    [EventType.INTRO_HOLD_RELEASED]: 'Intro Hold Released',
    [EventType.STRUCTURED_FEEDBACK_SUBMITTED]: 'Structured Feedback Submitted',
    [EventType.OPERATOR_OVERRIDE_LOGGED]: 'Operator Override Logged',
    [EventType.SYNTHETIC_CHECK_FAILED]: 'Synthetic Check Failed',
    [EventType.VISIBILITY_CHANGED]: 'Visibility Changed',
    [EventType.REDACT_MODE_TOGGLED]: 'Redact Mode Toggled',
    [EventType.PRIVACY_SETTINGS_UPDATED]: 'Privacy Settings Updated',
    [EventType.API_LATENCY]: 'API Latency',
    [EventType.PERFORMANCE_METRIC]: 'Performance Metric',
    [EventType.PAGE_VIEW]: 'Page View',
    [EventType.API_EVENT]: 'API Event',
    [EventType.WEB_VITAL]: 'Web Vital',
    [EventType.CUSTOM_EVENT]: 'Custom Event',
  };

  return names[eventType] || eventType;
}
