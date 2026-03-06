import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { matchingRefreshJobs } from '@/db/schema';
import { getRows } from '@/lib/db/rows';

const DEFAULT_WORKER_BATCH_SIZE = 100;
const DEFAULT_WORKER_CONCURRENCY = 4;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_LEASE_SECONDS = 180;
const MAX_BACKOFF_SECONDS = 15 * 60;
const BASE_BACKOFF_SECONDS = 30;

export type MatchingRefreshQueueSource = 'cron' | 'manual' | 'on_demand' | 'retry';

export type ClaimedRefreshJob = {
  id: string;
  profileId: string;
  attempts: number;
  maxAttempts: number;
  source: string;
  payload: Record<string, unknown>;
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

export function isMatchingRefreshQueueEnabled(): boolean {
  const raw = process.env.MATCHING_REFRESH_QUEUE_ENABLED?.trim().toLowerCase();
  if (raw === 'false') {
    return false;
  }
  if (raw === 'true') {
    return true;
  }
  return true;
}

export function resolveMatchingRefreshWorkerBatchSize(): number {
  return parsePositiveInt(
    process.env.MATCHING_REFRESH_WORKER_BATCH_SIZE,
    DEFAULT_WORKER_BATCH_SIZE
  );
}

export function resolveMatchingRefreshWorkerConcurrency(): number {
  return parsePositiveInt(
    process.env.MATCHING_REFRESH_WORKER_CONCURRENCY,
    DEFAULT_WORKER_CONCURRENCY
  );
}

export function resolveMatchingRefreshMaxAttempts(): number {
  return parsePositiveInt(process.env.MATCHING_REFRESH_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS);
}

function resolveLeaseSeconds(): number {
  return parsePositiveInt(process.env.MATCHING_REFRESH_WORKER_LEASE_SECONDS, DEFAULT_LEASE_SECONDS);
}

function computeBackoffSeconds(attempts: number): number {
  const exponent = Math.max(0, attempts - 1);
  const delay = BASE_BACKOFF_SECONDS * 2 ** exponent;
  return Math.min(MAX_BACKOFF_SECONDS, delay);
}

export async function listProfilesForRefresh(limit = 100): Promise<string[]> {
  const rows = await db.query.matchingProfiles.findMany({
    columns: { profileId: true },
    limit,
  });
  return rows.map((row) => row.profileId);
}

export async function enqueueProfiles(
  profileIds: string[],
  source: MatchingRefreshQueueSource = 'cron'
): Promise<{ enqueued: number; attempted: number }> {
  if (!profileIds.length) {
    return { enqueued: 0, attempted: 0 };
  }

  const uniqueProfileIds = Array.from(new Set(profileIds));
  const maxAttempts = resolveMatchingRefreshMaxAttempts();
  const now = new Date();

  const rows = uniqueProfileIds.map((profileId) => ({
    profileId,
    status: 'pending' as const,
    attempts: 0,
    maxAttempts,
    nextRunAt: now,
    leaseExpiresAt: null,
    lastError: null,
    source,
    payload: {},
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  }));

  const inserted = await db
    .insert(matchingRefreshJobs)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: matchingRefreshJobs.id });

  return { enqueued: inserted.length, attempted: uniqueProfileIds.length };
}

export async function claimJobs(batchSize: number): Promise<ClaimedRefreshJob[]> {
  const leaseSeconds = resolveLeaseSeconds();
  const safeBatchSize = Math.max(1, batchSize);

  const result = await db.execute(sql`
    WITH claimable AS (
      SELECT id
      FROM public.matching_refresh_jobs
      WHERE (
        status = 'pending'
        OR (status = 'leased' AND lease_expires_at IS NOT NULL AND lease_expires_at <= now())
      )
      AND next_run_at <= now()
      ORDER BY next_run_at ASC, created_at ASC
      LIMIT ${safeBatchSize}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE public.matching_refresh_jobs AS jobs
    SET
      status = 'leased',
      attempts = jobs.attempts + 1,
      lease_expires_at = now() + (${leaseSeconds} * interval '1 second'),
      updated_at = now()
    FROM claimable
    WHERE jobs.id = claimable.id
    RETURNING
      jobs.id,
      jobs.profile_id,
      jobs.attempts,
      jobs.max_attempts,
      jobs.source,
      jobs.payload;
  `);

  const rows = getRows(result) as Array<{
    id: string;
    profile_id: string;
    attempts: number;
    max_attempts: number;
    source: string;
    payload: Record<string, unknown> | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    profileId: row.profile_id,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    source: row.source,
    payload: row.payload || {},
  }));
}

export async function markJobSuccess(jobId: string): Promise<void> {
  await db
    .update(matchingRefreshJobs)
    .set({
      status: 'completed',
      completedAt: new Date(),
      leaseExpiresAt: null,
      lastError: null,
      updatedAt: new Date(),
    })
    .where(eq(matchingRefreshJobs.id, jobId));
}

export async function markJobFailure(jobId: string, errorMessage: string): Promise<void> {
  const [job] = await db
    .select({
      id: matchingRefreshJobs.id,
      attempts: matchingRefreshJobs.attempts,
      maxAttempts: matchingRefreshJobs.maxAttempts,
    })
    .from(matchingRefreshJobs)
    .where(eq(matchingRefreshJobs.id, jobId))
    .limit(1);

  if (!job) {
    return;
  }

  const exhausted = job.attempts >= job.maxAttempts;
  if (exhausted) {
    await db
      .update(matchingRefreshJobs)
      .set({
        status: 'failed',
        lastError: errorMessage.slice(0, 2000),
        leaseExpiresAt: null,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(matchingRefreshJobs.id, jobId));
    return;
  }

  const backoffSeconds = computeBackoffSeconds(job.attempts);
  await db
    .update(matchingRefreshJobs)
    .set({
      status: 'pending',
      leaseExpiresAt: null,
      lastError: errorMessage.slice(0, 2000),
      nextRunAt: sql`now() + (${backoffSeconds} * interval '1 second')`,
      updatedAt: new Date(),
    })
    .where(and(eq(matchingRefreshJobs.id, jobId), eq(matchingRefreshJobs.status, 'leased')));
}

export async function countPendingRefreshJobs(): Promise<number> {
  const result = await db.execute(sql`
    SELECT COUNT(*)::int AS pending_count
    FROM public.matching_refresh_jobs
    WHERE (
      status = 'pending'
      OR (status = 'leased' AND lease_expires_at IS NOT NULL AND lease_expires_at <= now())
    )
      AND next_run_at <= now();
  `);

  const rows = getRows(result) as Array<{ pending_count: number }>;
  return rows[0]?.pending_count ?? 0;
}
