import { CANDIDATE_INVITE_FLOW_TYPE, CANDIDATE_INVITE_STATUS } from '@/lib/candidate-invites';

export const VISUAL_CANDIDATE_INVITE_TOKENS = {
  proofCardClaimed: 'visual-proof-card-claimed',
  proofCardPending: 'visual-proof-card-pending',
} as const;

const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001';

export function candidateInviteVisualFixturesEnabled() {
  return (
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true' &&
    process.env.PROOFOUND_VISUAL_FIXTURES === 'true' &&
    process.env.VERCEL_ENV !== 'production'
  );
}

function buildAssignment() {
  return {
    id: 'visual-assignment-candidate-proof',
    role: 'Evidence Operations Lead for a proof-first pilot corridor',
    description:
      'Lead a compact proof review lane for a privacy-sensitive hiring pilot, turning raw project evidence, reviewer notes, and operational constraints into a calm assignment packet the organization can inspect without seeing identity-bearing details too early.',
    status: 'active',
    creationStatus: 'published',
    engagementType: 'contract_consulting',
    businessValue:
      'Reduce noisy candidate screening by reviewing one role-specific proof pack before any identity reveal or broad portfolio exposure.',
    expectedImpact:
      'Submit one owner-only proof pack showing real work, your part in the outcome, constraints, and what can be checked without contacting third parties.',
    mustHaveSkills: [
      { label: 'Evidence review', level: 4 },
      { label: 'Privacy operations', level: 4 },
      { label: 'Stakeholder synthesis', level: 3 },
      { label: 'Workflow design', level: 3 },
    ],
    niceToHaveSkills: [{ label: 'Hiring operations', level: 3 }],
    locationMode: 'hybrid',
    country: 'Sweden',
    city: 'Stockholm',
    compMin: 650,
    compMax: 950,
    currency: 'SEK',
    hoursMin: 12,
    hoursMax: 20,
    startEarliest: '2026-06-01T00:00:00.000Z',
    startLatest: '2026-06-15T00:00:00.000Z',
    verificationGates: ['identity', 'work_email'],
    createdAt: '2026-05-18T08:00:00.000Z',
  };
}

export function buildVisualCandidateInviteResponse(token: string) {
  if (
    token !== VISUAL_CANDIDATE_INVITE_TOKENS.proofCardClaimed &&
    token !== VISUAL_CANDIDATE_INVITE_TOKENS.proofCardPending
  ) {
    return null;
  }

  const claimed = token === VISUAL_CANDIDATE_INVITE_TOKENS.proofCardClaimed;

  return {
    invite: {
      id: 'visual-candidate-invite-1',
      status: claimed ? CANDIDATE_INVITE_STATUS.CLAIMED : CANDIDATE_INVITE_STATUS.PENDING,
      flowType: CANDIDATE_INVITE_FLOW_TYPE.PROOF_CARD,
      assignmentId: 'visual-assignment-candidate-proof',
      maskedEmail: 'ca***@example.com',
      expiresAt: '2026-06-21T12:00:00.000Z',
      claimedAt: claimed ? '2026-05-18T09:00:00.000Z' : null,
      claimedByCurrentUser: claimed,
      acceptedAt: null,
      acceptedByCurrentUser: false,
      communicationsUrl: null,
      proofSubmittedAt: null,
    },
    organization: {
      id: 'visual-org-nordic-field',
      slug: 'nordic-field-systems',
      displayName: 'Nordic Field Systems',
      logoUrl: null,
    },
    assignment: buildAssignment(),
    availableProofPacks: claimed
      ? [
          {
            id: '11111111-1111-4111-8111-111111111111',
            title: 'Pilot proof review system with privacy-safe evidence packet',
            summary:
              'Owner-only proof pack with implementation notes, before/after review quality signals, and a concise verifier-safe outcome summary.',
            evidenceSummary:
              'Includes a workflow snapshot, decision checklist, anonymized reviewer feedback, and implementation notes.',
            outcomesSummary:
              'Reduced review ambiguity and gave the organization a concrete first-pass evidence path.',
            verificationSummary:
              'One scoped work-email verification is available; no new verification request is sent by this invite submission.',
            updatedAt: '2026-05-18T09:30:00.000Z',
          },
        ]
      : [],
  };
}
