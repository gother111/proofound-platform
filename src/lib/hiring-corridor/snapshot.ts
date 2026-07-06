import type { EngagementVerificationSummary } from '@/lib/engagement-verifications/service';

export const HIRING_CORRIDOR_STEPS = [
  'shortlisted',
  'intro_requested',
  'intro_accepted',
  'reveal_requested',
  'reveal_approved',
  'interviews',
  'decision',
  'engagement_recorded',
  'engagement_verified',
] as const;

export type HiringCorridorStep = (typeof HIRING_CORRIDOR_STEPS)[number];
export type HiringCorridorStepStatus = 'complete' | 'current' | 'upcoming';
export type HiringCorridorPerspective = 'individual' | 'organization';

export type HiringCorridorNextActionId =
  | 'wait_for_intro_request'
  | 'request_intro'
  | 'respond_to_intro'
  | 'wait_for_intro_response'
  | 'request_reveal'
  | 'respond_to_reveal'
  | 'wait_for_reveal_response'
  | 'schedule_interview'
  | 'wait_for_interview_schedule'
  | 'prepare_for_interview'
  | 'record_decision'
  | 'wait_for_decision'
  | 'advance_to_next_interview'
  | 'wait_for_next_interview'
  | 'confirm_engagement'
  | 'wait_for_engagement_confirmation'
  | 'corridor_complete'
  | 'corridor_closed';

export type HiringCorridorNextAction = {
  id: HiringCorridorNextActionId;
  label: string;
  description: string;
};

export type HiringCorridorSnapshot = {
  currentStep: HiringCorridorStep;
  steps: Array<{
    id: HiringCorridorStep;
    label: string;
    status: HiringCorridorStepStatus;
    timestamp: string | null;
  }>;
  nextAction: HiringCorridorNextAction;
  privacyStage:
    | 'stage1_capability_and_proof'
    | 'stage2_contextual_reveal'
    | 'stage3_intro_approved'
    | 'stage4_interview_coordination';
  decisionState: string | null;
  engagementVerification: EngagementVerificationSummary | null;
  summary: string;
  subjectLabel: string;
};

export type HiringCorridorSource = {
  matchId: string;
  assignmentTitle: string | null;
  organizationName: string | null;
  candidateDisplayName: string | null;
  candidateProfileId: string | null;
  reviewStage: string | null;
  revealScope: string | null;
  shortlistedAt: Date | null;
  fullIdentityUnlockedAt: Date | null;
  introId: string | null;
  introState: string | null;
  introUpdatedAt: Date | null;
  introLastActivityAt: Date | null;
  conversationId: string | null;
  conversationStage: 'masked' | 'revealed' | null;
  participantOneId: string | null;
  participantTwoId: string | null;
  participantOneWantsReveal: boolean | null;
  participantTwoWantsReveal: boolean | null;
  participantOneRevealRequestedAt: Date | null;
  participantTwoRevealRequestedAt: Date | null;
  revealedAt: Date | null;
  maskedHandleOne: string | null;
  maskedHandleTwo: string | null;
  interviewId: string | null;
  interviewStatus: string | null;
  interviewScheduledAt: Date | null;
  interviewDurationMinutes: number | null;
  interviewPlatform: string | null;
  interviewMeetingUrl: string | null;
  interviewManualMeetingProvider: string | null;
  interviewRescheduleCount: number | null;
  interviewCompletedAt: Date | null;
  interviewCancelledAt: Date | null;
  interviewNoShowAt: Date | null;
  decisionId: string | null;
  decisionState: string | null;
  decisionUpdatedAt: Date | null;
  decisionHoldUntil: Date | null;
  engagementVerification: EngagementVerificationSummary | null;
};

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

function stepLabel(step: HiringCorridorStep) {
  switch (step) {
    case 'shortlisted':
      return 'Shortlisted';
    case 'intro_requested':
      return 'Intro requested';
    case 'intro_accepted':
      return 'Intro accepted';
    case 'reveal_requested':
      return 'Reveal requested';
    case 'reveal_approved':
      return 'Reveal approved';
    case 'interviews':
      return 'Interview(s)';
    case 'decision':
      return 'Decision';
    case 'engagement_recorded':
      return 'Engagement recorded';
    case 'engagement_verified':
      return 'Engagement verified';
  }
}

export function getHiringCorridorPrivacyLabel(stage: HiringCorridorSnapshot['privacyStage']) {
  switch (stage) {
    case 'stage1_capability_and_proof':
      return 'Blind review';
    case 'stage2_contextual_reveal':
      return 'Context reveal';
    case 'stage3_intro_approved':
      return 'Identity reveal approved';
    case 'stage4_interview_coordination':
      return 'Interview coordination';
  }
}

function getMaskedCounterpartyLabel(source: HiringCorridorSource, userId: string) {
  if (source.participantOneId === userId) {
    return source.maskedHandleTwo ?? 'Proof-review participant';
  }

  if (source.participantTwoId === userId) {
    return source.maskedHandleOne ?? 'Proof-review participant';
  }

  return 'Proof-review participant';
}

function getRevealRequestState(source: HiringCorridorSource, userId: string) {
  const participantOnePending =
    source.participantOneWantsReveal === true && source.participantTwoWantsReveal !== true;
  const participantTwoPending =
    source.participantTwoWantsReveal === true && source.participantOneWantsReveal !== true;

  if (!participantOnePending && !participantTwoPending) {
    return {
      pending: false,
      requestedByCurrentUser: false,
      requestedAt: null as Date | null,
    };
  }

  const requestedByCurrentUser = participantOnePending
    ? source.participantOneId === userId
    : source.participantTwoId === userId;
  const requestedAt = participantOnePending
    ? source.participantOneRevealRequestedAt
    : source.participantTwoRevealRequestedAt;

  return {
    pending: true,
    requestedByCurrentUser,
    requestedAt,
  };
}

function getPrivacyStage(source: HiringCorridorSource) {
  if (source.interviewId) {
    return 'stage4_interview_coordination' as const;
  }

  if (
    source.revealScope === 'full_identity' ||
    source.fullIdentityUnlockedAt ||
    source.conversationStage === 'revealed'
  ) {
    return 'stage3_intro_approved' as const;
  }

  if (source.revealScope === 'shortlist_identity') {
    return 'stage2_contextual_reveal' as const;
  }

  return 'stage1_capability_and_proof' as const;
}

export function buildHiringCorridorSnapshot(params: {
  source: HiringCorridorSource;
  viewerUserId: string;
  perspective: HiringCorridorPerspective;
}): HiringCorridorSnapshot | null {
  const { source, viewerUserId, perspective } = params;

  const isShortlisted =
    source.reviewStage === 'shortlisted' ||
    Boolean(source.shortlistedAt) ||
    Boolean(source.introId) ||
    Boolean(source.conversationId) ||
    Boolean(source.interviewId) ||
    Boolean(source.decisionId);

  if (!isShortlisted) {
    return null;
  }

  const introRequested =
    source.introState === 'pending_candidate_interest' ||
    source.introState === 'pending_org_interest';
  const introAccepted =
    source.introState === 'mutual' ||
    source.introState === 'conversation_open' ||
    source.introState === 'interview_handoff';
  const revealRequest = getRevealRequestState(source, viewerUserId);
  const revealApproved =
    source.conversationStage === 'revealed' ||
    source.revealScope === 'full_identity' ||
    Boolean(source.fullIdentityUnlockedAt) ||
    source.introState === 'interview_handoff' ||
    Boolean(source.interviewId) ||
    Boolean(source.decisionId);
  const interviewScheduled = Boolean(source.interviewId);
  const decisionComplete = Boolean(source.decisionState && source.decisionState !== 'pending');
  const engagementRecorded = Boolean(source.engagementVerification?.id);
  const engagementVerified = source.engagementVerification?.status === 'verified';
  const activeInterviewInProgress = source.interviewStatus === 'scheduled';

  let currentStep: HiringCorridorStep = 'shortlisted';

  if (engagementVerified) {
    currentStep = 'engagement_verified';
  } else if (engagementRecorded) {
    currentStep = 'engagement_recorded';
  } else if (activeInterviewInProgress) {
    currentStep = 'interviews';
  } else if (decisionComplete) {
    currentStep = 'decision';
  } else if (interviewScheduled) {
    currentStep = 'interviews';
  } else if (revealApproved) {
    currentStep = 'reveal_approved';
  } else if (revealRequest.pending) {
    currentStep = 'reveal_requested';
  } else if (introAccepted) {
    currentStep = 'intro_accepted';
  } else if (introRequested) {
    currentStep = 'intro_requested';
  }

  const currentIndex = HIRING_CORRIDOR_STEPS.indexOf(currentStep);

  let nextAction: HiringCorridorNextAction;
  let summary: string;

  if (currentStep === 'shortlisted') {
    if (perspective === 'organization') {
      nextAction = {
        id: 'request_intro',
        label: 'Request intro',
        description:
          'Open the assignment-review flow by asking the proof-review participant to accept an intro.',
      };
      summary = 'The proof-review participant is shortlisted and still in blind review.';
    } else {
      nextAction = {
        id: 'wait_for_intro_request',
        label: 'Wait for intro request',
        description:
          'You are shortlisted. The organization must request an intro before the assignment-review flow moves forward.',
      };
      summary = 'You are shortlisted. Blind review is still in place.';
    }
  } else if (currentStep === 'intro_requested') {
    if (source.introState === 'pending_candidate_interest') {
      if (perspective === 'individual') {
        nextAction = {
          id: 'respond_to_intro',
          label: 'Respond to intro',
          description: 'Accept or decline the intro request to keep the assignment-review flow moving.',
        };
        summary = 'An intro has been requested and is waiting for your response.';
      } else {
        nextAction = {
          id: 'wait_for_intro_response',
          label: 'Wait for intro response',
          description: 'The proof-review participant needs to accept or decline the intro request.',
        };
        summary = 'The intro request is waiting on the proof-review participant.';
      }
    } else if (perspective === 'organization') {
      nextAction = {
        id: 'respond_to_intro',
        label: 'Confirm intro',
        description:
          'The proof-review participant expressed interest. Confirm the intro to open the assignment-review flow.',
      };
      summary =
        'The proof-review participant has signaled interest and the organization still needs to confirm.';
    } else {
      nextAction = {
        id: 'wait_for_intro_response',
        label: 'Wait for organization response',
        description:
          'The organization still needs to confirm the intro before identity reveal can start.',
      };
      summary = 'You have signaled interest and the organization still needs to confirm the intro.';
    }
  } else if (currentStep === 'intro_accepted') {
    if (perspective === 'organization') {
      nextAction = {
        id: 'request_reveal',
        label: 'Request reveal',
        description: 'Ask for identity-bearing reveal before interview coordination begins.',
      };
      summary = 'The intro is accepted. Blind review still applies until reveal is approved.';
    } else {
      nextAction = {
        id: 'wait_for_reveal_response',
        label: 'Wait for reveal request',
        description:
          'The organization can request reveal when it is ready to continue the assignment-review flow.',
      };
      summary =
        'The intro is accepted and the conversation can continue anonymously until reveal is requested.';
    }
  } else if (currentStep === 'reveal_requested') {
    if (revealRequest.requestedByCurrentUser) {
      nextAction = {
        id: 'wait_for_reveal_response',
        label: 'Wait for reveal response',
        description:
          'The other side must approve reveal before identity-bearing information becomes visible.',
      };
      summary = 'Reveal has been requested and is waiting for the other side to approve it.';
    } else {
      nextAction = {
        id: 'respond_to_reveal',
        label: 'Review and approve reveal',
        description:
          'Check what becomes visible now, what stays hidden, and approve only if you want to continue.',
      };
      summary = 'Reveal has been requested. Identity is still hidden until you approve it.';
    }
  } else if (currentStep === 'reveal_approved') {
    if (perspective === 'organization') {
      nextAction = {
        id: 'schedule_interview',
        label: 'Schedule interview',
        description: 'Reveal is approved, so interview coordination can begin.',
      };
      summary = 'Reveal is approved. Interview coordination is now the legal next step.';
    } else {
      nextAction = {
        id: 'wait_for_interview_schedule',
        label: 'Wait for interview schedule',
        description: 'The organization can now schedule the interview.',
      };
      summary = 'Reveal is approved. The assignment-review flow is ready for interview scheduling.';
    }
  } else if (currentStep === 'interviews') {
    const interviewFinished =
      source.interviewStatus === 'completed' ||
      Boolean(source.interviewCompletedAt) ||
      source.interviewStatus === 'no_show' ||
      source.interviewStatus === 'cancelled';

    if (source.interviewStatus === 'no_show' || source.interviewStatus === 'cancelled') {
      if (perspective === 'organization') {
        nextAction = {
          id: 'schedule_interview',
          label: 'Schedule replacement interview',
          description:
            'The last interview did not complete, so the legal next action is to schedule a replacement interview.',
        };
        summary =
          'The interview did not complete, and the assignment-review flow is waiting for a replacement interview.';
      } else {
        nextAction = {
          id: 'wait_for_next_interview',
          label: 'Wait for replacement interview',
          description: 'The organization needs to schedule the next interview slot.',
        };
        summary =
          'The last interview did not complete. The assignment-review flow is waiting for a replacement interview.';
      }
    } else if (interviewFinished) {
      if (perspective === 'organization') {
        nextAction = {
          id: 'record_decision',
          label: 'Record decision',
          description: 'Complete the decision step now that the interview has finished.',
        };
        summary = 'The interview round is complete and the assignment-review flow is waiting for a decision.';
      } else {
        nextAction = {
          id: 'wait_for_decision',
          label: 'Wait for decision',
          description: 'The organization is expected to record the next decision.',
        };
        summary =
          'The interview round is complete and the assignment-review flow is waiting for the organization’s decision.';
      }
    } else {
      nextAction = {
        id: 'prepare_for_interview',
        label: 'Prepare for interview',
        description:
          'The interview round is scheduled and coordination details are now visible to both sides.',
      };
      summary = 'The interview stage is active and the assignment-review flow is in coordination mode.';
    }
  } else if (currentStep === 'decision') {
    if (source.decisionState === 'hire') {
      const orgConfirmed = Boolean(source.engagementVerification?.organizationConfirmedAt);
      const candidateConfirmed = Boolean(source.engagementVerification?.candidateConfirmedAt);

      if (perspective === 'organization' && !orgConfirmed) {
        nextAction = {
          id: 'confirm_engagement',
          label: 'Confirm engagement',
          description:
            'Record the engagement confirmation so the decision stays distinct from trust verification.',
        };
        summary =
          'The engagement decision is recorded. Engagement verification is still waiting on the organization.';
      } else if (perspective === 'individual' && !candidateConfirmed) {
        nextAction = {
          id: 'confirm_engagement',
          label: 'Confirm engagement',
          description:
            'Confirm the engagement so the trust record can move beyond the decision stage.',
        };
        summary =
          'The engagement decision is recorded. Engagement verification is still waiting on you.';
      } else {
        nextAction = {
          id: 'wait_for_engagement_confirmation',
          label: 'Wait for engagement confirmation',
          description:
            'The engagement decision is recorded. The remaining step is engagement verification.',
        };
        summary =
          'The engagement decision is recorded and the assignment-review flow is waiting for engagement verification.';
      }
    } else if (source.decisionState === 'advance') {
      if (perspective === 'organization') {
        nextAction = {
          id: 'advance_to_next_interview',
          label: 'Schedule next interview',
          description:
            'Advance keeps the assignment-review flow active and requires the next interview step.',
        };
        summary =
          'The proof-review participant advanced and the assignment-review flow is waiting for the next interview step.';
      } else {
        nextAction = {
          id: 'wait_for_next_interview',
          label: 'Wait for next interview',
          description:
            'The organization advanced the assignment-review flow and should schedule the next interview step.',
        };
        summary =
          'You advanced in the assignment-review flow and the next interview step should be scheduled.';
      }
    } else if (source.decisionState === 'hold') {
      nextAction = {
        id: 'wait_for_decision',
        label: 'Wait for decision update',
        description:
          'The assignment-review flow is on hold until the organization records the next decision.',
      };
      summary = 'The decision is on hold.';
    } else if (source.decisionState === 'reject' || source.decisionState === 'withdraw') {
      nextAction = {
        id: 'corridor_closed',
        label: 'Assignment-review flow closed',
        description:
          'This assignment-review flow ended without an engagement, so there is no next workflow action.',
      };
      summary = 'The assignment-review flow is closed.';
    } else {
      nextAction = {
        id: 'wait_for_decision',
        label: 'Wait for decision update',
        description:
          'The current decision keeps the assignment-review flow open, but no further action is available yet.',
      };
      summary = 'The assignment-review flow is waiting on the next decision update.';
    }
  } else if (currentStep === 'engagement_recorded') {
    const organizationConfirmed =
      source.engagementVerification?.organizationConfirmedAt &&
      source.engagementVerification.organizationConfirmedAt.length > 0;
    const candidateConfirmed =
      source.engagementVerification?.candidateConfirmedAt &&
      source.engagementVerification.candidateConfirmedAt.length > 0;

    if (perspective === 'organization' && !organizationConfirmed) {
      nextAction = {
        id: 'confirm_engagement',
        label: 'Confirm engagement',
        description:
          'Record the engagement details so the proof-review participant can complete the final verification step.',
      };
      summary =
        'The engagement decision is recorded and the assignment-review flow is waiting for the organization to record the engagement.';
    } else if (perspective === 'individual' && !candidateConfirmed) {
      nextAction = {
        id: 'confirm_engagement',
        label: 'Confirm engagement',
        description:
          'The engagement has been recorded and now needs your confirmation to finish the assignment-review flow.',
      };
      summary =
        'The engagement has been recorded and the assignment-review flow is waiting for your confirmation.';
    } else {
      nextAction = {
        id: 'wait_for_engagement_confirmation',
        label: 'Wait for engagement confirmation',
        description:
          'One side has already recorded the engagement. The assignment-review flow will complete after the remaining confirmation.',
      };
      summary =
        'The engagement is recorded and the assignment-review flow is waiting for the remaining confirmation.';
    }
  } else {
    nextAction = {
      id: 'corridor_complete',
      label: 'Assignment-review flow complete',
      description: 'The engagement is verified and the assignment-review flow is complete.',
    };
    summary = 'The engagement has been verified.';
  }

  const subjectLabel =
    perspective === 'organization'
      ? revealApproved
        ? source.candidateDisplayName || 'Proof-review participant'
        : getMaskedCounterpartyLabel(source, viewerUserId)
      : source.organizationName || source.assignmentTitle || 'Organization';

  const engagementRecordedAt = source.engagementVerification?.createdAt
    ? new Date(source.engagementVerification.createdAt)
    : null;
  const engagementVerifiedAt = source.engagementVerification?.verifiedAt
    ? new Date(source.engagementVerification.verifiedAt)
    : null;

  return {
    currentStep,
    steps: HIRING_CORRIDOR_STEPS.map((step, index) => ({
      id: step,
      label: stepLabel(step),
      status: index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming',
      timestamp:
        step === 'shortlisted'
          ? toIso(source.shortlistedAt)
          : step === 'intro_requested'
            ? toIso(source.introUpdatedAt)
            : step === 'intro_accepted'
              ? toIso(source.introLastActivityAt ?? source.introUpdatedAt)
              : step === 'reveal_requested'
                ? toIso(revealRequest.requestedAt)
                : step === 'reveal_approved'
                  ? toIso(
                      source.revealedAt ?? source.fullIdentityUnlockedAt ?? source.introUpdatedAt
                    )
                  : step === 'interviews'
                    ? toIso(source.interviewScheduledAt)
                    : step === 'decision'
                      ? toIso(source.decisionUpdatedAt)
                      : step === 'engagement_recorded'
                        ? toIso(engagementRecordedAt)
                        : toIso(engagementVerifiedAt),
    })),
    nextAction,
    privacyStage: getPrivacyStage(source),
    decisionState: source.decisionState,
    engagementVerification: source.engagementVerification,
    summary,
    subjectLabel,
  };
}
