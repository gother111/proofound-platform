import { createHash, createHmac, randomUUID } from 'node:crypto';

import { z } from 'zod';

import {
  getGcpCvOcrAuthSecret,
  resolveGcpCvOcrConfig,
  type GcpCvOcrAllowedMimeType,
  type GcpCvOcrConfig,
} from '@/lib/expertise/gcp-cv-ocr-config';
import {
  resolveGcpCvOcrOidcBearerToken,
  type VercelOidcTokenFactory,
} from '@/lib/expertise/gcp-cv-ocr-oidc';
import {
  isLocalMockDocumentExtractionEnabled,
  localMockDocumentExtractionProvider,
  resolveLocalMockDocumentExtractionConfig,
} from '@/lib/expertise/local-mock-document-extraction-provider';

export type DocumentExtractionProviderName =
  | 'gcp_document_ai'
  | 'gcp_vision'
  | 'mock'
  | 'fallback'
  | 'unavailable';

export type DocumentExtractionStatus =
  | 'completed'
  | 'unavailable'
  | 'timeout'
  | 'invalid_response'
  | 'error';

type EnvReader = Record<string, string | undefined>;

const DEFAULT_TIMEOUT_MS = 8000;
const MAX_TEXT_LENGTH = 30000;
const SAFE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SIGNED_URL_PATTERN =
  /https?:\/\/[^\s"'<>]*(?:x-amz-signature|x-goog-signature|signature=|token=)[^\s"'<>]*/gi;
const STORAGE_PATH_PATTERN =
  /\b(?:gs|s3):\/\/[^\s"'<>]+|\b(?:cv-import-temp|user-uploads-private|proofound-uploads)\/[^\s"'<>]+/gi;
const SECRET_PATTERN =
  /\b(?:api[_-]?key|authorization|bearer|secret|token)\s*[:=]\s*['"]?[^'",\s;}]+/gi;
const RAW_FILENAME_PATTERN = /\b[\w.-]+\.(?:pdf|docx?|png|jpe?g|tiff?|webp)\b/gi;

const FORBIDDEN_FIELD_NAMES = new Set([
  'email',
  'emailAddress',
  'fileName',
  'filename',
  'gcsPath',
  'objectName',
  'originalFilename',
  'path',
  'processorId',
  'rawFilename',
  'signedUrl',
  'storagePath',
  'token',
  'secret',
  'url',
]);

const SafeIdSchema = z.string().trim().min(1).max(128).regex(SAFE_ID_PATTERN);
const SafeMetadataValueSchema = z.union([
  z.string().trim().max(500),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const SafeDocumentExtractionMetadataSchema = z
  .record(SafeMetadataValueSchema)
  .default({})
  .superRefine((metadata, ctx) => {
    for (const [key, value] of Object.entries(metadata)) {
      if (isForbiddenFieldName(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: 'Unsafe document extraction metadata field is not allowed.',
        });
      }

      if (typeof value === 'string' && containsForbiddenResponseText(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: 'Unsafe document extraction metadata value is not allowed.',
        });
      }
    }
  });

export const SafeUserReferenceSchema = z
  .object({
    kind: z.enum(['internal_user_id', 'opaque_user_ref']),
    value: SafeIdSchema,
  })
  .strict();

export const DocumentExtractionInputSchema = z
  .object({
    requestId: SafeIdSchema,
    userId: z.string().uuid().optional(),
    userRef: SafeUserReferenceSchema.optional(),
    documentId: SafeIdSchema,
    contentType: z.string().trim().min(1).max(120),
    fileBytes: z.instanceof(Uint8Array).optional(),
    stream: z
      .custom<ReadableStream<Uint8Array>>(isReadableStream, 'stream must be a ReadableStream')
      .optional(),
    metadata: SafeDocumentExtractionMetadataSchema,
  })
  .strict()
  .superRefine((input, ctx) => {
    if (!input.userId && !input.userRef) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['userId'],
        message: 'Document extraction input requires userId or userRef.',
      });
    }

    if (input.userId && input.userRef) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['userRef'],
        message: 'Document extraction input accepts userId or userRef, not both.',
      });
    }

    if (!input.fileBytes && !input.stream) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fileBytes'],
        message: 'Document extraction input requires fileBytes or stream.',
      });
    }

    if (input.fileBytes && input.stream) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['stream'],
        message: 'Document extraction input accepts fileBytes or stream, not both.',
      });
    }
  });

export const DocumentExtractionResponseSchema = z
  .object({
    status: z.enum(['completed', 'unavailable', 'timeout', 'invalid_response', 'error']),
    provider: z.enum(['gcp_document_ai', 'gcp_vision', 'mock', 'fallback', 'unavailable']),
    requestId: SafeIdSchema,
    documentId: SafeIdSchema,
    pageCount: z.number().int().min(0),
    text: z.string().max(MAX_TEXT_LENGTH),
    confidence: z.number().min(0).max(1),
    elapsedMs: z.number().int().min(0),
    warnings: z.array(z.string().trim().min(1).max(200)).max(20),
    fallback: z.boolean(),
  })
  .strict()
  .superRefine((response, ctx) => {
    if (containsForbiddenResponseText(response.text)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['text'],
        message: 'Document extraction response text contains forbidden sensitive content.',
      });
    }

    response.warnings.forEach((warning, index) => {
      if (containsForbiddenResponseText(warning)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['warnings', index],
          message: 'Document extraction warning contains forbidden sensitive content.',
        });
      }
    });
  });

export type DocumentExtractionInput = z.infer<typeof DocumentExtractionInputSchema>;
export type DocumentExtractionResponse = z.infer<typeof DocumentExtractionResponseSchema>;

export interface DocumentExtractionProvider {
  readonly provider: DocumentExtractionProviderName;
  extractTextFromDocument(input: DocumentExtractionInput): Promise<DocumentExtractionResponse>;
}

export type ExtractTextFromDocumentOptions = {
  env?: EnvReader;
  now?: Date;
  config?: GcpCvOcrConfig;
  provider?: DocumentExtractionProvider;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  clock?: () => number;
  nonceFactory?: () => string;
  vercelOidcTokenFactory?: VercelOidcTokenFactory;
};

export class DocumentExtractionProviderError extends Error {
  constructor(
    message: string,
    readonly status: DocumentExtractionStatus
  ) {
    super(message);
    this.name = 'DocumentExtractionProviderError';
  }
}

export const unavailableDocumentExtractionProvider: DocumentExtractionProvider = {
  provider: 'unavailable',
  async extractTextFromDocument(input) {
    return createFallbackDocumentExtractionResponse(input, {
      status: 'unavailable',
      provider: 'unavailable',
      warnings: ['document_extraction_provider_unavailable'],
    });
  },
};

const GcpCvOcrServiceResponseSchema = z
  .object({
    status: z.enum(['completed']),
    provider: z.enum(['gcp_document_ai', 'mock']),
    requestId: SafeIdSchema,
    documentId: SafeIdSchema,
    pageCount: z.number().int().min(0),
    text: z.string().max(MAX_TEXT_LENGTH),
    metadata: z
      .object({
        confidence: z.number().min(0).max(1).default(0),
        elapsedMs: z.number().int().min(0).default(0),
      })
      .passthrough()
      .default({ confidence: 0, elapsedMs: 0 }),
    warnings: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  })
  .strict();

export class GcpCvOcrHttpDocumentExtractionProvider implements DocumentExtractionProvider {
  readonly provider = 'gcp_document_ai' as const;

  private readonly config: GcpCvOcrConfig;
  private readonly secret: string | null;
  private readonly fetchImpl: typeof fetch;
  private readonly clock: () => number;
  private readonly nonceFactory: () => string;
  private readonly vercelOidcTokenFactory?: VercelOidcTokenFactory;

  constructor(params: {
    config: GcpCvOcrConfig;
    secret?: string | null;
    fetchImpl?: typeof fetch;
    clock?: () => number;
    nonceFactory?: () => string;
    vercelOidcTokenFactory?: VercelOidcTokenFactory;
  }) {
    this.config = params.config;
    this.secret = params.secret ?? null;
    this.fetchImpl = params.fetchImpl ?? fetch;
    this.clock = params.clock ?? Date.now;
    this.nonceFactory = params.nonceFactory ?? (() => `nonce_${randomUUID().replaceAll('-', '')}`);
    this.vercelOidcTokenFactory = params.vercelOidcTokenFactory;
  }

  async extractTextFromDocument(
    input: DocumentExtractionInput
  ): Promise<DocumentExtractionResponse> {
    if (!this.config.baseUrl) {
      throw new DocumentExtractionProviderError('GCP CV OCR base URL is missing.', 'error');
    }

    const fileBytes = input.fileBytes ?? (input.stream ? await readStream(input.stream) : null);
    if (!fileBytes) {
      throw new DocumentExtractionProviderError('Document bytes are missing.', 'error');
    }

    const rawBody = JSON.stringify({
      contentType: input.contentType,
      fileBase64: Buffer.from(fileBytes).toString('base64'),
      requesterRef: createOpaqueRequesterRef(input),
    });
    const headers = await this.buildAuthHeaders(rawBody);
    const response = await this.fetchImpl(`${this.config.baseUrl}/extract`, {
      method: 'POST',
      headers,
      body: rawBody,
    });

    if (!response.ok) {
      throw new DocumentExtractionProviderError(
        'GCP CV OCR provider failed.',
        response.status === 504 ? 'timeout' : 'error'
      );
    }

    const parsed = GcpCvOcrServiceResponseSchema.parse(await response.json());

    return DocumentExtractionResponseSchema.parse({
      status: parsed.status,
      provider: parsed.provider,
      requestId: input.requestId,
      documentId: input.documentId,
      pageCount: parsed.pageCount,
      text: parsed.text,
      confidence: parsed.metadata.confidence,
      elapsedMs: parsed.metadata.elapsedMs,
      warnings: parsed.warnings,
      fallback: false,
    });
  }

  private async buildAuthHeaders(rawBody: string): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };

    if (this.config.authMode === 'oidc') {
      const token = await resolveGcpCvOcrOidcBearerToken({
        config: this.config,
        fetchImpl: this.fetchImpl,
        vercelOidcTokenFactory: this.vercelOidcTokenFactory,
        nowMs: this.clock,
      });
      headers.authorization = `Bearer ${token}`;
      return headers;
    }

    if (!this.secret) {
      throw new DocumentExtractionProviderError('GCP CV OCR auth secret is missing.', 'error');
    }

    const timestamp = String(Math.floor(this.clock() / 1000));
    const nonce = this.nonceFactory();
    const bodyHash = createHash('sha256').update(rawBody).digest('hex');
    headers['x-proofound-timestamp'] = timestamp;
    headers['x-proofound-nonce'] = nonce;
    headers['x-proofound-content-sha256'] = bodyHash;
    headers['x-proofound-signature'] = `sha256=${createHmac('sha256', this.secret)
      .update(`${timestamp}.${nonce}.${bodyHash}`)
      .digest('hex')}`;

    return headers;
  }
}

export async function extractTextFromDocument(
  rawInput: unknown,
  options: ExtractTextFromDocumentOptions = {}
): Promise<DocumentExtractionResponse> {
  const clock = options.clock ?? Date.now;
  const startedAt = clock();
  const input = DocumentExtractionInputSchema.parse(rawInput);
  const localMockEnabled = isLocalMockDocumentExtractionEnabled(options.env);
  const config =
    options.config ??
    (localMockEnabled
      ? resolveLocalMockDocumentExtractionConfig(options.env)
      : resolveGcpCvOcrConfig(options.env, options.now ?? new Date()));

  if (!config.available) {
    return createFallbackDocumentExtractionResponse(input, {
      status: 'unavailable',
      provider: 'unavailable',
      elapsedMs: elapsedSince(startedAt, clock),
      warnings: [
        config.unavailableReason
          ? `document_extraction_provider_${config.unavailableReason}`
          : 'document_extraction_provider_unavailable',
      ],
    });
  }

  const validationFailure = validateExtractionInputAgainstConfig(input, config);
  if (validationFailure) {
    return createFallbackDocumentExtractionResponse(input, {
      status: 'error',
      provider: 'fallback',
      elapsedMs: elapsedSince(startedAt, clock),
      warnings: [validationFailure],
    });
  }

  const provider =
    options.provider ??
    (localMockEnabled
      ? localMockDocumentExtractionProvider
      : createConfiguredGcpProvider({
          config,
          env: options.env,
          fetchImpl: options.fetchImpl,
          clock,
          nonceFactory: options.nonceFactory,
          vercelOidcTokenFactory: options.vercelOidcTokenFactory,
        }));

  try {
    const rawResponse = await resolveWithTimeout(
      provider.extractTextFromDocument(input),
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    );
    const parsed = DocumentExtractionResponseSchema.parse(rawResponse);
    return DocumentExtractionResponseSchema.parse({
      ...parsed,
      requestId: input.requestId,
      documentId: input.documentId,
      text: redactForbiddenResponseText(parsed.text),
      elapsedMs: parsed.elapsedMs || elapsedSince(startedAt, clock),
      warnings: parsed.warnings.map(redactForbiddenResponseText),
    });
  } catch (error) {
    const status = classifyProviderFailure(error);
    return createFallbackDocumentExtractionResponse(input, {
      status,
      provider: status === 'timeout' ? provider.provider : 'fallback',
      elapsedMs: elapsedSince(startedAt, clock),
      warnings: [`document_extraction_${status}`],
    });
  }
}

function createConfiguredGcpProvider(params: {
  config: GcpCvOcrConfig;
  env?: EnvReader;
  fetchImpl?: typeof fetch;
  clock?: () => number;
  nonceFactory?: () => string;
  vercelOidcTokenFactory?: VercelOidcTokenFactory;
}): DocumentExtractionProvider {
  const secret = getGcpCvOcrAuthSecret(params.env);

  if (!params.config.available || (params.config.authMode === 'hmac' && !secret)) {
    return unavailableDocumentExtractionProvider;
  }

  return new GcpCvOcrHttpDocumentExtractionProvider({
    config: params.config,
    secret,
    fetchImpl: params.fetchImpl,
    clock: params.clock,
    nonceFactory: params.nonceFactory,
    vercelOidcTokenFactory: params.vercelOidcTokenFactory,
  });
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    chunks.push(value);
    totalLength += value.byteLength;
  }

  const bytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}

export function createFallbackDocumentExtractionResponse(
  input: Pick<DocumentExtractionInput, 'requestId' | 'documentId'>,
  overrides: Partial<
    Pick<
      DocumentExtractionResponse,
      'status' | 'provider' | 'elapsedMs' | 'warnings' | 'pageCount' | 'text' | 'confidence'
    >
  > = {}
): DocumentExtractionResponse {
  return DocumentExtractionResponseSchema.parse({
    status: overrides.status ?? 'unavailable',
    provider: overrides.provider ?? 'fallback',
    requestId: input.requestId,
    documentId: input.documentId,
    pageCount: overrides.pageCount ?? 0,
    text: redactForbiddenResponseText(overrides.text ?? ''),
    confidence: overrides.confidence ?? 0,
    elapsedMs: overrides.elapsedMs ?? 0,
    warnings: (overrides.warnings ?? ['document_extraction_fallback_used']).map(
      redactForbiddenResponseText
    ),
    fallback: true,
  });
}

function resolveWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new DocumentExtractionProviderError('Document extraction timed out.', 'timeout'));
    }, timeoutMs);

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

function classifyProviderFailure(error: unknown): DocumentExtractionStatus {
  if (error instanceof DocumentExtractionProviderError) {
    return error.status;
  }

  if (error instanceof z.ZodError) {
    return 'invalid_response';
  }

  return 'error';
}

function validateExtractionInputAgainstConfig(
  input: DocumentExtractionInput,
  config: Pick<GcpCvOcrConfig, 'allowedMimeTypes' | 'maxFileSizeBytes'>
): string | null {
  if (!config.allowedMimeTypes.includes(input.contentType as GcpCvOcrAllowedMimeType)) {
    return 'document_extraction_unsupported_mime_type';
  }

  if (input.fileBytes && input.fileBytes.byteLength > config.maxFileSizeBytes) {
    return 'document_extraction_file_too_large';
  }

  return null;
}

function createOpaqueRequesterRef(input: DocumentExtractionInput): string {
  const rawRef = input.userRef?.value ?? input.userId ?? input.requestId;
  return `req_${createHash('sha256')
    .update(`proofound-gcp-cv-ocr:${rawRef}`)
    .digest('hex')
    .slice(0, 32)}`;
}

function elapsedSince(startedAt: number, clock: () => number): number {
  return Math.max(0, Math.round(clock() - startedAt));
}

function isForbiddenFieldName(key: string): boolean {
  return (
    FORBIDDEN_FIELD_NAMES.has(key) || /(filename|signedurl|storagepath|secret|token)/i.test(key)
  );
}

function isReadableStream(value: unknown): value is ReadableStream<Uint8Array> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'getReader' in value &&
    typeof (value as ReadableStream<Uint8Array>).getReader === 'function'
  );
}

function containsForbiddenResponseText(value: string): boolean {
  EMAIL_PATTERN.lastIndex = 0;
  SIGNED_URL_PATTERN.lastIndex = 0;
  STORAGE_PATH_PATTERN.lastIndex = 0;
  SECRET_PATTERN.lastIndex = 0;

  return (
    EMAIL_PATTERN.test(value) ||
    SIGNED_URL_PATTERN.test(value) ||
    STORAGE_PATH_PATTERN.test(value) ||
    SECRET_PATTERN.test(value)
  );
}

function redactForbiddenResponseText(value: string): string {
  return value
    .replace(SIGNED_URL_PATTERN, '[redacted-url]')
    .replace(STORAGE_PATH_PATTERN, '[redacted-path]')
    .replace(EMAIL_PATTERN, '[redacted-email]')
    .replace(SECRET_PATTERN, '[redacted-secret]')
    .replace(RAW_FILENAME_PATTERN, '[redacted-file]');
}
