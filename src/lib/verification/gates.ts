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
import {
  listVerificationRecordsForOwner,
  summarizeVerificationPolicy,
} from '@/lib/verification/policy';
import {
  listCanonicalProofPackAggregatesForOwner,
  summarizeCanonicalProofOwnerAggregates,
} from '@/lib/proofs/canonical-pack';

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
  let gates: VerificationGate[] = [];

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

    gates = normalizeVerificationGates((assignmentRows[0] as any).verification_gates);

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

    return {
      passed: false,
      unmetGates: gates,
      userVerifications: [],
      canIntroduce: false,
      blockingMessage:
        'Verification checks could not be completed. Introductions are paused until trust checks succeed.',
    };
  }
}

/**
 * Get user's current verification status
 */
async function getUserVerifications(userId: string): Promise<VerificationStatus[]> {
  const verifications: VerificationStatus[] = [];
  const [records, proofAggregates] = await Promise.all([
    listVerificationRecordsForOwner('individual_profile', userId).catch(() => []),
    listCanonicalProofPackAggregatesForOwner('individual_profile', userId).catch(() => []),
  ]);
  const policySummary = summarizeVerificationPolicy({ records });
  const proofSummary = summarizeCanonicalProofOwnerAggregates(proofAggregates);

  verifications.push({
    type: 'identity',
    verified: policySummary.slots.identity.activeTrust,
    verifiedAt: policySummary.slots.identity.verifiedAt
      ? new Date(policySummary.slots.identity.verifiedAt)
      : undefined,
    provider:
      policySummary.slots.identity.kind === 'veriff_identity'
        ? 'veriff'
        : policySummary.slots.identity.kind === 'linkedin_identity'
          ? 'linkedin'
          : undefined,
  });

  verifications.push({
    type: 'work_email',
    verified: policySummary.slots.workplace.activeTrust,
    verifiedAt: policySummary.slots.workplace.verifiedAt
      ? new Date(policySummary.slots.workplace.verifiedAt)
      : undefined,
    provider:
      policySummary.slots.workplace.kind === 'linkedin_workplace' ? 'linkedin' : 'work_email',
  });

  const linkedinVerified =
    policySummary.slots.identity.activeTrust &&
    policySummary.slots.identity.kind === 'linkedin_identity'
      ? true
      : policySummary.slots.workplace.activeTrust &&
        policySummary.slots.workplace.kind === 'linkedin_workplace';
  verifications.push({
    type: 'linkedin',
    verified: linkedinVerified,
    verifiedAt:
      policySummary.slots.identity.kind === 'linkedin_identity'
        ? policySummary.slots.identity.verifiedAt
          ? new Date(policySummary.slots.identity.verifiedAt)
          : undefined
        : policySummary.slots.workplace.verifiedAt
          ? new Date(policySummary.slots.workplace.verifiedAt)
          : undefined,
    provider: linkedinVerified ? 'linkedin' : undefined,
  });

  verifications.push({
    type: 'peer_attestation',
    verified: policySummary.evidence.verifiedCount > 0,
    verifiedAt: policySummary.evidence.latestVerifiedAt
      ? new Date(policySummary.evidence.latestVerifiedAt)
      : undefined,
  });

  const hasVerifiedProofPack = proofSummary.subjectSummaries.some(
    (summary) =>
      (summary.verificationStatus === 'verified' ||
        summary.verificationStatus === 'partially_verified') &&
      summary.freshnessState !== 'expired'
  );
  verifications.push({
    type: 'skill_proof',
    verified: hasVerifiedProofPack,
    provider: hasVerifiedProofPack ? 'proof_pack' : undefined,
  });

  return verifications;
}
