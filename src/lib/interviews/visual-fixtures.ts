import { isMockSupabaseEnabled } from '@/lib/env';
import type { InterviewCorridorItem } from '@/app/actions/interviews';
import type { EngagementVerificationSummary } from '@/lib/engagement-verifications/service';
import type {
  HiringCorridorNextActionId,
  HiringCorridorSnapshot,
  HiringCorridorStep,
} from '@/lib/hiring-corridor/snapshot';

export function interviewVisualFixturesEnabled() {
  return (
    isMockSupabaseEnabled() &&
    process.env.PROOFOUND_VISUAL_FIXTURES === 'true' &&
    process.env.PROOFOUND_INTERVIEWS_VISUAL_STATE === 'filled' &&
    process.env.VERCEL_ENV !== 'production'
  );
}

const steps: HiringCorridorStep[] = [
  'shortlisted',
  'intro_requested',
  'intro_accepted',
  'reveal_requested',
  'reveal_approved',
  'interviews',
  'decision',
  'engagement_recorded',
  'engagement_verified',
];

function buildCorridor(params: {
  currentStep: HiringCorridorStep;
  nextActionId: HiringCorridorNextActionId;
  nextActionLabel: string;
  nextActionDescription: string;
  summary: string;
  subjectLabel: string;
  decisionState?: string | null;
  engagementVerification?: HiringCorridorSnapshot['engagementVerification'];
}): HiringCorridorSnapshot {
  const currentIndex = steps.indexOf(params.currentStep);

  return {
    currentStep: params.currentStep,
    steps: steps.map((step, index) => ({
      id: step,
      label:
        step === 'intro_requested'
          ? 'Intro requested'
          : step === 'intro_accepted'
            ? 'Intro accepted'
            : step === 'reveal_requested'
              ? 'Reveal requested'
              : step === 'reveal_approved'
                ? 'Reveal approved'
                : step === 'engagement_recorded'
                  ? 'Engagement recorded'
                  : step === 'engagement_verified'
                    ? 'Engagement verified'
                    : step.charAt(0).toUpperCase() + step.slice(1),
      status: index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming',
      timestamp:
        index <= currentIndex
          ? new Date(Date.now() - (currentIndex - index) * 86400000).toISOString()
          : null,
    })),
    nextAction: {
      id: params.nextActionId,
      label: params.nextActionLabel,
      description: params.nextActionDescription,
    },
    privacyStage: 'stage4_interview_coordination',
    decisionState: params.decisionState ?? null,
    engagementVerification: params.engagementVerification ?? null,
    summary: params.summary,
    subjectLabel: params.subjectLabel,
  };
}

export function buildVisualOrgInterviewCorridorItems(): InterviewCorridorItem[] {
  const now = Date.now();
  const scheduledAt = new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString();
  const completedAt = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
  const engagementVerification: EngagementVerificationSummary = {
    id: 'visual-engagement-verification-1',
    decisionId: 'visual-decision-1',
    status: 'pending_both_confirmations',
    statusLabel: 'Awaiting both confirmations',
    engagementType: null,
    candidateConfirmedAt: null,
    organizationConfirmedAt: null,
    uploadedEvidencePresent: false,
    proofHookStatus: 'not_ready',
    verifiedAt: null,
    createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    workflow: {
      state: 'pending_both_confirmations',
      displayState: 'Awaiting both confirmations',
      allowedActions: ['confirm'],
    },
  };

  return [
    {
      id: 'visual-org-interview-scheduled',
      matchId: '11111111-1111-4111-8111-111111111111',
      assignmentTitle:
        'Privacy-safe proof operations lead with a deliberately long assignment title',
      organizationName: 'Nordic Future Labs',
      candidateDisplayName: 'Elena Proof Reviewer',
      introAcceptedAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      interview: {
        id: 'visual-interview-scheduled-1',
        scheduledAt,
        duration: 30,
        platform: 'google_meet',
        meetingUrl: 'https://meet.google.com/visual-proofound',
        manualMeetingProvider: null,
        rescheduleCount: 0,
        status: 'scheduled',
        completedAt: null,
        cancelledAt: null,
        noShowAt: null,
      },
      decisionState: null,
      engagementVerification: null,
      corridor: buildCorridor({
        currentStep: 'interviews',
        nextActionId: 'prepare_for_interview',
        nextActionLabel: 'Prepare for interview',
        nextActionDescription:
          'The interview is scheduled. Keep coordination details visible and record the outcome after the call.',
        summary: 'Interview coordination is active for this candidate.',
        subjectLabel: 'Elena Proof Reviewer',
      }),
    },
    {
      id: 'visual-org-interview-decision',
      matchId: '22222222-2222-4222-8222-222222222222',
      assignmentTitle: 'Evidence systems consultant',
      organizationName: 'Nordic Future Labs',
      candidateDisplayName: 'Mira Andersson',
      introAcceptedAt: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(),
      interview: {
        id: 'visual-interview-completed-1',
        scheduledAt: completedAt,
        duration: 45,
        platform: 'manual',
        meetingUrl: 'pending',
        manualMeetingProvider: 'teams',
        rescheduleCount: 1,
        status: 'completed',
        completedAt,
        cancelledAt: null,
        noShowAt: null,
      },
      decisionState: 'hire',
      engagementVerification,
      corridor: buildCorridor({
        currentStep: 'decision',
        nextActionId: 'confirm_engagement',
        nextActionLabel: 'Confirm engagement',
        nextActionDescription:
          'The hire decision is recorded. Confirm engagement details so verification can finish.',
        summary: 'The decision is hire and engagement verification is waiting on the organization.',
        subjectLabel: 'Mira Andersson',
        decisionState: 'hire',
        engagementVerification,
      }),
    },
  ];
}
