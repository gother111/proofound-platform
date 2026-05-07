import path from 'path';

export type UploadPrivacyReviewReason =
  | 'filename_sanitized'
  | 'filename_identity_signal'
  | 'metadata_exif'
  | 'metadata_gps'
  | 'metadata_author'
  | 'metadata_title'
  | 'metadata_creator'
  | 'metadata_company'
  | 'metadata_hidden_properties'
  | 'malware_scanner_unavailable'
  | 'metadata_stripping_unavailable';

export type UploadMetadataFlags = {
  detectedMime: string | null;
  hasExif: boolean;
  hasGps: boolean;
  hasAuthorMetadata: boolean;
  hasTitleMetadata: boolean;
  hasCreatorMetadata: boolean;
  hasCompanyMetadata: boolean;
  hasHiddenDocumentProperties: boolean;
  publicSafeEligible: boolean;
};

export type UploadFilenameAssessment = {
  originalFilename: string;
  sanitizedFilename: string;
  materiallyChanged: boolean;
  containsIdentitySignal: boolean;
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
const SAFE_UPLOAD_EXTENSION_PATTERN = /^\.(?:pdf|doc|docx|txt|md|png|jpe?g|webp|csv|xls|xlsx)$/i;
const PRIVACY_REVIEW_REASON_PREFIX = 'privacy_review_required:';
const SENSITIVE_ENGAGEMENT_DOCUMENT_PATTERN =
  /\b(invoice|contract|agreement|statement[\s_-]*of[\s_-]*work|sow|offer[\s_-]*letter)\b/i;
const COMMON_UPLOAD_EXTENSION_PATTERN = /\.(pdf|doc|docx|txt|md|png|jpe?g|webp|csv|xls|xlsx)$/i;
const EMAIL_PATTERN = /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i;
const PHONE_PATTERN = /(?:\+?\d[\s().-]*){7,}\d/;
const ADDRESS_PATTERN =
  /\b\d{1,6}\s+[a-z][a-z\s.'-]{2,}\s+(street|st|road|rd|avenue|ave|lane|ln|drive|dr|boulevard|blvd|väg|gatan|gata|gränd|allé|allee)\b/i;
const COMPANY_PATTERN =
  /\b([a-z0-9][\w&.'-]*\s+){0,4}(inc|llc|ltd|limited|corp|corporation|company|co|ab|oy|gmbh|sarl|sas|as|bv)\b/i;
const HUMAN_NAME_FILENAME_PATTERN = /\b[A-Z][a-z]{1,}(?:[_\s.-]+[A-Z][a-z]{1,}){1,3}\b/;
const GENERIC_FILENAME_WORDS = new Set([
  'proof',
  'portfolio',
  'artifact',
  'document',
  'case',
  'study',
  'sample',
  'work',
  'project',
  'credential',
  'certificate',
  'resume',
  'cv',
  'invoice',
  'contract',
  'agreement',
  'statement',
  'letter',
]);

export function sanitizeUploadFilename(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const safeExt = SAFE_UPLOAD_EXTENSION_PATTERN.test(ext) ? ext : '';
  const base =
    path
      .basename(fileName.trim(), ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'file';
  return `${base}${safeExt}`;
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

function containsIdentityBearingFilenameSignal(fileName: string) {
  const basename = path.basename(fileName.trim());
  const withoutExtension = basename.replace(COMMON_UPLOAD_EXTENSION_PATTERN, '');
  const normalizedWords = withoutExtension
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  const meaningfulWords = normalizedWords.filter((word) => !GENERIC_FILENAME_WORDS.has(word));

  return (
    EMAIL_PATTERN.test(basename) ||
    PHONE_PATTERN.test(basename) ||
    ADDRESS_PATTERN.test(withoutExtension) ||
    COMPANY_PATTERN.test(withoutExtension) ||
    (meaningfulWords.length >= 2 && HUMAN_NAME_FILENAME_PATTERN.test(withoutExtension))
  );
}

export function resolveArtifactDisplayNameForSurface(
  input: ArtifactDisplayNameInput,
  surface: ArtifactDisplaySurface = 'owner'
) {
  const fallbackLabel = resolveTypedArtifactFallbackLabel(input);

  if (surface !== 'owner') {
    return fallbackLabel;
  }

  if (
    containsIdentityBearingFilenameSignal(input.originalFilename ?? '') ||
    containsIdentityBearingFilenameSignal(input.sanitizedFilename ?? '')
  ) {
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
  const utf8Content = buffer.toString('utf8');
  const asciiContent = buffer.toString('latin1');

  const hasExif = /Exif|exif:/i.test(asciiContent);
  const hasGps = /GPSLatitude|GPSLongitude|\bGPS\b|gps:/i.test(asciiContent);
  const hasAuthorMetadata =
    /\/Author\b|author[:=]|<dc:creator\b|<cp:lastModifiedBy\b|<Manager\b/i.test(utf8Content);
  const hasTitleMetadata = /\/Title\b|<dc:title\b|<Title\b/i.test(utf8Content);
  const hasCreatorMetadata = /\/Creator\b|\/Producer\b|creator[:=]|<Application\b/i.test(
    utf8Content
  );
  const hasCompanyMetadata = /\bCompany\b|<Company\b|company[:=]/i.test(utf8Content);
  const hasHiddenDocumentProperties =
    /xmp:|<rdf:|photoshop|icc_profile|docProps\/(core|app)\.xml/i.test(utf8Content);

  return {
    detectedMime,
    hasExif,
    hasGps,
    hasAuthorMetadata,
    hasTitleMetadata,
    hasCreatorMetadata,
    hasCompanyMetadata,
    hasHiddenDocumentProperties,
    publicSafeEligible:
      !hasExif &&
      !hasGps &&
      !hasAuthorMetadata &&
      !hasTitleMetadata &&
      !hasCreatorMetadata &&
      !hasCompanyMetadata &&
      !hasHiddenDocumentProperties,
  };
}

export function assessUploadFilenamePrivacy(fileName: string): UploadFilenameAssessment {
  const sanitizedFilename = sanitizeUploadFilename(fileName);
  const materiallyChanged = sanitizedFilename !== fileName.trim();
  const containsIdentitySignal = containsIdentityBearingFilenameSignal(fileName);
  const requiresReview =
    (materiallyChanged && FILENAME_REVIEW_PATTERN.test(fileName)) || containsIdentitySignal;
  const reasons: UploadPrivacyReviewReason[] = [];

  if (materiallyChanged && FILENAME_REVIEW_PATTERN.test(fileName)) {
    reasons.push('filename_sanitized');
  }

  if (containsIdentitySignal) {
    reasons.push('filename_identity_signal');
  }

  return {
    originalFilename: fileName,
    sanitizedFilename,
    materiallyChanged,
    containsIdentitySignal,
    requiresReview,
    reasons,
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
  if (input.metadataFlags.hasTitleMetadata) {
    reasons.push('metadata_title');
  }
  if (input.metadataFlags.hasCreatorMetadata) {
    reasons.push('metadata_creator');
  }
  if (input.metadataFlags.hasCompanyMetadata) {
    reasons.push('metadata_company');
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
        'filename_identity_signal',
        'metadata_exif',
        'metadata_gps',
        'metadata_author',
        'metadata_title',
        'metadata_creator',
        'metadata_company',
        'metadata_hidden_properties',
        'malware_scanner_unavailable',
        'metadata_stripping_unavailable',
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
