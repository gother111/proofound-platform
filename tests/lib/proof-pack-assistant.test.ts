// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCanonicalProofPackAggregate: vi.fn(),
  generateJson: vi.fn(),
  buildAiSuggestionCacheKey: vi.fn(() => 'cache-key-1'),
  findAiSuggestionReplay: vi.fn(async () => null),
  hashAiContent: vi.fn(() => 'input-hash-1'),
  recordAiSuggestionEvent: vi.fn(async () => undefined),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/proofs/canonical-pack', () => ({
  getCanonicalProofPackAggregate: (...args: unknown[]) =>
    mocks.getCanonicalProofPackAggregate(...args),
}));

vi.mock('@/lib/ai/provider', () => ({
  generateJson: (...args: unknown[]) => mocks.generateJson(...args),
}));

vi.mock('@/lib/ai/usage-ledger', () => ({
  buildAiSuggestionCacheKey: (...args: unknown[]) => mocks.buildAiSuggestionCacheKey(...args),
  findAiSuggestionReplay: (...args: unknown[]) => mocks.findAiSuggestionReplay(...args),
  hashAiContent: (...args: unknown[]) => mocks.hashAiContent(...args),
  recordAiSuggestionEvent: (...args: unknown[]) => mocks.recordAiSuggestionEvent(...args),
}));

import {
  buildSanitizedProofPackAssistantContext,
  suggestProofPackForUser,
} from '@/lib/ai/proof-pack-assistant';
import { AiProviderError } from '@/lib/ai/provider/types';

function createAggregate(overrides: Record<string, unknown> = {}) {
  return {
    pack: {
      id: '11111111-1111-4111-8111-111111111111',
      ownerType: 'individual_profile',
      ownerId: 'user-1',
      visibility: 'matched_org',
      ...((overrides.pack as Record<string, unknown>) ?? {}),
    },
    ownerFull: {
      hiddenReviewIdentity: {
        displayName: 'Jane Doe',
        email: 'jane.hidden@example.com',
        employerNames: ['Very Hidden Employer AB'],
        schoolNames: ['Hidden School of Design'],
      },
      contract: {
        title: 'Launch proof for jane@example.com at Very Hidden Employer AB',
        primaryClaim: {
          statement:
            'I shipped the launch pack. See https://example.com/private and sk_test_1234567890abcdefghijklmnop.',
        },
        ownershipStatement: 'Call me at +46701234567. I owned the release notes.',
        outcomeSummary:
          'Outcome was captured in Jane-Doe-Resume.pdf after Hidden School of Design.',
        timeframe: {
          start: null,
          end: null,
          label: '2026 Q1',
        },
        linkedSkills: [],
      },
      items: [
        {
          effectiveVisibility: 'matched_org',
          itemClass: 'file_upload',
          artifact: {
            artifactKind: 'document',
            title: 'Jane-Doe-Resume.pdf',
            artifactDisplayName: null,
          },
        },
        {
          effectiveVisibility: 'owner_only',
          itemClass: 'file_upload',
          artifact: {
            artifactKind: 'document',
            title: 'Hidden-Client-Plan.docx',
            artifactDisplayName: null,
          },
        },
      ],
    },
    ...overrides,
  } as any;
}

describe('Proof Pack Assistant privacy controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findAiSuggestionReplay.mockResolvedValue(null);
    mocks.generateJson.mockResolvedValue({
      data: {
        missingContext: [],
        suggestedRewrite: {
          title: 'Clearer launch proof',
          claimStatement: 'I shipped the launch pack.',
        },
        privacyFlags: [],
        verificationSuggestions: [],
        warnings: [],
      },
    });
  });

  it('excludes hidden evidence and redacts emails, phones, URLs, filenames, and tokens', () => {
    const context = buildSanitizedProofPackAssistantContext(createAggregate());
    const serialized = JSON.stringify(context);

    expect(serialized).not.toContain('jane@example.com');
    expect(serialized).not.toContain('+46701234567');
    expect(serialized).not.toContain('https://example.com/private');
    expect(serialized).not.toContain('Jane-Doe-Resume.pdf');
    expect(serialized).not.toContain('Hidden-Client-Plan.docx');
    expect(serialized).not.toContain('sk_test_1234567890abcdefghijklmnop');
    expect(serialized).not.toContain('Very Hidden Employer AB');
    expect(serialized).not.toContain('Hidden School of Design');
    expect(serialized).toContain('[redacted email]');
    expect(serialized).toContain('[redacted phone]');
    expect(serialized).toContain('[redacted url]');
    expect(serialized).toContain('[redacted filename]');
    expect(serialized).toContain('[redacted token]');
    expect(serialized).toContain('[redacted hidden identity]');
  });

  it("rejects another user's Proof Pack before provider access", async () => {
    mocks.getCanonicalProofPackAggregate.mockResolvedValue(
      createAggregate({ pack: { ownerId: 'user-2' } })
    );

    await expect(
      suggestProofPackForUser({
        proofPackId: '11111111-1111-4111-8111-111111111111',
        userId: 'user-1',
        requestId: 'req-1',
      })
    ).rejects.toThrow('PROOF_PACK_NOT_FOUND');

    expect(mocks.generateJson).not.toHaveBeenCalled();
  });

  it('sends only sanitized context to the provider prompt', async () => {
    mocks.getCanonicalProofPackAggregate.mockResolvedValue(createAggregate());

    await suggestProofPackForUser({
      proofPackId: '11111111-1111-4111-8111-111111111111',
      userId: 'user-1',
      requestId: 'req-1',
    });

    const prompt = mocks.generateJson.mock.calls[0]?.[0]?.prompt as string;
    const responseJsonSchema = mocks.generateJson.mock.calls[0]?.[0]?.responseJsonSchema as any;
    expect(prompt).toContain('ai-proof-pack-v1');
    expect(responseJsonSchema?.required).toEqual([
      'missingContext',
      'suggestedRewrite',
      'privacyFlags',
      'verificationSuggestions',
      'warnings',
    ]);
    expect(responseJsonSchema?.properties?.verificationSuggestions?.maxItems).toBe(12);
    expect(prompt).not.toContain('jane@example.com');
    expect(prompt).not.toContain('https://example.com/private');
    expect(prompt).not.toContain('Jane-Doe-Resume.pdf');
    expect(prompt).not.toContain('sk_test_1234567890abcdefghijklmnop');
    expect(prompt).not.toContain('Hidden-Client-Plan.docx');
    expect(prompt).not.toContain('Very Hidden Employer AB');
    expect(prompt).not.toContain('Hidden School of Design');
    expect(prompt).not.toContain('jane.hidden@example.com');
    expect(prompt).toContain('[redacted');
  });

  it('returns deterministic fallback when the provider fails', async () => {
    mocks.getCanonicalProofPackAggregate.mockResolvedValue(createAggregate());
    mocks.generateJson.mockRejectedValueOnce(
      new AiProviderError('provider failed', 'model_error', 500, true)
    );

    const result = await suggestProofPackForUser({
      proofPackId: '11111111-1111-4111-8111-111111111111',
      userId: 'user-1',
      requestId: 'req-1',
    });

    expect(result.fallback).toBe(true);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'AI provider was unavailable, so Proofound returned a deterministic checklist.',
      ])
    );
  });

  it('returns cached suggestions without provider generation', async () => {
    mocks.getCanonicalProofPackAggregate.mockResolvedValue(createAggregate());
    mocks.findAiSuggestionReplay.mockResolvedValueOnce({
      cacheId: 'cache-row-1',
      payload: {
        missingContext: [],
        suggestedRewrite: {
          title: 'Cached title',
        },
        privacyFlags: [],
        verificationSuggestions: [],
        warnings: [],
      },
      outputHash: 'output-hash',
      model: 'gemini-3.1-flash-lite',
      costOre: 0,
      tokenUsage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
    });

    const result = await suggestProofPackForUser({
      proofPackId: '11111111-1111-4111-8111-111111111111',
      userId: 'user-1',
      requestId: 'req-1',
    });

    expect(result.cacheHit).toBe(true);
    expect(result.suggestedRewrite.title).toBe('Cached title');
    expect(mocks.generateJson).not.toHaveBeenCalled();
    expect(mocks.recordAiSuggestionEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'cache_hit' })
    );
  });

  it('removes candidate score and rank language from generated responses', async () => {
    mocks.getCanonicalProofPackAggregate.mockResolvedValue(createAggregate());
    mocks.generateJson.mockResolvedValueOnce({
      data: {
        missingContext: [],
        suggestedRewrite: {
          title: 'Rank this candidate with a candidate score.',
          claimStatement: 'I shipped the launch pack.',
        },
        privacyFlags: [],
        verificationSuggestions: [],
        warnings: [],
      },
    });

    const result = await suggestProofPackForUser({
      proofPackId: '11111111-1111-4111-8111-111111111111',
      userId: 'user-1',
      requestId: 'req-1',
    });
    const serialized = JSON.stringify(result).toLowerCase();

    expect(result.suggestedRewrite.title).toBeNull();
    expect(serialized).not.toContain('candidate score');
    expect(serialized).not.toContain('rank this candidate');
  });
});
