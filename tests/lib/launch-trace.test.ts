import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}));

import { log } from '@/lib/log';
import { emitLaunchTrace, startLaunchTrace } from '@/lib/launch/trace';

describe('launch trace helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits canonical dimensions for successful traces', () => {
    const trace = startLaunchTrace({
      flow: 'export',
      requestId: 'req-123',
      actorId: 'user-1',
      actorType: 'user_account',
      objectRefs: {
        profileId: 'profile-1',
      },
    });

    const payload = emitLaunchTrace(trace, {
      outcome: 'success',
      state: 'portfolio_export_ready',
      failureClass: null,
      finishedAtMs: trace.startedAtMs + 125,
    });

    expect(payload).toMatchObject({
      flow: 'export',
      requestId: 'req-123',
      actorId: 'user-1',
      actorType: 'user_account',
      objectRefs: {
        profileId: 'profile-1',
      },
      outcome: 'success',
      state: 'portfolio_export_ready',
      latencyMs: 125,
      failureClass: null,
    });
    expect(log.info).toHaveBeenCalledWith('launch.trace', expect.objectContaining(payload));
  });

  it('uses error logging for failing traces', () => {
    const trace = startLaunchTrace({
      flow: 'delete_unpublish',
      actorType: 'system',
    });

    emitLaunchTrace(trace, {
      outcome: 'failure',
      state: 'account_delete_failed',
      failureClass: 'anonymize_failed',
    });

    expect(log.error).toHaveBeenCalledWith(
      'launch.trace',
      expect.objectContaining({
        flow: 'delete_unpublish',
        failureClass: 'anonymize_failed',
      })
    );
  });
});
