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

// Enforced defaults for invite-driven proof cards.
export const CANDIDATE_PROOF_CARD_DEFAULT_FIELDS: Record<string, boolean | number> = {
  name: true,
  headline: true,
  bio: true,
  skills: true,
  topSkills: 8,
  experience: true,
  education: true,
  location: true,
  profileImage: true,
  values: true,
  causes: true,
};
