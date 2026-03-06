import { z } from 'zod';

export const CV_IMPORT_TEMP_STORAGE_BUCKET = 'cv-import-temp' as const;
export const CV_IMPORT_EXTRACT_JOB_TYPE = 'document_intelligence_extract_only' as const;
export const CV_IMPORT_EXTRACT_POLL_AFTER_MS = 1500;
const DEFAULT_CV_IMPORT_FILE_SIZE_MB = 5;
const DEFAULT_CV_IMPORT_MAX_DOCUMENTS = 5;
const DEFAULT_CV_IMPORT_TEMP_TTL_HOURS = 24;

export const CvImportExtractedDocumentSchema = z.object({
  document_id: z.string().min(1).max(128),
  file_name: z.string().min(1).max(260),
  text: z.string(),
  context: z.literal('cv'),
});

export const CvImportExtractFailedDocumentSchema = z.object({
  document_id: z.string().min(1).max(128),
  file_name: z.string().min(1).max(260),
  context: z.literal('cv'),
  parse_error: z.string().min(1),
  parse_error_code: z.string().nullable().optional(),
});

export const CvImportExtractJobPayloadSchema = z.object({
  user_id: z.string().uuid(),
  requested_at: z.string().datetime(),
  documents: z
    .array(
      z.object({
        document_id: z.string().min(1).max(128),
        file_name: z.string().min(1).max(260),
        storage_path: z.string().min(1).max(512),
        content_type: z.literal('application/pdf'),
        context: z.literal('cv'),
      })
    )
    .min(1)
    .max(25),
});

export const CvImportExtractJobResultSchema = z.object({
  documents: z.array(CvImportExtractedDocumentSchema),
  failed_documents: z.array(CvImportExtractFailedDocumentSchema),
  cleanup_pending: z.boolean().optional(),
  cleanup_failed_paths: z.array(z.string().min(1)).optional(),
});

export const CvImportWizardExtractQueuedResponseSchema = z.object({
  job_id: z.string().uuid(),
  status: z.literal('queued'),
  poll_after_ms: z.number().int().positive(),
});

export const CvImportWizardExtractProcessingResponseSchema = z.object({
  job_id: z.string().uuid(),
  status: z.enum(['queued', 'processing']),
  poll_after_ms: z.number().int().positive(),
});

export const CvImportWizardExtractCompletedResponseSchema = z.object({
  job_id: z.string().uuid(),
  status: z.literal('completed'),
  documents: z.array(CvImportExtractedDocumentSchema),
  failed_documents: z.array(CvImportExtractFailedDocumentSchema),
  cleanup_pending: z.boolean().optional(),
});

export const CvImportWizardExtractFailedResponseSchema = z.object({
  job_id: z.string().uuid(),
  status: z.literal('failed'),
  error: z.string().min(1),
  message: z.string().min(1),
  code: z.string().min(1).optional(),
});

export const CvImportWizardExtractStatusResponseSchema = z.union([
  CvImportWizardExtractProcessingResponseSchema,
  CvImportWizardExtractCompletedResponseSchema,
  CvImportWizardExtractFailedResponseSchema,
]);

export type CvImportExtractJobPayload = z.infer<typeof CvImportExtractJobPayloadSchema>;
export type CvImportExtractJobResult = z.infer<typeof CvImportExtractJobResultSchema>;
export type CvImportExtractedDocument = z.infer<typeof CvImportExtractedDocumentSchema>;
export type CvImportExtractFailedDocument = z.infer<typeof CvImportExtractFailedDocumentSchema>;

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

export function resolveCvImportMaxDocuments(): number {
  return parsePositiveInt(process.env.CV_IMPORT_MAX_DOCUMENTS, DEFAULT_CV_IMPORT_MAX_DOCUMENTS);
}

export function resolveCvImportMaxFileSizeBytes(): number {
  return (
    parsePositiveInt(process.env.CV_IMPORT_MAX_FILE_SIZE_MB, DEFAULT_CV_IMPORT_FILE_SIZE_MB) *
    1024 *
    1024
  );
}

export function resolveCvImportTempTtlHours(): number {
  return parsePositiveInt(process.env.CV_IMPORT_TEMP_TTL_HOURS, DEFAULT_CV_IMPORT_TEMP_TTL_HOURS);
}

export function sanitizeCvImportDocumentId(
  rawValue: string | null | undefined,
  index: number
): string {
  const trimmed = rawValue?.trim();
  if (trimmed && /^[A-Za-z0-9_-]{1,128}$/.test(trimmed)) {
    return trimmed;
  }

  return `doc_${index.toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function sanitizeCvImportStorageFileName(fileName: string): string {
  const normalized = fileName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const [basePart, ...extParts] = normalized.split('.');
  const ext = extParts.length > 0 ? `.${extParts.join('.')}` : '.pdf';
  const safeBase = (basePart || 'upload')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_\-.]+|[_\-.]+$/g, '')
    .slice(0, 120);
  const safeExt = ext.replace(/[^a-zA-Z0-9.]+/g, '').slice(0, 16) || '.pdf';
  return `${safeBase || 'upload'}${safeExt}`;
}

export function buildCvImportTempStoragePath(params: {
  userId: string;
  jobId: string;
  documentId: string;
  fileName: string;
}): string {
  return `${params.userId}/${params.jobId}/${params.documentId}-${sanitizeCvImportStorageFileName(params.fileName)}`;
}
