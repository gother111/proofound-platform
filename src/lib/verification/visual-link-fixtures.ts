export const VISUAL_VERIFY_TOKENS = {
  skillObserved: 'visual-skill-verification-token-00000001',
  customBundle: 'visual-custom-verification-token-0000001',
  workEmailSuccess: 'visual-work-email-token-000000000001',
  emailSuccess: 'visual-email-verification-token-00000001',
  resetPasswordSuccess: 'visual-reset-password-token-000000001',
} as const;

export function verificationLinkVisualFixturesEnabled() {
  return (
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true' &&
    process.env.PROOFOUND_VISUAL_FIXTURES === 'true' &&
    process.env.VERCEL_ENV !== 'production'
  );
}

export function buildVisualSkillVerificationResponse(token: string) {
  if (token !== VISUAL_VERIFY_TOKENS.skillObserved) {
    return null;
  }

  return {
    verification: {
      id: 'visual-skill-verification-1',
      verification_type: 'skill',
      skill_name: 'Evidence operations and privacy-safe proof review',
      skill_code: 'evidence_operations',
      requester_name: 'Mira Andersson',
      requester_email: 'mira@example.com',
      verifier_source: 'manager',
      verifier_relationship: 'former_manager',
      request_kind: 'human_observed_attestation',
      attestation_request: {
        skillIds: ['visual-skill-evidence-ops', 'visual-skill-privacy-review'],
        skillLabels: [
          'Evidence operations and privacy-safe proof review',
          'Stakeholder synthesis for launch review',
        ],
      },
      message:
        'Please confirm only what you directly observed during the pilot evidence review. A partial answer is completely fine.',
      status: 'pending',
      requires_authenticated_verifier: false,
      integrity_status: 'clear',
      integrity_reason: null,
      created_at: '2026-05-18T08:00:00.000Z',
      expires_at: '2026-06-18T08:00:00.000Z',
      proofs: [
        {
          id: 'visual-proof-1',
          proof_type: 'project',
          title:
            'Privacy-safe proof review checklist for a launch pilot with a long artifact title',
          description:
            'A compact artifact showing how raw project evidence was converted into an inspectable proof packet without exposing identity-bearing details too early.',
          url: 'https://example.com/proof/privacy-safe-review',
          issued_date: '2026-04-10T00:00:00.000Z',
          expires_date: null,
        },
        {
          id: 'visual-proof-2',
          proof_type: 'document',
          title: 'Reviewer handoff notes',
          description:
            'An anonymized summary of what changed after the evidence workflow was introduced.',
          url: null,
          issued_date: null,
          expires_date: null,
        },
      ],
    },
  };
}

export function buildVisualCustomVerificationResponse(token: string) {
  if (token !== VISUAL_VERIFY_TOKENS.customBundle) {
    return null;
  }

  return {
    request: {
      id: 'visual-custom-verification-1',
      requester_name: 'Elena Proof Reviewer',
      requester_avatar: null,
      relationship: 'client_or_customer',
      request_kind: 'generic_verification',
      attestation_request: null,
      message:
        'Please review the specific artifacts below. Confirm only the parts you can personally stand behind.',
      status: 'pending',
      created_at: '2026-05-18T08:00:00.000Z',
      expires_at: '2026-06-18T08:00:00.000Z',
      responded_at: null,
      response_message: null,
      items: [
        {
          id: 'visual-custom-item-1',
          artifact_type: 'experience',
          artifact_id: 'visual-experience-1',
          display_label:
            'Led a privacy-safe evidence review workflow for a high-trust pilot corridor',
          claim_template: 'confirmed_role',
          claim_label:
            'Elena led the pilot evidence review workflow and coordinated feedback across reviewers',
          support_label: 'Observed directly',
          status: 'pending',
        },
        {
          id: 'visual-custom-item-2',
          artifact_type: 'project',
          artifact_id: 'visual-project-1',
          display_label: 'Proof packet redesign for candidate review',
          claim_template: 'confirmed_outcome',
          claim_label:
            'The redesign made the review packet easier to inspect without broad profile exposure',
          support_label: 'Can confirm outcome',
          status: 'pending',
        },
        {
          id: 'visual-custom-item-3',
          artifact_type: 'skill',
          artifact_id: 'visual-skill-1',
          display_label: 'Stakeholder synthesis',
          claim_template: 'confirmed_skill',
          claim_label: 'Elena synthesized reviewer concerns into a practical operating checklist',
          support_label: 'Worked together',
          status: 'pending',
        },
      ],
    },
  };
}

export function buildVisualWorkEmailVerificationResponse(token: string) {
  if (token !== VISUAL_VERIFY_TOKENS.workEmailSuccess) {
    return null;
  }

  return {
    message: 'Work email verified successfully.',
    workEmail: 'elena.reviewer@northstar-evidence.example',
  };
}

export function isVisualEmailVerificationToken(token: string) {
  return token === VISUAL_VERIFY_TOKENS.emailSuccess;
}

export function isVisualResetPasswordToken(token: string) {
  return token === VISUAL_VERIFY_TOKENS.resetPasswordSuccess;
}
