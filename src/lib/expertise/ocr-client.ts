type PdfJsModule = {
  getDocument?: unknown;
  GlobalWorkerOptions?: {
    workerSrc?: string;
  };
  default?: {
    getDocument?: unknown;
    GlobalWorkerOptions?: {
      workerSrc?: string;
    };
  };
};

type PdfPage = {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
};

type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
};

type GetDocumentFn = (source: { data: Uint8Array }) => {
  promise: Promise<PdfDocument>;
};

type TesseractWorker = {
  recognize: (
    image: string | HTMLCanvasElement | ImageData
  ) => Promise<{ data: { text?: string } }>;
  terminate: () => Promise<unknown>;
  setParameters?: (params: Record<string, unknown>) => Promise<void>;
};

type CreateWorkerFn = (language?: string) => Promise<TesseractWorker>;

let getDocumentPromise: Promise<GetDocumentFn> | null = null;
let createWorkerPromise: Promise<CreateWorkerFn> | null = null;

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

function resolveGetDocument(module: PdfJsModule): GetDocumentFn | null {
  const getDocument = module.getDocument ?? module.default?.getDocument;
  return typeof getDocument === 'function' ? (getDocument as GetDocumentFn) : null;
}

function ensureWorkerSrc(module: PdfJsModule): void {
  const workerOptions = module.GlobalWorkerOptions ?? module.default?.GlobalWorkerOptions;
  if (!workerOptions) {
    return;
  }

  const workerSrc = workerOptions.workerSrc;
  if (typeof workerSrc === 'string' && workerSrc.trim().length > 0) {
    return;
  }

  workerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

async function loadGetDocument(): Promise<GetDocumentFn> {
  try {
    const webpackModule = (await import('pdfjs-dist/webpack.mjs')) as PdfJsModule;
    const getDocument = resolveGetDocument(webpackModule);
    if (getDocument) {
      ensureWorkerSrc(webpackModule);
      return getDocument;
    }
  } catch {
    // Continue with fallback path.
  }

  const buildModule = (await import('pdfjs-dist/build/pdf.mjs')) as PdfJsModule;
  const getDocument = resolveGetDocument(buildModule);
  if (getDocument) {
    ensureWorkerSrc(buildModule);
    return getDocument;
  }

  throw new Error('OCR PDF parser could not start.');
}

async function getDocumentLoader(): Promise<GetDocumentFn> {
  if (!getDocumentPromise) {
    getDocumentPromise = loadGetDocument().catch((error) => {
      getDocumentPromise = null;
      throw error;
    });
  }
  return getDocumentPromise;
}

async function loadCreateWorker(): Promise<CreateWorkerFn> {
  const tesseract = await import('tesseract.js');
  const createWorker = (tesseract as unknown as { createWorker?: CreateWorkerFn }).createWorker;

  if (typeof createWorker !== 'function') {
    throw new Error('OCR worker could not be initialized.');
  }

  return createWorker;
}

async function getCreateWorker(): Promise<CreateWorkerFn> {
  if (!createWorkerPromise) {
    createWorkerPromise = loadCreateWorker().catch((error) => {
      createWorkerPromise = null;
      throw error;
    });
  }
  return createWorkerPromise;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out.`)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
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

export async function extractPdfTextWithOcr(
  file: File
): Promise<{ text: string; pagesProcessed: number }> {
  const limits = resolveOcrClientLimits();

  if (file.size > limits.maxFileSizeBytes) {
    throw new Error(
      `OCR supports files up to ${Math.round(limits.maxFileSizeBytes / (1024 * 1024))}MB.`
    );
  }

  const getDocument = await getDocumentLoader();
  const buffer = await file.arrayBuffer();
  const document = await getDocument({
    data: new Uint8Array(buffer),
  }).promise;

  if (document.numPages > limits.maxPages) {
    throw new Error(`OCR supports up to ${limits.maxPages} pages per document.`);
  }

  const createWorker = await getCreateWorker();
  const worker = await createWorker(limits.language);

  let terminated = false;
  const terminateWorker = async () => {
    if (terminated) {
      return;
    }
    terminated = true;
    await worker.terminate();
  };

  const runOcr = async () => {
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: limits.renderScale });
      const canvas = documentRef().createElement('canvas');
      canvas.width = Math.max(1, Math.ceil(viewport.width));
      canvas.height = Math.max(1, Math.ceil(viewport.height));
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('OCR canvas rendering is unavailable in this browser.');
      }

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      const recognition = await withTimeout(
        worker.recognize(canvas),
        limits.pageTimeoutMs,
        `OCR page ${pageNumber}`
      );
      const pageText = (recognition.data.text || '').replace(/\\s+/g, ' ').trim();
      if (pageText.length > 0) {
        pageTexts.push(pageText);
      }
    }

    const text = pageTexts.join('\\n').trim();
    if (!text) {
      throw new Error('OCR could not extract readable text. Upload a text-based PDF.');
    }

    return {
      text,
      pagesProcessed: document.numPages,
    };
  };

  try {
    return await withTimeout(runOcr(), limits.totalTimeoutMs, 'OCR processing');
  } finally {
    await terminateWorker();
  }
}

function documentRef(): Document {
  if (typeof document === 'undefined') {
    throw new Error('OCR is only available in the browser.');
  }
  return document;
}
