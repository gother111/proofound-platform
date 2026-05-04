import { describe, expect, it, vi } from 'vitest';

import { InMemoryNonceStore, sha256Hex, signHmacRequest } from '../../services/gcp-cv-ocr/src/auth';
import { createGcpCvOcrHandler } from '../../services/gcp-cv-ocr/src/handler';
import { InMemoryDailyLimitStore } from '../../services/gcp-cv-ocr/src/handler';
import {
  GoogleDocumentAiOcrProvider,
  OcrProviderError,
  type OcrProvider,
} from '../../services/gcp-cv-ocr/src/provider';
import { extractTextFromDocument } from '@/lib/expertise/document-extraction-provider';

const SECRET = 'unit-test-secret';
const NOW_MS = Date.parse('2026-05-03T12:00:00.000Z');
const NOW_SECONDS = String(Math.floor(NOW_MS / 1000));
const CONSERVATIVE_CREDIT_CUTOFF = '2026-08-03T00:00:00.000Z';
const USER_ID = '11111111-1111-4111-8111-111111111111';

function pdfBytes(pages = 1): Buffer {
  const pageObjects = Array.from(
    { length: pages },
    (_, index) => `${index + 1} 0 obj\n<< /Type /Page >>\nendobj`
  ).join('\n');
  return Buffer.from(`%PDF-1.4\n${pageObjects}\n%%EOF`);
}

function signedRequest(params: {
  body: unknown;
  headers?: Record<string, string>;
  nonce?: string;
  timestamp?: string;
  secret?: string;
}): Request {
  const rawBody = JSON.stringify(params.body);
  const bodyHash = sha256Hex(rawBody);
  const timestamp = params.timestamp ?? NOW_SECONDS;
  const nonce = params.nonce ?? 'nonce-123456';
  const signature = signHmacRequest({
    secret: params.secret ?? SECRET,
    timestamp,
    nonce,
    bodyHash,
  });

  return new Request('https://ocr.example.test/extract', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-proofound-timestamp': timestamp,
      'x-proofound-nonce': nonce,
      'x-proofound-content-sha256': bodyHash,
      'x-proofound-signature': signature,
      ...(params.headers ?? {}),
    },
    body: rawBody,
  });
}

function basePayload(overrides: Record<string, unknown> = {}) {
  return {
    contentType: 'application/pdf',
    fileBase64: pdfBytes(1).toString('base64'),
    ...overrides,
  };
}

function testHandler(options: Parameters<typeof createGcpCvOcrHandler>[0] = {}) {
  return createGcpCvOcrHandler({
    env: {
      GCP_CV_OCR_SHARED_SECRET: SECRET,
      GCP_CV_OCR_MAX_FILE_SIZE_MB: '1',
      GCP_CV_OCR_MAX_PAGES: '2',
    },
    nowMs: () => NOW_MS,
    nonceStore: new InMemoryNonceStore(),
    dailyLimitStore: new InMemoryDailyLimitStore(),
    requestIdFactory: () => 'ocr_testrequest000000000000000001',
    documentIdFactory: () => 'doc_testdocument0000000000000001',
    ...options,
  });
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, any>>;
}

describe('temporary GCP CV/OCR Cloud Run service skeleton', () => {
  it('serves a minimal health endpoint', async () => {
    const response = await testHandler()(new Request('https://ocr.example.test/health'));

    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toEqual({
      status: 'ok',
      service: 'gcp-cv-ocr',
    });
  });

  it('rejects extract requests without service-to-service auth', async () => {
    const response = await testHandler()(
      new Request('https://ocr.example.test/extract', {
        method: 'POST',
        body: JSON.stringify(basePayload()),
      })
    );
    const body = await json(response);

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('unauthorized');
  });

  it('accepts extract requests in OIDC mode after Cloud Run IAM has admitted the call', async () => {
    const extractSpy = vi.fn(async () => ({
      provider: 'mock' as const,
      text: 'safe text',
      confidence: 0.9,
    }));
    const response = await testHandler({
      env: {
        GCP_CV_OCR_AUTH_MODE: 'oidc',
        GCP_CV_OCR_MAX_FILE_SIZE_MB: '1',
        GCP_CV_OCR_MAX_PAGES: '2',
      },
      provider: {
        extract: extractSpy,
      },
    })(
      new Request('https://ocr.example.test/extract', {
        method: 'POST',
        body: JSON.stringify(basePayload()),
      })
    );

    expect(response.status).toBe(200);
    expect(extractSpy).toHaveBeenCalledTimes(1);
    expect(await json(response)).toMatchObject({
      status: 'completed',
      provider: 'mock',
    });
  });

  it('rejects replayed nonces and old timestamps', async () => {
    const handler = testHandler();
    const first = await handler(signedRequest({ body: basePayload(), nonce: 'nonce-replay-1' }));
    const replay = await handler(signedRequest({ body: basePayload(), nonce: 'nonce-replay-1' }));
    const old = await handler(
      signedRequest({
        body: basePayload(),
        nonce: 'nonce-old-1',
        timestamp: String(Math.floor((NOW_MS - 10 * 60 * 1000) / 1000)),
      })
    );

    expect(first.status).toBe(200);
    expect(replay.status).toBe(401);
    expect((await json(replay)).error.code).toBe('unauthorized');
    expect(old.status).toBe(401);
    expect((await json(old)).error.code).toBe('stale_timestamp');
  });

  it('rejects bad MIME types', async () => {
    const response = await testHandler()(
      signedRequest({
        body: basePayload({
          contentType: 'application/x-msdownload',
        }),
      })
    );

    expect(response.status).toBe(400);
    expect((await json(response)).error.code).toBe('bad_mime');
  });

  it('rejects signed URL, private storage URL, remote URL, and header inputs', async () => {
    const payloads = [
      basePayload({
        signedUrl: 'https://storage.googleapis.com/private/cv.pdf?X-Goog-Signature=abc',
      }),
      basePayload({
        storagePath: 'gs://private-bucket/cv.pdf',
      }),
      basePayload({
        url: 'https://example.com/remote-cv.pdf',
      }),
      basePayload({
        headers: {
          authorization: 'Bearer user-session-token',
          cookie: 'sb-auth-token=session-value',
          'x-forwarded-host': 'attacker.example',
        },
      }),
    ];

    for (const [index, body] of payloads.entries()) {
      const response = await testHandler()(
        signedRequest({
          body,
          nonce: `nonce-invalid-${index}`,
        })
      );
      const responseBody = await json(response);

      expect(response.status).toBe(400);
      expect(responseBody.error.code).toBe('invalid_request');
      expect(JSON.stringify(responseBody)).not.toContain('storage.googleapis.com');
      expect(JSON.stringify(responseBody)).not.toContain('private-bucket');
      expect(JSON.stringify(responseBody)).not.toContain('remote-cv.pdf');
      expect(JSON.stringify(responseBody)).not.toContain('user-session-token');
    }
  });

  it('rejects oversized files', async () => {
    const response = await testHandler({
      env: {
        GCP_CV_OCR_SHARED_SECRET: SECRET,
        GCP_CV_OCR_MAX_FILE_SIZE_MB: '1',
      },
    })(
      signedRequest({
        body: basePayload({
          fileBase64: Buffer.concat([
            Buffer.from('%PDF-1.4\n'),
            Buffer.alloc(1024 * 1024 + 1),
          ]).toString('base64'),
        }),
      })
    );

    expect(response.status).toBe(400);
    expect((await json(response)).error.code).toBe('file_too_large');
  });

  it('rejects PDFs above the page-count limit', async () => {
    const response = await testHandler()(
      signedRequest({
        body: basePayload({
          fileBase64: pdfBytes(3).toString('base64'),
        }),
      })
    );

    expect(response.status).toBe(400);
    expect((await json(response)).error.code).toBe('too_many_pages');
  });

  it('rejects multi-file request shapes above the configured request limit', async () => {
    const response = await testHandler()(
      signedRequest({
        body: {
          files: [basePayload(), basePayload()],
        },
      })
    );

    expect(response.status).toBe(400);
    expect((await json(response)).error.code).toBe('too_many_files');
  });

  it('enforces per-requester and global daily limits before calling the provider', async () => {
    const extractSpy = vi.fn(async () => ({
      provider: 'mock' as const,
      text: 'safe text',
      confidence: 0.9,
    }));
    const handler = testHandler({
      env: {
        GCP_CV_OCR_SHARED_SECRET: SECRET,
        GCP_CV_OCR_USER_DAILY_LIMIT: '1',
        GCP_CV_OCR_GLOBAL_DAILY_LIMIT: '2',
      },
      provider: {
        extract: extractSpy,
      },
    });

    const first = await handler(
      signedRequest({
        body: basePayload({ requesterRef: 'req_same_requester_0001' }),
        nonce: 'nonce-limit-1',
      })
    );
    const secondSameRequester = await handler(
      signedRequest({
        body: basePayload({ requesterRef: 'req_same_requester_0001' }),
        nonce: 'nonce-limit-2',
      })
    );
    const secondRequester = await handler(
      signedRequest({
        body: basePayload({ requesterRef: 'req_second_requester_0001' }),
        nonce: 'nonce-limit-3',
      })
    );
    const globalExceeded = await handler(
      signedRequest({
        body: basePayload({ requesterRef: 'req_third_requester_0001' }),
        nonce: 'nonce-limit-4',
      })
    );

    expect(first.status).toBe(200);
    expect(secondSameRequester.status).toBe(429);
    expect((await json(secondSameRequester)).error.code).toBe('daily_limit_exceeded');
    expect(secondRequester.status).toBe(200);
    expect(globalExceeded.status).toBe(429);
    expect((await json(globalExceeded)).error.code).toBe('global_limit_exceeded');
    expect(extractSpy).toHaveBeenCalledTimes(2);
  });

  it('returns a safe provider-timeout response', async () => {
    const neverProvider: OcrProvider = {
      async extract() {
        return new Promise(() => undefined);
      },
    };
    const response = await testHandler({ provider: neverProvider, providerTimeoutMs: 5 })(
      signedRequest({ body: basePayload() })
    );

    expect(response.status).toBe(504);
    expect((await json(response)).error.code).toBe('provider_timeout');
  });

  it('returns a safe provider-error response', async () => {
    const failingProvider: OcrProvider = {
      async extract() {
        throw new OcrProviderError(
          'Simulated provider failure with sensitive details omitted.',
          'provider_error'
        );
      },
    };
    const response = await testHandler({ provider: failingProvider })(
      signedRequest({ body: basePayload() })
    );

    expect(response.status).toBe(502);
    expect((await json(response)).error.code).toBe('provider_error');
  });

  it('does not call the OCR provider at the conservative August 3, 2026 cutoff', async () => {
    const extractSpy = vi.fn(async () => ({
      provider: 'mock' as const,
      text: 'should not run',
      confidence: 0.9,
    }));
    const response = await testHandler({
      env: {
        GCP_CV_OCR_SHARED_SECRET: SECRET,
        GCP_CV_OCR_EXPIRES_AT: CONSERVATIVE_CREDIT_CUTOFF,
      },
      nowMs: () => Date.parse(CONSERVATIVE_CREDIT_CUTOFF),
      provider: {
        extract: extractSpy,
      },
    })(
      signedRequest({
        body: basePayload(),
        timestamp: String(Date.parse(CONSERVATIVE_CREDIT_CUTOFF) / 1000),
      })
    );
    const body = await json(response);

    expect(response.status).toBe(503);
    expect(body.error.code).toBe('ocr_expired');
    expect(extractSpy).not.toHaveBeenCalled();
  });

  it('does not call the OCR provider at a configured verified expiry timestamp', async () => {
    const verifiedExpiry = '2026-07-29T18:45:00.000Z';
    const extractSpy = vi.fn(async () => ({
      provider: 'mock' as const,
      text: 'should not run',
      confidence: 0.9,
    }));
    const response = await testHandler({
      env: {
        GCP_CV_OCR_SHARED_SECRET: SECRET,
        GCP_CV_OCR_EXPIRES_AT: verifiedExpiry,
      },
      nowMs: () => Date.parse(verifiedExpiry),
      provider: {
        extract: extractSpy,
      },
    })(
      signedRequest({ body: basePayload(), timestamp: String(Date.parse(verifiedExpiry) / 1000) })
    );
    const body = await json(response);

    expect(response.status).toBe(503);
    expect(body.error.code).toBe('ocr_expired');
    expect(extractSpy).not.toHaveBeenCalled();
  });

  it('does not pass client cookies, auth headers, or forwarded host to the OCR provider', async () => {
    const extractSpy = vi.fn(async () => ({
      provider: 'mock' as const,
      text: 'safe text',
      confidence: 0.9,
    }));
    const response = await testHandler({
      provider: {
        extract: extractSpy,
      },
    })(
      signedRequest({
        body: basePayload(),
        headers: {
          authorization: 'Bearer user-session-token',
          cookie: 'sb-auth-token=session-value',
          'x-forwarded-host': 'attacker.example',
        },
      })
    );

    expect(response.status).toBe(200);
    expect(extractSpy).toHaveBeenCalledTimes(1);
    expect(extractSpy.mock.calls[0][0]).toMatchObject({
      documentId: 'doc_testdocument0000000000000001',
      contentType: 'application/pdf',
      pageCount: 1,
    });
    expect(Array.from(extractSpy.mock.calls[0][0].fileBytes)).toEqual(Array.from(pdfBytes(1)));
    expect(JSON.stringify(extractSpy.mock.calls[0][0])).not.toMatch(
      /authorization|cookie|x-forwarded-host/i
    );
  });

  it('redacts raw filenames, storage paths, and signed URLs from provider text', async () => {
    const response = await testHandler({
      provider: {
        async extract() {
          return {
            provider: 'mock',
            text:
              'candidate-secret-cv.pdf cv-import-temp/user/job/candidate-secret-cv.pdf ' +
              'https://storage.example/cv.pdf?X-Goog-Signature=abc jane@example.com +46 70 123 45 67',
            confidence: 0.9,
          };
        },
      },
    })(signedRequest({ body: basePayload() }));
    const body = await json(response);
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body.text).toContain('[redacted-file]');
    expect(body.text).toContain('[redacted-path]');
    expect(body.text).toContain('[redacted-url]');
    expect(body.text).toContain('[redacted-email]');
    expect(body.text).toContain('[redacted-phone]');
    expect(serialized).not.toContain('candidate-secret-cv.pdf');
    expect(serialized).not.toContain('cv-import-temp/user/job');
    expect(serialized).not.toContain('X-Goog-Signature');
    expect(serialized).not.toContain('jane@example.com');
    expect(serialized).not.toContain('+46 70 123 45 67');
  });

  it('does not log raw file text on validation or provider failures', async () => {
    const consoleSpies = [
      vi.spyOn(console, 'debug').mockImplementation(() => undefined),
      vi.spyOn(console, 'info').mockImplementation(() => undefined),
      vi.spyOn(console, 'log').mockImplementation(() => undefined),
      vi.spyOn(console, 'warn').mockImplementation(() => undefined),
      vi.spyOn(console, 'error').mockImplementation(() => undefined),
    ];
    const rawFileText = 'Raw CV text: confidential acquisition planning.';
    const response = await testHandler({
      provider: {
        async extract() {
          throw new OcrProviderError(rawFileText, 'provider_error');
        },
      },
    })(signedRequest({ body: basePayload() }));
    const serializedLogs = JSON.stringify(
      consoleSpies.flatMap((spy) => spy.mock.calls.flatMap((call) => call.map(String)))
    );

    expect(response.status).toBe(502);
    expect(serializedLogs).not.toContain(rawFileText);
    expect(consoleSpies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
  });

  it('fails closed when the OCR provider returns an invalid response shape', async () => {
    const response = await testHandler({
      provider: {
        async extract() {
          return {
            provider: 'mock',
            text: 123,
            confidence: 0.9,
          } as any;
        },
      },
    })(signedRequest({ body: basePayload() }));
    const body = await json(response);

    expect(response.status).toBe(502);
    expect(body.error.code).toBe('provider_error');
    expect(JSON.stringify(body)).not.toContain('123');
  });

  it('returns only the safe success response shape', async () => {
    const response = await testHandler()(signedRequest({ body: basePayload() }));
    const body = await json(response);
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: 'completed',
      provider: 'mock',
      requestId: 'ocr_testrequest000000000000000001',
      documentId: 'doc_testdocument0000000000000001',
      pageCount: 1,
      text: 'Mock OCR extraction completed.',
      metadata: {
        confidence: 0.9,
        elapsedMs: 0,
        textLength: 30,
        truncated: false,
      },
      warnings: [],
    });
    expect(serialized).not.toMatch(
      /filename|storagePath|signedUrl|processorId|bucket|secret|authorization/i
    );
  });

  it('calls Document AI with ADC auth and returns only extracted text plus confidence', async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            document: {
              text: 'Synthetic CV OCR text',
              pages: [{ layout: { confidence: 0.8 } }, { layout: { confidence: 1 } }],
            },
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          }
        )
    );
    const provider = new GoogleDocumentAiOcrProvider({
      env: {
        GCP_CV_OCR_PROJECT_ID: 'proofound-cv-ocr-prod',
        GCP_CV_OCR_DOCUMENT_AI_LOCATION: 'eu',
        GCP_CV_OCR_DOCUMENT_AI_PROCESSOR_ID: 'processor_123',
      },
      fetchImpl: fetchSpy as typeof fetch,
      accessTokenProvider: async () => 'access-token',
    });

    const output = await provider.extract({
      documentId: 'doc_testdocument0000000000000001',
      contentType: 'application/pdf',
      fileBytes: pdfBytes(1),
      pageCount: 1,
    });

    expect(output).toEqual({
      provider: 'gcp_document_ai',
      text: 'Synthetic CV OCR text',
      confidence: 0.9,
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      'https://eu-documentai.googleapis.com/v1/projects/proofound-cv-ocr-prod/locations/eu/processors/processor_123:process'
    );
    expect(fetchSpy.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: {
        authorization: 'Bearer access-token',
        'content-type': 'application/json; charset=utf-8',
      },
    });
    expect(JSON.stringify(fetchSpy.mock.calls[0][1])).not.toMatch(
      /filename|storagePath|signedUrl|processorId/i
    );
  });

  it('keeps the Cloud Vision provider non-production-ready', async () => {
    const response = await testHandler({
      env: {
        GCP_CV_OCR_SHARED_SECRET: SECRET,
        GCP_CV_OCR_PROVIDER: 'gcp_vision',
      },
    })(signedRequest({ body: basePayload() }));

    expect(response.status).toBe(502);
    expect((await json(response)).error.code).toBe('provider_error');
  });

  it('sends only an opaque requester reference from the Vercel server integration', async () => {
    const fetchSpy = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          status: 'completed',
          provider: 'gcp_document_ai',
          requestId: 'worker_request',
          documentId: 'worker_document',
          pageCount: 1,
          text: 'Synthetic OCR text',
          metadata: { confidence: 0.9, elapsedMs: 12 },
          warnings: [],
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    });

    await extractTextFromDocument(
      {
        requestId: 'ocr_request_opaque_ref',
        userId: USER_ID,
        documentId: 'doc_testdocument0000000000000001',
        contentType: 'application/pdf',
        fileBytes: new Uint8Array(pdfBytes(1)),
        metadata: {},
      },
      {
        config: {
          available: true,
          unavailableReason: null,
          baseUrl: 'https://gcp-cv-ocr.example',
          authMode: 'hmac',
          allowedMimeTypes: ['application/pdf'],
          maxFileSizeBytes: 1024 * 1024,
        } as any,
        env: {
          GCP_CV_OCR_SHARED_SECRET: SECRET,
        },
        fetchImpl: fetchSpy as typeof fetch,
        clock: () => NOW_MS,
        nonceFactory: () => 'nonce-opaque-ref',
      }
    );

    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body.requesterRef).toMatch(/^req_[a-f0-9]{32}$/);
    expect(JSON.stringify(body)).not.toContain(USER_ID);
  });

  it('treats Cloud Vision worker responses as invalid for the Vercel integration', async () => {
    const result = await extractTextFromDocument(
      {
        requestId: 'ocr_request_cloud_vision_rejected',
        userRef: {
          kind: 'opaque_user_ref',
          value: 'synthetic-user',
        },
        documentId: 'doc_testdocument0000000000000001',
        contentType: 'application/pdf',
        fileBytes: new Uint8Array(pdfBytes(1)),
        metadata: {},
      },
      {
        config: {
          available: true,
          unavailableReason: null,
          baseUrl: 'https://gcp-cv-ocr.example',
          authMode: 'hmac',
          allowedMimeTypes: ['application/pdf'],
          maxFileSizeBytes: 1024 * 1024,
        } as any,
        env: {
          GCP_CV_OCR_SHARED_SECRET: SECRET,
        },
        fetchImpl: vi.fn(
          async () =>
            new Response(
              JSON.stringify({
                status: 'completed',
                provider: 'gcp_vision',
                requestId: 'worker_request',
                documentId: 'worker_document',
                pageCount: 1,
                text: 'Should not be trusted',
                metadata: { confidence: 0.9, elapsedMs: 12 },
                warnings: [],
              }),
              {
                status: 200,
                headers: { 'content-type': 'application/json' },
              }
            )
        ) as typeof fetch,
        clock: () => NOW_MS,
        nonceFactory: () => 'nonce-cloud-vision',
      }
    );

    expect(result.status).toBe('invalid_response');
    expect(result.provider).toBe('fallback');
    expect(result.fallback).toBe(true);
    expect(result.text).toBe('');
  });

  it('fails closed when Document AI config is missing or the provider response is invalid', async () => {
    expect(
      () =>
        new GoogleDocumentAiOcrProvider({
          env: {
            GCP_CV_OCR_PROJECT_ID: 'proofound-cv-ocr-prod',
            GCP_CV_OCR_DOCUMENT_AI_LOCATION: 'eu',
          },
          accessTokenProvider: async () => 'access-token',
        })
    ).toThrow(OcrProviderError);

    const provider = new GoogleDocumentAiOcrProvider({
      env: {
        GCP_CV_OCR_PROJECT_ID: 'proofound-cv-ocr-prod',
        GCP_CV_OCR_DOCUMENT_AI_LOCATION: 'eu',
        GCP_CV_OCR_DOCUMENT_AI_PROCESSOR_ID: 'processor_123',
      },
      fetchImpl: vi.fn(
        async () => new Response(JSON.stringify({}), { status: 200 })
      ) as typeof fetch,
      accessTokenProvider: async () => 'access-token',
    });

    await expect(
      provider.extract({
        documentId: 'doc_testdocument0000000000000001',
        contentType: 'application/pdf',
        fileBytes: pdfBytes(1),
        pageCount: 1,
      })
    ).rejects.toMatchObject({
      code: 'provider_error',
    });
  });
});
