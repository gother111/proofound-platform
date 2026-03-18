import path from 'path';

export type UploadPrivacyReviewReason =
  | 'filename_sanitized'
  | 'metadata_exif'
  | 'metadata_gps'
  | 'metadata_author'
  | 'metadata_hidden_properties';

export type UploadMetadataFlags = {
  detectedMime: string | null;
  hasExif: boolean;
  hasGps: boolean;
  hasAuthorMetadata: boolean;
  hasHiddenDocumentProperties: boolean;
  publicSafeEligible: boolean;
};

export type UploadFilenameAssessment = {
  originalFilename: string;
  sanitizedFilename: string;
  materiallyChanged: boolean;
  requiresReview: boolean;
  reasons: UploadPrivacyReviewReason[];
};

export type EvidenceUploadPrivacyAssessment = {
  metadataFlags: UploadMetadataFlags;
  filename: UploadFilenameAssessment;
  requiresReview: boolean;
  reasons: UploadPrivacyReviewReason[];
  safetyReason: string | null;
};

type ArtifactDisplayNameInput = {
  sanitizedFilename?: string | null;
  originalFilename?: string | null;
  detectedMime?: string | null;
  uploadKind?: string | null;
};

const FILENAME_REVIEW_PATTERN =
  /[\/\\]|(\.\.)|[\u0000-\u001f\u007f]|[\u202A-\u202E\u2066-\u2069]|[<>:"|?*]/;
const PRIVACY_REVIEW_REASON_PREFIX = 'privacy_review_required:';

export function sanitizeUploadFilename(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const base =
    path
      .basename(fileName.trim(), ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'file';
  return `${base}${ext.slice(0, 10)}`;
}

function resolveTypedArtifactFallbackLabel(input: {
  detectedMime?: string | null;
  uploadKind?: string | null;
}) {
  if (input.uploadKind === 'avatar') {
    return 'Profile image';
  }

  if (input.uploadKind === 'cover') {
    return 'Cover image';
  }

  switch (input.detectedMime) {
    case 'application/pdf':
      return 'Uploaded PDF document';
    case 'text/markdown':
      return 'Uploaded Markdown document';
    case 'text/plain':
      return 'Uploaded text document';
    case 'image/jpeg':
    case 'image/png':
    case 'image/webp':
      return 'Uploaded image';
    default:
      return 'Uploaded document';
  }
}

function normalizeStoredSanitizedFilename(fileName: string | null | undefined) {
  const trimmed = fileName?.trim();
  if (!trimmed) {
    return null;
  }

  const leafName = path.basename(trimmed);
  const normalized = sanitizeUploadFilename(leafName);
  return normalized.trim().length > 0 ? normalized : null;
}

export function resolveArtifactDisplayName(input: ArtifactDisplayNameInput) {
  const sanitized = normalizeStoredSanitizedFilename(input.sanitizedFilename);
  if (sanitized) {
    return sanitized;
  }

  const originalSanitized = normalizeStoredSanitizedFilename(input.originalFilename);
  if (originalSanitized) {
    return originalSanitized;
  }

  return resolveTypedArtifactFallbackLabel(input);
}

export function collectUploadMetadataFlags(
  buffer: Buffer,
  detectedMime: string | null
): UploadMetadataFlags {
  const utf8Preview = buffer.subarray(0, Math.min(buffer.length, 16384)).toString('utf8');
  const asciiPreview = buffer.subarray(0, Math.min(buffer.length, 16384)).toString('latin1');

  const hasExif = asciiPreview.includes('Exif');
  const hasGps = /GPS|gps/i.test(asciiPreview);
  const hasAuthorMetadata = /\/Author|author[:=]/i.test(utf8Preview);
  const hasHiddenDocumentProperties = /xmp:|<rdf:|photoshop|icc_profile/i.test(utf8Preview);

  return {
    detectedMime,
    hasExif,
    hasGps,
    hasAuthorMetadata,
    hasHiddenDocumentProperties,
    publicSafeEligible: !hasExif && !hasGps && !hasAuthorMetadata && !hasHiddenDocumentProperties,
  };
}

export function assessUploadFilenamePrivacy(fileName: string): UploadFilenameAssessment {
  const sanitizedFilename = sanitizeUploadFilename(fileName);
  const materiallyChanged = sanitizedFilename !== fileName.trim();
  const requiresReview = materiallyChanged && FILENAME_REVIEW_PATTERN.test(fileName);

  return {
    originalFilename: fileName,
    sanitizedFilename,
    materiallyChanged,
    requiresReview,
    reasons: requiresReview ? ['filename_sanitized'] : [],
  };
}

export function assessEvidenceUploadPrivacy(input: {
  originalFilename: string;
  metadataFlags: UploadMetadataFlags;
}): EvidenceUploadPrivacyAssessment {
  const filename = assessUploadFilenamePrivacy(input.originalFilename);
  const reasons: UploadPrivacyReviewReason[] = [...filename.reasons];

  if (input.metadataFlags.hasExif) {
    reasons.push('metadata_exif');
  }
  if (input.metadataFlags.hasGps) {
    reasons.push('metadata_gps');
  }
  if (input.metadataFlags.hasAuthorMetadata) {
    reasons.push('metadata_author');
  }
  if (input.metadataFlags.hasHiddenDocumentProperties) {
    reasons.push('metadata_hidden_properties');
  }

  const uniqueReasons = [...new Set(reasons)];

  return {
    metadataFlags: input.metadataFlags,
    filename,
    requiresReview: uniqueReasons.length > 0,
    reasons: uniqueReasons,
    safetyReason:
      uniqueReasons.length > 0 ? `${PRIVACY_REVIEW_REASON_PREFIX}${uniqueReasons.join(',')}` : null,
  };
}

export function parseUploadPrivacyReviewReasons(
  safetyReason: string | null | undefined
): UploadPrivacyReviewReason[] {
  if (!safetyReason || !safetyReason.startsWith(PRIVACY_REVIEW_REASON_PREFIX)) {
    return [];
  }

  return safetyReason
    .slice(PRIVACY_REVIEW_REASON_PREFIX.length)
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is UploadPrivacyReviewReason =>
      [
        'filename_sanitized',
        'metadata_exif',
        'metadata_gps',
        'metadata_author',
        'metadata_hidden_properties',
      ].includes(value)
    );
}

export function isUploadHeldForPrivacyReview(input: {
  safetyStatus?: string | null;
  safetyReason?: string | null;
}) {
  return (
    input.safetyStatus === 'manual_review' ||
    parseUploadPrivacyReviewReasons(input.safetyReason).length > 0
  );
}
