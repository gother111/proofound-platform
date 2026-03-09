import { NextRequest } from 'next/server';

import {
  createRequestId,
  enforceCvImportUserRateLimit,
  jsonWithRequestId,
} from '@/lib/expertise/cv-import-runtime';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  CV_IMPORT_EXTRACT_JOB_TYPE,
  CV_IMPORT_EXTRACT_POLL_AFTER_MS,
  resolveCvImportMaxDocuments,
  resolveCvImportMaxFileSizeBytes,
  sanitizeCvImportDocumentId,
} from '@/lib/expertise/cv-import-wizard-extract';
import {
  uploadCvImportTempPdf,
  removeCvImportTempPdfs,
} from '@/lib/expertise/cv-import-temp-storage';
import {
  enqueuePythonInternalJobs,
  isPythonInternalJobsEnabled,
} from '@/lib/python-internal/job-queue';
import { triggerPythonInternalWorker } from '@/lib/python-internal/trigger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonWithRequestId(requestId, { error: 'Unauthorized' }, 401);
  }

  if (!isPythonInternalJobsEnabled()) {
    return jsonWithRequestId(
      requestId,
      {
        error: 'CV extraction queue is unavailable',
        message: 'The background CV extraction queue is disabled.',
        code: 'CV_IMPORT_EXTRACT_QUEUE_DISABLED',
      },
      503
    );
  }

  const rateLimitResult = enforceCvImportUserRateLimit({
    userId: user.id,
    route: '/api/expertise/cv-import/wizard-extract',
  });

  if (!rateLimitResult.allowed) {
    return jsonWithRequestId(
      requestId,
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        code: 'CV_IMPORT_RATE_LIMIT_EXCEEDED',
        retry_after_seconds: rateLimitResult.retryAfterSeconds,
      },
      429,
      {
        'Retry-After': String(rateLimitResult.retryAfterSeconds),
      }
    );
  }

  const maxDocuments = resolveCvImportMaxDocuments();
  const maxFileSizeBytes = resolveCvImportMaxFileSizeBytes();

  try {
    const formData = await request.formData();
    const files = formData.getAll('files').filter((value): value is File => value instanceof File);
    const rawDocumentIds = formData.getAll('document_ids');
    const rawContexts = formData.getAll('contexts');

    if (files.length === 0) {
      return jsonWithRequestId(requestId, { error: 'No files provided' }, 400);
    }

    if (files.length > maxDocuments) {
      return jsonWithRequestId(
        requestId,
        {
          error: 'Too many documents',
          message: `Maximum allowed is ${maxDocuments}.`,
          code: 'CV_IMPORT_TOO_MANY_DOCUMENTS',
        },
        400
      );
    }

    for (const file of files) {
      if (file.type !== 'application/pdf') {
        return jsonWithRequestId(
          requestId,
          {
            error: 'Invalid file type',
            message: 'Only PDF files are supported in V1.',
            code: 'CV_IMPORT_INVALID_FILE_TYPE',
          },
          400
        );
      }

      if (file.size > maxFileSizeBytes) {
        return jsonWithRequestId(
          requestId,
          {
            error: 'Invalid file size',
            message: `File exceeds max size of ${maxFileSizeBytes / (1024 * 1024)}MB.`,
            code: 'CV_IMPORT_FILE_TOO_LARGE',
          },
          413
        );
      }
    }

    const admin = createAdminClient();
    const jobId = crypto.randomUUID();
    const uploadedPaths: string[] = [];
    const documents: Array<{
      document_id: string;
      file_name: string;
      storage_path: string;
      content_type: 'application/pdf';
      context: 'cv';
    }> = [];

    try {
      for (const [index, file] of files.entries()) {
        const rawDocumentId = rawDocumentIds[index];
        const documentId = sanitizeCvImportDocumentId(
          typeof rawDocumentId === 'string' ? rawDocumentId : null,
          index + 1
        );
        const context = rawContexts[index] === 'cv' ? 'cv' : 'cv';
        const { storagePath } = await uploadCvImportTempPdf({
          admin,
          userId: user.id,
          jobId,
          documentId,
          fileName: file.name || `upload-${index + 1}.pdf`,
          file,
        });
        uploadedPaths.push(storagePath);
        documents.push({
          document_id: documentId,
          file_name: file.name || `upload-${index + 1}.pdf`,
          storage_path: storagePath,
          content_type: 'application/pdf',
          context,
        });
      }
    } catch (error) {
      const cleanup = await removeCvImportTempPdfs({ admin, storagePaths: uploadedPaths });
      if (cleanup.failedPaths.length > 0) {
        console.warn('[cv-import] failed to cleanup temp files after enqueue error', {
          requestId,
          failedPaths: cleanup.failedPaths,
        });
      }
      throw error;
    }

    await enqueuePythonInternalJobs([
      {
        id: jobId,
        jobType: CV_IMPORT_EXTRACT_JOB_TYPE,
        source: 'manual',
        payload: {
          user_id: user.id,
          requested_at: new Date().toISOString(),
          documents,
        },
      },
    ]);

    await triggerPythonInternalWorker({ request });

    return jsonWithRequestId(
      requestId,
      {
        job_id: jobId,
        status: 'queued',
        poll_after_ms: CV_IMPORT_EXTRACT_POLL_AFTER_MS,
      },
      202
    );
  } catch (error) {
    return jsonWithRequestId(
      requestId,
      {
        error: 'Failed to queue CV extraction',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'CV_IMPORT_EXTRACT_ENQUEUE_FAILED',
      },
      500
    );
  }
}
