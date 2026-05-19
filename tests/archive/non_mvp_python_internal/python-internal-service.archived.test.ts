import { afterEach, describe, expect, it } from 'vitest';

import { resolvePythonInternalServiceBaseUrl } from '@/archive/non_launch_python_internal/lib/python-internal/service';

describe('resolvePythonInternalServiceBaseUrl', () => {
  const originalBaseUrl = process.env.PYTHON_CV_IMPORT_BASE_URL;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    if (typeof originalBaseUrl === 'string') {
      process.env.PYTHON_CV_IMPORT_BASE_URL = originalBaseUrl;
    } else {
      delete process.env.PYTHON_CV_IMPORT_BASE_URL;
    }

    if (typeof originalNodeEnv === 'string') {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }

    if (typeof originalVercelEnv === 'string') {
      process.env.VERCEL_ENV = originalVercelEnv;
    } else {
      delete process.env.VERCEL_ENV;
    }
  });

  it('uses configured PYTHON_CV_IMPORT_BASE_URL when provided', () => {
    process.env.PYTHON_CV_IMPORT_BASE_URL = 'https://python.internal/';

    expect(resolvePythonInternalServiceBaseUrl()).toBe('https://python.internal');
  });

  it('uses the local fallback in non-production runtimes when base URL is unset', () => {
    delete process.env.PYTHON_CV_IMPORT_BASE_URL;
    process.env.NODE_ENV = 'test';
    delete process.env.VERCEL_ENV;

    expect(resolvePythonInternalServiceBaseUrl()).toBe('http://127.0.0.1:3000');
  });

  it('rejects non-local http base URLs even outside production', () => {
    process.env.PYTHON_CV_IMPORT_BASE_URL = 'http://attacker.example';
    process.env.NODE_ENV = 'test';
    delete process.env.VERCEL_ENV;

    expect(() => resolvePythonInternalServiceBaseUrl()).toThrow(
      'PYTHON_CV_IMPORT_BASE_URL must use https outside local development.'
    );
  });

  it('fails closed when production-like runtime is missing a configured base URL', () => {
    delete process.env.PYTHON_CV_IMPORT_BASE_URL;
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'production';

    expect(() => resolvePythonInternalServiceBaseUrl()).toThrow(
      'PYTHON_CV_IMPORT_BASE_URL must be configured in production-like environments.'
    );
  });
});
