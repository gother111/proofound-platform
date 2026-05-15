export const CANDIDATE_INVITE_EXPIRY_DAYS = 14;

export const CANDIDATE_INVITE_STATUS = {
  PENDING: 'pending',
  CLAIMED: 'claimed',
  PROOF_SUBMITTED: 'proof_submitted',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
} as const;

export type CandidateInviteStatus =
  (typeof CANDIDATE_INVITE_STATUS)[keyof typeof CANDIDATE_INVITE_STATUS];

export const CANDIDATE_INVITE_FLOW_TYPE = {
  PROOF_CARD: 'proof_card',
  TEST_MATCH: 'test_match',
} as const;

export type CandidateInviteFlowType =
  (typeof CANDIDATE_INVITE_FLOW_TYPE)[keyof typeof CANDIDATE_INVITE_FLOW_TYPE];
