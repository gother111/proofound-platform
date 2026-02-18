/**
 * Verification Gates Library (Server-Side)
 *
 * Checks if user meets verification requirements before matching/introducing
 * PRD Requirement: Assignments can specify required verifications (gates)
 * that must be passed before introduction
 *
 * NOTE: This file is server-only. For client-safe utilities, use gates-utils.ts
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { getRows } from '@/lib/db/rows';

// Re-export types from client-safe utils
export type {
  VerificationGateType,
  VerificationGate,
  VerificationStatus,
  GateCheckResult,
} from './gates-utils';

// Re-export utility functions
export { getGateDescription, getGateActionLink } from './gates-utils';

// Import types for local use
import type { VerificationGate, VerificationStatus, GateCheckResult } from './gates-utils';

function normalizeVerificationGates(raw: unknown): VerificationGate[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const gates = raw.flatMap((entry) => {
    if (typeof entry === 'string') {
      return [
        {
          type: entry as VerificationGate['type'],
          required: true,
        },
      ];
    }

    if (entry && typeof entry === 'object') {
      const maybeGate = entry as Partial<VerificationGate> & { type?: unknown; required?: unknown };
      if (typeof maybeGate.type === 'string') {
        return [
          {
            type: maybeGate.type as VerificationGate['type'],
            required: maybeGate.required !== false,
            ...(typeof maybeGate.description === 'string'
              ? { description: maybeGate.description }
              : {}),
          },
        ];
      }
    }

    return [];
  });

  const deduped = new Map<VerificationGate['type'], VerificationGate>();
  for (const gate of gates) {
    const existing = deduped.get(gate.type);
    if (!existing) {
      deduped.set(gate.type, gate);
      continue;
    }

    deduped.set(gate.type, {
      ...existing,
      required: existing.required || gate.required,
      description: existing.description || gate.description,
    });
  }

  return [...deduped.values()];
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

    const assignmentRows = getRows(assignment as any) as any[];
    if (!assignmentRows.length) {
      return {
        passed: true,
        unmetGates: [],
        userVerifications: [],
        canIntroduce: true,
      };
    }

    const gates = normalizeVerificationGates((assignmentRows[0] as any).verification_gates);

    if (gates.length === 0) {
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

  const profileRows = getRows(profile as any) as any[];
  if (profileRows.length > 0) {
    const row = profileRows[0] as any;

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

  const attestationRows = getRows(attestations as any) as any[];
  if (attestationRows.length > 0) {
    const count = parseInt((attestationRows[0] as any).count || '0');
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

  const skillProofRows = getRows(skillProofs as any) as any[];
  if (skillProofRows.length > 0) {
    const count = parseInt((skillProofRows[0] as any).count || '0');
    if (count > 0) {
      verifications.push({
        type: 'skill_proof',
        verified: true,
      });
    }
  }

  return verifications;
}
