import { normalizePdfParseError } from '@/lib/expertise/pdf-client-errors';
import {
  isOcrClientEnabled,
  resolveOcrClientLimits,
  type OcrClientLimits,
} from '@/lib/expertise/ocr-client-config';

type PdfClientExtractorModule = typeof import('@/lib/expertise/pdf-client-extractor');
type OcrClientModule = typeof import('@/lib/expertise/ocr-client');

let pdfClientExtractorPromise: Promise<PdfClientExtractorModule> | null = null;
let ocrClientPromise: Promise<OcrClientModule> | null = null;

async function loadPdfClientExtractor(): Promise<PdfClientExtractorModule> {
  if (!pdfClientExtractorPromise) {
    pdfClientExtractorPromise = import('@/lib/expertise/pdf-client-extractor').catch((error) => {
      pdfClientExtractorPromise = null;
      throw error;
    });
  }

  return pdfClientExtractorPromise;
}

async function loadOcrClient(): Promise<OcrClientModule> {
  if (!ocrClientPromise) {
    ocrClientPromise = import('@/lib/expertise/ocr-client').catch((error) => {
      ocrClientPromise = null;
      throw error;
    });
  }

  return ocrClientPromise;
}

export { isOcrClientEnabled, normalizePdfParseError, resolveOcrClientLimits };
export type { OcrClientLimits };

export async function extractPdfTextFromFile(file: File): Promise<string> {
  const extractorModule = await loadPdfClientExtractor();
  return extractorModule.extractPdfTextFromFile(file);
}

export async function extractPdfTextWithOcr(
  file: File
): Promise<{ text: string; pagesProcessed: number }> {
  const ocrModule = await loadOcrClient();
  return ocrModule.extractPdfTextWithOcr(file);
}
