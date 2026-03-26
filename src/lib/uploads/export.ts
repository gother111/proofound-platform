import { resolveArtifactDisplayNameForSurface } from '@/lib/uploads/privacy';

type UploadManifestRow = {
  id: string;
  upload_kind: string | null;
  sanitized_filename: string | null;
  detected_mime: string | null;
  durable_path: string | null;
  public_path: string | null;
  deleted_at: unknown;
};

type PortableUploadManifestBase = {
  fileId: string;
  uploadKind: string | null;
  originalFilename: string;
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
    // Preserve the export contract field name while only emitting the owner-safe label.
    originalFilename: resolveArtifactDisplayNameForSurface(
      {
        sanitizedFilename: row.sanitized_filename,
        detectedMime: row.detected_mime,
        uploadKind: row.upload_kind,
      },
      'owner'
    ),
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
