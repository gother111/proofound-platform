import { afterEach, describe, expect, it, vi } from 'vitest';

import { safeApiErrorResponse } from '@/lib/api/errors';
import {
  sanitizeErrorForLog,
  sanitizeLogPayload,
  sanitizeSensitiveLogText,
} from '@/lib/privacy/log-redaction';

const logError = vi.hoisted(() => vi.fn());

vi.mock('@/lib/log', () => ({
  log: {
    error: logError,
  },
}));

describe('privacy-safe API error helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('redacts SQL, table names, env names, token hashes, emails, storage paths, and filenames', () => {
    const input = {
      email: 'verifier@example.com',
      originalFilename: 'Jordan Resume.pdf',
      storagePath: 'individual_profile/user-1/proof/Jordan Resume.pdf',
      tokenHash: 'a'.repeat(64),
      message:
        'relation "verification_records" does not exist for DATABASE_URL and verifier@example.com',
      nested: {
        sourceUrl: 'https://supabase.example/storage/v1/object/proof/Jordan Resume.pdf',
      },
    };

    const redacted = sanitizeLogPayload(input);
    const serialized = JSON.stringify(redacted);

    expect(serialized).not.toContain('verifier@example.com');
    expect(serialized).not.toContain('Jordan Resume.pdf');
    expect(serialized).not.toContain('individual_profile/user-1');
    expect(serialized).not.toContain('verification_records');
    expect(serialized).not.toContain('DATABASE_URL');
    expect(serialized).not.toContain('aaaaaaaa');
    expect(serialized).toContain('[REDACTED_EMAIL]');
    expect(serialized).toContain('[REDACTED_DATABASE_ERROR]');
  });

  it('categorizes raw database and storage errors without preserving implementation details', () => {
    const dbError = sanitizeErrorForLog(
      new Error('duplicate key violates constraint "profiles_email_key" on table profiles')
    );
    const storageError = sanitizeErrorForLog(
      new Error('storage path uploads/user-1/private/Jordan Resume.pdf failed')
    );

    expect(dbError).toMatchObject({
      category: 'database',
      message: '[REDACTED_DATABASE_ERROR]',
    });
    expect(storageError).toMatchObject({
      category: 'storage',
      message: '[REDACTED_STORAGE_ERROR]',
    });
  });

  it('returns generic production responses while logging only redacted structured errors', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const response = safeApiErrorResponse({
      event: 'test.route.failed',
      error: new Error('select * from hidden_profiles where email = verifier@example.com'),
      requestId: 'req-1',
      publicMessage: 'Unable to complete request',
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: 'Unable to complete request',
      requestId: 'req-1',
    });
    expect(logError).toHaveBeenCalledWith(
      'test.route.failed',
      expect.objectContaining({
        requestId: 'req-1',
        error: expect.objectContaining({
          category: 'database',
          message: '[REDACTED_DATABASE_ERROR]',
        }),
      })
    );
    expect(JSON.stringify(logError.mock.calls)).not.toContain('hidden_profiles');
    expect(JSON.stringify(logError.mock.calls)).not.toContain('verifier@example.com');
  });

  it('sanitizes free-form sensitive text without hiding harmless validation language', () => {
    expect(sanitizeSensitiveLogText('Assignment title is required', 'message')).toBe(
      'Assignment title is required'
    );
    expect(
      sanitizeSensitiveLogText('token_hash=abc123 and file uploads/u/Jordan Resume.pdf', 'message')
    ).toBe('[REDACTED_STORAGE_ERROR]');
  });
});
