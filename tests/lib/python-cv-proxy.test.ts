import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { proxyCvRequestToPython } from '@/lib/expertise/python-cv-proxy';

describe('python-cv-proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds endpoint query URL and forwards csrf context headers', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
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
    expect(body.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [targetUrl, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;

    expect(targetUrl).toContain('/api/python/cv_import?endpoint=wizard-suggest');
    expect(targetUrl).toContain('a=1');
    expect(headers['x-csrf-token']).toBe('csrf-token-value');
    expect(headers.cookie).toContain('csrf_token=csrf-token-value');
  });

  it('forwards multipart content-type boundary to python runtime', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
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
    expect(body.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['content-type']).toBe(multipartContentType);
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
});
