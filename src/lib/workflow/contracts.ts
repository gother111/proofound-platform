import {
  canonicalAssignmentWorkflowStates,
  canonicalConsentObligationStates,
  canonicalDecisionWorkflowStates,
  canonicalInterviewWorkflowStates,
  canonicalIntroWorkflowStates,
  canonicalVerificationStatuses,
  canonicalWorkflowActorTypes,
} from '@/db/schema';

export type WorkflowActorType = (typeof canonicalWorkflowActorTypes)[number];
export type AssignmentWorkflowState = (typeof canonicalAssignmentWorkflowStates)[number];
export type IntroWorkflowState = (typeof canonicalIntroWorkflowStates)[number];
export type InterviewWorkflowState = (typeof canonicalInterviewWorkflowStates)[number];
export type DecisionWorkflowState = (typeof canonicalDecisionWorkflowStates)[number];
export type VerificationWorkflowState = (typeof canonicalVerificationStatuses)[number];
export type ConsentObligationState = (typeof canonicalConsentObligationStates)[number];

export type WorkflowMachineName =
  | 'assignment'
  | 'intro'
  | 'interview'
  | 'decision'
  | 'verification'
  | 'consent';

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
