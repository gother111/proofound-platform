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

vi.mock('@/lib/verification/integrity', async () => {
  const actual = await vi.importActual<typeof import('@/lib/verification/integrity')>(
    '@/lib/verification/integrity'
  );

  return {
    ...actual,
    writeVerificationAuditLog: vi.fn(),
  };
});

import { createAdminClient } from '@/lib/supabase/admin';
import { log } from '@/lib/log';
import { reconcileVerifierContradictions } from '@/lib/verification/contradiction';

function makeMaybeSingleQuery(result: unknown) {
  const query: any = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  return query;
}

describe('verification contradiction logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs admin client fallback and catch-all failures without throwing', async () => {
    const adminError = new Error('admin unavailable');
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw adminError;
    });

    await expect(
      reconcileVerifierContradictions({
        verifierEmail: 'Verifier@Example.com',
      })
    ).resolves.toEqual({
      flaggedSkillCount: 0,
      flaggedImpactCount: 0,
      impactedStoryCount: 0,
    });

    expect(log.warn).toHaveBeenCalledWith('verification.contradiction.admin_client_unavailable', {
      error: adminError,
    });
    expect(log.error).toHaveBeenCalledWith('verification.contradiction.reconcile_failed', {
      error: adminError,
    });
    expect(JSON.stringify(vi.mocked(log.error).mock.calls)).not.toContain('Verifier@Example.com');
  });

  it('logs canonical verification record scan failures without exposing verifier email', async () => {
    const recordsError = new Error('records unavailable');
    const verificationRecordsQuery: any = {
      select: vi.fn(() => verificationRecordsQuery),
      eq: vi.fn(() => verificationRecordsQuery),
      contains: vi.fn().mockResolvedValue({
        data: null,
        error: recordsError,
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles' || table === 'individual_profiles') {
          return makeMaybeSingleQuery({ data: null, error: null });
        }

        if (table === 'verification_records') {
          return verificationRecordsQuery;
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    await expect(
      reconcileVerifierContradictions({
        verifierEmail: 'Verifier@Example.com',
        verifierProfileId: 'verifier-profile-1',
      })
    ).resolves.toEqual({
      flaggedSkillCount: 0,
      flaggedImpactCount: 0,
      impactedStoryCount: 0,
    });

    expect(log.error).toHaveBeenCalledWith('verification.contradiction.records_load_failed', {
      error: recordsError,
      verifierProfileId: 'verifier-profile-1',
      hasVerifierEmail: true,
    });
    expect(JSON.stringify(vi.mocked(log.error).mock.calls)).not.toContain('Verifier@Example.com');
  });
});
