import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { proxyCvRequestToPython } from '@/lib/expertise/python-cv-proxy';
import { PYTHON_INTERNAL_CONTRACT_VERSION } from '@/lib/python-internal/contracts';

describe('python-cv-proxy', () => {
  const validSuggestPayload = {
    documents: [],
    metadata: {
      semantic_used: false,
      semantic_fallback_triggered: false,
      unmapped_candidates_count: 0,
      service: 'document_intelligence',
      contract_version: PYTHON_INTERNAL_CONTRACT_VERSION,
      limits: {
        max_documents: 5,
        max_chars_per_document: 30000,
        max_total_chars: 90000,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds endpoint query URL without forwarding client auth headers', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(validSuggestPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const request = new NextRequest('http://localhost/api/expertise/cv-import/wizard-suggest?a=1', {
      method: 'POST',
      body: JSON.stringify({ documents: [] }),
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': 'csrf-token-value',
        cookie: 'csrf_token=csrf-token-value; sb-auth-token=session-value',
      },
    });

    const response = await proxyCvRequestToPython(request, '/wizard-suggest');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metadata.contract_version).toBe(PYTHON_INTERNAL_CONTRACT_VERSION);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [targetUrl, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;

    expect(targetUrl).toContain('/api/python/cv_import?endpoint=wizard-suggest');
    expect(targetUrl).toContain('a=1');
    expect(headers['x-csrf-token']).toBeUndefined();
    expect(headers.cookie).toBeUndefined();
    expect(headers['x-proofound-contract-version']).toBe(PYTHON_INTERNAL_CONTRACT_VERSION);
    expect(headers['x-python-service-secret']).toBeTruthy();
  });

  it('forwards multipart content-type boundary to python runtime', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(validSuggestPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const multipartContentType = 'multipart/form-data; boundary=----vitest-boundary';
    const request = new NextRequest('http://localhost/api/expertise/cv-import/wizard-suggest', {
      method: 'POST',
      body: '--dummy multipart body--',
      headers: {
        'content-type': multipartContentType,
      },
    });

    const response = await proxyCvRequestToPython(request, '/wizard-suggest');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metadata.service).toBe('document_intelligence');
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['content-type']).toBe(multipartContentType);
  });

  it('uses request origin instead of x-forwarded host for upstream URL', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(validSuggestPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const request = new NextRequest('http://localhost/api/expertise/cv-import/suggest', {
      method: 'POST',
      body: JSON.stringify({ documents: [] }),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-proto': 'http',
        'x-forwarded-host': 'attacker.example:8080',
      },
    });

    const response = await proxyCvRequestToPython(request, '/suggest');

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [targetUrl] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(targetUrl).toContain('http://localhost/api/python/cv_import');
    expect(targetUrl).not.toContain('attacker.example');
  });

  it('maps python csrf 403 failures to proxy unavailable response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: 'CSRF validation failed',
          message: 'Invalid or missing CSRF token',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    const request = new NextRequest('http://localhost/api/expertise/cv-import/wizard-suggest', {
      method: 'POST',
      body: JSON.stringify({ documents: [] }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await proxyCvRequestToPython(request, '/wizard-suggest');
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toBe('Failed to process CV wizard suggestions');
    expect(body.code).toBe('CV_IMPORT_PROXY_UNAVAILABLE');
  });

  it('normalizes upstream utf-8 codec errors from JSON payloads', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: 'Failed to process CV documents',
          message:
            "'utf-8' codec can't decode byte 0xc4 in position 177: invalid continuation byte",
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    const request = new NextRequest('http://localhost/api/expertise/cv-import/suggest', {
      method: 'POST',
      body: JSON.stringify({ documents: [] }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await proxyCvRequestToPython(request, '/suggest');
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe(
      'Upload metadata contains unsupported characters. Please rename the PDF and retry.'
    );
    expect(body.code).toBe('CV_IMPORT_MULTIPART_METADATA_INVALID');
    expect(String(body.message).toLowerCase()).not.toContain('utf-8');
  });

  it('normalizes upstream utf-8 codec errors from non-JSON payloads', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        "'utf-8' codec can't decode byte 0xc4 in position 177: invalid continuation byte",
        {
          status: 500,
          headers: { 'Content-Type': 'text/plain' },
        }
      )
    );

    const request = new NextRequest('http://localhost/api/expertise/cv-import/suggest', {
      method: 'POST',
      body: JSON.stringify({ documents: [] }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await proxyCvRequestToPython(request, '/suggest');
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to process CV documents');
    expect(body.message).toBe(
      'Upload metadata contains unsupported characters. Please rename the PDF and retry.'
    );
    expect(body.code).toBe('CV_IMPORT_MULTIPART_METADATA_INVALID');
  });

  it('rejects python success responses that do not match the versioned contract', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          documents: [],
          metadata: {
            semantic_used: false,
            semantic_fallback_triggered: false,
            unmapped_candidates_count: 0,
            limits: {
              max_documents: 5,
              max_chars_per_document: 30000,
              max_total_chars: 90000,
            },
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    const request = new NextRequest('http://localhost/api/expertise/cv-import/suggest', {
      method: 'POST',
      body: JSON.stringify({ documents: [] }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await proxyCvRequestToPython(request, '/suggest');
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.code).toBe('CV_IMPORT_PROXY_INVALID_CONTRACT');
  });
});
