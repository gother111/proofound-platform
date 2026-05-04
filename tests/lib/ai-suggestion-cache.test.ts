// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMock = vi.hoisted(() => {
  const state = {
    membership: null as unknown,
    selectRows: [] as unknown[][],
    insertValues: [] as unknown[],
  };

  const select = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(async () => state.selectRows.shift() ?? []),
      })),
    })),
  }));

  const insert = vi.fn(() => ({
    values: vi.fn((value: unknown) => {
      state.insertValues.push(value);
      return {
        onConflictDoUpdate: vi.fn(async () => undefined),
      };
    }),
  }));

  return {
    state,
    db: {
      query: {
        organizationMembers: {
          findFirst: vi.fn(async () => state.membership),
        },
      },
      select,
      insert,
    },
  };
});

vi.mock('@/db', () => ({
  db: dbMock.db,
}));

import {
  buildAiSuggestionCacheKey,
  getCachedSuggestion,
  hashAiContent,
  recordSuggestionEvent,
  saveSuggestion,
} from '@/lib/ai/usage-ledger';

const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';
const ORG_ID = '33333333-3333-4333-8333-333333333333';

function cacheRow(overrides: Record<string, unknown> = {}) {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    userId: USER_A,
    orgId: null,
    responsePayload: { answer: 'cached' },
    outputHash: 'output-hash',
    tokenUsage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
    model: 'gemini-3.1-flash-lite-preview',
    costOre: 7,
    feature: 'proof_pack_assistant',
    entityType: 'proof_pack',
    entityId: 'pack-1',
    inputHash: 'input-hash-1',
    ...overrides,
  };
}

describe('AI suggestion cache and audit trail helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.state.membership = null;
    dbMock.state.selectRows = [];
    dbMock.state.insertValues = [];
  });

  it('uses stable scoped cache keys for sanitized input, entity, prompt version, and user scope', () => {
    const inputHash = hashAiContent({ selectedFields: { title: 'sanitized' } });
    const first = buildAiSuggestionCacheKey({
      userId: USER_A,
      feature: 'proof_pack_assistant',
      entityType: 'proof_pack',
      entityId: 'pack-1',
      inputHash,
      promptVersion: 'prompt-v1',
    });
    const second = buildAiSuggestionCacheKey({
      userId: USER_A,
      feature: 'proof_pack_assistant',
      entityType: 'proof_pack',
      entityId: 'pack-1',
      inputHash,
      promptVersion: 'prompt-v1',
    });

    expect(second).toBe(first);
  });

  it('invalidates cache keys when sanitized input or prompt version changes', () => {
    const base = {
      userId: USER_A,
      feature: 'assignment_clarity',
      entityType: 'assignment',
      entityId: 'assignment-1',
    };

    const original = buildAiSuggestionCacheKey({
      ...base,
      inputHash: hashAiContent({ title: 'one' }),
      promptVersion: 'prompt-v1',
    });
    const changedInput = buildAiSuggestionCacheKey({
      ...base,
      inputHash: hashAiContent({ title: 'two' }),
      promptVersion: 'prompt-v1',
    });
    const changedPrompt = buildAiSuggestionCacheKey({
      ...base,
      inputHash: hashAiContent({ title: 'one' }),
      promptVersion: 'prompt-v2',
    });

    expect(changedInput).not.toBe(original);
    expect(changedPrompt).not.toBe(original);
  });

  it('returns cached suggestions for the same sanitized input in the same user scope', async () => {
    dbMock.state.selectRows = [[cacheRow()]];

    const replay = await getCachedSuggestion({
      cacheKey: 'cache-key-1',
      userId: USER_A,
    });

    expect(replay).toMatchObject({
      cacheId: '44444444-4444-4444-8444-444444444444',
      payload: { answer: 'cached' },
      tokenUsage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
    });
  });

  it('does not return another user cache row even if a bad caller supplies its key', async () => {
    dbMock.state.selectRows = [[cacheRow({ userId: USER_B })]];

    const replay = await getCachedSuggestion({
      cacheKey: 'cache-key-1',
      userId: USER_A,
    });

    expect(replay).toBeNull();
  });

  it('requires active org membership before reading or saving org-scoped cache', async () => {
    dbMock.state.selectRows = [[cacheRow({ orgId: ORG_ID })]];

    const replay = await getCachedSuggestion({
      cacheKey: 'cache-key-1',
      userId: USER_A,
      orgId: ORG_ID,
    });

    expect(replay).toBeNull();

    const saved = await saveSuggestion({
      cacheKey: 'cache-key-1',
      userId: USER_A,
      orgId: ORG_ID,
      feature: 'assignment_clarity',
      entityType: 'assignment',
      entityId: 'assignment-1',
      model: 'gemini-3.1-flash-lite-preview',
      promptVersion: 'prompt-v1',
      inputHash: 'input-hash-1',
      outputHash: 'output-hash',
      responsePayload: { answer: 'ok' },
      tokenUsage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
      costOre: 1,
    });

    expect(saved).toBeNull();
    expect(dbMock.db.insert).not.toHaveBeenCalled();
  });

  it('saves org cache for members with the default 30 day TTL', async () => {
    dbMock.state.membership = { id: 'membership-1' };
    dbMock.state.selectRows = [[{ id: 'cache-row-1' }]];

    const saved = await saveSuggestion({
      cacheKey: 'cache-key-1',
      userId: USER_A,
      orgId: ORG_ID,
      feature: 'assignment_clarity',
      entityType: 'assignment',
      entityId: 'assignment-1',
      model: 'gemini-3.1-flash-lite-preview',
      promptVersion: 'prompt-v1',
      inputHash: 'input-hash-1',
      outputHash: 'output-hash',
      responsePayload: { answer: 'ok' },
      tokenUsage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
      costOre: 1,
      redactionSummary: { raw_prompt_stored: false },
    });

    expect(saved).toBe('cache-row-1');
    expect(dbMock.state.insertValues[0]).toMatchObject({
      userId: USER_A,
      orgId: ORG_ID,
      inputHash: 'input-hash-1',
      responsePayload: { answer: 'ok' },
    });
    expect((dbMock.state.insertValues[0] as { expiresAt?: Date }).expiresAt).toBeInstanceOf(Date);
  });

  it('records accept, edit, and dismiss events with field-level metadata but no raw values', async () => {
    dbMock.state.selectRows = [[cacheRow()], [cacheRow()], [cacheRow()]];

    for (const eventType of ['accepted', 'edited', 'dismissed'] as const) {
      await recordSuggestionEvent({
        cacheId: '44444444-4444-4444-8444-444444444444',
        eventType,
        userId: USER_A,
        safeMetadata: {
          fields: [
            { field: 'title', edited: eventType === 'edited', applied: eventType === 'accepted' },
          ],
          rawInput: 'must redact',
          suggestionText: 'Better title with jane@example.com',
        },
      });
    }

    expect(dbMock.state.insertValues).toHaveLength(3);
    expect(dbMock.state.insertValues.map((value) => (value as any).eventType)).toEqual([
      'accepted',
      'edited',
      'dismissed',
    ]);
    expect(JSON.stringify(dbMock.state.insertValues)).toContain('"field":"title"');
    expect(JSON.stringify(dbMock.state.insertValues)).not.toContain('must redact');
    expect(JSON.stringify(dbMock.state.insertValues)).not.toContain('Better title');
    expect(JSON.stringify(dbMock.state.insertValues)).not.toContain('jane@example.com');
    expect(JSON.stringify(dbMock.state.insertValues)).toContain('[redacted]');
  });
});
