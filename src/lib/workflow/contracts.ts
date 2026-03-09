import {
  canonicalAssignmentWorkflowStates,
  canonicalConsentObligationStates,
  canonicalDecisionWorkflowStates,
  canonicalDeletionLifecycleStates,
  canonicalExportLifecycleStates,
  canonicalImportLifecycleStates,
  canonicalInterviewWorkflowStates,
  canonicalIntroWorkflowStates,
  canonicalMatchLifecycleStates,
  canonicalOrgInviteLifecycleStates,
  canonicalProfileLifecycleStates,
  canonicalProofArtifactLifecycleStates,
  canonicalVerificationStatuses,
  canonicalVerificationInviteLifecycleStates,
  canonicalWorkflowActorTypes,
} from '@/db/schema';

export type WorkflowActorType = (typeof canonicalWorkflowActorTypes)[number];
export type AssignmentWorkflowState = (typeof canonicalAssignmentWorkflowStates)[number];
export type IntroWorkflowState = (typeof canonicalIntroWorkflowStates)[number];
export type InterviewWorkflowState = (typeof canonicalInterviewWorkflowStates)[number];
export type DecisionWorkflowState = (typeof canonicalDecisionWorkflowStates)[number];
export type VerificationWorkflowState = (typeof canonicalVerificationStatuses)[number];
export type ConsentObligationState = (typeof canonicalConsentObligationStates)[number];
export type ProfileLifecycleState = (typeof canonicalProfileLifecycleStates)[number];
export type ProofArtifactLifecycleState = (typeof canonicalProofArtifactLifecycleStates)[number];
export type MatchLifecycleState = (typeof canonicalMatchLifecycleStates)[number];
export type VerificationInviteLifecycleState =
  (typeof canonicalVerificationInviteLifecycleStates)[number];
export type OrgInviteLifecycleState = (typeof canonicalOrgInviteLifecycleStates)[number];
export type ExportLifecycleState = (typeof canonicalExportLifecycleStates)[number];
export type ImportLifecycleState = (typeof canonicalImportLifecycleStates)[number];
export type DeletionLifecycleState = (typeof canonicalDeletionLifecycleStates)[number];

export type WorkflowMachineName =
  | 'assignment'
  | 'intro'
  | 'interview'
  | 'decision'
  | 'verification'
  | 'consent';

export const RESIDUAL_LIFECYCLE_APPENDIX = {
  profile: {
    states: canonicalProfileLifecycleStates,
    initialState: 'draft',
    terminalStates: ['deleted'],
    allowedTransitions: {
      draft: ['active_private', 'active_matchable', 'restricted', 'deleted'],
      active_private: ['active_matchable', 'restricted', 'deleted'],
      active_matchable: ['active_private', 'restricted', 'deleted'],
      restricted: ['active_private', 'active_matchable', 'deleted'],
      deleted: [],
    },
    timeoutBehavior:
      'No default timeout. Consent expiry or policy restriction persists restricted.',
    actorOwnership: {
      candidate: ['activate_profile', 'enable_matchability', 'request_deletion'],
      system: ['apply_restriction', 'clear_restriction', 'finalize_deletion'],
      platform_admin: ['apply_restriction', 'clear_restriction'],
    },
    requiredTimestamps: [
      'created_at',
      'activated_at',
      'matchable_at',
      'restricted_at',
      'deleted_at',
    ],
    requiredAuditEvents: [
      'profile_created',
      'profile_activated',
      'profile_matchable_enabled',
      'profile_restricted',
      'profile_deleted',
    ],
  },
  proofArtifact: {
    states: canonicalProofArtifactLifecycleStates,
    initialState: 'draft',
    terminalStates: ['revoked', 'deleted'],
    allowedTransitions: {
      draft: ['active', 'deleted'],
      active: ['expiring', 'expired', 'revoked', 'deleted'],
      expiring: ['active', 'expired', 'revoked', 'deleted'],
      expired: ['active', 'revoked', 'deleted'],
      revoked: [],
      deleted: [],
    },
    timeoutBehavior:
      'expires_at persists expiring/expired. Deleted and revoked artifacts are excluded from exports and public surfaces.',
    actorOwnership: {
      candidate: ['create_artifact', 'replace_artifact', 'revoke_artifact', 'delete_artifact'],
      organization_member: [],
      system: ['mark_expiring', 'mark_expired', 'cleanup_deleted_artifact'],
      platform_admin: ['revoke_artifact', 'delete_artifact'],
    },
    requiredTimestamps: [
      'created_at',
      'activated_at',
      'expires_at',
      'expired_at',
      'revoked_at',
      'deleted_at',
      'cleanup_completed_at',
    ],
    requiredAuditEvents: [
      'proof_artifact_created',
      'proof_artifact_updated',
      'proof_freshness_state_changed',
      'proof_freshness_nudge_queued',
      'proof_freshness_nudge_sent',
      'proof_artifact_revoked',
      'proof_artifact_deleted',
    ],
  },
  match: {
    states: canonicalMatchLifecycleStates,
    initialState: 'generated',
    terminalStates: ['closed'],
    allowedTransitions: {
      generated: ['shortlisted', 'passed', 'stale', 'hidden_due_to_policy', 'closed'],
      shortlisted: ['passed', 'intro_in_progress', 'stale', 'hidden_due_to_policy', 'closed'],
      passed: ['intro_in_progress', 'stale', 'hidden_due_to_policy', 'closed'],
      intro_in_progress: [
        'shortlisted',
        'interview_in_progress',
        'stale',
        'hidden_due_to_policy',
        'closed',
      ],
      interview_in_progress: ['closed', 'stale', 'hidden_due_to_policy'],
      stale: ['generated', 'shortlisted', 'closed'],
      hidden_due_to_policy: ['generated', 'shortlisted', 'closed'],
      closed: [],
    },
    timeoutBehavior:
      'Stale-match reconciliation persists stale. Fairness or policy suppression persists hidden_due_to_policy.',
    actorOwnership: {
      candidate: [],
      organization_member: ['shortlist_match', 'pass_match', 'close_match'],
      system: ['generate_match', 'mark_match_stale', 'hide_match_due_to_policy', 'close_match'],
      platform_admin: ['hide_match_due_to_policy', 'close_match'],
    },
    requiredTimestamps: [
      'generated_at',
      'shortlisted_at',
      'passed_at',
      'intro_started_at',
      'interview_started_at',
      'stale_at',
      'hidden_due_to_policy_at',
      'closed_at',
    ],
    requiredAuditEvents: [
      'match_generated',
      'match_shortlisted',
      'match_passed',
      'match_intro_started',
      'match_interview_started',
      'match_marked_stale',
      'match_hidden_due_to_policy',
      'match_closed',
    ],
  },
  verificationInvite: {
    states: canonicalVerificationInviteLifecycleStates,
    initialState: 'pending',
    terminalStates: ['accepted', 'declined', 'expired', 'revoked', 'cancelled'],
    allowedTransitions: {
      pending: ['opened', 'accepted', 'declined', 'expired', 'revoked', 'cancelled'],
      opened: ['accepted', 'declined', 'expired', 'revoked', 'cancelled'],
      accepted: [],
      declined: [],
      expired: [],
      revoked: [],
      cancelled: [],
    },
    timeoutBehavior:
      'Expiry is persisted explicitly. Accepted and declined invites link to the resulting verification record.',
    actorOwnership: {
      candidate: ['send_verification_invite', 'cancel_verification_invite'],
      organization_member: [],
      system: ['expire_verification_invite', 'send_verification_reminder'],
      platform_admin: ['revoke_verification_invite'],
    },
    requiredTimestamps: [
      'created_at',
      'opened_at',
      'responded_at',
      'expires_at',
      'expired_at',
      'revoked_at',
      'cancelled_at',
    ],
    requiredAuditEvents: [
      'verification_invite_created',
      'verification_invite_opened',
      'verification_invite_accepted',
      'verification_invite_declined',
      'verification_invite_expired',
      'verification_invite_revoked',
      'verification_invite_resent',
    ],
  },
  orgInvite: {
    states: canonicalOrgInviteLifecycleStates,
    initialState: 'pending',
    terminalStates: ['accepted', 'expired', 'revoked'],
    allowedTransitions: {
      pending: ['accepted', 'expired', 'revoked'],
      accepted: [],
      expired: [],
      revoked: [],
    },
    timeoutBehavior:
      'Expired invites remain queryable. Accepted invites are retained instead of being deleted.',
    actorOwnership: {
      organization_member: ['send_org_invite', 'resend_org_invite', 'revoke_org_invite'],
      candidate: ['accept_org_invite'],
      system: ['expire_org_invite'],
      platform_admin: ['revoke_org_invite'],
    },
    requiredTimestamps: [
      'created_at',
      'last_sent_at',
      'accepted_at',
      'expires_at',
      'expired_at',
      'revoked_at',
    ],
    requiredAuditEvents: [
      'org_invite_sent',
      'org_invite_resent',
      'org_invite_accepted',
      'org_invite_expired',
      'org_invite_revoked',
    ],
  },
  export: {
    states: canonicalExportLifecycleStates,
    initialState: 'requested',
    terminalStates: ['downloaded', 'expired', 'failed', 'cancelled'],
    allowedTransitions: {
      requested: ['preparing', 'failed', 'cancelled'],
      preparing: ['ready', 'failed', 'cancelled'],
      ready: ['downloaded', 'expired', 'cancelled'],
      downloaded: [],
      expired: [],
      failed: [],
      cancelled: [],
    },
    timeoutBehavior:
      'Ready exports receive a fixed TTL and are blocked when the subject enters deletion.',
    actorOwnership: {
      candidate: ['request_export', 'download_export', 'cancel_export'],
      organization_member: [],
      system: ['prepare_export', 'expire_export', 'block_export_due_to_deletion'],
      platform_admin: ['cancel_export'],
    },
    requiredTimestamps: [
      'requested_at',
      'ready_at',
      'downloaded_at',
      'expires_at',
      'failed_at',
      'cancelled_at',
    ],
    requiredAuditEvents: [
      'export_requested',
      'export_ready',
      'export_downloaded',
      'export_expired',
      'export_failed',
      'export_cancelled',
    ],
  },
  import: {
    states: canonicalImportLifecycleStates,
    initialState: 'uploaded',
    terminalStates: ['completed', 'rejected', 'expired', 'failed', 'cancelled'],
    allowedTransitions: {
      uploaded: ['validating', 'cancelled'],
      validating: ['awaiting_confirmation', 'rejected', 'failed', 'cancelled'],
      awaiting_confirmation: ['applying', 'expired', 'cancelled'],
      applying: ['completed', 'failed'],
      completed: [],
      rejected: [],
      expired: [],
      failed: [],
      cancelled: [],
    },
    timeoutBehavior:
      'Staged imports expire if they are not confirmed within the retention window. Failed validation applies no writes.',
    actorOwnership: {
      candidate: ['upload_import', 'confirm_import', 'cancel_import'],
      organization_member: [],
      system: ['validate_import', 'apply_import', 'expire_import'],
      platform_admin: ['cancel_import'],
    },
    requiredTimestamps: [
      'uploaded_at',
      'validated_at',
      'confirmed_at',
      'applied_at',
      'completed_at',
      'expired_at',
      'failed_at',
      'cancelled_at',
    ],
    requiredAuditEvents: [
      'import_uploaded',
      'import_validated',
      'import_confirmed',
      'import_applied',
      'import_completed',
      'import_rejected',
      'import_expired',
      'import_failed',
    ],
  },
  deletion: {
    states: canonicalDeletionLifecycleStates,
    initialState: 'requested',
    terminalStates: ['deleted', 'failed_requires_manual_review'],
    allowedTransitions: {
      requested: ['processing', 'blocked_legal_hold', 'failed_requires_manual_review'],
      blocked_legal_hold: ['processing', 'failed_requires_manual_review'],
      processing: ['deleted', 'failed_requires_manual_review'],
      deleted: [],
      failed_requires_manual_review: [],
    },
    timeoutBehavior:
      'No grace-period state. Long-running processing jobs alert instead of silently lingering.',
    actorOwnership: {
      candidate: ['request_deletion'],
      organization_member: [],
      system: ['start_deletion_processing', 'complete_deletion', 'fail_deletion'],
      platform_admin: ['block_deletion_legal_hold', 'release_deletion_legal_hold'],
    },
    requiredTimestamps: [
      'requested_at',
      'processing_started_at',
      'blocked_at',
      'deleted_at',
      'failed_at',
    ],
    requiredAuditEvents: [
      'deletion_requested',
      'deletion_blocked',
      'deletion_processing_started',
      'deletion_completed',
      'deletion_failed',
    ],
  },
} as const;

export type ResidualLifecycleMachineName = keyof typeof RESIDUAL_LIFECYCLE_APPENDIX;

export const APPLICATION_VS_INTRO_CONTRACT = {
  areSeparateObjects: true,
  relationship:
    'Match is a scored eligibility record. Intro is the bilateral workflow that begins when a scored match or candidate invite is actively pursued. Application is explicit candidate intent submitted through an application surface and may create at most one intro for a candidate-assignment pair.',
  currentMvpPolicy:
    'Intro remains the canonical pursuit workflow until a first-class self-serve application object ships. Launch-safe lifecycle behavior is defined by the canonical relationship lifecycle contract below.',
  duplicationRules: [
    'At most one active intro may exist per candidate_profile_id and assignment_id.',
    'Duplicate applications may only exist as resubmissions after a terminal outcome.',
    'A duplicate application must never create a second active intro.',
  ],
  reopenRules: [
    'Withdrawn intros do not reopen in place. Re-entry requires a new intro attempt after a terminal loss state.',
    'Expired, duplicate_candidate, and closed intros remain terminal and require a new intro attempt.',
    'No-show interview records remain terminal. Recovery uses a new interview attempt, not a state mutation on the same no-show record.',
  ],
  ownership: {
    candidate: ['submit_application', 'withdraw_application', 'express_intro_interest'],
    organization_member: [
      'shortlist_match',
      'advance_intro',
      'schedule_interview',
      'record_decision',
    ],
    system: ['expire_intro', 'mark_match_stale', 'enforce_duplicate_intro_guard'],
  },
} as const;

export const CANONICAL_RELATIONSHIP_LIFECYCLE_CONTRACT = {
  version: 'relationship-lifecycle/v1',
  sourceOfTruth:
    'PRD_TECHNICAL_REQUIREMENTS.md Section 7 and PRD_for_a_web_platform_MVP.master-latest.md O11.1',
  aggregateOutcomeStates: ['active', 'closed_won', 'closed_lost'] as const,
  objects: {
    matchReviewState: {
      purpose: 'Blind review and shortlist posture only.',
      productStates: ['generated', 'shortlisted', 'passed', 'closed'] as const,
    },
    introWorkflow: {
      purpose: 'Bilateral intro intent.',
      productStates: [
        'intro_pending',
        'intro_accepted',
        'intro_declined',
        'intro_expired',
        'withdraw',
      ] as const,
      backendMapping: {
        intro_pending: ['pending_candidate_interest', 'pending_org_interest'],
        intro_accepted: ['mutual'],
        intro_declined: ['closed'],
        intro_expired: ['expired'],
        withdraw: ['withdrawn'],
      },
    },
    revealRequest: {
      purpose: 'Identity-bearing reveal gate.',
      productStates: ['reveal_pending', 'reveal_completed'] as const,
    },
    interview: {
      purpose: 'Scheduling and attendance.',
      productStates: [
        'interview_pending',
        'interview_scheduled',
        'interview_rescheduled',
        'interview_cancelled',
        'interview_completed',
        'no_show_reported',
      ] as const,
    },
    decision: {
      purpose: 'Organization outcome after interview.',
      productStates: ['decision_pending', 'advance', 'hold', 'reject', 'hire', 'withdraw'] as const,
    },
    feedbackRecord: {
      purpose: 'Candidate-visible closure and acknowledgement tracking.',
      productStates: [
        'feedback_pending',
        'feedback_submitted',
        'feedback_delivered',
        'feedback_acknowledged',
        'feedback_expired',
      ] as const,
    },
  },
  policy: {
    reveal: {
      trigger: 'organization_member_request',
      requiresCandidateApproval: true,
      autoRevealOnMutualIntro: false,
      declineOrTimeoutReturnsTo: 'intro_accepted',
      timeoutHours: 72,
    },
    intro: {
      singleActiveIntroPerCandidateAssignment: true,
      parallelAcrossAssignmentsAllowed: true,
      reentryRequiresNewIntroAttempt: true,
      terminalLossStates: [
        'intro_declined',
        'intro_expired',
        'reject',
        'withdraw',
        'closed_lost',
      ] as const,
    },
    interview: {
      rescheduleUsesSameInterviewId: true,
      maxReschedules: 1,
      cancellationRecoveryStartsAt: 'interview_pending',
      noShowRecoveryStartsAt: 'interview_pending',
      noShowRecordReopensInPlace: false,
    },
    feedback: {
      candidateVisibleFields: ['personalized_note', 'suggested_next_step'] as const,
      internalOnlyFields: ['internal_note'] as const,
      tokenTtlDays: 7,
      postInterviewWithdrawalStillRequiresVisibleFeedback: true,
    },
  },
  timers: {
    introExpiryDays: 14,
    introReminderHoursBeforeExpiry: 48,
    schedulingWindowFrom: 'intro_accepted_at',
    schedulingPresetDays: {
      startup: 7,
      enterprise: 14,
      volunteer: 21,
      default: 7,
    },
    decisionReminderHours: [24, 40, 48, 54] as const,
  },
  aggregateOutcomeMapping: {
    hire: 'closed_won',
    reject: 'closed_lost',
    withdraw: 'closed_lost',
    intro_declined: 'closed_lost',
    intro_expired: 'closed_lost',
    assignment_closed_without_hire: 'closed_lost',
    unrecovered_no_show: 'closed_lost',
  },
  supersedesLegacyReopenLoops: ['withdrawn -> pending_*', 'no_show -> scheduled'] as const,
} as const;

export const WORKFLOW_LABELS = {
  assignment: {
    draft: 'Draft',
    active: 'Open',
    hold: 'On hold',
    closed: 'Closed',
  },
  intro: {
    pending_candidate_interest: 'Waiting for candidate interest',
    pending_org_interest: 'Waiting for organization interest',
    mutual: 'Mutual interest',
    conversation_open: 'Conversation open',
    interview_handoff: 'Moved to interview',
    withdrawn: 'Withdrawn',
    expired: 'Expired',
    duplicate_candidate: 'Already active elsewhere',
    closed: 'Closed',
  },
  interview: {
    scheduled: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No-show',
  },
  decision: {
    pending: 'Decision pending',
    advance: 'Advance',
    hire: 'Hire',
    hold: 'On hold',
    hold_expired: 'Hold expired',
    reject: 'Not moving forward',
    withdrawn: 'Withdrawn',
    closed: 'Closed',
  },
  verification: {
    pending: 'Pending',
    verified: 'Verified',
    expired: 'Expired',
    superseded: 'Superseded',
    downgraded: 'Downgraded',
    contradicted: 'Changed since issue',
    disputed: 'Under review',
    revoked: 'Revoked',
    declined: 'Declined',
    cancelled: 'Cancelled',
    failed: 'Failed',
  },
  consent: {
    active: 'Current',
    expiring: 'Review soon',
    expired: 'Needs review',
    revoked: 'Revoked',
  },
} as const;

export const WORKFLOW_TRANSITIONS = {
  assignment: {
    draft: ['active', 'closed'],
    active: ['hold', 'closed'],
    hold: ['active', 'closed'],
    closed: [],
  },
  intro: {
    pending_candidate_interest: [
      'pending_org_interest',
      'withdrawn',
      'expired',
      'duplicate_candidate',
    ],
    pending_org_interest: [
      'pending_candidate_interest',
      'withdrawn',
      'expired',
      'duplicate_candidate',
    ],
    mutual: ['conversation_open', 'withdrawn', 'expired', 'closed'],
    conversation_open: ['interview_handoff', 'withdrawn', 'expired', 'closed'],
    interview_handoff: ['withdrawn', 'closed'],
    withdrawn: ['pending_candidate_interest', 'pending_org_interest', 'mutual'],
    expired: [],
    duplicate_candidate: [],
    closed: [],
  },
  interview: {
    scheduled: ['completed', 'cancelled', 'no_show'],
    completed: [],
    cancelled: [],
    no_show: ['scheduled'],
  },
  decision: {
    pending: ['advance', 'hire', 'hold', 'reject', 'withdrawn', 'closed'],
    advance: ['pending', 'closed'],
    hire: ['closed'],
    hold: ['advance', 'hire', 'reject', 'hold_expired', 'withdrawn', 'closed'],
    hold_expired: ['pending', 'advance', 'hire', 'reject', 'closed'],
    reject: ['pending', 'closed'],
    withdrawn: ['pending'],
    closed: [],
  },
  verification: {
    pending: ['verified', 'declined', 'expired', 'cancelled', 'failed', 'disputed', 'revoked'],
    verified: ['expired', 'superseded', 'downgraded', 'contradicted', 'disputed', 'revoked'],
    expired: ['pending', 'verified', 'superseded', 'revoked'],
    superseded: [],
    downgraded: ['pending', 'expired', 'superseded', 'contradicted', 'disputed', 'revoked'],
    contradicted: ['pending', 'downgraded', 'disputed', 'superseded', 'revoked'],
    disputed: ['pending', 'verified', 'downgraded', 'contradicted', 'superseded', 'revoked'],
    revoked: [],
    declined: ['pending'],
    cancelled: ['pending'],
    failed: ['pending'],
  },
  consent: {
    active: ['expiring', 'expired', 'revoked'],
    expiring: ['active', 'expired', 'revoked'],
    expired: ['active', 'revoked'],
    revoked: ['active'],
  },
} as const;

export function getWorkflowLabel(
  machine: WorkflowMachineName,
  state:
    | AssignmentWorkflowState
    | IntroWorkflowState
    | InterviewWorkflowState
    | DecisionWorkflowState
    | VerificationWorkflowState
    | ConsentObligationState
): string {
  return (WORKFLOW_LABELS[machine] as Record<string, string>)[state] ?? state;
}

export function assertAllowedTransition(
  machine: WorkflowMachineName,
  fromState: string | null | undefined,
  toState: string
) {
  if (!fromState) {
    return;
  }

  const allowed =
    (WORKFLOW_TRANSITIONS[machine] as Record<string, readonly string[]>)[fromState] ?? [];
  if (!allowed.includes(toState)) {
    throw new Error(`Forbidden ${machine} transition: ${fromState} -> ${toState}`);
  }
}

export function getAllowedActions(machine: WorkflowMachineName, state: string) {
  return [
    ...(((WORKFLOW_TRANSITIONS[machine] as Record<string, readonly string[]>)[state] ??
      []) as string[]),
  ];
}
