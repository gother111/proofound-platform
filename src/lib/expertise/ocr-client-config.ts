function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function parsePositiveFloat(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function isOcrClientEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED === 'true';
}

export type OcrClientLimits = {
  maxPages: number;
  maxFileSizeBytes: number;
  pageTimeoutMs: number;
  totalTimeoutMs: number;
  renderScale: number;
  language: string;
};

export function resolveOcrClientLimits(): OcrClientLimits {
  const maxFileSizeMb = parsePositiveInt(process.env.NEXT_PUBLIC_CV_IMPORT_OCR_MAX_FILE_SIZE_MB, 5);
  return {
    maxPages: parsePositiveInt(process.env.NEXT_PUBLIC_CV_IMPORT_OCR_MAX_PAGES, 4),
    maxFileSizeBytes: maxFileSizeMb * 1024 * 1024,
    pageTimeoutMs: parsePositiveInt(process.env.NEXT_PUBLIC_CV_IMPORT_OCR_PAGE_TIMEOUT_MS, 8000),
    totalTimeoutMs: parsePositiveInt(process.env.NEXT_PUBLIC_CV_IMPORT_OCR_TIMEOUT_MS, 25000),
    renderScale: parsePositiveFloat(process.env.NEXT_PUBLIC_CV_IMPORT_OCR_RENDER_SCALE, 2),
    language: (process.env.NEXT_PUBLIC_CV_IMPORT_OCR_LANGUAGE || 'eng').trim() || 'eng',
  };
}
