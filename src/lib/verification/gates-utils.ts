/**
 * Verification Gates Utilities (Client-Safe)
 *
 * Pure utility functions that can be used on both client and server
 * No database or Node.js-specific imports
 */

// ============================================================================
// TYPES (shared with gates.ts)
// ============================================================================

export type VerificationGateType =
  | 'identity' // Identity verification (Veriff)
  | 'work_email' // Work email verification
  | 'linkedin' // LinkedIn connection
  | 'peer_attestation' // Peer/mentor attestation
  | 'skill_proof'; // Skill evidence/proof

export interface VerificationGate {
  type: VerificationGateType;
  required: boolean;
  description?: string;
}

export interface VerificationStatus {
  type: VerificationGateType;
  verified: boolean;
  verifiedAt?: Date;
  provider?: string;
}

export interface GateCheckResult {
  passed: boolean;
  unmetGates: VerificationGate[];
  userVerifications: VerificationStatus[];
  canIntroduce: boolean;
  blockingMessage?: string;
}

// ============================================================================
// UTILITY FUNCTIONS (Client-Safe)
// ============================================================================

/**
 * Get human-readable gate description
 */
export function getGateDescription(type: VerificationGateType): string {
  switch (type) {
    case 'identity':
      return 'Identity verification (government ID)';
    case 'work_email':
      return 'Work email verification';
    case 'linkedin':
      return 'LinkedIn profile connection';
    case 'peer_attestation':
      return 'Peer or mentor attestation';
    case 'skill_proof':
      return 'Portfolio or skill evidence';
    default:
      return 'Verification required';
  }
}

/**
 * Get action link for completing verification
 */
export function getGateActionLink(type: VerificationGateType): string {
  switch (type) {
    case 'identity':
      return '/app/i/settings/verification';
    case 'work_email':
      return '/verify-work-email';
    case 'linkedin':
      return '/app/i/settings/connections';
    case 'peer_attestation':
      return '/app/i/profile#attestations';
    case 'skill_proof':
      return '/app/i/portfolio';
    default:
      return '/app/i/settings';
  }
}
