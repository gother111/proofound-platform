import { describe, expect, it, vi, afterEach } from 'vitest';
import { z } from 'zod';

import {
  DocumentExtractionInputSchema,
  DocumentExtractionResponseSchema,
  extractTextFromDocument,
  type DocumentExtractionInput,
  type DocumentExtractionProvider,
} from '@/lib/expertise/document-extraction-provider';
import { resolveGcpCvOcrConfig } from '@/lib/expertise/gcp-cv-ocr-config';
import { LOCAL_MOCK_DOCUMENT_EXTRACTOR_ENV_KEY } from '@/lib/expertise/local-mock-document-extraction-provider';

const NOW = new Date('2026-05-03T12:00:00.000Z');
const FUTURE = '2026-05-04T12:00:00.000Z';
const CONSERVATIVE_CREDIT_CUTOFF = '2026-08-03T00:00:00.000Z';

function enabledEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    GCP_CV_OCR_ENABLED: 'true',
    GCP_CV_OCR_EXPIRES_AT: FUTURE,
    GCP_CV_OCR_BASE_URL: 'https://gcp-cv-ocr.example/run',
    GCP_CV_OCR_AUTH_MODE: 'hmac',
    GCP_CV_OCR_SHARED_SECRET: 'test-secret',
    ...overrides,
  };
}

function enabledOidcEnv(overrides: Record<string, string | undefined> = {}) {
  return enabledEnv({
    GCP_CV_OCR_AUTH_MODE: 'oidc',
    GCP_CV_OCR_SHARED_SECRET: '',
    GCP_CV_OCR_OIDC_PROJECT_NUMBER: '617801124609',
    GCP_CV_OCR_OIDC_WORKLOAD_IDENTITY_POOL_ID: 'vercel',
    GCP_CV_OCR_OIDC_WORKLOAD_IDENTITY_PROVIDER_ID: 'vercel',
    GCP_CV_OCR_OIDC_SERVICE_ACCOUNT_EMAIL:
      'vercel-cv-ocr-invoker@pf-cv-ocr-20260503.iam.gserviceaccount.com',
    ...overrides,
  });
}

function input(overrides: Partial<DocumentExtractionInput> = {}) {
  return {
    requestId: 'req_test_123',
    userRef: {
      kind: 'opaque_user_ref',
      value: 'usr_ref_123',
    },
    documentId: 'doc_test_123',
    contentType: 'application/pdf',
    fileBytes: new Uint8Array([37, 80, 68, 70]),
    metadata: {
      source: 'synthetic-test',
      sizeBytes: 4,
    },
    ...overrides,
  };
}

function successfulProvider(overrides: Record<string, unknown> = {}): DocumentExtractionProvider {
  return {
    provider: 'mock',
    async extractTextFromDocument(request) {
      return {
        status: 'completed',
        provider: 'mock',
        requestId: request.requestId,
        documentId: request.documentId,
        pageCount: 2,
        text: 'Extracted text for user review.',
        confidence: 0.92,
        elapsedMs: 17,
        warnings: [],
        fallback: false,
        ...overrides,
      };
    },
  };
}

describe('document extraction provider abstraction', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns a strict successful extraction response from an injected provider', async () => {
    const result = await extractTextFromDocument(input(), {
      config: resolveGcpCvOcrConfig(enabledEnv(), NOW),
      provider: successfulProvider(),
      clock: () => 100,
    });

    expect(result).toEqual({
      status: 'completed',
      provider: 'mock',
      requestId: 'req_test_123',
      documentId: 'doc_test_123',
      pageCount: 2,
      text: 'Extracted text for user review.',
      confidence: 0.92,
      elapsedMs: 17,
      warnings: [],
      fallback: false,
    });
    expect(DocumentExtractionResponseSchema.safeParse(result).success).toBe(true);
  });

  it('uses the configured GCP HTTP provider with HMAC when no provider is injected', async () => {
    const fetchSpy = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe('https://gcp-cv-ocr.example/extract');
      expect(init?.method).toBe('POST');
      expect(init?.headers).toMatchObject({
        'content-type': 'application/json',
        'x-proofound-timestamp': '1777838400',
        'x-proofound-nonce': 'nonce-unit-test',
      });
      expect(JSON.stringify(init?.body)).not.toMatch(
        /filename|storagePath|signedUrl|authorization/i
      );

      return new Response(
        JSON.stringify({
          status: 'completed',
          provider: 'gcp_document_ai',
          requestId: 'ocr_provider_request',
          documentId: 'doc_provider_document',
          pageCount: 1,
          text: 'Synthetic OCR text from Cloud Run.',
          metadata: {
            confidence: 0.88,
            elapsedMs: 123,
          },
          warnings: [],
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    });

    const result = await extractTextFromDocument(input(), {
      env: enabledEnv(),
      now: NOW,
      fetchImpl: fetchSpy as typeof fetch,
      clock: () => 1777838400000,
      nonceFactory: () => 'nonce-unit-test',
    });

    expect(result).toEqual({
      status: 'completed',
      provider: 'gcp_document_ai',
      requestId: 'req_test_123',
      documentId: 'doc_test_123',
      pageCount: 1,
      text: 'Synthetic OCR text from Cloud Run.',
      confidence: 0.88,
      elapsedMs: 123,
      warnings: [],
      fallback: false,
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('uses Vercel OIDC and Google identity tokens without a shared secret', async () => {
    const fetchSpy = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const target = String(url);
      if (target === 'https://sts.googleapis.com/v1/token') {
        expect(String(init?.body)).toContain('subject_token=vercel-oidc-token');
        expect(String(init?.body)).toContain('workloadIdentityPools%2Fvercel%2Fproviders%2Fvercel');
        return new Response(JSON.stringify({ access_token: 'google-access-token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }

      if (target.includes(':generateIdToken')) {
        expect(init).toMatchObject({
          method: 'POST',
          headers: {
            authorization: 'Bearer google-access-token',
            'content-type': 'application/json; charset=utf-8',
          },
        });
        expect(JSON.parse(String(init?.body))).toMatchObject({
          audience: 'https://gcp-cv-ocr.example',
          includeEmail: true,
        });
        return new Response(JSON.stringify({ token: 'cloud-run-id-token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }

      expect(target).toBe('https://gcp-cv-ocr.example/extract');
      expect(init?.headers).toMatchObject({
        'content-type': 'application/json',
        authorization: 'Bearer cloud-run-id-token',
      });
      expect(JSON.stringify(init?.headers)).not.toMatch(/x-proofound-signature|test-secret/i);
      return new Response(
        JSON.stringify({
          status: 'completed',
          provider: 'gcp_document_ai',
          requestId: 'ocr_provider_request',
          documentId: 'doc_provider_document',
          pageCount: 1,
          text: 'Synthetic OCR text from Cloud Run.',
          metadata: {
            confidence: 0.88,
            elapsedMs: 123,
          },
          warnings: [],
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    });

    const result = await extractTextFromDocument(input(), {
      env: enabledOidcEnv(),
      now: NOW,
      fetchImpl: fetchSpy as typeof fetch,
      clock: () => 1777838400000,
      vercelOidcTokenFactory: () => 'vercel-oidc-token',
    });

    expect(result).toMatchObject({
      status: 'completed',
      provider: 'gcp_document_ai',
      fallback: false,
    });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('maps GCP HTTP provider failures to fallback without exposing provider details', async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: 'error',
            error: {
              code: 'provider_error',
              message: 'OCR provider failed.',
            },
          }),
          { status: 502 }
        )
    );

    const result = await extractTextFromDocument(input(), {
      env: enabledEnv(),
      now: NOW,
      fetchImpl: fetchSpy as typeof fetch,
      clock: () => 1777838400000,
      nonceFactory: () => 'nonce-unit-test',
    });

    expect(result).toMatchObject({
      status: 'error',
      provider: 'fallback',
      requestId: 'req_test_123',
      documentId: 'doc_test_123',
      text: '',
      warnings: ['document_extraction_error'],
      fallback: true,
    });
    expect(JSON.stringify(result)).not.toContain('test-secret');
  });

  it('returns deterministic fallback when the provider config is disabled', async () => {
    const provider = successfulProvider();
    const providerSpy = vi.spyOn(provider, 'extractTextFromDocument');

    const result = await extractTextFromDocument(input(), {
      env: {},
      provider,
      now: NOW,
      clock: () => 100,
    });

    expect(result).toEqual({
      status: 'unavailable',
      provider: 'unavailable',
      requestId: 'req_test_123',
      documentId: 'doc_test_123',
      pageCount: 0,
      text: '',
      confidence: 0,
      elapsedMs: 0,
      warnings: ['document_extraction_provider_disabled'],
      fallback: true,
    });
    expect(providerSpy).not.toHaveBeenCalled();
  });

  it('keeps the local mock disabled by default and uses fallback when the flag is off', async () => {
    const result = await extractTextFromDocument(input(), {
      env: {
        [LOCAL_MOCK_DOCUMENT_EXTRACTOR_ENV_KEY]: 'false',
        GCP_CV_OCR_ENABLED: 'false',
      },
      now: NOW,
      clock: () => 100,
    });

    expect(result).toMatchObject({
      status: 'unavailable',
      provider: 'unavailable',
      text: '',
      warnings: ['document_extraction_provider_disabled'],
      fallback: true,
    });
  });

  it('keeps the local mock on a private server env flag and disables it in production', async () => {
    const result = await extractTextFromDocument(input(), {
      env: {
        [LOCAL_MOCK_DOCUMENT_EXTRACTOR_ENV_KEY]: 'true',
        NODE_ENV: 'production',
        GCP_CV_OCR_ENABLED: 'false',
      },
      now: NOW,
      clock: () => 100,
    });

    expect(LOCAL_MOCK_DOCUMENT_EXTRACTOR_ENV_KEY).not.toMatch(/^NEXT_PUBLIC_/);
    expect(result).toMatchObject({
      status: 'unavailable',
      provider: 'unavailable',
      text: '',
      warnings: ['document_extraction_provider_disabled'],
      fallback: true,
    });
  });

  it('returns synthetic fixture text from the server-side local mock without exposing file details', async () => {
    const consoleSpies = [
      vi.spyOn(console, 'debug').mockImplementation(() => undefined),
      vi.spyOn(console, 'info').mockImplementation(() => undefined),
      vi.spyOn(console, 'log').mockImplementation(() => undefined),
      vi.spyOn(console, 'warn').mockImplementation(() => undefined),
      vi.spyOn(console, 'error').mockImplementation(() => undefined),
    ];
    const sensitiveFileText =
      'Original filename: real-candidate-cv.pdf\nStorage path: cv-import-temp/user/job/real-candidate-cv.pdf';
    const sensitiveFileBytes = new Uint8Array(
      Array.from(sensitiveFileText).map((char) => char.charCodeAt(0))
    );

    const result = await extractTextFromDocument(
      input({
        fileBytes: sensitiveFileBytes,
      }),
      {
        env: {
          [LOCAL_MOCK_DOCUMENT_EXTRACTOR_ENV_KEY]: 'true',
          NODE_ENV: 'development',
          GCP_CV_OCR_ENABLED: 'false',
        },
        now: NOW,
        clock: () => 100,
      }
    );

    const serialized = JSON.stringify(result);
    const serializedLogs = JSON.stringify(
      consoleSpies.flatMap((spy) => spy.mock.calls.flatMap((call) => call.map(String)))
    );

    expect(result).toMatchObject({
      status: 'completed',
      provider: 'mock',
      documentId: 'doc_test_123',
      pageCount: 1,
      confidence: 1,
      fallback: false,
    });
    expect(result.text).toContain('Synthetic Proofound Local Extractor Fixture');
    expect(result.text).toContain('TypeScript, React');
    expect(serialized).not.toContain('real-candidate-cv.pdf');
    expect(serialized).not.toContain('cv-import-temp/user/job');
    expect(serializedLogs).not.toContain('real-candidate-cv.pdf');
    expect(serializedLogs).not.toContain('Synthetic Proofound Local Extractor Fixture');
    expect(consoleSpies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
  });

  it('returns deterministic fallback when the provider config is expired', async () => {
    const provider = successfulProvider();
    const providerSpy = vi.spyOn(provider, 'extractTextFromDocument');

    const result = await extractTextFromDocument(input(), {
      env: enabledEnv({ GCP_CV_OCR_EXPIRES_AT: '2026-05-02T12:00:00.000Z' }),
      provider,
      now: NOW,
      clock: () => 100,
    });

    expect(result).toMatchObject({
      status: 'unavailable',
      provider: 'unavailable',
      requestId: 'req_test_123',
      documentId: 'doc_test_123',
      pageCount: 0,
      text: '',
      confidence: 0,
      warnings: ['document_extraction_provider_expired'],
      fallback: true,
    });
    expect(providerSpy).not.toHaveBeenCalled();
  });

  it('does not call the provider at the conservative August 3, 2026 cutoff', async () => {
    const provider = successfulProvider();
    const providerSpy = vi.spyOn(provider, 'extractTextFromDocument');

    const result = await extractTextFromDocument(input(), {
      env: enabledEnv({ GCP_CV_OCR_EXPIRES_AT: CONSERVATIVE_CREDIT_CUTOFF }),
      provider,
      now: new Date(CONSERVATIVE_CREDIT_CUTOFF),
      clock: () => 100,
    });

    expect(result).toMatchObject({
      status: 'unavailable',
      provider: 'unavailable',
      warnings: ['document_extraction_provider_expired'],
      fallback: true,
    });
    expect(providerSpy).not.toHaveBeenCalled();
  });

  it('does not call the provider at a configured verified expiry timestamp', async () => {
    const verifiedExpiry = '2026-07-29T18:45:00.000Z';
    const provider = successfulProvider();
    const providerSpy = vi.spyOn(provider, 'extractTextFromDocument');

    const result = await extractTextFromDocument(input(), {
      env: enabledEnv({ GCP_CV_OCR_EXPIRES_AT: verifiedExpiry }),
      provider,
      now: new Date(verifiedExpiry),
      clock: () => 100,
    });

    expect(result).toMatchObject({
      status: 'unavailable',
      provider: 'unavailable',
      warnings: ['document_extraction_provider_expired'],
      fallback: true,
    });
    expect(providerSpy).not.toHaveBeenCalled();
  });

  it('redacts raw filenames from provider text before returning extraction results', async () => {
    const result = await extractTextFromDocument(input(), {
      config: resolveGcpCvOcrConfig(enabledEnv(), NOW),
      provider: successfulProvider({
        text: 'Candidate document candidate-secret-cv.pdf contains safe extracted text.',
      }),
      clock: () => 100,
    });

    expect(result.status).toBe('completed');
    expect(result.text).toContain('[redacted-file]');
    expect(result.text).not.toContain('candidate-secret-cv.pdf');
  });

  it('fails closed when provider text includes a private storage path', async () => {
    const result = await extractTextFromDocument(input(), {
      config: resolveGcpCvOcrConfig(enabledEnv(), NOW),
      provider: successfulProvider({
        text: 'Storage path cv-import-temp/user/job/candidate-secret-cv.pdf',
      }),
      clock: () => 100,
    });

    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: 'invalid_response',
      provider: 'fallback',
      text: '',
      warnings: ['document_extraction_invalid_response'],
      fallback: true,
    });
    expect(serialized).not.toContain('cv-import-temp/user/job');
    expect(serialized).not.toContain('candidate-secret-cv.pdf');
  });

  it('rejects signed URL, private storage URL, and remote URL inputs before provider execution', async () => {
    const provider = successfulProvider();
    const providerSpy = vi.spyOn(provider, 'extractTextFromDocument');

    expect(() =>
      DocumentExtractionInputSchema.parse(
        input({
          metadata: {
            source: 'https://storage.googleapis.com/bucket/cv.pdf?X-Goog-Signature=abc',
          },
        })
      )
    ).toThrow(z.ZodError);

    expect(() =>
      DocumentExtractionInputSchema.parse(
        input({
          metadata: {
            source: 'gs://private-bucket/cv.pdf',
          },
        })
      )
    ).toThrow(z.ZodError);

    await expect(
      extractTextFromDocument(
        {
          ...input(),
          url: 'https://example.com/remote-cv.pdf',
        },
        {
          config: resolveGcpCvOcrConfig(enabledEnv(), NOW),
          provider,
          clock: () => 100,
        }
      )
    ).rejects.toThrow(z.ZodError);
    expect(providerSpy).not.toHaveBeenCalled();
  });

  it('rejects client cookies, auth headers, and forwarded host before provider execution', async () => {
    const provider = successfulProvider();
    const providerSpy = vi.spyOn(provider, 'extractTextFromDocument');

    await expect(
      extractTextFromDocument(
        {
          ...input(),
          headers: {
            authorization: 'Bearer user-session-token',
            cookie: 'sb-auth-token=session-value',
            'x-forwarded-host': 'attacker.example',
          },
        },
        {
          config: resolveGcpCvOcrConfig(enabledEnv(), NOW),
          provider,
          clock: () => 100,
        }
      )
    ).rejects.toThrow(z.ZodError);
    expect(providerSpy).not.toHaveBeenCalled();
  });

  it('does not log raw file text when provider execution fails', async () => {
    const consoleSpies = [
      vi.spyOn(console, 'debug').mockImplementation(() => undefined),
      vi.spyOn(console, 'info').mockImplementation(() => undefined),
      vi.spyOn(console, 'log').mockImplementation(() => undefined),
      vi.spyOn(console, 'warn').mockImplementation(() => undefined),
      vi.spyOn(console, 'error').mockImplementation(() => undefined),
    ];
    const rawFileText = 'Raw CV text: candidate worked on confidential acquisition planning.';
    const failingProvider: DocumentExtractionProvider = {
      provider: 'mock',
      async extractTextFromDocument() {
        throw new Error(rawFileText);
      },
    };

    const result = await extractTextFromDocument(
      input({
        fileBytes: new Uint8Array(Array.from(rawFileText).map((char) => char.charCodeAt(0))),
      }),
      {
        config: resolveGcpCvOcrConfig(enabledEnv(), NOW),
        provider: failingProvider,
        clock: () => 100,
      }
    );
    const serializedLogs = JSON.stringify(
      consoleSpies.flatMap((spy) => spy.mock.calls.flatMap((call) => call.map(String)))
    );

    expect(result).toMatchObject({
      status: 'error',
      provider: 'fallback',
      text: '',
      warnings: ['document_extraction_error'],
      fallback: true,
    });
    expect(serializedLogs).not.toContain(rawFileText);
    expect(consoleSpies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
  });

  it('falls back on provider failure without breaking the core extraction flow', async () => {
    const failingProvider: DocumentExtractionProvider = {
      provider: 'mock',
      async extractTextFromDocument() {
        throw new Error('provider unavailable');
      },
    };

    const result = await extractTextFromDocument(input(), {
      config: resolveGcpCvOcrConfig(enabledEnv(), NOW),
      provider: failingProvider,
      clock: () => 100,
    });

    expect(result).toMatchObject({
      status: 'error',
      provider: 'fallback',
      requestId: 'req_test_123',
      documentId: 'doc_test_123',
      text: '',
      warnings: ['document_extraction_error'],
      fallback: true,
    });
  });

  it('falls back when the provider returns an invalid response schema', async () => {
    const result = await extractTextFromDocument(input(), {
      config: resolveGcpCvOcrConfig(enabledEnv(), NOW),
      provider: successfulProvider({ pageCount: -1 }),
      clock: () => 100,
    });

    expect(result).toMatchObject({
      status: 'invalid_response',
      provider: 'fallback',
      requestId: 'req_test_123',
      documentId: 'doc_test_123',
      text: '',
      warnings: ['document_extraction_invalid_response'],
      fallback: true,
    });
  });

  it('rejects oversized files before provider execution', async () => {
    const provider = successfulProvider();
    const providerSpy = vi.spyOn(provider, 'extractTextFromDocument');

    const result = await extractTextFromDocument(
      input({
        fileBytes: new Uint8Array(1024 * 1024 + 1),
      }),
      {
        config: resolveGcpCvOcrConfig(
          enabledEnv({
            GCP_CV_OCR_MAX_FILE_SIZE_MB: '1',
          }),
          NOW
        ),
        provider,
        clock: () => 100,
      }
    );

    expect(result).toMatchObject({
      status: 'error',
      provider: 'fallback',
      text: '',
      warnings: ['document_extraction_file_too_large'],
      fallback: true,
    });
    expect(providerSpy).not.toHaveBeenCalled();
  });

  it('rejects unsupported MIME types before provider execution', async () => {
    const provider = successfulProvider();
    const providerSpy = vi.spyOn(provider, 'extractTextFromDocument');

    const result = await extractTextFromDocument(
      input({
        contentType: 'application/x-msdownload',
      }),
      {
        config: resolveGcpCvOcrConfig(enabledEnv(), NOW),
        provider,
        clock: () => 100,
      }
    );

    expect(result).toMatchObject({
      status: 'error',
      provider: 'fallback',
      text: '',
      warnings: ['document_extraction_unsupported_mime_type'],
      fallback: true,
    });
    expect(providerSpy).not.toHaveBeenCalled();
  });

  it('falls back on provider timeout without leaking provider details', async () => {
    vi.useFakeTimers();
    const stalledProvider: DocumentExtractionProvider = {
      provider: 'mock',
      extractTextFromDocument: vi.fn(() => new Promise(() => undefined)),
    };

    const resultPromise = extractTextFromDocument(input(), {
      config: resolveGcpCvOcrConfig(enabledEnv(), NOW),
      provider: stalledProvider,
      timeoutMs: 25,
      clock: () => 100,
    });

    await vi.advanceTimersByTimeAsync(30);
    const result = await resultPromise;

    expect(result).toMatchObject({
      status: 'timeout',
      provider: 'mock',
      requestId: 'req_test_123',
      documentId: 'doc_test_123',
      text: '',
      warnings: ['document_extraction_timeout'],
      fallback: true,
    });
  });

  it('rejects forbidden input metadata fields with Zod validation', () => {
    expect(() =>
      DocumentExtractionInputSchema.parse(
        input({
          metadata: {
            rawFilename: 'candidate-cv.pdf',
            source: 'synthetic-test',
          },
        })
      )
    ).toThrow(z.ZodError);
  });

  it('does not allow forbidden response fields or sensitive values to escape', async () => {
    const result = await extractTextFromDocument(input(), {
      config: resolveGcpCvOcrConfig(enabledEnv(), NOW),
      provider: successfulProvider({
        signedUrl: 'https://storage.example/file.pdf?X-Goog-Signature=abc',
        text: 'Candidate email is person@example.com',
      }),
      clock: () => 100,
    });

    const serialized = JSON.stringify(result);

    expect(result.status).toBe('invalid_response');
    expect(serialized).not.toContain('signedUrl');
    expect(serialized).not.toContain('storage.example');
    expect(serialized).not.toContain('person@example.com');
    expect(serialized).not.toContain('file.pdf');
    expect(serialized).not.toContain('test-secret');
  });
});
