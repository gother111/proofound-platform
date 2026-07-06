import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { buildBlindSafeVerificationReminderEmail } from '@/lib/email/privacy';
import { sendEmail } from '@/lib/email/sender';
import { resolveCanonicalSiteUrl } from '@/lib/env';
import {
  CAPABILITY_BINDINGS,
  CAPABILITY_TOKEN_CLASSES,
  issueCapabilityToken,
} from '@/lib/security/capability-tokens';
import { normalizeEmail } from '@/lib/verification/integrity';

const DAY_MS = 24 * 60 * 60 * 1000;
export const SKILL_VERIFICATION_REMINDER_SCHEDULE_DAYS = [5, 10] as const;
export const MAX_SKILL_VERIFICATION_REMINDERS = SKILL_VERIFICATION_REMINDER_SCHEDULE_DAYS.length;

type SkillVerificationReminderNumber = 1 | 2;
type SkillVerificationRequestKind = 'generic_verification' | 'human_observed_attestation';
type SkillVerifierSource = 'peer' | 'manager' | 'external';

export type SkillVerificationReminderCandidate = {
  id: string;
  skillId: string;
  verifierEmail: string;
  verifierProfileId: string | null;
  verifierSource: SkillVerifierSource;
  requestKind: SkillVerificationRequestKind;
  requiresAuthenticatedVerifier: boolean;
  requestedAt: string | Date | null;
  createdAt: string | Date | null;
  expiresAt: string | Date | null;
  requestExpiresAt: string | Date | null;
  lastFollowUpAt: string | Date | null;
  reminderCount: number;
  reminderStages: number[];
  emailVerificationRequested: boolean | null;
  metadata: Record<string, unknown>;
};

export type SkillVerificationReminderDueState = {
  reminderNumber: SkillVerificationReminderNumber;
  dueAt: Date;
  expiresAt: Date;
  daysRemaining: number;
};

export type SkillVerificationReminderJobResult = {
  checked: number;
  due: number;
  sent: number;
  skipped: number;
  errors: Array<{ requestId: string; reason: string }>;
};

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeBaseUrl(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function clampReminderCount(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.min(MAX_SKILL_VERIFICATION_REMINDERS, Math.floor(number));
}

function asMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  return {};
}

function parseReminderStages(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((stage) => Number(stage))
    .filter((stage) => Number.isInteger(stage) && stage >= 1 && stage <= 2);
}

function reminderDueAt(requestedAt: Date, reminderNumber: SkillVerificationReminderNumber) {
  return new Date(
    requestedAt.getTime() + SKILL_VERIFICATION_REMINDER_SCHEDULE_DAYS[reminderNumber - 1] * DAY_MS
  );
}

function inferCountFromLastFollowUp(lastFollowUpAt: Date | null, requestedAt: Date): number {
  if (!lastFollowUpAt) {
    return 0;
  }

  if (lastFollowUpAt.getTime() >= reminderDueAt(requestedAt, 2).getTime()) {
    return 2;
  }

  if (lastFollowUpAt.getTime() >= reminderDueAt(requestedAt, 1).getTime()) {
    return 1;
  }

  return 0;
}

export function resolveSkillVerificationReminderDueState(input: {
  requestedAt: string | Date | null;
  createdAt?: string | Date | null;
  expiresAt: string | Date | null;
  requestExpiresAt?: string | Date | null;
  lastFollowUpAt?: string | Date | null;
  reminderCount?: number | null;
  now?: Date;
}): SkillVerificationReminderDueState | null {
  const now = input.now ?? new Date();
  const requestedAt = toDate(input.requestedAt) ?? toDate(input.createdAt);
  const expiresAt = toDate(input.requestExpiresAt) ?? toDate(input.expiresAt);
  if (!requestedAt || !expiresAt || now.getTime() >= expiresAt.getTime()) {
    return null;
  }

  const lastFollowUpAt = toDate(input.lastFollowUpAt);
  const effectiveReminderCount = Math.max(
    clampReminderCount(input.reminderCount ?? 0),
    inferCountFromLastFollowUp(lastFollowUpAt, requestedAt)
  );

  if (effectiveReminderCount >= MAX_SKILL_VERIFICATION_REMINDERS) {
    return null;
  }

  const reminderNumber = (effectiveReminderCount + 1) as SkillVerificationReminderNumber;
  const dueAt = reminderDueAt(requestedAt, reminderNumber);
  if (now.getTime() < dueAt.getTime() || dueAt.getTime() >= expiresAt.getTime()) {
    return null;
  }

  return {
    reminderNumber,
    dueAt,
    expiresAt,
    daysRemaining: Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS)),
  };
}

function getRowValue(row: Record<string, unknown>, camelKey: string, snakeKey: string) {
  return row[camelKey] ?? row[snakeKey];
}

function normalizeVerifierSource(value: unknown): SkillVerifierSource {
  return value === 'peer' || value === 'manager' || value === 'external' ? value : 'external';
}

function normalizeRequestKind(value: unknown): SkillVerificationRequestKind {
  return value === 'human_observed_attestation'
    ? 'human_observed_attestation'
    : 'generic_verification';
}

function normalizeCandidateRow(
  row: Record<string, unknown>
): SkillVerificationReminderCandidate | null {
  const metadata = asMetadata(row.metadata);
  const verifierEmail = normalizeEmail(
    typeof metadata.verifierEmail === 'string' ? metadata.verifierEmail : null
  );
  const id = String(row.id ?? '').trim();
  const skillId = String(getRowValue(row, 'skillId', 'skill_id') ?? '').trim();
  if (!id || !skillId || !verifierEmail) {
    return null;
  }

  const emailPreference = getRowValue(
    row,
    'emailVerificationRequested',
    'email_verification_requested'
  );

  return {
    id,
    skillId,
    verifierEmail,
    verifierProfileId:
      typeof getRowValue(row, 'verifierProfileId', 'verifier_profile_id') === 'string'
        ? (getRowValue(row, 'verifierProfileId', 'verifier_profile_id') as string)
        : null,
    verifierSource: normalizeVerifierSource(metadata.verifierSource),
    requestKind: normalizeRequestKind(metadata.requestKind),
    requiresAuthenticatedVerifier: Boolean(metadata.requiresAuthenticatedVerifier),
    requestedAt: (getRowValue(row, 'requestedAt', 'requested_at') as string | Date | null) ?? null,
    createdAt: (getRowValue(row, 'createdAt', 'created_at') as string | Date | null) ?? null,
    expiresAt: (getRowValue(row, 'expiresAt', 'expires_at') as string | Date | null) ?? null,
    requestExpiresAt:
      (getRowValue(row, 'requestExpiresAt', 'request_expires_at') as string | Date | null) ?? null,
    lastFollowUpAt:
      (getRowValue(row, 'lastFollowUpAt', 'last_follow_up_at') as string | Date | null) ?? null,
    reminderCount: clampReminderCount(metadata.verificationReminderCount),
    reminderStages: parseReminderStages(metadata.verificationReminderStages),
    emailVerificationRequested: typeof emailPreference === 'boolean' ? emailPreference : null,
    metadata,
  };
}

export function selectDueSkillVerificationReminderCandidates(
  candidates: SkillVerificationReminderCandidate[],
  now = new Date()
): Array<{
  candidate: SkillVerificationReminderCandidate;
  due: SkillVerificationReminderDueState;
}> {
  const dueCandidates: Array<{
    candidate: SkillVerificationReminderCandidate;
    due: SkillVerificationReminderDueState;
  }> = [];

  for (const candidate of candidates) {
    if (candidate.emailVerificationRequested === false) {
      continue;
    }

    const due = resolveSkillVerificationReminderDueState({
      requestedAt: candidate.requestedAt,
      createdAt: candidate.createdAt,
      expiresAt: candidate.expiresAt,
      requestExpiresAt: candidate.requestExpiresAt,
      lastFollowUpAt: candidate.lastFollowUpAt,
      reminderCount: candidate.reminderCount,
      now,
    });

    if (due) {
      dueCandidates.push({ candidate, due });
    }
  }

  return dueCandidates;
}

async function loadSkillVerificationReminderCandidates(now: Date, limit: number) {
  const normalizedLimit = Math.max(1, Math.min(500, Math.floor(limit)));
  const nowIso = now.toISOString();

  const result = await db.execute(sql`
    SELECT
      vr.id AS id,
      vr.subject_id AS skill_id,
      vr.verifier_profile_id AS verifier_profile_id,
      vr.requested_at AS requested_at,
      vr.created_at AS created_at,
      vr.expires_at AS expires_at,
      vr.request_expires_at AS request_expires_at,
      vr.last_follow_up_at AS last_follow_up_at,
      vr.metadata AS metadata,
      np.email_verification_requested AS email_verification_requested
    FROM verification_records vr
    LEFT JOIN notification_preferences np
      ON np.user_id = vr.verifier_profile_id
    WHERE vr.owner_type = 'individual_profile'
      AND vr.subject_type = 'skill'
      AND vr.status = 'pending'
      AND vr.metadata->>'requestTransport' = 'skill_verification_request'
      AND lower(coalesce(vr.metadata->>'verifierEmail', '')) <> ''
      AND COALESCE(vr.request_expires_at, vr.expires_at) > CAST(${nowIso} AS timestamptz)
      AND COALESCE(vr.requested_at, vr.created_at) <= CAST(${nowIso} AS timestamptz) - INTERVAL '5 days'
      AND (
        CASE
          WHEN COALESCE(vr.metadata->>'verificationReminderCount', '') ~ '^[0-9]+$'
            THEN (vr.metadata->>'verificationReminderCount')::int
          ELSE 0
        END
      ) < ${MAX_SKILL_VERIFICATION_REMINDERS}
    ORDER BY COALESCE(vr.requested_at, vr.created_at) ASC
    LIMIT ${normalizedLimit}
  `);

  return getRows<Record<string, unknown>>(result as any)
    .map(normalizeCandidateRow)
    .filter((candidate): candidate is SkillVerificationReminderCandidate => Boolean(candidate));
}

function buildSkillVerificationScopeKey(skillId: string, verifierEmail: string) {
  return `skill_verification:${skillId}:${normalizeEmail(verifierEmail) ?? 'unknown'}`;
}

function nextFollowUpDueAt(
  candidate: SkillVerificationReminderCandidate,
  reminderNumber: SkillVerificationReminderNumber
) {
  if (reminderNumber >= MAX_SKILL_VERIFICATION_REMINDERS) {
    return null;
  }

  const requestedAt = toDate(candidate.requestedAt) ?? toDate(candidate.createdAt);
  return requestedAt
    ? reminderDueAt(requestedAt, (reminderNumber + 1) as SkillVerificationReminderNumber)
    : null;
}

async function markReminderSent(params: {
  candidate: SkillVerificationReminderCandidate;
  due: SkillVerificationReminderDueState;
  capabilityTokenId: string;
  sentAt: Date;
}) {
  const sentAtIso = params.sentAt.toISOString();
  const nextDueAt = nextFollowUpDueAt(params.candidate, params.due.reminderNumber);
  const stages = Array.from(
    new Set([...params.candidate.reminderStages, params.due.reminderNumber])
  ).sort();
  const metadataPatch = {
    capabilityTokenId: params.capabilityTokenId,
    verificationReminderCount: Math.max(params.candidate.reminderCount, params.due.reminderNumber),
    verificationReminderLastSentAt: sentAtIso,
    verificationReminderStages: stages,
    emailSent: true,
    emailError: null,
  };

  const result = await db.execute(sql`
    UPDATE verification_records
    SET
      last_follow_up_at = CAST(${sentAtIso} AS timestamptz),
      follow_up_due_at = ${nextDueAt ? sql`CAST(${nextDueAt.toISOString()} AS timestamptz)` : sql`NULL`},
      metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify(metadataPatch)}::jsonb,
      updated_at = NOW()
    WHERE id = ${params.candidate.id}
      AND status = 'pending'
      AND (
        last_follow_up_at IS NULL
        OR last_follow_up_at < CAST(${params.due.dueAt.toISOString()} AS timestamptz)
      )
    RETURNING id
  `);

  return getRows<{ id: string }>(result as any).length > 0;
}

export async function processVerificationRequestReminders(options?: {
  now?: Date;
  limit?: number;
}): Promise<SkillVerificationReminderJobResult> {
  const now = options?.now ?? new Date();
  const candidates = await loadSkillVerificationReminderCandidates(now, options?.limit ?? 100);
  const dueCandidates = selectDueSkillVerificationReminderCandidates(candidates, now);
  const result: SkillVerificationReminderJobResult = {
    checked: candidates.length,
    due: dueCandidates.length,
    sent: 0,
    skipped: candidates.length - dueCandidates.length,
    errors: [],
  };

  const baseUrl = normalizeBaseUrl(resolveCanonicalSiteUrl());
  if (!baseUrl && dueCandidates.length > 0) {
    for (const { candidate } of dueCandidates) {
      result.errors.push({
        requestId: candidate.id,
        reason: 'canonical_site_url_missing',
      });
    }
    return result;
  }

  for (const { candidate, due } of dueCandidates) {
    try {
      const issued = await issueCapabilityToken({
        tokenClass: CAPABILITY_TOKEN_CLASSES.SKILL_VERIFICATION_RESPONSE,
        sourceTable: 'verification_records',
        sourceId: candidate.id,
        actionScope: 'skill_verification.respond',
        subjectType: 'skill_verification_request',
        subjectId: candidate.id,
        actorBinding: candidate.requiresAuthenticatedVerifier
          ? CAPABILITY_BINDINGS.EMAIL_THEN_PROFILE_LOCK
          : CAPABILITY_BINDINGS.EMAIL_HASH,
        actorEmail: candidate.verifierEmail,
        actorProfileId: candidate.verifierProfileId,
        expiresAt: due.expiresAt,
        singleUse: true,
        maxUses: 1,
        scopeKey: buildSkillVerificationScopeKey(candidate.skillId, candidate.verifierEmail),
        revokePriorActiveTokensForScope: true,
        metadata: {
          verifierSource: candidate.verifierSource,
          skillId: candidate.skillId,
          requestTransport: 'skill_verification_request',
          reminder: true,
          reminderNumber: due.reminderNumber,
        },
      });

      const emailCopy = buildBlindSafeVerificationReminderEmail({
        verifyUrl: `${baseUrl}/verify/${issued.rawToken}`,
        expiresInDays: due.daysRemaining,
        ctaLabel: 'Review request',
        requestKind: candidate.requestKind,
        reminderNumber: due.reminderNumber,
      });

      const sendResult = await sendEmail({
        to: candidate.verifierEmail,
        subject: emailCopy.subject,
        html: emailCopy.html,
        text: emailCopy.text,
        workflow: 'verification',
      });

      if (!sendResult.success) {
        result.errors.push({
          requestId: candidate.id,
          reason: sendResult.error || 'email_delivery_failed',
        });
        continue;
      }

      const marked = await markReminderSent({
        candidate,
        due,
        capabilityTokenId: issued.token.id,
        sentAt: now,
      });

      if (!marked) {
        result.skipped += 1;
        continue;
      }

      result.sent += 1;
    } catch (error) {
      result.errors.push({
        requestId: candidate.id,
        reason: error instanceof Error ? error.message : 'unknown_reminder_error',
      });
    }
  }

  return result;
}
