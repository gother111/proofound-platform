import { randomUUID } from 'node:crypto';

import type {
  CvImportExtractFailedDocument,
  CvImportExtractedDocument,
} from '@/lib/expertise/cv-import-wizard-extract';

export type CvImportExtractStoredJob =
  | {
      job_id: string;
      status: 'completed';
      documents: CvImportExtractedDocument[];
      failed_documents: CvImportExtractFailedDocument[];
      cleanup_pending?: boolean;
    }
  | {
      job_id: string;
      status: 'failed';
      error: string;
      message: string;
      code?: string;
    };

type JobStore = Map<string, CvImportExtractStoredJob & { createdAt: number; userId: string }>;

const STORE_KEY = Symbol.for('proofound.cvImportExtractJobs');
const JOB_TTL_MS = 15 * 60 * 1000;

function getStore(): JobStore {
  const globalScope = globalThis as typeof globalThis & { [STORE_KEY]?: JobStore };
  if (!globalScope[STORE_KEY]) {
    globalScope[STORE_KEY] = new Map();
  }
  return globalScope[STORE_KEY];
}

function pruneStore(store: JobStore) {
  const now = Date.now();
  for (const [jobId, job] of store.entries()) {
    if (now - job.createdAt > JOB_TTL_MS) {
      store.delete(jobId);
    }
  }
}

export function saveCvImportExtractJob(
  userId: string,
  job:
    | Omit<Extract<CvImportExtractStoredJob, { status: 'completed' }>, 'job_id'>
    | Omit<Extract<CvImportExtractStoredJob, { status: 'failed' }>, 'job_id'>
): CvImportExtractStoredJob {
  const store = getStore();
  pruneStore(store);

  const storedJob = {
    ...job,
    job_id: randomUUID(),
  } as CvImportExtractStoredJob;

  store.set(storedJob.job_id, {
    ...storedJob,
    createdAt: Date.now(),
    userId,
  });

  return storedJob;
}

export function readCvImportExtractJob(
  userId: string,
  jobId: string
): CvImportExtractStoredJob | null {
  const store = getStore();
  pruneStore(store);

  const job = store.get(jobId);
  if (!job || job.userId !== userId) {
    return null;
  }

  const { createdAt: _createdAt, userId: _userId, ...payload } = job;
  return payload;
}
