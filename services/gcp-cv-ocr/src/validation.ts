export type ValidatedDocument = {
  contentType: AllowedMimeType;
  fileBytes: Uint8Array;
  pageCount: number;
};

export type ValidationFailureCode =
  | 'bad_json'
  | 'invalid_request'
  | 'bad_mime'
  | 'bad_base64'
  | 'bad_magic_bytes'
  | 'file_too_large'
  | 'too_many_pages';

export type ValidationResult =
  | { ok: true; document: ValidatedDocument }
  | { ok: false; code: ValidationFailureCode };

export type AllowedMimeType =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'image/tiff'
  | 'image/webp';

const DEFAULT_MAX_FILE_SIZE_MB = 5;
const DEFAULT_MAX_PAGES = 4;
const ALLOWED_MIME_TYPES = new Set<AllowedMimeType>([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/webp',
]);
const FORBIDDEN_REQUEST_KEYS = new Set([
  'bucket',
  'fileName',
  'filename',
  'gcsPath',
  'headers',
  'objectName',
  'originalFilename',
  'path',
  'processorId',
  'secret',
  'signedUrl',
  'storagePath',
  'token',
  'url',
]);

export function resolveLimits(env: Record<string, string | undefined> = process.env): {
  maxFileSizeBytes: number;
  maxPages: number;
} {
  const maxFileSizeMb = parsePositiveInt(env.GCP_CV_OCR_MAX_FILE_SIZE_MB, DEFAULT_MAX_FILE_SIZE_MB);

  return {
    maxFileSizeBytes: maxFileSizeMb * 1024 * 1024,
    maxPages: parsePositiveInt(env.GCP_CV_OCR_MAX_PAGES, DEFAULT_MAX_PAGES),
  };
}

export function validateExtractPayload(
  rawPayload: unknown,
  limits: { maxFileSizeBytes: number; maxPages: number }
): ValidationResult {
  if (!isRecord(rawPayload) || containsForbiddenRequestKey(rawPayload)) {
    return { ok: false, code: 'invalid_request' };
  }

  const contentType =
    typeof rawPayload.contentType === 'string' ? rawPayload.contentType.trim().toLowerCase() : '';
  if (!ALLOWED_MIME_TYPES.has(contentType as AllowedMimeType)) {
    return { ok: false, code: 'bad_mime' };
  }

  const fileBase64 = typeof rawPayload.fileBase64 === 'string' ? rawPayload.fileBase64.trim() : '';
  const fileBytes = decodeBase64(fileBase64);
  if (!fileBytes) {
    return { ok: false, code: 'bad_base64' };
  }

  if (fileBytes.byteLength > limits.maxFileSizeBytes) {
    return { ok: false, code: 'file_too_large' };
  }

  if (!matchesMagicBytes(contentType as AllowedMimeType, fileBytes)) {
    return { ok: false, code: 'bad_magic_bytes' };
  }

  const declaredPageCount = parseDeclaredPageCount(rawPayload.pageCount);
  if (rawPayload.pageCount !== undefined && declaredPageCount === null) {
    return { ok: false, code: 'invalid_request' };
  }

  const pageCount = resolvePageCount(contentType as AllowedMimeType, fileBytes, declaredPageCount);
  if (pageCount > limits.maxPages) {
    return { ok: false, code: 'too_many_pages' };
  }

  return {
    ok: true,
    document: {
      contentType: contentType as AllowedMimeType,
      fileBytes,
      pageCount,
    },
  };
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function containsForbiddenRequestKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsForbiddenRequestKey);
  }

  if (!isRecord(value)) {
    return false;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (
      FORBIDDEN_REQUEST_KEYS.has(key) ||
      /(filename|storagepath|signedurl|processorid|secret|token)/i.test(key)
    ) {
      return true;
    }

    if (containsForbiddenRequestKey(nestedValue)) {
      return true;
    }
  }

  return false;
}

function decodeBase64(value: string): Uint8Array | null {
  if (!value || !/^[a-zA-Z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) {
    return null;
  }

  try {
    return new Uint8Array(Buffer.from(value, 'base64'));
  } catch {
    return null;
  }
}

function parseDeclaredPageCount(value: unknown): number | null {
  if (value === undefined) {
    return null;
  }

  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function resolvePageCount(
  contentType: AllowedMimeType,
  fileBytes: Uint8Array,
  declaredPageCount: number | null
): number {
  if (contentType !== 'application/pdf') {
    return 1;
  }

  const pdfText = Buffer.from(fileBytes).toString('latin1');
  const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
  const detectedPageCount = pageMatches?.length ?? 0;

  return Math.max(1, detectedPageCount, declaredPageCount ?? 0);
}

function matchesMagicBytes(contentType: AllowedMimeType, fileBytes: Uint8Array): boolean {
  if (contentType === 'application/pdf') {
    return startsWithAscii(fileBytes, '%PDF-');
  }

  if (contentType === 'image/png') {
    return startsWithBytes(fileBytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }

  if (contentType === 'image/jpeg') {
    return startsWithBytes(fileBytes, [0xff, 0xd8, 0xff]);
  }

  if (contentType === 'image/tiff') {
    return (
      startsWithBytes(fileBytes, [0x49, 0x49, 0x2a, 0x00]) ||
      startsWithBytes(fileBytes, [0x4d, 0x4d, 0x00, 0x2a])
    );
  }

  return (
    startsWithAscii(fileBytes, 'RIFF') &&
    fileBytes.byteLength >= 12 &&
    Buffer.from(fileBytes.slice(8, 12)).toString('ascii') === 'WEBP'
  );
}

function startsWithAscii(fileBytes: Uint8Array, value: string): boolean {
  return Buffer.from(fileBytes.slice(0, value.length)).toString('ascii') === value;
}

function startsWithBytes(fileBytes: Uint8Array, expected: number[]): boolean {
  if (fileBytes.byteLength < expected.length) {
    return false;
  }

  return expected.every((byte, index) => fileBytes[index] === byte);
}
