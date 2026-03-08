import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db';
import { workflowAsyncJobs } from '@/db/schema';
import { getRows } from '@/lib/db/rows';

export type WorkflowAsyncJobType =
  | 'intro_reminder'
  | 'decision_reminder'
  | 'expiry_transition'
  | 'verification_follow_up'
  | 'proof_freshness_nudge'
  | 'portfolio_index_refresh'
  | 'consent_prompt'
  | 'workflow_fanout';

export type WorkflowAsyncJobStatus = 'pending' | 'leased' | 'completed' | 'failed' | 'cancelled';

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_LEASE_SECONDS = 180;
const BASE_BACKOFF_SECONDS = 30;
const MAX_BACKOFF_SECONDS = 15 * 60;

function computeBackoffSeconds(attempts: number) {
  return Math.min(MAX_BACKOFF_SECONDS, BASE_BACKOFF_SECONDS * 2 ** Math.max(0, attempts - 1));
}

function resolveLeaseSeconds() {
  const raw = process.env.WORKFLOW_ASYNC_JOB_LEASE_SECONDS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_LEASE_SECONDS;
}

export async function enqueueWorkflowJob(input: {
  jobType: WorkflowAsyncJobType;
  idempotencyKey: string;
  dedupeKey?: string | null;
  correlationId?: string | null;
  sourceState?: string | null;
  scheduledAt?: Date;
  maxAttempts?: number;
  assignmentId?: string | null;
  introWorkflowId?: string | null;
  interviewId?: string | null;
  decisionId?: string | null;
  verificationRecordId?: string | null;
  consentObligationId?: string | null;
  profileId?: string | null;
  payload?: Record<string, unknown>;
}) {
  if (input.dedupeKey) {
    const existing = await db.query.workflowAsyncJobs.findFirst({
      where: and(
        eq(workflowAsyncJobs.dedupeKey, input.dedupeKey),
        inArray(workflowAsyncJobs.status, ['pending', 'leased'])
      ),
    });

    if (existing) {
      return existing;
    }
  }

  const [inserted] = await db
    .insert(workflowAsyncJobs)
    .values({
      jobType: input.jobType,
      status: 'pending',
      assignmentId: input.assignmentId ?? null,
      introWorkflowId: input.introWorkflowId ?? null,
      interviewId: input.interviewId ?? null,
      decisionId: input.decisionId ?? null,
      verificationRecordId: input.verificationRecordId ?? null,
      consentObligationId: input.consentObligationId ?? null,
      profileId: input.profileId ?? null,
      scheduledAt: input.scheduledAt ?? new Date(),
      attempts: 0,
      maxAttempts:
        input.maxAttempts ??
        (input.jobType === 'expiry_transition' || input.jobType === 'workflow_fanout'
          ? 8
          : DEFAULT_MAX_ATTEMPTS),
      idempotencyKey: input.idempotencyKey,
      dedupeKey: input.dedupeKey ?? null,
      correlationId: input.correlationId ?? null,
      sourceState: input.sourceState ?? null,
      payload: input.payload ?? {},
      result: null,
      lastError: null,
      cancelledAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing({
      target: workflowAsyncJobs.idempotencyKey,
    })
    .returning();

  if (inserted) {
    return inserted;
  }

  const existing = await db.query.workflowAsyncJobs.findFirst({
    where: eq(workflowAsyncJobs.idempotencyKey, input.idempotencyKey),
  });

  if (!existing) {
    throw new Error(`Failed to enqueue workflow job for ${input.jobType}`);
  }

  return existing;
}

export async function cancelWorkflowJobs(params: {
  jobTypes?: WorkflowAsyncJobType[];
  introWorkflowId?: string;
  decisionId?: string;
  verificationRecordId?: string;
  consentObligationId?: string;
  interviewId?: string;
  reason?: string;
}) {
  const filters = [];

  if (params.jobTypes?.length) {
    filters.push(inArray(workflowAsyncJobs.jobType, params.jobTypes));
  }
  if (params.introWorkflowId) {
    filters.push(eq(workflowAsyncJobs.introWorkflowId, params.introWorkflowId));
  }
  if (params.decisionId) {
    filters.push(eq(workflowAsyncJobs.decisionId, params.decisionId));
  }
  if (params.verificationRecordId) {
    filters.push(eq(workflowAsyncJobs.verificationRecordId, params.verificationRecordId));
  }
  if (params.consentObligationId) {
    filters.push(eq(workflowAsyncJobs.consentObligationId, params.consentObligationId));
  }
  if (params.interviewId) {
    filters.push(eq(workflowAsyncJobs.interviewId, params.interviewId));
  }

  if (filters.length === 0) {
    return 0;
  }

  const updated = await db
    .update(workflowAsyncJobs)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      lastError: params.reason ? params.reason.slice(0, 2000) : null,
      updatedAt: new Date(),
    })
    .where(and(inArray(workflowAsyncJobs.status, ['pending', 'leased']), ...filters))
    .returning({ id: workflowAsyncJobs.id });

  return updated.length;
}

export async function claimWorkflowJobs(batchSize: number) {
  const leaseSeconds = resolveLeaseSeconds();
  const safeBatchSize = Math.max(1, batchSize);

  const result = await db.execute(sql`
    WITH claimable AS (
      SELECT id
      FROM public.workflow_async_jobs
      WHERE (
        status = 'pending'
        OR (status = 'leased' AND lease_expires_at IS NOT NULL AND lease_expires_at <= now())
      )
      AND cancelled_at IS NULL
      AND scheduled_at <= now()
      ORDER BY scheduled_at ASC, created_at ASC
      LIMIT ${safeBatchSize}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE public.workflow_async_jobs AS jobs
    SET
      status = 'leased',
      attempts = jobs.attempts + 1,
      lease_expires_at = now() + (${leaseSeconds} * interval '1 second'),
      updated_at = now()
    FROM claimable
    WHERE jobs.id = claimable.id
    RETURNING jobs.*;
  `);

  return getRows(result) as Array<typeof workflowAsyncJobs.$inferSelect>;
}

export async function markWorkflowJobSuccess(
  jobId: string,
  resultPayload: Record<string, unknown> = {}
) {
  await db
    .update(workflowAsyncJobs)
    .set({
      status: 'completed',
      result: resultPayload,
      completedAt: new Date(),
      leaseExpiresAt: null,
      lastError: null,
      updatedAt: new Date(),
    })
    .where(eq(workflowAsyncJobs.id, jobId));
}

export async function markWorkflowJobFailure(
  jobId: string,
  errorMessage: string,
  resultPayload?: Record<string, unknown>
) {
  const [job] = await db
    .select({
      attempts: workflowAsyncJobs.attempts,
      maxAttempts: workflowAsyncJobs.maxAttempts,
    })
    .from(workflowAsyncJobs)
    .where(eq(workflowAsyncJobs.id, jobId))
    .limit(1);

  if (!job) {
    return;
  }

  if (job.attempts >= job.maxAttempts) {
    await db
      .update(workflowAsyncJobs)
      .set({
        status: 'failed',
        leaseExpiresAt: null,
        completedAt: new Date(),
        lastError: errorMessage.slice(0, 2000),
        result: resultPayload ?? null,
        updatedAt: new Date(),
      })
      .where(eq(workflowAsyncJobs.id, jobId));
    return;
  }

  const backoffSeconds = computeBackoffSeconds(job.attempts);
  await db
    .update(workflowAsyncJobs)
    .set({
      status: 'pending',
      leaseExpiresAt: null,
      lastError: errorMessage.slice(0, 2000),
      result: resultPayload ?? null,
      scheduledAt: sql`now() + (${backoffSeconds} * interval '1 second')`,
      updatedAt: new Date(),
    })
    .where(eq(workflowAsyncJobs.id, jobId));
}
