export { normalizePdfParseError } from '@/lib/expertise/pdf-client-errors';

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

type PdfTextContentItem = {
  str?: string;
};

type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<{
    getTextContent: () => Promise<{
      items: PdfTextContentItem[];
    }>;
  }>;
};

type GetDocumentFn = (source: { data: Uint8Array }) => {
  promise: Promise<PdfDocument>;
};

let getDocumentPromise: Promise<GetDocumentFn> | null = null;

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
  if (typeof window === 'undefined') {
    try {
      const legacyModule = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as PdfJsModule;
      const legacyGetDocument = resolveGetDocument(legacyModule);
      if (legacyGetDocument) {
        ensureWorkerSrc(legacyModule);
        return legacyGetDocument;
      }
    } catch {
      // Continue with browser-oriented entrypoints below.
    }
  }

  try {
    const webpackModule = (await import('pdfjs-dist/webpack.mjs')) as PdfJsModule;
    const webpackGetDocument = resolveGetDocument(webpackModule);
    if (webpackGetDocument) {
      ensureWorkerSrc(webpackModule);
      return webpackGetDocument;
    }
  } catch {
    // Continue with fallback module path.
  }

  try {
    const buildModule = (await import('pdfjs-dist/build/pdf.mjs')) as PdfJsModule;
    const buildGetDocument = resolveGetDocument(buildModule);
    if (buildGetDocument) {
      ensureWorkerSrc(buildModule);
      return buildGetDocument;
    }
  } catch {
    // Continue to deterministic init failure below.
  }

  throw new Error('PDF parser initialization failed');
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

export async function extractPdfTextFromBytes(bytes: Uint8Array): Promise<string> {
  const getDocument = await getDocumentLoader();
  const document = await getDocument({
    data: new Uint8Array(bytes),
  }).promise;

  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => item.str || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length > 0) {
      pageTexts.push(text);
    }
  }

  return pageTexts.join('\n').trim();
}

export async function extractPdfTextFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return extractPdfTextFromBytes(new Uint8Array(buffer));
}
