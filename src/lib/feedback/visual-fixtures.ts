export const VISUAL_FEEDBACK_TOKENS = {
  pendingCandidateToOrg: 'visual-feedback-token-candidate-0000001',
} as const;

export function feedbackVisualFixturesEnabled() {
  return (
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true' &&
    process.env.PROOFOUND_VISUAL_FIXTURES === 'true' &&
    process.env.VERCEL_ENV !== 'production'
  );
}

export function clientFeedbackVisualFixturesEnabled() {
  return process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true';
}

export function buildVisualFeedbackTokenResponse(token: string) {
  if (token !== VISUAL_FEEDBACK_TOKENS.pendingCandidateToOrg) {
    return null;
  }

  return {
    token,
    direction: 'candidate_to_org' as const,
    expiresAt: '2026-06-18T08:00:00.000Z',
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
