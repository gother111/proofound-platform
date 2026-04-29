import { resolveArtifactDisplayNameForSurface } from '@/lib/uploads/privacy';

type UploadManifestRow = {
  id: string;
  upload_kind: string | null;
  sanitized_filename: string | null;
  original_filename: string | null;
  original_filename_sensitive: boolean | null;
  detected_mime: string | null;
  durable_path: string | null;
  public_path: string | null;
  deleted_at: unknown;
};

type PortableUploadManifestBase = {
  fileId: string;
  uploadKind: string | null;
  displayLabel: string;
  originalFilename: string | null;
  originalFilenameSensitive: boolean;
};

type PortableIncludedUploadManifest = PortableUploadManifestBase & {
  storagePath: string | null;
};

type PortableOmittedUploadManifest = PortableUploadManifestBase & {
  reason: 'deleted_before_export';
};

export function buildPortableUploadManifest(rows: UploadManifestRow[]) {
  const toPortableBase = (row: UploadManifestRow): PortableUploadManifestBase => ({
    fileId: row.id,
    uploadKind: row.upload_kind,
    displayLabel: resolveArtifactDisplayNameForSurface(
      {
        sanitizedFilename: row.sanitized_filename,
        detectedMime: row.detected_mime,
        uploadKind: row.upload_kind,
      },
      'owner'
    ),
    originalFilename: row.original_filename ?? null,
    originalFilenameSensitive: row.original_filename_sensitive !== false,
  });

  const omittedFiles: PortableOmittedUploadManifest[] = rows
    .filter((row) => Boolean(row.deleted_at))
    .map((row) => ({
      ...toPortableBase(row),
      reason: 'deleted_before_export',
    }));

  const includedFiles: PortableIncludedUploadManifest[] = rows
    .filter((row) => !row.deleted_at)
    .map((row) => ({
      ...toPortableBase(row),
      storagePath: row.durable_path || row.public_path || null,
    }));

  return {
    includedFiles,
    omittedFiles,
  };
}
