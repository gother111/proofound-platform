import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  findDecision: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  getRows: vi.fn(),
  enqueueWorkflowJob: vi.fn(),
  cancelWorkflowJobs: vi.fn(),
  emitLifecycleEvent: vi.fn(),
  emitDecisionMade: vi.fn(),
  emitInterviewCompleted: vi.fn(),
  computeProofTrustSnapshot: vi.fn(),
  appendVerificationLogEntry: vi.fn(),
  appendVerificationTransitionLogEntry: vi.fn(),
  ensureEngagementVerificationForDecision: vi.fn(),
  revalidatePublicPortfolioByProfileId: vi.fn(),
}));

const schema = vi.hoisted(() => ({
  assignmentStateTransitions: {},
  assignments: {},
  consentObligations: {},
  consentStateTransitions: {},
  decisionStateTransitions: { __name: 'decision_state_transitions' },
  decisions: {
    __name: 'decisions',
    id: Symbol('decisions.id'),
    introId: Symbol('decisions.introId'),
    interviewId: Symbol('decisions.interviewId'),
    latestInterviewId: Symbol('decisions.latestInterviewId'),
  },
  interviews: {
    __name: 'interviews',
    id: Symbol('interviews.id'),
  },
  interviewStateTransitions: {},
  introWorkflowStateTransitions: {},
  introWorkflows: {},
  verificationRecords: {},
  verificationStateTransitions: {},
  workflowAsyncJobs: {},
}));

vi.mock('@/db', () => ({
  db: {
    execute: mocks.execute,
    query: {
      decisions: {
        findFirst: mocks.findDecision,
      },
    },
    insert: mocks.insert,
    update: mocks.update,
  },
}));

vi.mock('@/db/schema', () => schema);

vi.mock('@/lib/analytics/lifecycle-events', () => ({
  emitLifecycleEvent: mocks.emitLifecycleEvent,
}));

vi.mock('@/lib/datetime/normalize', () => ({
  toIsoOrNull: (value: Date | null | undefined) => value?.toISOString() ?? null,
}));

vi.mock('@/lib/db/rows', () => ({
  getRows: mocks.getRows,
}));

vi.mock('@/lib/analytics/events', () => ({
  emitDecisionMade: mocks.emitDecisionMade,
  emitInterviewCompleted: mocks.emitInterviewCompleted,
}));

vi.mock('@/lib/privacy/consent-contract', () => ({
  getPolicyVersionForConsentType: vi.fn(),
}));

vi.mock('@/lib/workflow/contracts', () => ({
  assertAllowedTransition: vi.fn(),
  getAllowedActions: vi.fn(() => []),
  getWorkflowLabel: vi.fn((_machine: string, state: string) => state),
}));

vi.mock('@/lib/workflow/queue', () => ({
  cancelWorkflowJobs: mocks.cancelWorkflowJobs,
  enqueueWorkflowJob: mocks.enqueueWorkflowJob,
}));

vi.mock('@/lib/portfolio/public-invalidation', () => ({
  revalidatePublicPortfolioByProfileId: mocks.revalidatePublicPortfolioByProfileId,
}));

vi.mock('@/lib/proof-trust/snapshots', () => ({
  computeProofTrustSnapshot: mocks.computeProofTrustSnapshot,
}));

vi.mock('@/lib/verification/log-entries', () => ({
  appendVerificationLogEntry: mocks.appendVerificationLogEntry,
  appendVerificationTransitionLogEntry: mocks.appendVerificationTransitionLogEntry,
}));

vi.mock('@/lib/engagement-verifications/service', () => ({
  ensureEngagementVerificationForDecision: mocks.ensureEngagementVerificationForDecision,
}));

import { ensureDecisionRecordForInterview, recordDecisionTransition } from '@/lib/workflow/service';

function setInterviewContext(interviewId: string) {
  mocks.getRows.mockReturnValue([
    {
      interview_id: interviewId,
      interview_status: 'completed',
      completed_at: null,
      match_id: 'match-1',
      assignment_id: 'assignment-1',
      candidate_profile_id: 'candidate-1',
      org_id: 'org-1',
      intro_id: 'intro-1',
    },
  ]);
}

describe('workflow decision bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists both interview_id and latest_interview_id when creating a decision record', async () => {
    setInterviewContext('interview-1');
    mocks.findDecision.mockResolvedValue(null);

    const insertDecisionValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([
        {
          id: 'decision-1',
          introId: 'intro-1',
          assignmentId: 'assignment-1',
          candidateProfileId: 'candidate-1',
          orgId: 'org-1',
          interviewId: 'interview-1',
          latestInterviewId: 'interview-1',
          decision: 'hold',
          hoursSinceInterview: '0.00',
          withinSla: true,
          state: 'pending',
        },
      ]),
    });
    const insertTransitionValues = vi.fn().mockResolvedValue(undefined);

    mocks.insert.mockImplementation((table: unknown) => {
      if (table === schema.decisions) {
        return { values: insertDecisionValues };
      }

      if (table === schema.decisionStateTransitions) {
        return { values: insertTransitionValues };
      }

      throw new Error('Unexpected insert target');
    });

    const result = await ensureDecisionRecordForInterview({
      interviewId: 'interview-1',
      actorType: 'organization_member',
      actorId: 'owner-1',
    });

    expect(insertDecisionValues).toHaveBeenCalledWith(
      expect.objectContaining({
        interviewId: 'interview-1',
        latestInterviewId: 'interview-1',
        decision: 'hold',
        hoursSinceInterview: '0.00',
        withinSla: true,
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'decision-1',
        interviewId: 'interview-1',
        latestInterviewId: 'interview-1',
        decision: 'hold',
      })
    );
  });

  it('backfills the legacy interview_id when an existing decision only has latest_interview_id drift', async () => {
    setInterviewContext('interview-2');
    mocks.findDecision.mockResolvedValue({
      id: 'decision-1',
      interviewId: null,
      latestInterviewId: 'interview-old',
    });

    const updateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 'decision-1',
            interviewId: 'interview-2',
            latestInterviewId: 'interview-2',
          },
        ]),
      }),
    });

    mocks.update.mockReturnValue({ set: updateSet });

    const result = await ensureDecisionRecordForInterview({
      interviewId: 'interview-2',
      actorType: 'organization_member',
      actorId: 'owner-1',
    });

    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        interviewId: 'interview-2',
        latestInterviewId: 'interview-2',
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'decision-1',
        interviewId: 'interview-2',
        latestInterviewId: 'interview-2',
      })
    );
  });

  it('records a hire even when legacy interview decision columns are missing in runtime', async () => {
    mocks.getRows
      .mockReturnValueOnce([
        {
          interview_id: 'interview-3',
          interview_status: 'completed',
          completed_at: null,
          match_id: 'match-1',
          assignment_id: 'assignment-1',
          candidate_profile_id: 'candidate-1',
          org_id: 'org-1',
          intro_id: 'intro-1',
        },
      ])
      .mockReturnValueOnce([
        {
          id: 'interview-3',
          status: 'completed',
          completed_at: new Date('2026-03-15T00:00:00.000Z'),
          cancelled_at: null,
          cancelled_by: null,
          cancel_reason: null,
          no_show_at: null,
          no_show_recorded_by: null,
          updated_at: new Date('2026-03-15T00:00:00.000Z'),
        },
      ]);

    mocks.findDecision.mockResolvedValue({
      id: 'decision-1',
      introId: 'intro-1',
      assignmentId: 'assignment-1',
      candidateProfileId: 'candidate-1',
      orgId: 'org-1',
      interviewId: 'interview-3',
      latestInterviewId: 'interview-3',
      state: 'pending',
      reopenedAt: null,
      withdrawnAt: null,
      closedAt: null,
    });

    const decisionUpdateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 'decision-1',
            introId: 'intro-1',
            assignmentId: 'assignment-1',
            candidateProfileId: 'candidate-1',
            orgId: 'org-1',
            interviewId: 'interview-3',
            latestInterviewId: 'interview-3',
            state: 'hire',
            holdUntil: null,
            reasonCode: null,
            updatedAt: new Date('2026-03-15T01:00:00.000Z'),
            reopenedAt: null,
            withdrawnAt: null,
            closedAt: null,
          },
        ]),
      }),
    });
    const interviewUpdateSet = vi.fn().mockReturnValue({
      where: vi
        .fn()
        .mockRejectedValue(new Error('column "decision" of relation "interviews" does not exist')),
    });
    const transitionInsertValues = vi.fn().mockResolvedValue(undefined);

    mocks.update.mockImplementation((table: unknown) => {
      if (table === schema.decisions) {
        return { set: decisionUpdateSet };
      }

      if (table === schema.interviews) {
        return { set: interviewUpdateSet };
      }

      throw new Error('Unexpected update target');
    });
    mocks.insert.mockImplementation((table: unknown) => {
      if (table === schema.decisionStateTransitions) {
        return { values: transitionInsertValues };
      }

      throw new Error('Unexpected insert target');
    });
    mocks.cancelWorkflowJobs.mockResolvedValue(undefined);
    mocks.enqueueWorkflowJob.mockResolvedValue(undefined);
    mocks.ensureEngagementVerificationForDecision.mockResolvedValue({
      id: 'engagement-1',
      status: 'pending_both_confirmations',
    });

    const result = await recordDecisionTransition({
      interviewId: 'interview-3',
      toState: 'hire',
      actorType: 'organization_member',
      actorId: 'owner-1',
      internalNote: 'Strong closeout',
    });

    expect(decisionUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'hire',
        feedback: 'Strong closeout',
      })
    );
    expect(interviewUpdateSet).toHaveBeenCalled();
    expect(result.state).toBe('hire');
    expect(result.engagementVerification).toEqual({
      id: 'engagement-1',
      status: 'pending_both_confirmations',
    });
  });
});
