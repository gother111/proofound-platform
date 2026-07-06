import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { createAdminClient } from '@/lib/supabase/admin';
import { log } from '@/lib/log';
import { writeVerificationAuditLog } from '@/lib/verification/integrity';

describe('verification integrity logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs admin client creation failures without throwing', async () => {
    const adminError = new Error('admin unavailable');
    vi.mocked(createAdminClient).mockImplementationOnce(() => {
      throw adminError;
    });

    await expect(
      writeVerificationAuditLog({
        actorId: 'actor-1',
        action: 'verification.test',
        targetType: 'verification_record',
        targetId: 'target-1',
      })
    ).resolves.toBeUndefined();

    expect(log.warn).toHaveBeenCalledWith('verification.integrity.admin_client_unavailable', {
      error: adminError,
    });
  });

  it('logs audit insert failures with target context without throwing', async () => {
    const insertError = new Error('insert failed');
    const insert = vi.fn().mockRejectedValue(insertError);
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        insert,
      })),
    } as any);

    await expect(
      writeVerificationAuditLog({
        actorId: 'actor-1',
        action: 'verification.request.resent',
        targetType: 'skill_verification_request',
        targetId: 'request-1',
        meta: {
          verifier_email: 'verifier@example.com',
        },
      })
    ).resolves.toBeUndefined();

    expect(log.error).toHaveBeenCalledWith('verification.integrity.audit_log_insert_failed', {
      error: insertError,
      action: 'verification.request.resent',
      targetType: 'skill_verification_request',
      targetId: 'request-1',
    });
    expect(JSON.stringify(vi.mocked(log.error).mock.calls)).not.toContain('verifier@example.com');
  });
});
