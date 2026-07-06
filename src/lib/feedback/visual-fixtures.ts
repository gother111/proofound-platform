import { visualFixturesRuntimeAllowed } from '@/lib/env';

export const VISUAL_FEEDBACK_TOKENS = {
  pendingCandidateToOrg: 'visual-feedback-token-candidate-0000001',
} as const;

export const VISUAL_FEEDBACK_INTERVIEW_IDS = {
  completed: '11111111-1111-4111-8111-111111111111',
} as const;

const VISUAL_FEEDBACK_EXPIRY_DAYS = 30;

function buildFutureVisualFeedbackExpiry() {
  return new Date(Date.now() + VISUAL_FEEDBACK_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function feedbackVisualFixturesEnabled() {
  return (
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true' &&
    process.env.PROOFOUND_VISUAL_FIXTURES === 'true' &&
    visualFixturesRuntimeAllowed()
  );
}

export function clientFeedbackVisualFixturesEnabled() {
  const visualFixturesEnabled =
    process.env.NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES === 'true' ||
    process.env.PROOFOUND_VISUAL_FIXTURES === 'true';

  return (
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true' &&
    visualFixturesEnabled &&
    visualFixturesRuntimeAllowed()
  );
}

export function buildVisualFeedbackTokenResponse(token: string) {
  if (token !== VISUAL_FEEDBACK_TOKENS.pendingCandidateToOrg) {
    return null;
  }

  return {
    token,
    direction: 'candidate_to_org' as const,
    expiresAt: buildFutureVisualFeedbackExpiry(),
    usedAt: null,
    structuredFeedbackRequired: false,
    feedbackContract: {
      requiresReasonCode: false,
      requiresPersonalizedNote: false,
      requiresSuggestedNextStep: false,
      rubricVersion: 'structured-feedback/v1',
    },
    template: {
      id: 'visual-feedback-template-1',
      name: 'Candidate to organization interview feedback',
      direction: 'candidate_to_org' as const,
      description: 'A compact, anonymous follow-up after an interview.',
    },
    questions: [
      {
        id: 'visual-feedback-q-clarity',
        prompt: 'How clear was the assignment and interview process?',
        question_type: 'scale' as const,
        scale_min: 1,
        scale_max: 5,
        required: true,
        sort_order: 1,
        helper_text: '1 means unclear, 5 means very clear.',
      },
      {
        id: 'visual-feedback-q-next-step',
        prompt: 'What would have made the next step easier?',
        question_type: 'text' as const,
        scale_min: null,
        scale_max: null,
        required: false,
        sort_order: 2,
        helper_text: 'Keep it short. One or two concrete details is enough.',
      },
    ],
    interview: {
      id: 'visual-feedback-interview-1',
      status: 'completed',
      scheduled_at: '2026-05-17T13:00:00.000Z',
      completed_at: '2026-05-17T13:45:00.000Z',
    },
    feedbackFollowUp: {
      dueAt: '2026-05-19T13:45:00.000Z',
      overallState: 'on_track',
      candidateToOrg: 'pending',
      orgToCandidate: 'submitted',
      slaBreached: false,
    },
  };
}

export function buildVisualInterviewFeedbackResponse(interviewId: string) {
  if (interviewId !== VISUAL_FEEDBACK_INTERVIEW_IDS.completed) {
    return null;
  }

  const participantTemplateId = '22222222-2222-4222-8222-222222222222';
  const organizationTemplateId = '33333333-3333-4333-8333-333333333333';
  const organizationTextQuestionId = '55555555-5555-4555-8555-555555555555';

  return {
    interview: {
      id: interviewId,
      status: 'completed',
    },
    templates: [
      {
        id: participantTemplateId,
        name: 'Participant feedback',
        direction: 'candidate_to_org' as const,
        description: 'A compact, anonymous participant follow-up after an interview.',
        questions: [
          {
            id: '44444444-4444-4444-8444-444444444444',
            prompt: 'How clear was the assignment and interview process?',
            question_type: 'scale' as const,
            scale_min: 1,
            scale_max: 5,
            required: true,
            sort_order: 1,
            helper_text: '1 means unclear, 5 means very clear.',
          },
          {
            id: '66666666-6666-4666-8666-666666666666',
            prompt: 'What would have made the next step easier?',
            question_type: 'text' as const,
            scale_min: null,
            scale_max: null,
            required: false,
            sort_order: 2,
            helper_text: 'Keep it short. One or two concrete details is enough.',
          },
        ],
      },
      {
        id: organizationTemplateId,
        name: 'Organization workflow feedback',
        direction: 'org_to_candidate' as const,
        description: 'A compact, anonymous organization-side workflow follow-up.',
        questions: [
          {
            id: organizationTextQuestionId,
            prompt: 'What helped the review workflow feel clear?',
            question_type: 'text' as const,
            scale_min: null,
            scale_max: null,
            required: false,
            sort_order: 1,
            helper_text: 'Keep it concrete and tied to the interview workflow.',
          },
        ],
      },
    ],
    responses: [
      {
        id: '77777777-7777-4777-8777-777777777777',
        template_id: organizationTemplateId,
        direction: 'org_to_candidate' as const,
        submitted_by: null,
        created_at: '2026-05-17T14:00:00.000Z',
        answers: [
          {
            id: '88888888-8888-4888-8888-888888888888',
            question_id: organizationTextQuestionId,
            score: null,
            text_answer:
              'The proof packet made the discussion easier to anchor without exposing identity details too early.',
          },
        ],
      },
    ],
  };
}
