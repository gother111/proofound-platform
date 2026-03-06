import type { SupabaseClient } from '@supabase/supabase-js';

import {
  buildCvImportTempStoragePath,
  CV_IMPORT_TEMP_STORAGE_BUCKET,
} from '@/lib/expertise/cv-import-wizard-extract';

export function uploadCvImportTempPdf(params: {
  admin: SupabaseClient;
  userId: string;
  jobId: string;
  documentId: string;
  fileName: string;
  file: File;
}): Promise<{ storagePath: string }> {
  return (async () => {
    const storagePath = buildCvImportTempStoragePath({
      userId: params.userId,
      jobId: params.jobId,
      documentId: params.documentId,
      fileName: params.fileName,
    });

    const buffer = Buffer.from(await params.file.arrayBuffer());
    const { error } = await params.admin.storage
      .from(CV_IMPORT_TEMP_STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload temp CV PDF: ${error.message}`);
    }

    return { storagePath };
  })();
}

export async function downloadCvImportTempPdf(params: {
  admin: SupabaseClient;
  storagePath: string;
}): Promise<Buffer> {
  const { data, error } = await params.admin.storage
    .from(CV_IMPORT_TEMP_STORAGE_BUCKET)
    .download(params.storagePath);

  if (error || !data) {
    throw new Error(`Failed to download temp CV PDF: ${error?.message || 'Missing file data'}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

export async function removeCvImportTempPdfs(params: {
  admin: SupabaseClient;
  storagePaths: string[];
}): Promise<{ failedPaths: string[] }> {
  const uniquePaths = Array.from(
    new Set(params.storagePaths.filter((value) => value.trim().length > 0))
  );
  if (uniquePaths.length === 0) {
    return { failedPaths: [] };
  }

  const { error } = await params.admin.storage
    .from(CV_IMPORT_TEMP_STORAGE_BUCKET)
    .remove(uniquePaths);

  if (!error) {
    return { failedPaths: [] };
  }

  return { failedPaths: uniquePaths };
}
