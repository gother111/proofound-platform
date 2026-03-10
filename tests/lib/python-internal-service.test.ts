import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { resolvePythonInternalServiceBaseUrl } from '@/lib/python-internal/service';

describe('resolvePythonInternalServiceBaseUrl', () => {
  const originalBaseUrl = process.env.PYTHON_CV_IMPORT_BASE_URL;

  afterEach(() => {
    if (typeof originalBaseUrl === 'string') {
      process.env.PYTHON_CV_IMPORT_BASE_URL = originalBaseUrl;
      return;
    }

    delete process.env.PYTHON_CV_IMPORT_BASE_URL;
  });

  it('uses configured PYTHON_CV_IMPORT_BASE_URL when provided', () => {
    process.env.PYTHON_CV_IMPORT_BASE_URL = 'https://python.internal/';

    const request = new NextRequest('https://app.proofound.io/api/test');

    expect(resolvePythonInternalServiceBaseUrl(request)).toBe('https://python.internal');
  });

  it('uses request origin and ignores forwarded host headers', () => {
    delete process.env.PYTHON_CV_IMPORT_BASE_URL;

    const request = new NextRequest('https://app.proofound.io/api/test', {
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'attacker.example',
      },
    });

    expect(resolvePythonInternalServiceBaseUrl(request)).toBe('https://app.proofound.io');
  });
});
