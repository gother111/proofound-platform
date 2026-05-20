// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  recordSuggestionEvent: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: (...args: unknown[]) => mocks.requireApiAuthContext(...args),
}));

vi.mock('@/lib/ai/usage-ledger', () => ({
  recordSuggestionEvent: (...args: unknown[]) => mocks.recordSuggestionEvent(...args),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { POST } from '@/app/api/ai/suggestions/events/route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/ai/suggestions/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function rawRequest(body: string) {
  return new NextRequest('http://localhost/api/ai/suggestions/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

describe('AI suggestion events route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: '11111111-1111-4111-8111-111111111111' },
    });
    mocks.recordSuggestionEvent.mockResolvedValue(undefined);
  });

  it('requires authentication', async () => {
    mocks.requireApiAuthContext.mockResolvedValueOnce(null);

    const response = await POST(
      request({
        suggestionId: '22222222-2222-4222-8222-222222222222',
        eventType: 'accepted',
        field: 'title',
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.recordSuggestionEvent).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON before recording suggestion events', async () => {
    const response = await POST(rawRequest('{"suggestionId":'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(mocks.recordSuggestionEvent).not.toHaveBeenCalled();
  });

  it('records accepted field-level metadata without raw suggestion content', async () => {
    const response = await POST(
      request({
        suggestionId: '22222222-2222-4222-8222-222222222222',
        eventType: 'accepted',
        field: 'title',
        fields: [{ field: 'title', edited: true, applied: true }],
        metadata: { uiSurface: 'assignment_clarity_assistant' },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(mocks.recordSuggestionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        cacheId: '22222222-2222-4222-8222-222222222222',
        eventType: 'accepted',
        userId: '11111111-1111-4111-8111-111111111111',
        safeMetadata: expect.objectContaining({
          field_count: 1,
          fields: [{ field: 'title', edited: true, applied: true }],
        }),
      })
    );
    expect(JSON.stringify(mocks.recordSuggestionEvent.mock.calls)).not.toContain('Better title');
  });

  it('rejects event payloads that try to store suggestion text as metadata', async () => {
    const response = await POST(
      request({
        suggestionId: '22222222-2222-4222-8222-222222222222',
        eventType: 'edited',
        field: 'Better title with private detail',
        metadata: { suggestionText: 'Better title with private detail' },
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.recordSuggestionEvent).not.toHaveBeenCalled();
  });

  it('fails closed when the suggestion does not belong to the user', async () => {
    mocks.recordSuggestionEvent.mockRejectedValueOnce(new Error('AI_SUGGESTION_CACHE_FORBIDDEN'));

    const response = await POST(
      request({
        suggestionId: '22222222-2222-4222-8222-222222222222',
        eventType: 'dismissed',
        field: 'title',
      })
    );

    expect(response.status).toBe(403);
  });
});
