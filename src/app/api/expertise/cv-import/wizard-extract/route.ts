import { NextRequest, NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import {
  CV_IMPORT_EXTRACT_POLL_AFTER_MS,
  resolveCvImportMaxDocuments,
  resolveCvImportMaxFileSizeBytes,
  sanitizeCvImportDocumentId,
} from '@/lib/expertise/cv-import-wizard-extract';
import { saveCvImportExtractJob } from '@/lib/expertise/cv-import-extract-job-store';
import {
  extractPdfTextFromFile,
  normalizePdfParseError,
} from '@/lib/expertise/pdf-client-extractor';

export const dynamic = 'force-dynamic';

function readFormValues(formData: FormData, key: string): string[] {
  return formData.getAll(key).map((value) => String(value));
}

export async function POST(request: NextRequest) {
  const authContext = await requireApiAuthContext();
  if (!authContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll('files').filter((value): value is File => value instanceof File);
  const documentIds = readFormValues(formData, 'document_ids');
  const contexts = readFormValues(formData, 'contexts');
  const maxDocuments = resolveCvImportMaxDocuments();
  const maxFileSizeBytes = resolveCvImportMaxFileSizeBytes();

  if (files.length === 0) {
    return NextResponse.json({ error: 'Upload at least one CV PDF.' }, { status: 400 });
  }

  if (files.length > maxDocuments) {
    return NextResponse.json(
      { error: `Upload ${maxDocuments} or fewer CV PDFs at once.` },
      { status: 400 }
    );
  }

  const documents = [];
  const failedDocuments = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const documentId = sanitizeCvImportDocumentId(documentIds[index], index);
    const context = contexts[index] === 'cv' ? 'cv' : null;

    if (context !== 'cv') {
      failedDocuments.push({
        document_id: documentId,
        file_name: file.name,
        context: 'cv' as const,
        parse_error: 'Only CV imports are supported here.',
        parse_error_code: 'CV_CONTEXT_UNSUPPORTED',
      });
      continue;
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      failedDocuments.push({
        document_id: documentId,
        file_name: file.name,
        context: 'cv' as const,
        parse_error: 'Upload a PDF file.',
        parse_error_code: 'CV_FILE_TYPE_UNSUPPORTED',
      });
      continue;
    }

    if (file.size > maxFileSizeBytes) {
      failedDocuments.push({
        document_id: documentId,
        file_name: file.name,
        context: 'cv' as const,
        parse_error: 'This PDF is too large for CV import.',
        parse_error_code: 'CV_FILE_TOO_LARGE',
      });
      continue;
    }

    try {
      const text = (await extractPdfTextFromFile(file)).trim();
      if (!text) {
        failedDocuments.push({
          document_id: documentId,
          file_name: file.name,
          context: 'cv' as const,
          parse_error: 'No text could be extracted from the PDF.',
          parse_error_code: 'PDF_EMPTY_TEXT',
        });
        continue;
      }

      documents.push({
        document_id: documentId,
        file_name: file.name,
        text,
        context: 'cv' as const,
      });
    } catch (error) {
      failedDocuments.push({
        document_id: documentId,
        file_name: file.name,
        context: 'cv' as const,
        parse_error: normalizePdfParseError(error),
        parse_error_code: 'PDF_PARSE_FAILED',
      });
    }
  }

  const job = saveCvImportExtractJob(authContext.user.id, {
    status: 'completed',
    documents,
    failed_documents: failedDocuments,
    cleanup_pending: false,
  });

  return NextResponse.json(
    {
      job_id: job.job_id,
      status: 'queued',
      poll_after_ms: CV_IMPORT_EXTRACT_POLL_AFTER_MS,
    },
    { status: 202 }
  );
}
