/**
 * Verification Gates Library
 *
 * Checks if user meets verification requirements before matching/introducing
 * PRD Requirement: Assignments can specify required verifications (gates)
 * that must be passed before introduction
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';

// ============================================================================
// TYPES
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
// GATE CHECKING
// ============================================================================

/**
 * Check if user meets verification gates for an assignment
 * Blocks introduce action if requirements not met
 */
export async function checkVerificationGates(
  userId: string,
  assignmentId: string
): Promise<GateCheckResult> {
  try {
    // Get assignment's required verification gates
    const assignment = await db.execute(sql`
      SELECT verification_gates
      FROM assignments
      WHERE id = ${assignmentId}
    `);

    if (!assignment.rows.length) {
      return {
        passed: true,
        unmetGates: [],
        userVerifications: [],
        canIntroduce: true,
      };
    }

    const gates = (assignment.rows[0] as any).verification_gates as VerificationGate[] | null;

    if (!gates || gates.length === 0) {
      // No gates required
      return {
        passed: true,
        unmetGates: [],
        userVerifications: [],
        canIntroduce: true,
      };
    }

    // Get user's verification status
    const userVerifications = await getUserVerifications(userId);

    // Check each required gate
    const unmetGates: VerificationGate[] = [];

    for (const gate of gates) {
      if (!gate.required) continue;

      const userVerification = userVerifications.find((v) => v.type === gate.type);

      if (!userVerification || !userVerification.verified) {
        unmetGates.push(gate);
      }
    }

    const passed = unmetGates.length === 0;

    log.info('verification.gates.checked', {
      userId,
      assignmentId,
      passed,
      unmetCount: unmetGates.length,
    });

    return {
      passed,
      unmetGates,
      userVerifications,
      canIntroduce: passed,
      blockingMessage: passed
        ? undefined
        : `You must complete ${unmetGates.length} verification${unmetGates.length > 1 ? 's' : ''} before introducing yourself to this role.`,
    };
  } catch (error) {
    log.error('verification.gates.check.failed', {
      userId,
      assignmentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Fail-safe: allow if check fails (don't block user)
    return {
      passed: true,
      unmetGates: [],
      userVerifications: [],
      canIntroduce: true,
    };
  }
}

/**
 * Get user's current verification status
 */
async function getUserVerifications(userId: string): Promise<VerificationStatus[]> {
  const verifications: VerificationStatus[] = [];

  // Get individual profile data
  const profile = await db.execute(sql`
    SELECT
      verification_status,
      verification_method,
      verified_at,
      work_email_verified
    FROM individual_profiles
    WHERE user_id = ${userId}
  `);

  if (profile.rows.length > 0) {
    const row = profile.rows[0] as any;

    // Identity verification
    if (row.verification_status === 'verified') {
      verifications.push({
        type: 'identity',
        verified: true,
        verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,
        provider: row.verification_method,
      });
    }

    // Work email verification
    if (row.work_email_verified) {
      verifications.push({
        type: 'work_email',
        verified: true,
      });
    }
  }

  // Check for attestations
  const attestations = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM attestations
    WHERE subject_user_id = ${userId}
      AND status = 'verified'
  `);

  if (attestations.rows.length > 0) {
    const count = parseInt((attestations.rows[0] as any).count || '0');
    if (count > 0) {
      verifications.push({
        type: 'peer_attestation',
        verified: true,
      });
    }
  }

  // Check for skill proofs (projects with evidence)
  const skillProofs = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM experiences
    WHERE user_id = ${userId}
      AND evidence_urls IS NOT NULL
      AND jsonb_array_length(evidence_urls) > 0
  `);

  if (skillProofs.rows.length > 0) {
    const count = parseInt((skillProofs.rows[0] as any).count || '0');
    if (count > 0) {
      verifications.push({
        type: 'skill_proof',
        verified: true,
      });
    }
  }

  return verifications;
}

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
      return '/app/i/expertise';
    default:
      return '/app/i/settings';
  }
}
