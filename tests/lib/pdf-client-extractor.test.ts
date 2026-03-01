import { beforeEach, describe, expect, it, vi } from 'vitest';

function createMockPdfFile(): File {
  return {
    arrayBuffer: async () => new TextEncoder().encode('mock-pdf').buffer,
  } as File;
}

function createResolvedLoadingTask(text: string) {
  return {
    promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({
        getTextContent: async () => ({
          items: [{ str: text }],
        }),
      }),
    }),
  };
}

describe('pdf-client-extractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unmock('pdfjs-dist/webpack.mjs');
    vi.unmock('pdfjs-dist/build/pdf.mjs');
  });

  it('extracts text through webpack entrypoint and initializes worker source', async () => {
    const workerOptions = { workerSrc: '' };
    const getDocumentMock = vi.fn(() => createResolvedLoadingTask('React TypeScript'));

    vi.doMock('pdfjs-dist/webpack.mjs', () => ({
      getDocument: getDocumentMock,
      GlobalWorkerOptions: workerOptions,
    }));

    const { extractPdfTextFromFile } = await import('@/lib/expertise/pdf-client-extractor');
    const text = await extractPdfTextFromFile(createMockPdfFile());

    expect(getDocumentMock).toHaveBeenCalledTimes(1);
    expect(text).toBe('React TypeScript');
    expect(workerOptions.workerSrc).toContain('pdf.worker.min.mjs');
  });

  it('falls back to build/pdf.mjs when webpack entrypoint load fails', async () => {
    const fallbackWorkerOptions = { workerSrc: '' };
    const fallbackGetDocumentMock = vi.fn(() => createResolvedLoadingTask('Fallback Parser'));

    vi.doMock('pdfjs-dist/webpack.mjs', () => {
      throw new Error('webpack module unavailable');
    });
    vi.doMock('pdfjs-dist/build/pdf.mjs', () => ({
      getDocument: fallbackGetDocumentMock,
      GlobalWorkerOptions: fallbackWorkerOptions,
    }));

    const { extractPdfTextFromFile } = await import('@/lib/expertise/pdf-client-extractor');
    const text = await extractPdfTextFromFile(createMockPdfFile());

    expect(fallbackGetDocumentMock).toHaveBeenCalledTimes(1);
    expect(text).toBe('Fallback Parser');
    expect(fallbackWorkerOptions.workerSrc).toContain('pdf.worker.min.mjs');
  });

  it('throws deterministic parser-init error when no entrypoint exposes getDocument', async () => {
    vi.doMock('pdfjs-dist/webpack.mjs', () => ({
      GlobalWorkerOptions: { workerSrc: '' },
    }));
    vi.doMock('pdfjs-dist/build/pdf.mjs', () => ({
      default: {},
      GlobalWorkerOptions: { workerSrc: '' },
    }));

    const { extractPdfTextFromFile } = await import('@/lib/expertise/pdf-client-extractor');

    await expect(extractPdfTextFromFile(createMockPdfFile())).rejects.toThrow(
      'PDF parser initialization failed'
    );
  });

  it('sets worker source before getDocument execution and keeps friendly parse mapping', async () => {
    const workerOptions = { workerSrc: '' };
    const getDocumentMock = vi.fn(() => {
      if (!workerOptions.workerSrc) {
        throw new Error('No "GlobalWorkerOptions.workerSrc" specified.');
      }

      return createResolvedLoadingTask('Worker Ready');
    });

    vi.doMock('pdfjs-dist/webpack.mjs', () => ({
      getDocument: getDocumentMock,
      GlobalWorkerOptions: workerOptions,
    }));

    const { extractPdfTextFromFile, normalizePdfParseError } = await import(
      '@/lib/expertise/pdf-client-extractor'
    );
    const text = await extractPdfTextFromFile(createMockPdfFile());

    expect(text).toBe('Worker Ready');
    expect(normalizePdfParseError(new Error('No "GlobalWorkerOptions.workerSrc" specified.'))).toBe(
      'PDF parser could not start. Please refresh and re-upload the file.'
    );
  });
});
