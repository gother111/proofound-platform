import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: mocks.execute,
  },
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: mocks.logError,
  },
}));

import { withWorkflowMutationIdempotency } from '@/lib/api/workflow-idempotency';
import { stableHashPayload } from '@/lib/contracts/canonical-domain';

function requestWithKey(key = 'wf-test-key-123') {
  return new NextRequest('https://example.com/api/decisions', {
    method: 'POST',
    headers: {
      'Idempotency-Key': key,
    },
  });
}

const scope = {
  userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  orgId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  action: 'decision.record',
  resourceType: 'interview',
  resourceId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
};

describe('workflow mutation idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores successful mutation responses for safe retry replay', async () => {
    mocks.execute
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'record-1',
            request_hash: 'new-hash',
            response_status: null,
            response_body: null,
            state: 'processing',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] });

    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({
        success: true,
        decision: { id: 'decision-1', decision: 'hire' },
      })
    );

    const response = await withWorkflowMutationIdempotency(
      requestWithKey(),
      scope,
      { interviewId: scope.resourceId, decision: 'hire' },
      handler
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      decision: { id: 'decision-1', decision: 'hire' },
    });
    expect(response.headers.get('Idempotency-Key')).toBe('wf-test-key-123');
    expect(handler).toHaveBeenCalledOnce();
    expect(mocks.execute).toHaveBeenCalledTimes(2);
  });

  it('replays a completed response without invoking the mutation handler again', async () => {
    const payload = { interviewId: scope.resourceId, decision: 'hire' };
    const capturedHash = stableHashPayload(payload);
    mocks.execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({
      rows: [
        {
          id: 'record-1',
          request_hash: capturedHash,
          response_status: 200,
          response_body: {
            success: true,
            decision: { id: 'decision-1', decision: 'hire' },
          },
          state: 'completed',
        },
      ],
    });

    const handler = vi.fn();
    const response = await withWorkflowMutationIdempotency(
      requestWithKey(),
      scope,
      payload,
      handler
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Idempotency-Replayed')).toBe('true');
    await expect(response.json()).resolves.toEqual({
      success: true,
      decision: { id: 'decision-1', decision: 'hire' },
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('rejects same-key replay with a changed payload', async () => {
    mocks.execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({
      rows: [
        {
          id: 'record-1',
          request_hash: 'different-hash',
          response_status: 200,
          response_body: { success: true },
          state: 'completed',
        },
      ],
    });

    const handler = vi.fn();
    const response = await withWorkflowMutationIdempotency(
      requestWithKey(),
      scope,
      { interviewId: scope.resourceId, decision: 'reject' },
      handler
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.code).toBe('IDEMPOTENCY_REPLAY_MISMATCH');
    expect(handler).not.toHaveBeenCalled();
  });
});
