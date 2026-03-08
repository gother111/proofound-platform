import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  assignmentStateTransitions,
  assignments,
  consentObligations,
  consentStateTransitions,
  decisionStateTransitions,
  decisions,
  interviews,
  interviewStateTransitions,
  introWorkflowStateTransitions,
  introWorkflows,
  verificationRecords,
  verificationStateTransitions,
  workflowAsyncJobs,
} from '@/db/schema';
import { getRows } from '@/lib/db/rows';
import { emitDecisionMade, emitInterviewCompleted } from '@/lib/analytics/events';
import {
  getPolicyVersionForConsentType,
  type ConsentTypeValue,
} from '@/lib/privacy/consent-contract';
import {
  assertAllowedTransition,
  getAllowedActions,
  getWorkflowLabel,
  type ConsentObligationState,
  type DecisionWorkflowState,
  type InterviewWorkflowState,
  type IntroWorkflowState,
  type VerificationWorkflowState,
  type WorkflowActorType,
  type WorkflowMachineName,
} from '@/lib/workflow/contracts';
import { cancelWorkflowJobs, enqueueWorkflowJob } from '@/lib/workflow/queue';

type TransitionContext = {
  trigger: string;
  actorType: WorkflowActorType;
  actorId?: string | null;
  reasonCode?: string | null;
  metadata?: Record<string, unknown>;
};

type WorkflowViewParams = {
  machine: WorkflowMachineName;
  state: string;
  reasonCode?: string | null;
  timestamps?: Record<string, string | null | undefined>;
};

function buildWorkflowView(params: WorkflowViewParams) {
  return {
    state: params.state,
    displayState: getWorkflowLabel(params.machine, params.state as never),
    reasonCode: params.reasonCode ?? null,
    timestamps: params.timestamps ?? {},
    allowedActions: getAllowedActions(params.machine, params.state),
  };
}

function toIso(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function appendAssignmentTransition(
  assignmentId: string,
  fromState: string | null,
  toState: string,
  context: TransitionContext
) {
  await db.insert(assignmentStateTransitions).values({
    assignmentId,
    fromState: fromState as any,
    toState: toState as any,
    trigger: context.trigger,
    reasonCode: context.reasonCode ?? null,
    actorType: context.actorType,
    actorId: context.actorId ?? null,
    metadata: context.metadata ?? {},
  });
}

async function appendIntroTransition(
  introWorkflowId: string,
  fromState: string | null,
  toState: string,
  context: TransitionContext
) {
  await db.insert(introWorkflowStateTransitions).values({
    introWorkflowId,
    fromState: fromState as any,
    toState: toState as any,
    trigger: context.trigger,
    reasonCode: context.reasonCode ?? null,
    actorType: context.actorType,
    actorId: context.actorId ?? null,
    metadata: context.metadata ?? {},
  });
}

async function appendInterviewTransition(
  interviewId: string,
  fromState: string | null,
  toState: string,
  context: TransitionContext
) {
  await db.insert(interviewStateTransitions).values({
    interviewId,
    fromState: fromState as any,
    toState: toState as any,
    trigger: context.trigger,
    reasonCode: context.reasonCode ?? null,
    actorType: context.actorType,
    actorId: context.actorId ?? null,
    metadata: context.metadata ?? {},
  });
}

async function appendDecisionTransition(
  decisionId: string,
  fromState: string | null,
  toState: string,
  context: TransitionContext
) {
  await db.insert(decisionStateTransitions).values({
    decisionId,
    fromState: fromState as any,
    toState: toState as any,
    trigger: context.trigger,
    reasonCode: context.reasonCode ?? null,
    actorType: context.actorType,
    actorId: context.actorId ?? null,
    metadata: context.metadata ?? {},
  });
}

async function appendVerificationTransition(
  verificationRecordId: string,
  fromState: string | null,
  toState: string,
  context: TransitionContext
) {
  await db.insert(verificationStateTransitions).values({
    verificationRecordId,
    fromState: fromState as any,
    toState: toState as any,
    trigger: context.trigger,
    reasonCode: context.reasonCode ?? null,
    actorType: context.actorType,
    actorId: context.actorId ?? null,
    metadata: context.metadata ?? {},
  });
}

async function appendConsentTransition(
  consentObligationId: string,
  fromState: string | null,
  toState: string,
  context: TransitionContext
) {
  await db.insert(consentStateTransitions).values({
    consentObligationId,
    fromState: fromState as any,
    toState: toState as any,
    trigger: context.trigger,
    reasonCode: context.reasonCode ?? null,
    actorType: context.actorType,
    actorId: context.actorId ?? null,
    metadata: context.metadata ?? {},
  });
}

export async function recordAssignmentTransition(params: {
  assignmentId: string;
  toState: 'draft' | 'active' | 'hold' | 'closed';
  actorType: WorkflowActorType;
  actorId?: string | null;
  trigger: string;
  reasonCode?: string | null;
  holdUntil?: Date | null;
  metadata?: Record<string, unknown>;
}) {
  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, params.assignmentId),
  });

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (assignment.status !== params.toState) {
    assertAllowedTransition('assignment', assignment.status, params.toState);
  }

  const now = new Date();
  const [updated] = await db
    .update(assignments)
    .set({
      status: params.toState,
      heldAt: params.toState === 'hold' ? now : null,
      holdUntil: params.toState === 'hold' ? (params.holdUntil ?? null) : null,
      holdReason: params.toState === 'hold' ? (params.reasonCode ?? null) : null,
      closedAt: params.toState === 'closed' ? now : null,
      closedReason: params.toState === 'closed' ? (params.reasonCode ?? null) : null,
      updatedAt: now,
    })
    .where(eq(assignments.id, params.assignmentId))
    .returning();

  if (assignment.status !== params.toState) {
    await appendAssignmentTransition(params.assignmentId, assignment.status, params.toState, {
      trigger: params.trigger,
      actorType: params.actorType,
      actorId: params.actorId ?? null,
      reasonCode: params.reasonCode ?? null,
      metadata: params.metadata,
    });
  }

  if (params.toState === 'closed') {
    const activeIntros = await db.query.introWorkflows.findMany({
      where: eq(introWorkflows.assignmentId, params.assignmentId),
    });

    for (const intro of activeIntros) {
      if (!['closed', 'expired', 'duplicate_candidate'].includes(intro.state)) {
        assertAllowedTransition('intro', intro.state, 'closed');
        await db
          .update(introWorkflows)
          .set({
            state: 'closed',
            closeReason: params.reasonCode ?? 'assignment_closed',
            closedAt: now,
            lastActivityAt: now,
            updatedAt: now,
          })
          .where(eq(introWorkflows.id, intro.id));

        await appendIntroTransition(intro.id, intro.state, 'closed', {
          trigger: 'assignment_closed',
          actorType: params.actorType,
          actorId: params.actorId ?? null,
          reasonCode: params.reasonCode ?? 'assignment_closed',
        });
      }
    }
  }

  return updated;
}

function decisionReminderSchedule(completedAt: Date) {
  return [
    { reminderKey: '24h', scheduledAt: new Date(completedAt.getTime() + 24 * 60 * 60 * 1000) },
    { reminderKey: '40h', scheduledAt: new Date(completedAt.getTime() + 40 * 60 * 60 * 1000) },
    {
      reminderKey: '48h_deadline',
      scheduledAt: new Date(completedAt.getTime() + 48 * 60 * 60 * 1000),
    },
    {
      reminderKey: '54h_overdue',
      scheduledAt: new Date(completedAt.getTime() + 54 * 60 * 60 * 1000),
    },
  ];
}

function resolveIntroExpiry(expiresAt?: Date | null) {
  return expiresAt ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
}

async function scheduleIntroJobs(params: {
  introWorkflowId: string;
  assignmentId: string;
  profileId: string;
  expiresAt: Date;
}) {
  const reminderAt = new Date(params.expiresAt.getTime() - 48 * 60 * 60 * 1000);

  await Promise.all([
    enqueueWorkflowJob({
      jobType: 'intro_reminder',
      idempotencyKey: `intro-reminder:${params.introWorkflowId}:${reminderAt.toISOString()}`,
      dedupeKey: `intro_reminder:${params.introWorkflowId}`,
      introWorkflowId: params.introWorkflowId,
      assignmentId: params.assignmentId,
      profileId: params.profileId,
      sourceState: 'pending',
      scheduledAt: reminderAt,
      payload: {
        introWorkflowId: params.introWorkflowId,
        reminderAt: reminderAt.toISOString(),
      },
    }),
    enqueueWorkflowJob({
      jobType: 'expiry_transition',
      idempotencyKey: `intro-expiry:${params.introWorkflowId}:${params.expiresAt.toISOString()}`,
      dedupeKey: `intro_expiry:${params.introWorkflowId}`,
      introWorkflowId: params.introWorkflowId,
      assignmentId: params.assignmentId,
      profileId: params.profileId,
      sourceState: 'pending',
      scheduledAt: params.expiresAt,
      payload: {
        objectType: 'intro',
        transitionTo: 'expired',
        introWorkflowId: params.introWorkflowId,
        expiresAt: params.expiresAt.toISOString(),
      },
    }),
  ]);
}

async function scheduleDecisionReminderJobs(params: {
  decisionId: string;
  interviewId: string;
  assignmentId: string;
  profileId: string;
  completedAt: Date;
}) {
  await Promise.all(
    decisionReminderSchedule(params.completedAt).map((entry) =>
      enqueueWorkflowJob({
        jobType: 'decision_reminder',
        idempotencyKey: `decision-reminder:${params.decisionId}:${entry.reminderKey}`,
        dedupeKey: `decision_reminder:${params.decisionId}:${entry.reminderKey}`,
        decisionId: params.decisionId,
        interviewId: params.interviewId,
        assignmentId: params.assignmentId,
        profileId: params.profileId,
        sourceState: 'pending',
        scheduledAt: entry.scheduledAt,
        payload: {
          reminderKey: entry.reminderKey,
          decisionId: params.decisionId,
          interviewId: params.interviewId,
          assignmentId: params.assignmentId,
          profileId: params.profileId,
          scheduledAt: entry.scheduledAt.toISOString(),
        },
      })
    )
  );
}

async function scheduleHoldExpiryJob(params: {
  decisionId: string;
  assignmentId: string;
  profileId: string;
  holdUntil: Date;
}) {
  await enqueueWorkflowJob({
    jobType: 'expiry_transition',
    idempotencyKey: `decision-hold-expiry:${params.decisionId}:${params.holdUntil.toISOString()}`,
    dedupeKey: `decision_hold_expiry:${params.decisionId}`,
    decisionId: params.decisionId,
    assignmentId: params.assignmentId,
    profileId: params.profileId,
    sourceState: 'hold',
    scheduledAt: params.holdUntil,
    payload: {
      objectType: 'decision',
      transitionTo: 'hold_expired',
      decisionId: params.decisionId,
      holdUntil: params.holdUntil.toISOString(),
    },
  });
}

async function scheduleVerificationJobs(params: {
  verificationRecordId: string;
  profileId: string;
  requestExpiresAt: Date;
  followUpDueAt: Date;
}) {
  await Promise.all([
    enqueueWorkflowJob({
      jobType: 'verification_follow_up',
      idempotencyKey: `verification-follow-up:${params.verificationRecordId}:${params.followUpDueAt.toISOString()}`,
      dedupeKey: `verification_follow_up:${params.verificationRecordId}`,
      verificationRecordId: params.verificationRecordId,
      profileId: params.profileId,
      sourceState: 'pending',
      scheduledAt: params.followUpDueAt,
      payload: {
        verificationRecordId: params.verificationRecordId,
        profileId: params.profileId,
        followUpDueAt: params.followUpDueAt.toISOString(),
      },
    }),
    enqueueWorkflowJob({
      jobType: 'expiry_transition',
      idempotencyKey: `verification-expiry:${params.verificationRecordId}:${params.requestExpiresAt.toISOString()}`,
      dedupeKey: `verification_expiry:${params.verificationRecordId}`,
      verificationRecordId: params.verificationRecordId,
      profileId: params.profileId,
      sourceState: 'pending',
      scheduledAt: params.requestExpiresAt,
      payload: {
        objectType: 'verification',
        transitionTo: 'expired',
        verificationRecordId: params.verificationRecordId,
        requestExpiresAt: params.requestExpiresAt.toISOString(),
      },
    }),
  ]);
}

async function scheduleConsentPromptJob(params: {
  consentObligationId: string;
  profileId: string;
  scheduledAt: Date;
  sourceState: ConsentObligationState;
}) {
  await enqueueWorkflowJob({
    jobType: 'consent_prompt',
    idempotencyKey: `consent-prompt:${params.consentObligationId}:${params.scheduledAt.toISOString()}`,
    dedupeKey: `consent_prompt:${params.consentObligationId}`,
    consentObligationId: params.consentObligationId,
    profileId: params.profileId,
    sourceState: params.sourceState,
    scheduledAt: params.scheduledAt,
    payload: {
      consentObligationId: params.consentObligationId,
      profileId: params.profileId,
      scheduledAt: params.scheduledAt.toISOString(),
    },
  });
}

export async function getOrCreateIntroWorkflow(params: {
  assignmentId: string;
  candidateProfileId: string;
  orgId: string;
  actorType: WorkflowActorType;
  actorId?: string | null;
  initialState: IntroWorkflowState;
  matchId?: string | null;
  candidateInviteId?: string | null;
  expiresAt?: Date | null;
  metadata?: Record<string, unknown>;
}) {
  const resolvedExpiry = resolveIntroExpiry(params.expiresAt);
  const existing = await db.query.introWorkflows.findFirst({
    where: and(
      eq(introWorkflows.assignmentId, params.assignmentId),
      eq(introWorkflows.candidateProfileId, params.candidateProfileId)
    ),
    orderBy: [desc(introWorkflows.createdAt)],
  });

  if (existing) {
    return existing;
  }

  const [intro] = await db
    .insert(introWorkflows)
    .values({
      assignmentId: params.assignmentId,
      candidateProfileId: params.candidateProfileId,
      orgId: params.orgId,
      state: params.initialState,
      matchId: params.matchId ?? null,
      candidateInviteId: params.candidateInviteId ?? null,
      expiresAt: resolvedExpiry,
      lastActivityAt: new Date(),
      metadata: params.metadata ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  await appendIntroTransition(intro.id, null, intro.state, {
    trigger: 'intro_created',
    actorType: params.actorType,
    actorId: params.actorId ?? null,
    metadata: params.metadata,
  });

  await scheduleIntroJobs({
    introWorkflowId: intro.id,
    assignmentId: params.assignmentId,
    profileId: params.candidateProfileId,
    expiresAt: resolvedExpiry,
  });

  return intro;
}

export async function syncIntroWorkflowFromInterest(params: {
  assignmentId: string;
  candidateProfileId: string;
  orgId: string;
  actorType: WorkflowActorType;
  actorId?: string | null;
  mutual: boolean;
  matchId?: string | null;
  expiresAt?: Date | null;
}) {
  const nextState: IntroWorkflowState = params.mutual
    ? 'mutual'
    : params.actorType === 'candidate'
      ? 'pending_org_interest'
      : 'pending_candidate_interest';
  const resolvedExpiry = resolveIntroExpiry(params.expiresAt);

  const intro = await getOrCreateIntroWorkflow({
    assignmentId: params.assignmentId,
    candidateProfileId: params.candidateProfileId,
    orgId: params.orgId,
    actorType: params.actorType,
    actorId: params.actorId,
    initialState: nextState,
    matchId: params.matchId ?? null,
    expiresAt: params.expiresAt ?? null,
  });

  if (intro.state !== nextState) {
    assertAllowedTransition('intro', intro.state, nextState);
    const [updated] = await db
      .update(introWorkflows)
      .set({
        state: nextState,
        matchId: params.matchId ?? intro.matchId ?? null,
        expiresAt: resolvedExpiry,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(introWorkflows.id, intro.id))
      .returning();

    await appendIntroTransition(intro.id, intro.state, nextState, {
      trigger: params.mutual ? 'mutual_interest_recorded' : 'interest_recorded',
      actorType: params.actorType,
      actorId: params.actorId ?? null,
      metadata: {
        matchId: params.matchId ?? null,
      },
    });

    await cancelWorkflowJobs({
      introWorkflowId: intro.id,
      jobTypes: ['intro_reminder', 'expiry_transition'],
      reason: 'intro_rescheduled',
    });

    await scheduleIntroJobs({
      introWorkflowId: intro.id,
      assignmentId: params.assignmentId,
      profileId: params.candidateProfileId,
      expiresAt: resolvedExpiry,
    });

    return updated;
  }

  return intro;
}

export async function openIntroConversation(params: {
  introWorkflowId: string;
  conversationId: string;
  actorType: WorkflowActorType;
  actorId?: string | null;
  matchId?: string | null;
}) {
  const intro = await db.query.introWorkflows.findFirst({
    where: eq(introWorkflows.id, params.introWorkflowId),
  });

  if (!intro) {
    throw new Error('Intro workflow not found');
  }

  if (intro.state !== 'conversation_open') {
    assertAllowedTransition('intro', intro.state, 'conversation_open');
  }

  const [updated] = await db
    .update(introWorkflows)
    .set({
      state: 'conversation_open',
      conversationId: params.conversationId,
      matchId: params.matchId ?? intro.matchId ?? null,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(introWorkflows.id, intro.id))
    .returning();

  if (intro.state !== 'conversation_open') {
    await appendIntroTransition(intro.id, intro.state, 'conversation_open', {
      trigger: 'conversation_opened',
      actorType: params.actorType,
      actorId: params.actorId ?? null,
      metadata: {
        conversationId: params.conversationId,
      },
    });
  }

  return updated;
}

export async function recordIntroWorkflowTransition(params: {
  introWorkflowId: string;
  toState: IntroWorkflowState;
  actorType: WorkflowActorType;
  actorId?: string | null;
  trigger: string;
  reasonCode?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const intro = await db.query.introWorkflows.findFirst({
    where: eq(introWorkflows.id, params.introWorkflowId),
  });

  if (!intro) {
    throw new Error('Intro workflow not found');
  }

  assertAllowedTransition('intro', intro.state, params.toState);

  const now = new Date();
  const [updated] = await db
    .update(introWorkflows)
    .set({
      state: params.toState,
      withdrawnAt: params.toState === 'withdrawn' ? now : intro.withdrawnAt,
      withdrawnByActorType:
        params.toState === 'withdrawn' ? params.actorType : intro.withdrawnByActorType,
      withdrawnByActorId:
        params.toState === 'withdrawn' ? (params.actorId ?? null) : intro.withdrawnByActorId,
      closeReason: ['closed', 'expired', 'duplicate_candidate'].includes(params.toState)
        ? (params.reasonCode ?? intro.closeReason ?? null)
        : intro.closeReason,
      closedAt: params.toState === 'closed' ? now : intro.closedAt,
      lastActivityAt: now,
      updatedAt: now,
    })
    .where(eq(introWorkflows.id, intro.id))
    .returning();

  await appendIntroTransition(intro.id, intro.state, params.toState, {
    trigger: params.trigger,
    actorType: params.actorType,
    actorId: params.actorId ?? null,
    reasonCode: params.reasonCode ?? null,
    metadata: params.metadata,
  });

  if (
    ['withdrawn', 'expired', 'duplicate_candidate', 'closed', 'interview_handoff'].includes(
      params.toState
    )
  ) {
    await cancelWorkflowJobs({
      introWorkflowId: intro.id,
      jobTypes: ['intro_reminder', 'expiry_transition'],
      reason: `intro_${params.toState}`,
    });
  }

  return updated;
}

export async function handoffIntroToInterview(params: {
  matchId: string;
  interviewId: string;
  actorType: WorkflowActorType;
  actorId?: string | null;
}) {
  const intro = await db.query.introWorkflows.findFirst({
    where: eq(introWorkflows.matchId, params.matchId),
    orderBy: [desc(introWorkflows.updatedAt)],
  });

  if (!intro) {
    return null;
  }

  if (intro.state !== 'interview_handoff') {
    assertAllowedTransition('intro', intro.state, 'interview_handoff');
    const [updated] = await db
      .update(introWorkflows)
      .set({
        state: 'interview_handoff',
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(introWorkflows.id, intro.id))
      .returning();

    await appendIntroTransition(intro.id, intro.state, 'interview_handoff', {
      trigger: 'interview_scheduled',
      actorType: params.actorType,
      actorId: params.actorId ?? null,
      metadata: {
        interviewId: params.interviewId,
        matchId: params.matchId,
      },
    });

    await cancelWorkflowJobs({
      introWorkflowId: intro.id,
      jobTypes: ['intro_reminder', 'expiry_transition'],
      reason: 'intro_handed_off_to_interview',
    });

    return updated;
  }

  return intro;
}

async function getInterviewDecisionContext(interviewId: string) {
  const result = await db.execute(sql`
    SELECT
      i.id AS interview_id,
      i.status AS interview_status,
      i.completed_at,
      m.id AS match_id,
      m.assignment_id,
      m.profile_id AS candidate_profile_id,
      a.org_id,
      iw.id AS intro_id
    FROM interviews i
    INNER JOIN matches m ON m.id = i.match_id
    INNER JOIN assignments a ON a.id = m.assignment_id
    LEFT JOIN intro_workflows iw ON iw.match_id = m.id
    WHERE i.id = ${interviewId}
    LIMIT 1
  `);

  const row = (getRows(result)[0] ?? null) as {
    interview_id: string;
    interview_status: string;
    completed_at: string | null;
    match_id: string;
    assignment_id: string;
    candidate_profile_id: string;
    org_id: string;
    intro_id: string | null;
  } | null;

  return row;
}

export async function ensureDecisionRecordForInterview(params: {
  interviewId: string;
  actorType: WorkflowActorType;
  actorId?: string | null;
}) {
  const context = await getInterviewDecisionContext(params.interviewId);
  if (!context) {
    throw new Error('Interview context not found');
  }

  let introId = context.intro_id;
  if (!introId) {
    const intro = await getOrCreateIntroWorkflow({
      assignmentId: context.assignment_id,
      candidateProfileId: context.candidate_profile_id,
      orgId: context.org_id,
      actorType: params.actorType,
      actorId: params.actorId ?? null,
      initialState: 'interview_handoff',
      matchId: context.match_id,
    });
    introId = intro.id;
  }

  const existing = await db.query.decisions.findFirst({
    where: eq(decisions.introId, introId),
  });

  if (existing) {
    if (existing.latestInterviewId !== params.interviewId) {
      const [updated] = await db
        .update(decisions)
        .set({
          latestInterviewId: params.interviewId,
          updatedAt: new Date(),
        })
        .where(eq(decisions.id, existing.id))
        .returning();
      return updated;
    }
    return existing;
  }

  const [decision] = await db
    .insert(decisions)
    .values({
      introId,
      assignmentId: context.assignment_id,
      candidateProfileId: context.candidate_profile_id,
      orgId: context.org_id,
      latestInterviewId: params.interviewId,
      state: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  await appendDecisionTransition(decision.id, null, 'pending', {
    trigger: 'decision_record_created',
    actorType: params.actorType,
    actorId: params.actorId ?? null,
    metadata: {
      interviewId: params.interviewId,
    },
  });

  return decision;
}

export async function recordInterviewTransition(params: {
  interviewId: string;
  toState: InterviewWorkflowState;
  actorType: WorkflowActorType;
  actorId?: string | null;
  trigger: string;
  reasonCode?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const interview = await db.query.interviews.findFirst({
    where: eq(interviews.id, params.interviewId),
  });

  if (!interview) {
    throw new Error('Interview not found');
  }

  if (interview.status !== params.toState) {
    assertAllowedTransition('interview', interview.status, params.toState);
  }

  const now = new Date();
  const [updated] = await db
    .update(interviews)
    .set({
      status: params.toState,
      completedAt: params.toState === 'completed' ? now : interview.completedAt,
      cancelledAt: params.toState === 'cancelled' ? now : interview.cancelledAt,
      cancelledBy:
        params.toState === 'cancelled' ? (params.actorId ?? null) : interview.cancelledBy,
      cancelReason:
        params.toState === 'cancelled'
          ? (params.reasonCode ?? interview.cancelReason ?? null)
          : interview.cancelReason,
      noShowAt: params.toState === 'no_show' ? now : interview.noShowAt,
      noShowRecordedBy:
        params.toState === 'no_show' ? (params.actorId ?? null) : interview.noShowRecordedBy,
      updatedAt: now,
    })
    .where(eq(interviews.id, params.interviewId))
    .returning();

  if (interview.status !== params.toState) {
    await appendInterviewTransition(params.interviewId, interview.status, params.toState, {
      trigger: params.trigger,
      actorType: params.actorType,
      actorId: params.actorId ?? null,
      reasonCode: params.reasonCode ?? null,
      metadata: params.metadata,
    });
  }

  const context = await getInterviewDecisionContext(params.interviewId);

  if (params.toState === 'completed' && context) {
    await handoffIntroToInterview({
      matchId: context.match_id,
      interviewId: params.interviewId,
      actorType: params.actorType,
      actorId: params.actorId ?? null,
    });

    const decision = await ensureDecisionRecordForInterview({
      interviewId: params.interviewId,
      actorType: params.actorType,
      actorId: params.actorId ?? null,
    });

    await cancelWorkflowJobs({
      decisionId: decision.id,
      jobTypes: ['decision_reminder'],
      reason: 'rescheduled_decision_jobs',
    });

    await scheduleDecisionReminderJobs({
      decisionId: decision.id,
      interviewId: params.interviewId,
      assignmentId: decision.assignmentId,
      profileId: decision.candidateProfileId,
      completedAt: updated.completedAt ?? now,
    });

    try {
      await emitInterviewCompleted(
        params.actorId ?? context.candidate_profile_id,
        params.interviewId,
        {
          match_id: context.match_id,
          assignment_id: context.assignment_id,
        }
      );
    } catch {
      // Best effort only
    }
  }

  if (params.toState === 'cancelled' || params.toState === 'no_show') {
    const decision = context?.intro_id
      ? await db.query.decisions.findFirst({ where: eq(decisions.introId, context.intro_id) })
      : null;
    if (decision) {
      await cancelWorkflowJobs({
        decisionId: decision.id,
        jobTypes: ['decision_reminder'],
        reason: `interview_${params.toState}`,
      });
    }
  }

  return updated;
}

export async function registerScheduledInterviewWorkflow(params: {
  interviewId: string;
  matchId: string;
  actorType: WorkflowActorType;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const existingTransition = await db.query.interviewStateTransitions.findFirst({
    where: eq(interviewStateTransitions.interviewId, params.interviewId),
  });

  if (!existingTransition) {
    await appendInterviewTransition(params.interviewId, null, 'scheduled', {
      trigger: 'interview_created',
      actorType: params.actorType,
      actorId: params.actorId ?? null,
      metadata: params.metadata,
    });
  }

  await handoffIntroToInterview({
    matchId: params.matchId,
    interviewId: params.interviewId,
    actorType: params.actorType,
    actorId: params.actorId ?? null,
  });
}

export async function recordDecisionTransition(params: {
  interviewId: string;
  toState: DecisionWorkflowState;
  actorType: WorkflowActorType;
  actorId?: string | null;
  reasonCode?: string | null;
  internalNote?: string | null;
  holdUntil?: Date | null;
}) {
  const decision = await ensureDecisionRecordForInterview({
    interviewId: params.interviewId,
    actorType: params.actorType,
    actorId: params.actorId ?? null,
  });

  assertAllowedTransition('decision', decision.state, params.toState);

  if (params.toState === 'hold' && !params.holdUntil) {
    throw new Error('hold_until is required for hold decisions');
  }

  const now = new Date();
  const [updated] = await db
    .update(decisions)
    .set({
      latestInterviewId: params.interviewId,
      state: params.toState,
      holdUntil: params.toState === 'hold' ? (params.holdUntil ?? null) : null,
      reasonCode: params.reasonCode ?? null,
      internalNote: params.internalNote ?? null,
      madeByActorType: params.actorType,
      madeByActorId: params.actorId ?? null,
      reopenedAt: params.toState === 'pending' ? now : decision.reopenedAt,
      withdrawnAt: params.toState === 'withdrawn' ? now : null,
      closedAt: params.toState === 'closed' ? now : null,
      updatedAt: now,
    })
    .where(eq(decisions.id, decision.id))
    .returning();

  await appendDecisionTransition(decision.id, decision.state, params.toState, {
    trigger: 'manual_decision',
    actorType: params.actorType,
    actorId: params.actorId ?? null,
    reasonCode: params.reasonCode ?? null,
    metadata: {
      interviewId: params.interviewId,
    },
  });

  await cancelWorkflowJobs({
    decisionId: decision.id,
    jobTypes: ['decision_reminder', 'expiry_transition'],
    reason: `decision_${params.toState}`,
  });

  await enqueueWorkflowJob({
    jobType: 'workflow_fanout',
    idempotencyKey: `decision-fanout:${decision.id}:${params.toState}:${now.toISOString()}`,
    decisionId: decision.id,
    assignmentId: decision.assignmentId,
    interviewId: params.interviewId,
    profileId: decision.candidateProfileId,
    payload: {
      objectType: 'decision',
      decisionId: decision.id,
      state: params.toState,
      reasonCode: params.reasonCode ?? null,
    },
  });

  if (params.toState === 'hold' && params.holdUntil) {
    await scheduleHoldExpiryJob({
      decisionId: decision.id,
      assignmentId: decision.assignmentId,
      profileId: decision.candidateProfileId,
      holdUntil: params.holdUntil,
    });
  }

  const legacyDecision =
    params.toState === 'advance' || params.toState === 'hire'
      ? 'accept'
      : params.toState === 'reject'
        ? 'decline'
        : null;

  await db
    .update(interviews)
    .set({
      decision: legacyDecision as any,
      decidedBy: params.actorId ?? null,
      decidedAt: now,
      feedback: params.internalNote ?? null,
      updatedAt: now,
    })
    .where(eq(interviews.id, params.interviewId));

  const interview = await db.query.interviews.findFirst({
    where: eq(interviews.id, params.interviewId),
  });

  const completedAt = interview?.completedAt ?? interview?.updatedAt ?? now;
  const hoursSinceInterview = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);

  if (params.actorId) {
    await emitDecisionMade(params.actorId, params.interviewId, {
      interview_id: params.interviewId,
      decision:
        params.toState === 'closed' || params.toState === 'withdrawn'
          ? 'hold'
          : (params.toState as 'hire' | 'advance' | 'hold' | 'reject'),
      hours_since_interview: hoursSinceInterview,
      feedback_provided: Boolean(params.internalNote),
    });
  }

  return {
    ...updated,
    workflow: buildWorkflowView({
      machine: 'decision',
      state: updated.state,
      reasonCode: updated.reasonCode,
      timestamps: {
        holdUntil: toIso(updated.holdUntil),
        reopenedAt: toIso(updated.reopenedAt),
        withdrawnAt: toIso(updated.withdrawnAt),
        closedAt: toIso(updated.closedAt),
        updatedAt: toIso(updated.updatedAt),
      },
    }),
  };
}

export async function syncWorkEmailVerificationRequested(params: {
  profileId: string;
  orgId?: string | null;
  workEmail: string;
  requestExpiresAt: Date;
}) {
  const followUpDueAt = new Date(
    Math.max(
      Date.now() + 18 * 60 * 60 * 1000,
      params.requestExpiresAt.getTime() - 6 * 60 * 60 * 1000
    )
  );

  const existing = await db.query.verificationRecords.findFirst({
    where: and(
      eq(verificationRecords.ownerType, 'individual_profile'),
      eq(verificationRecords.ownerId, params.profileId),
      eq(verificationRecords.subjectType, 'individual_profile'),
      eq(verificationRecords.subjectId, params.profileId),
      eq(verificationRecords.verificationKind, 'work_email')
    ),
    orderBy: [desc(verificationRecords.createdAt)],
  });

  if (!existing) {
    const [record] = await db
      .insert(verificationRecords)
      .values({
        ownerType: 'individual_profile',
        ownerId: params.profileId,
        subjectType: 'individual_profile',
        subjectId: params.profileId,
        verificationKind: 'work_email',
        status: 'pending',
        verifierPrincipalType: 'system',
        verifierOrgId: params.orgId ?? null,
        requestExpiresAt: params.requestExpiresAt,
        followUpDueAt,
        metadata: {
          workEmailDomain: params.workEmail.split('@')[1] ?? null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await appendVerificationTransition(record.id, null, 'pending', {
      trigger: 'verification_requested',
      actorType: 'system',
      metadata: {
        orgId: params.orgId ?? null,
      },
    });

    await scheduleVerificationJobs({
      verificationRecordId: record.id,
      profileId: params.profileId,
      requestExpiresAt: params.requestExpiresAt,
      followUpDueAt,
    });

    return record;
  }

  const [updated] = await db
    .update(verificationRecords)
    .set({
      status: 'pending',
      verifierOrgId: params.orgId ?? existing.verifierOrgId ?? null,
      requestExpiresAt: params.requestExpiresAt,
      followUpDueAt,
      lastFollowUpAt: null,
      completedAt: null,
      expiredAt: null,
      cancelledAt: null,
      failureCode: null,
      updatedAt: new Date(),
      metadata: {
        ...(existing.metadata as Record<string, unknown>),
        workEmailDomain: params.workEmail.split('@')[1] ?? null,
      },
    })
    .where(eq(verificationRecords.id, existing.id))
    .returning();

  if (existing.status !== 'pending') {
    assertAllowedTransition('verification', existing.status, 'pending');
    await appendVerificationTransition(existing.id, existing.status, 'pending', {
      trigger: 'verification_requested',
      actorType: 'system',
      metadata: {
        orgId: params.orgId ?? null,
      },
    });
  }

  await cancelWorkflowJobs({
    verificationRecordId: existing.id,
    jobTypes: ['verification_follow_up', 'expiry_transition'],
    reason: 'verification_requested_again',
  });

  await scheduleVerificationJobs({
    verificationRecordId: existing.id,
    profileId: params.profileId,
    requestExpiresAt: params.requestExpiresAt,
    followUpDueAt,
  });

  return updated;
}

export async function recordVerificationTransition(params: {
  verificationRecordId: string;
  toState: VerificationWorkflowState;
  actorType: WorkflowActorType;
  actorId?: string | null;
  reasonCode?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const record = await db.query.verificationRecords.findFirst({
    where: eq(verificationRecords.id, params.verificationRecordId),
  });

  if (!record) {
    throw new Error('Verification record not found');
  }

  assertAllowedTransition('verification', record.status, params.toState);

  const now = new Date();
  const [updated] = await db
    .update(verificationRecords)
    .set({
      status: params.toState,
      completedAt: params.toState === 'accepted' ? now : record.completedAt,
      verifiedAt: params.toState === 'accepted' ? now : record.verifiedAt,
      expiredAt: params.toState === 'expired' ? now : null,
      cancelledAt: params.toState === 'cancelled' ? now : null,
      failureCode: params.toState === 'failed' ? (params.reasonCode ?? null) : null,
      lastFollowUpAt:
        params.toState === 'pending' || params.toState === 'accepted'
          ? record.lastFollowUpAt
          : record.lastFollowUpAt,
      updatedAt: now,
      metadata: params.metadata
        ? { ...(record.metadata as object), ...params.metadata }
        : record.metadata,
    })
    .where(eq(verificationRecords.id, record.id))
    .returning();

  await appendVerificationTransition(record.id, record.status, params.toState, {
    trigger: 'verification_state_change',
    actorType: params.actorType,
    actorId: params.actorId ?? null,
    reasonCode: params.reasonCode ?? null,
    metadata: params.metadata,
  });

  if (params.toState !== 'pending') {
    await cancelWorkflowJobs({
      verificationRecordId: record.id,
      jobTypes: ['verification_follow_up', 'expiry_transition'],
      reason: `verification_${params.toState}`,
    });
  }

  if (params.toState === 'accepted') {
    await Promise.all([
      enqueueWorkflowJob({
        jobType: 'proof_freshness_nudge',
        idempotencyKey: `proof-freshness:${record.id}:${now.toISOString()}`,
        dedupeKey: `proof_freshness:${record.id}`,
        verificationRecordId: record.id,
        profileId: record.ownerId,
        scheduledAt: new Date(now.getTime() + 335 * 24 * 60 * 60 * 1000),
        payload: {
          verificationRecordId: record.id,
          ownerId: record.ownerId,
          verificationKind: record.verificationKind,
        },
      }),
      enqueueWorkflowJob({
        jobType: 'portfolio_index_refresh',
        idempotencyKey: `portfolio-index-refresh:${record.ownerId}:${now.toISOString()}`,
        dedupeKey: `portfolio_index_refresh:${record.ownerId}`,
        verificationRecordId: record.id,
        profileId: record.ownerId,
        scheduledAt: now,
        payload: {
          verificationRecordId: record.id,
          ownerId: record.ownerId,
        },
      }),
      enqueueWorkflowJob({
        jobType: 'workflow_fanout',
        idempotencyKey: `verification-fanout:${record.id}:${params.toState}:${now.toISOString()}`,
        verificationRecordId: record.id,
        profileId: record.ownerId,
        payload: {
          objectType: 'verification',
          verificationRecordId: record.id,
          state: params.toState,
        },
      }),
    ]);
  }

  return updated;
}

export async function getLatestWorkEmailVerification(profileId: string) {
  return db.query.verificationRecords.findFirst({
    where: and(
      eq(verificationRecords.ownerType, 'individual_profile'),
      eq(verificationRecords.ownerId, profileId),
      eq(verificationRecords.subjectType, 'individual_profile'),
      eq(verificationRecords.subjectId, profileId),
      eq(verificationRecords.verificationKind, 'work_email')
    ),
    orderBy: [desc(verificationRecords.updatedAt)],
  });
}

export async function syncConsentObligation(params: {
  profileId: string;
  consentType: ConsentTypeValue;
  grantedConsentId?: string | null;
  consented: boolean;
  version?: string | null;
  actorType: WorkflowActorType;
  actorId?: string | null;
}) {
  const requiredVersion = params.version ?? getPolicyVersionForConsentType(params.consentType);
  const nextState: ConsentObligationState = params.consented ? 'active' : 'revoked';
  const existing = await db.query.consentObligations.findFirst({
    where: and(
      eq(consentObligations.profileId, params.profileId),
      eq(consentObligations.consentType, params.consentType)
    ),
  });

  if (!existing) {
    const [obligation] = await db
      .insert(consentObligations)
      .values({
        profileId: params.profileId,
        consentType: params.consentType,
        state: nextState,
        requiredVersion,
        grantedConsentId: params.grantedConsentId ?? null,
        expiresAt: null,
        expiredAt: null,
        revokedAt: nextState === 'revoked' ? new Date() : null,
        nextPromptAt: nextState === 'active' ? null : new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await appendConsentTransition(obligation.id, null, nextState, {
      trigger: 'consent_recorded',
      actorType: params.actorType,
      actorId: params.actorId ?? null,
    });

    if (nextState !== 'active') {
      await scheduleConsentPromptJob({
        consentObligationId: obligation.id,
        profileId: params.profileId,
        scheduledAt: new Date(),
        sourceState: nextState,
      });
    }

    return obligation;
  }

  if (existing.state !== nextState) {
    assertAllowedTransition('consent', existing.state, nextState);
  }

  const [updated] = await db
    .update(consentObligations)
    .set({
      state: nextState,
      requiredVersion,
      grantedConsentId: params.grantedConsentId ?? existing.grantedConsentId ?? null,
      expiredAt: null,
      revokedAt: nextState === 'revoked' ? new Date() : null,
      nextPromptAt: nextState === 'active' ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(consentObligations.id, existing.id))
    .returning();

  if (existing.state !== nextState) {
    await appendConsentTransition(existing.id, existing.state, nextState, {
      trigger: 'consent_recorded',
      actorType: params.actorType,
      actorId: params.actorId ?? null,
    });
  }

  await cancelWorkflowJobs({
    consentObligationId: existing.id,
    jobTypes: ['consent_prompt'],
    reason: 'consent_state_updated',
  });

  if (nextState !== 'active') {
    await scheduleConsentPromptJob({
      consentObligationId: existing.id,
      profileId: params.profileId,
      scheduledAt: new Date(),
      sourceState: nextState,
    });
  }

  await enqueueWorkflowJob({
    jobType: 'workflow_fanout',
    idempotencyKey: `consent-fanout:${existing.id}:${nextState}:${Date.now()}`,
    consentObligationId: existing.id,
    profileId: params.profileId,
    payload: {
      objectType: 'consent',
      consentObligationId: existing.id,
      state: nextState,
      consentType: params.consentType,
    },
  });

  return updated;
}

export async function recordConsentObligationTransition(params: {
  consentObligationId: string;
  toState: ConsentObligationState;
  actorType: WorkflowActorType;
  actorId?: string | null;
  trigger: string;
  reasonCode?: string | null;
}) {
  const obligation = await db.query.consentObligations.findFirst({
    where: eq(consentObligations.id, params.consentObligationId),
  });

  if (!obligation) {
    throw new Error('Consent obligation not found');
  }

  assertAllowedTransition('consent', obligation.state, params.toState);

  const now = new Date();
  const [updated] = await db
    .update(consentObligations)
    .set({
      state: params.toState,
      expiredAt: params.toState === 'expired' ? now : obligation.expiredAt,
      revokedAt: params.toState === 'revoked' ? now : obligation.revokedAt,
      nextPromptAt: params.toState === 'active' ? null : now,
      updatedAt: now,
    })
    .where(eq(consentObligations.id, obligation.id))
    .returning();

  await appendConsentTransition(obligation.id, obligation.state, params.toState, {
    trigger: params.trigger,
    actorType: params.actorType,
    actorId: params.actorId ?? null,
    reasonCode: params.reasonCode ?? null,
  });

  await cancelWorkflowJobs({
    consentObligationId: obligation.id,
    jobTypes: ['consent_prompt'],
    reason: `consent_${params.toState}`,
  });

  if (params.toState !== 'active') {
    await scheduleConsentPromptJob({
      consentObligationId: obligation.id,
      profileId: obligation.profileId,
      scheduledAt: now,
      sourceState: params.toState,
    });
  }

  return updated;
}

export async function refreshConsentObligationsForProfile(profileId: string) {
  const consentRows = await db.execute(sql`
    SELECT DISTINCT ON (consent_type)
      id,
      profile_id,
      consent_type,
      consented,
      version,
      consented_at
    FROM user_consents
    WHERE profile_id = ${profileId}
    ORDER BY consent_type, consented_at DESC, created_at DESC
  `);

  const rows = getRows(consentRows) as Array<{
    id: string;
    consent_type: ConsentTypeValue;
    consented: boolean;
    version: string | null;
  }>;

  const seen = new Set(rows.map((row) => row.consent_type));
  const requiredTypes: ConsentTypeValue[] = [
    'gdpr_terms_of_service',
    'gdpr_privacy_policy',
    'marketing_emails',
    'analytics_tracking',
    'ml_matching',
  ];

  for (const row of rows) {
    const expectedVersion = getPolicyVersionForConsentType(row.consent_type);
    const upToDate = row.consented && (!expectedVersion || row.version === expectedVersion);
    await syncConsentObligation({
      profileId,
      consentType: row.consent_type,
      grantedConsentId: row.id,
      consented: upToDate,
      version: expectedVersion,
      actorType: 'system',
    });
  }

  for (const consentType of requiredTypes) {
    if (seen.has(consentType)) {
      continue;
    }

    await syncConsentObligation({
      profileId,
      consentType,
      grantedConsentId: null,
      consented: false,
      version: getPolicyVersionForConsentType(consentType),
      actorType: 'system',
    });
  }

  return db.query.consentObligations.findMany({
    where: eq(consentObligations.profileId, profileId),
  });
}

export async function getConsentCheck(profileId: string) {
  const obligations = await refreshConsentObligationsForProfile(profileId);
  const tos = obligations.find((item) => item.consentType === 'gdpr_terms_of_service');
  const privacy = obligations.find((item) => item.consentType === 'gdpr_privacy_policy');

  const tosUpToDate = tos?.state === 'active';
  const privacyUpToDate = privacy?.state === 'active';
  const missingConsents = obligations
    .filter((item) => item.state !== 'active')
    .map((item) => {
      switch (item.consentType) {
        case 'gdpr_terms_of_service':
          return 'Terms of Service';
        case 'gdpr_privacy_policy':
          return 'Privacy Policy';
        case 'marketing_emails':
          return 'Marketing emails';
        case 'analytics_tracking':
          return 'Analytics tracking';
        case 'ml_matching':
          return 'Matching consent';
        default:
          return item.consentType;
      }
    });

  return {
    needsConsent: !tosUpToDate || !privacyUpToDate,
    tosUpToDate,
    privacyUpToDate,
    missingConsents,
    obligations: obligations.map((obligation) => ({
      id: obligation.id,
      consentType: obligation.consentType,
      workflow: buildWorkflowView({
        machine: 'consent',
        state: obligation.state,
        timestamps: {
          expiresAt: toIso(obligation.expiresAt),
          expiredAt: toIso(obligation.expiredAt),
          revokedAt: toIso(obligation.revokedAt),
          nextPromptAt: toIso(obligation.nextPromptAt),
        },
      }),
      requiredVersion: obligation.requiredVersion,
    })),
  };
}

export { buildWorkflowView };
