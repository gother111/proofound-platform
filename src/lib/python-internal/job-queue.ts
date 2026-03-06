import { eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { pythonInternalJobs } from '@/db/schema';
import { getRows } from '@/lib/db/rows';
import type { PythonInternalJobType } from '@/lib/python-internal/contracts';

const DEFAULT_PYTHON_INTERNAL_WORKER_BATCH_SIZE = 10;
const DEFAULT_PYTHON_INTERNAL_WORKER_CONCURRENCY = 2;
const DEFAULT_PYTHON_INTERNAL_MAX_ATTEMPTS = 3;
const DEFAULT_PYTHON_INTERNAL_LEASE_SECONDS = 180;
const BASE_BACKOFF_SECONDS = 30;
const MAX_BACKOFF_SECONDS = 15 * 60;

export type PythonInternalJobSource = 'manual' | 'cron' | 'admin' | 'retry';

export type ClaimedPythonInternalJob = {
  id: string;
  jobType: PythonInternalJobType;
  attempts: number;
  maxAttempts: number;
  source: string;
  payload: Record<string, unknown>;
};

export type PythonInternalJobStatus = 'pending' | 'leased' | 'completed' | 'failed';

export type PythonInternalJobRecord = {
  id: string;
  jobType: PythonInternalJobType;
  status: PythonInternalJobStatus;
  attempts: number;
  maxAttempts: number;
  source: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  lastError: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function computeBackoffSeconds(attempts: number): number {
  const exponent = Math.max(0, attempts - 1);
  const delay = BASE_BACKOFF_SECONDS * 2 ** exponent;
  return Math.min(MAX_BACKOFF_SECONDS, delay);
}

function resolveLeaseSeconds(): number {
  return parsePositiveInt(
    process.env.PYTHON_INTERNAL_WORKER_LEASE_SECONDS,
    DEFAULT_PYTHON_INTERNAL_LEASE_SECONDS
  );
}

export function isPythonInternalJobsEnabled(): boolean {
  const raw = process.env.PYTHON_INTERNAL_JOBS_ENABLED?.trim().toLowerCase();
  if (raw === 'false') {
    return false;
  }
  if (raw === 'true') {
    return true;
  }
  return true;
}

export function resolvePythonInternalWorkerBatchSize(): number {
  return parsePositiveInt(
    process.env.PYTHON_INTERNAL_WORKER_BATCH_SIZE,
    DEFAULT_PYTHON_INTERNAL_WORKER_BATCH_SIZE
  );
}

export function resolvePythonInternalWorkerConcurrency(): number {
  return parsePositiveInt(
    process.env.PYTHON_INTERNAL_WORKER_CONCURRENCY,
    DEFAULT_PYTHON_INTERNAL_WORKER_CONCURRENCY
  );
}

export function resolvePythonInternalMaxAttempts(): number {
  return parsePositiveInt(
    process.env.PYTHON_INTERNAL_MAX_ATTEMPTS,
    DEFAULT_PYTHON_INTERNAL_MAX_ATTEMPTS
  );
}

export async function enqueuePythonInternalJobs(
  jobs: Array<{
    id?: string;
    jobType: PythonInternalJobType;
    payload: Record<string, unknown>;
    maxAttempts?: number;
    source?: PythonInternalJobSource;
  }>
): Promise<Array<{ id: string; jobType: PythonInternalJobType }>> {
  if (!jobs.length) {
    return [];
  }

  const now = new Date();
  const rows = jobs.map((job) => ({
    id: job.id,
    jobType: job.jobType,
    status: 'pending' as const,
    attempts: 0,
    maxAttempts: job.maxAttempts ?? resolvePythonInternalMaxAttempts(),
    nextRunAt: now,
    leaseExpiresAt: null,
    lastError: null,
    source: job.source ?? 'manual',
    payload: job.payload,
    result: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  }));

  const inserted = await db
    .insert(pythonInternalJobs)
    .values(rows)
    .returning({ id: pythonInternalJobs.id, jobType: pythonInternalJobs.jobType });

  return inserted.map((job) => ({
    id: job.id,
    jobType: job.jobType as PythonInternalJobType,
  }));
}

export async function claimPythonInternalJobs(
  batchSize: number
): Promise<ClaimedPythonInternalJob[]> {
  const leaseSeconds = resolveLeaseSeconds();
  const safeBatchSize = Math.max(1, batchSize);

  const result = await db.execute(sql`
    WITH claimable AS (
      SELECT id
      FROM public.python_internal_jobs
      WHERE (
        status = 'pending'
        OR (status = 'leased' AND lease_expires_at IS NOT NULL AND lease_expires_at <= now())
      )
      AND next_run_at <= now()
      ORDER BY next_run_at ASC, created_at ASC
      LIMIT ${safeBatchSize}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE public.python_internal_jobs AS jobs
    SET
      status = 'leased',
      attempts = jobs.attempts + 1,
      lease_expires_at = now() + (${leaseSeconds} * interval '1 second'),
      updated_at = now()
    FROM claimable
    WHERE jobs.id = claimable.id
    RETURNING
      jobs.id,
      jobs.job_type,
      jobs.attempts,
      jobs.max_attempts,
      jobs.source,
      jobs.payload;
  `);

  const rows = getRows(result) as Array<{
    id: string;
    job_type: PythonInternalJobType;
    attempts: number;
    max_attempts: number;
    source: string;
    payload: Record<string, unknown> | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    jobType: row.job_type,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    source: row.source,
    payload: row.payload || {},
  }));
}

export async function markPythonInternalJobSuccess(
  jobId: string,
  resultPayload: Record<string, unknown>
): Promise<void> {
  await db
    .update(pythonInternalJobs)
    .set({
      status: 'completed',
      result: resultPayload,
      completedAt: new Date(),
      leaseExpiresAt: null,
      lastError: null,
      updatedAt: new Date(),
    })
    .where(eq(pythonInternalJobs.id, jobId));
}

export async function markPythonInternalJobFailure(
  jobId: string,
  errorMessage: string,
  resultPayload?: Record<string, unknown>
): Promise<void> {
  const [job] = await db
    .select({
      id: pythonInternalJobs.id,
      attempts: pythonInternalJobs.attempts,
      maxAttempts: pythonInternalJobs.maxAttempts,
    })
    .from(pythonInternalJobs)
    .where(eq(pythonInternalJobs.id, jobId))
    .limit(1);

  if (!job) {
    return;
  }

  if (job.attempts >= job.maxAttempts) {
    await db
      .update(pythonInternalJobs)
      .set({
        status: 'failed',
        lastError: errorMessage.slice(0, 2000),
        result: resultPayload ?? null,
        leaseExpiresAt: null,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pythonInternalJobs.id, jobId));
    return;
  }

  const backoffSeconds = computeBackoffSeconds(job.attempts);
  await db
    .update(pythonInternalJobs)
    .set({
      status: 'pending',
      leaseExpiresAt: null,
      lastError: errorMessage.slice(0, 2000),
      nextRunAt: sql`now() + (${backoffSeconds} * interval '1 second')`,
      updatedAt: new Date(),
    })
    .where(eq(pythonInternalJobs.id, jobId));
}

export async function getPythonInternalJob(jobId: string): Promise<PythonInternalJobRecord | null> {
  const [job] = await db
    .select({
      id: pythonInternalJobs.id,
      jobType: pythonInternalJobs.jobType,
      status: pythonInternalJobs.status,
      attempts: pythonInternalJobs.attempts,
      maxAttempts: pythonInternalJobs.maxAttempts,
      source: pythonInternalJobs.source,
      payload: pythonInternalJobs.payload,
      result: pythonInternalJobs.result,
      lastError: pythonInternalJobs.lastError,
      completedAt: pythonInternalJobs.completedAt,
      createdAt: pythonInternalJobs.createdAt,
      updatedAt: pythonInternalJobs.updatedAt,
    })
    .from(pythonInternalJobs)
    .where(eq(pythonInternalJobs.id, jobId))
    .limit(1);

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    jobType: job.jobType as PythonInternalJobType,
    status: job.status as PythonInternalJobStatus,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    source: job.source,
    payload: (job.payload as Record<string, unknown> | null) ?? {},
    result: (job.result as Record<string, unknown> | null) ?? null,
    lastError: job.lastError ?? null,
    completedAt: job.completedAt ?? null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export async function countPendingPythonInternalJobs(): Promise<number> {
  const result = await db.execute(sql`
    SELECT COUNT(*)::int AS pending_count
    FROM public.python_internal_jobs
    WHERE (
      status = 'pending'
      OR (status = 'leased' AND lease_expires_at IS NOT NULL AND lease_expires_at <= now())
    )
      AND next_run_at <= now();
  `);

  const rows = getRows(result) as Array<{ pending_count: number }>;
  return rows[0]?.pending_count ?? 0;
}
