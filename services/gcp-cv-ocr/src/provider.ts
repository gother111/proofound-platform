import { google } from 'googleapis';

export type OcrProviderName = 'mock' | 'gcp_document_ai' | 'gcp_vision';

export type OcrProviderInput = {
  documentId: string;
  contentType: string;
  fileBytes: Uint8Array;
  pageCount: number;
};

export type OcrProviderOutput = {
  provider: OcrProviderName;
  text: string;
  confidence: number;
};

export interface OcrProvider {
  extract(input: OcrProviderInput): Promise<OcrProviderOutput>;
}

export class OcrProviderError extends Error {
  constructor(
    message: string,
    readonly code: 'provider_error' | 'provider_timeout'
  ) {
    super(message);
    this.name = 'OcrProviderError';
  }
}

export class MockDocumentAiVisionClient implements OcrProvider {
  readonly provider: OcrProviderName = 'mock';

  constructor(private readonly text = 'Mock OCR extraction completed.') {}

  async extract(input: OcrProviderInput): Promise<OcrProviderOutput> {
    return {
      provider: this.provider,
      text: this.text,
      confidence: input.fileBytes.byteLength > 0 ? 0.9 : 0,
    };
  }
}

type FetchLike = typeof fetch;
type AccessTokenProvider = () => Promise<string>;

const DOCUMENT_AI_LOCATION_PATTERN = /^[a-z0-9-]{2,32}$/;
const DOCUMENT_AI_PROCESSOR_ID_PATTERN = /^[a-zA-Z0-9_-]{2,128}$/;

export class GoogleDocumentAiOcrProvider implements OcrProvider {
  readonly provider: OcrProviderName = 'gcp_document_ai';

  private readonly projectId: string;
  private readonly location: string;
  private readonly processorId: string;
  private readonly fetchImpl: FetchLike;
  private readonly accessTokenProvider: AccessTokenProvider;

  constructor(
    params: {
      env?: Record<string, string | undefined>;
      fetchImpl?: FetchLike;
      accessTokenProvider?: AccessTokenProvider;
    } = {}
  ) {
    const env = params.env ?? process.env;
    this.projectId = resolveRequiredEnv(env, [
      'GCP_CV_OCR_PROJECT_ID',
      'GOOGLE_CLOUD_PROJECT',
      'GCLOUD_PROJECT',
    ]);
    this.location = resolveRequiredEnv(env, ['GCP_CV_OCR_DOCUMENT_AI_LOCATION']);
    this.processorId = resolveRequiredEnv(env, ['GCP_CV_OCR_DOCUMENT_AI_PROCESSOR_ID']);
    this.fetchImpl = params.fetchImpl ?? fetch;
    this.accessTokenProvider = params.accessTokenProvider ?? createGoogleAccessTokenProvider();
  }

  async extract(input: OcrProviderInput): Promise<OcrProviderOutput> {
    if (!DOCUMENT_AI_LOCATION_PATTERN.test(this.location)) {
      throw new OcrProviderError(
        'Document AI location is not configured safely.',
        'provider_error'
      );
    }

    if (!DOCUMENT_AI_PROCESSOR_ID_PATTERN.test(this.processorId)) {
      throw new OcrProviderError(
        'Document AI processor ID is not configured safely.',
        'provider_error'
      );
    }

    const endpoint =
      `https://${this.location}-documentai.googleapis.com/v1/projects/` +
      `${encodeURIComponent(this.projectId)}/locations/${encodeURIComponent(this.location)}` +
      `/processors/${encodeURIComponent(this.processorId)}:process`;
    const accessToken = await this.accessTokenProvider();
    const response = await this.fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        rawDocument: {
          content: Buffer.from(input.fileBytes).toString('base64'),
          mimeType: input.contentType,
        },
      }),
    });

    if (!response.ok) {
      throw new OcrProviderError('Document AI provider request failed.', 'provider_error');
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new OcrProviderError('Document AI provider returned invalid JSON.', 'provider_error');
    }

    const document = isRecord(payload) && isRecord(payload.document) ? payload.document : null;
    const text = typeof document?.text === 'string' ? document.text : null;
    if (text === null) {
      throw new OcrProviderError(
        'Document AI provider returned an invalid document.',
        'provider_error'
      );
    }

    return {
      provider: this.provider,
      text,
      confidence: averageDocumentAiPageConfidence(document ?? {}),
    };
  }
}

class StubbedGcpOcrProvider implements OcrProvider {
  constructor(readonly provider: Exclude<OcrProviderName, 'mock'>) {}

  async extract(): Promise<OcrProviderOutput> {
    throw new OcrProviderError(
      'Real GCP OCR provider is not wired in this skeleton.',
      'provider_error'
    );
  }
}

export function createOcrProvider(
  env: Record<string, string | undefined> = process.env
): OcrProvider {
  const provider = env.GCP_CV_OCR_PROVIDER?.trim().toLowerCase();

  if (provider === 'document_ai' || provider === 'gcp_document_ai') {
    try {
      return new GoogleDocumentAiOcrProvider({ env });
    } catch {
      return new StubbedGcpOcrProvider('gcp_document_ai');
    }
  }

  if (provider === 'vision' || provider === 'gcp_vision') {
    return new StubbedGcpOcrProvider('gcp_vision');
  }

  return new MockDocumentAiVisionClient();
}

function resolveRequiredEnv(env: Record<string, string | undefined>, keys: string[]): string {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) {
      return value;
    }
  }

  throw new OcrProviderError('Required OCR provider configuration is missing.', 'provider_error');
}

function createGoogleAccessTokenProvider(): AccessTokenProvider {
  return async () => {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

    if (!token) {
      throw new OcrProviderError('Could not obtain Google access token.', 'provider_error');
    }

    return token;
  };
}

function averageDocumentAiPageConfidence(document: Record<string, unknown>): number {
  const pages = Array.isArray(document.pages) ? document.pages : [];
  const confidences = pages
    .map((page) => {
      if (!isRecord(page) || !isRecord(page.layout)) {
        return null;
      }

      return typeof page.layout.confidence === 'number' && Number.isFinite(page.layout.confidence)
        ? page.layout.confidence
        : null;
    })
    .filter((value): value is number => value !== null);

  if (!confidences.length) {
    return 0;
  }

  return confidences.reduce((sum, value) => sum + value, 0) / confidences.length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
