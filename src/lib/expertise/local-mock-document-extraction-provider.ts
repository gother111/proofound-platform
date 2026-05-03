import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { GcpCvOcrAllowedMimeType, GcpCvOcrConfig } from '@/lib/expertise/gcp-cv-ocr-config';
import type {
  DocumentExtractionInput,
  DocumentExtractionProvider,
} from '@/lib/expertise/document-extraction-provider';

export const LOCAL_MOCK_DOCUMENT_EXTRACTOR_ENV_KEY = 'PROOFOUND_DOCUMENT_EXTRACTOR_MOCK' as const;

const DEFAULT_MAX_FILE_SIZE_MB = 5;
const DEFAULT_MAX_PAGES = 4;
const DEFAULT_MAX_FILES_PER_REQUEST = 1;
const DEFAULT_RETENTION_HOURS = 24;
const DEFAULT_USER_DAILY_LIMIT = 5;
const DEFAULT_GLOBAL_DAILY_LIMIT = 50;
const LOCAL_MOCK_ALLOWED_MIME_TYPES: GcpCvOcrAllowedMimeType[] = ['application/pdf'];
const TRUE_VALUES = new Set(['true', '1', 'yes', 'on']);
const FIXTURE_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'local-mock-document-extraction.txt'
);

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

export function isLocalMockDocumentExtractionEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  const enabled = TRUE_VALUES.has(
    env[LOCAL_MOCK_DOCUMENT_EXTRACTOR_ENV_KEY]?.trim().toLowerCase() ?? ''
  );
  const productionRuntime = env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production';

  return enabled && !productionRuntime;
}

export function resolveLocalMockDocumentExtractionConfig(
  env: Record<string, string | undefined> = process.env
): GcpCvOcrConfig {
  const maxFileSizeMb = parsePositiveInt(env.GCP_CV_OCR_MAX_FILE_SIZE_MB, DEFAULT_MAX_FILE_SIZE_MB);

  return {
    enabled: true,
    available: true,
    unavailableReason: null,
    expiresAt: null,
    baseUrl: null,
    authMode: null,
    maxFileSizeMb,
    maxFileSizeBytes: maxFileSizeMb * 1024 * 1024,
    maxPages: parsePositiveInt(env.GCP_CV_OCR_MAX_PAGES, DEFAULT_MAX_PAGES),
    maxFilesPerRequest: parsePositiveInt(
      env.GCP_CV_OCR_MAX_FILES_PER_REQUEST,
      DEFAULT_MAX_FILES_PER_REQUEST
    ),
    allowedMimeTypes: LOCAL_MOCK_ALLOWED_MIME_TYPES,
    retentionHours: parsePositiveInt(env.GCP_CV_OCR_RETENTION_HOURS, DEFAULT_RETENTION_HOURS),
    userDailyLimit: parsePositiveInt(env.GCP_CV_OCR_USER_DAILY_LIMIT, DEFAULT_USER_DAILY_LIMIT),
    globalDailyLimit: parsePositiveInt(
      env.GCP_CV_OCR_GLOBAL_DAILY_LIMIT,
      DEFAULT_GLOBAL_DAILY_LIMIT
    ),
    hasAuthSecret: false,
  };
}

async function readSyntheticFixtureText(): Promise<string> {
  return (await readFile(FIXTURE_PATH, 'utf8')).trim();
}

export const localMockDocumentExtractionProvider: DocumentExtractionProvider = {
  provider: 'mock',
  async extractTextFromDocument(input: DocumentExtractionInput) {
    const text = await readSyntheticFixtureText();

    return {
      status: 'completed',
      provider: 'mock',
      requestId: input.requestId,
      documentId: input.documentId,
      pageCount: 1,
      text,
      confidence: 1,
      elapsedMs: 0,
      warnings: ['local_mock_document_extraction_fixture'],
      fallback: false,
    };
  },
};
