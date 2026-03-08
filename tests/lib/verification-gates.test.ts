import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkVerificationGates } from '@/lib/verification/gates';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/verification/policy', async () => {
  const actual = await vi.importActual<typeof import('@/lib/verification/policy')>(
    '@/lib/verification/policy'
  );

  return {
    ...actual,
    listVerificationRecordsForOwner: vi.fn().mockResolvedValue([]),
  };
});

describe('checkVerificationGates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('treats string[] verification_gates as required gates', async () => {
    const executeMock = db.execute as any;

    executeMock
      .mockResolvedValueOnce([{ verification_gates: ['identity', 'work_email'] }])
      .mockResolvedValueOnce([
        {
          verification_status: 'verified',
          verification_method: 'veriff',
          verified_at: '2026-02-01T00:00:00.000Z',
          work_email_verified: false,
        },
      ])
      .mockResolvedValueOnce([{ count: '0' }])
      .mockResolvedValueOnce([{ count: '0' }]);

    const result = await checkVerificationGates('user-1', 'assignment-1');

    expect(result.canIntroduce).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.unmetGates).toEqual([
      expect.objectContaining({ type: 'work_email', required: true }),
    ]);
  });
});
