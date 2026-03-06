import type { NextRequest } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import {
  CvImportExtractJobPayloadSchema,
  type CvImportExtractJobResult,
} from '@/lib/expertise/cv-import-wizard-extract';
import {
  downloadCvImportTempPdf,
  removeCvImportTempPdfs,
} from '@/lib/expertise/cv-import-temp-storage';
import {
  extractPdfTextViaPython,
  PythonCvExtractError,
} from '@/lib/expertise/python-cv-extract-client';

export async function processCvImportExtractJob(params: {
  request: NextRequest;
  payload: Record<string, unknown>;
}): Promise<CvImportExtractJobResult> {
  const parsedPayload = CvImportExtractJobPayloadSchema.parse(params.payload);
  const admin = createAdminClient();

  const documents: CvImportExtractJobResult['documents'] = [];
  const failedDocuments: CvImportExtractJobResult['failed_documents'] = [];
  const cleanupPaths: string[] = [];

  for (const document of parsedPayload.documents) {
    cleanupPaths.push(document.storage_path);

    const buffer = await downloadCvImportTempPdf({
      admin,
      storagePath: document.storage_path,
    });

    let extracted;
    try {
      extracted = await extractPdfTextViaPython({
        request: params.request,
        fileName: document.file_name,
        documentId: document.document_id,
        context: document.context,
        buffer,
      });
    } catch (error) {
      if (error instanceof PythonCvExtractError) {
        throw error;
      }
      throw new PythonCvExtractError(
        error instanceof Error ? error.message : 'CV extraction worker failed.',
        500,
        'CV_IMPORT_PROXY_UNAVAILABLE'
      );
    }

    if (typeof extracted.parse_error === 'string' && extracted.parse_error.trim().length > 0) {
      failedDocuments.push({
        document_id: extracted.document_id,
        file_name: extracted.file_name,
        context: 'cv',
        parse_error: extracted.parse_error,
        parse_error_code: extracted.parse_error_code ?? null,
      });
      continue;
    }

    const parsedText = extracted.parsed_text.trim();
    if (!parsedText) {
      failedDocuments.push({
        document_id: extracted.document_id,
        file_name: extracted.file_name,
        context: 'cv',
        parse_error: 'No text could be extracted from the PDF.',
        parse_error_code: extracted.parse_error_code ?? 'PDF_EMPTY_TEXT',
      });
      continue;
    }

    documents.push({
      document_id: extracted.document_id,
      file_name: extracted.file_name,
      text: parsedText,
      context: 'cv',
    });
  }

  const cleanup = await removeCvImportTempPdfs({
    admin,
    storagePaths: cleanupPaths,
  });

  return {
    documents,
    failed_documents: failedDocuments,
    cleanup_pending: cleanup.failedPaths.length > 0,
    cleanup_failed_paths: cleanup.failedPaths,
  };
}
