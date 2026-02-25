export const MAX_PROOFS_PER_SKILL = 5;
export const MAX_PROOF_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const PROOF_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/heif',
  'image/heic',
] as const;

export const PROOF_ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'heif', 'heic'] as const;
export const PROOF_ALLOWED_EXTENSIONS_LABEL = 'PNG, JPG, JPEG, HEIF, HEIC, PDF';
export const PROOF_FILE_ACCEPT_ATTRIBUTE = '.png,.jpg,.jpeg,.heif,.heic,.pdf';

const PROOF_ALLOWED_MIME_TYPE_SET = new Set<string>(PROOF_ALLOWED_MIME_TYPES);
const PROOF_ALLOWED_EXTENSION_SET = new Set<string>(PROOF_ALLOWED_EXTENSIONS);

export function getFileExtension(fileName: string): string {
  const normalizedName = fileName.trim().toLowerCase();
  const lastDotIndex = normalizedName.lastIndexOf('.');
  if (lastDotIndex <= 0 || lastDotIndex === normalizedName.length - 1) {
    return '';
  }
  return normalizedName.slice(lastDotIndex + 1);
}

export function isAllowedProofFile(fileType: string, fileName: string): boolean {
  const normalizedMime = fileType.trim().toLowerCase();
  if (normalizedMime && PROOF_ALLOWED_MIME_TYPE_SET.has(normalizedMime)) {
    return true;
  }
  const extension = getFileExtension(fileName);
  return Boolean(extension && PROOF_ALLOWED_EXTENSION_SET.has(extension));
}
