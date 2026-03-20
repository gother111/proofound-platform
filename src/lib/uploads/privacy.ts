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
  sensitivity: UploadSensitivityAssessment;
};

type ArtifactDisplayNameInput = {
  sanitizedFilename?: string | null;
  originalFilename?: string | null;
  detectedMime?: string | null;
  uploadKind?: string | null;
};

export type ArtifactDisplaySurface = 'owner' | 'review' | 'public';

export type UploadSensitivityAssessment = {
  sensitiveDocument: boolean;
  sensitivityReason: 'engagement_document' | null;
  recommendedVisibility: 'owner_only' | 'matched_org' | null;
  recommendedRevealGate: 'none' | 'conversation_started' | null;
};

const FILENAME_REVIEW_PATTERN =
  /[\/\\]|(\.\.)|[\u0000-\u001f\u007f]|[\u202A-\u202E\u2066-\u2069]|[<>:"|?*]/;
const PRIVACY_REVIEW_REASON_PREFIX = 'privacy_review_required:';
const SENSITIVE_ENGAGEMENT_DOCUMENT_PATTERN =
  /\b(invoice|contract|agreement|statement[\s_-]*of[\s_-]*work|sow|offer[\s_-]*letter)\b/i;
const COMMON_UPLOAD_EXTENSION_PATTERN = /\.(pdf|doc|docx|txt|md|png|jpe?g|webp|csv|xls|xlsx)$/i;

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

function normalizeLabel(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ') ?? null;
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

export function resolveArtifactDisplayNameForSurface(
  input: ArtifactDisplayNameInput,
  surface: ArtifactDisplaySurface = 'owner'
) {
  const fallbackLabel = resolveTypedArtifactFallbackLabel(input);

  if (surface !== 'owner') {
    return fallbackLabel;
  }

  const sanitized = normalizeStoredSanitizedFilename(input.sanitizedFilename);
  if (sanitized) {
    return sanitized;
  }

  const originalSanitized = normalizeStoredSanitizedFilename(input.originalFilename);
  if (originalSanitized) {
    return originalSanitized;
  }

  return fallbackLabel;
}

export function resolveArtifactDisplayName(input: ArtifactDisplayNameInput) {
  return resolveArtifactDisplayNameForSurface(input, 'owner');
}

export function classifyUploadSensitivity(input: {
  originalFilename: string;
  uploadKind?: string | null;
}): UploadSensitivityAssessment {
  const normalizedFilename = path
    .basename(input.originalFilename || '')
    .replace(COMMON_UPLOAD_EXTENSION_PATTERN, '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  const isSensitiveDocument =
    Boolean(normalizedFilename) &&
    ['proof', 'certificate', 'artifact', 'document'].includes(input.uploadKind ?? 'document') &&
    SENSITIVE_ENGAGEMENT_DOCUMENT_PATTERN.test(normalizedFilename);

  return {
    sensitiveDocument: isSensitiveDocument,
    sensitivityReason: isSensitiveDocument ? 'engagement_document' : null,
    recommendedVisibility: isSensitiveDocument ? 'owner_only' : null,
    recommendedRevealGate: isSensitiveDocument ? 'conversation_started' : null,
  };
}

export function isUploadDerivedTitle(
  title: string | null | undefined,
  input: ArtifactDisplayNameInput
) {
  const titleValue = title?.trim() ?? '';
  const normalizedTitle = normalizeLabel(title);
  if (!normalizedTitle) {
    return false;
  }

  const normalizedOwnerSafe = normalizeLabel(resolveArtifactDisplayNameForSurface(input, 'owner'));
  const normalizedPublicSafe = normalizeLabel(
    resolveArtifactDisplayNameForSurface(input, 'public')
  );
  const normalizedOriginalFilename = normalizeLabel(
    input.originalFilename ? path.basename(input.originalFilename) : null
  );

  return (
    normalizedTitle === normalizedOwnerSafe ||
    normalizedTitle === normalizedPublicSafe ||
    normalizedTitle === normalizedOriginalFilename ||
    normalizedTitle.startsWith('uploaded ') ||
    COMMON_UPLOAD_EXTENSION_PATTERN.test(titleValue)
  );
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
  uploadKind?: string | null;
}): EvidenceUploadPrivacyAssessment {
  const filename = assessUploadFilenamePrivacy(input.originalFilename);
  const reasons: UploadPrivacyReviewReason[] = [...filename.reasons];
  const sensitivity = classifyUploadSensitivity({
    originalFilename: input.originalFilename,
    uploadKind: input.uploadKind,
  });

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
    sensitivity,
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
