// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCanonicalProofPackAggregate: vi.fn(),
  generateJson: vi.fn(),
  buildAiSuggestionCacheKey: vi.fn(() => 'verification-cache-key-1'),
  findAiSuggestionReplay: vi.fn(async () => null),
  hashAiContent: vi.fn(() => 'verification-input-hash-1'),
  recordAiSuggestionEvent: vi.fn(async () => undefined),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/proofs/canonical-pack', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/proofs/canonical-pack')>();
  return {
    ...actual,
    getCanonicalProofPackAggregate: (...args: unknown[]) =>
      mocks.getCanonicalProofPackAggregate(...args),
  };
});

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
  VERIFICATION_COMPOSER_PROMPT_VERSION,
  buildSanitizedVerificationComposerContext,
  composeVerificationRequestForUser,
} from '@/lib/ai/verification-composer';

function createAggregate(overrides: Record<string, unknown> = {}) {
  return {
    pack: {
      id: '11111111-1111-4111-8111-111111111111',
      ownerType: 'individual_profile',
      ownerId: 'user-1',
      primarySubjectId: '22222222-2222-4222-8222-222222222222',
      ...((overrides.pack as Record<string, unknown>) ?? {}),
    },
    ownerFull: {
      hiddenReviewIdentity: {
        employerNames: ['Acme'],
        schoolNames: ['Hidden School of Design'],
      },
      contract: {
        title: 'Hidden Acme launch jane@example.com',
        primaryClaim: {
          statement: 'I coordinated the Acme launch using https://private.example.com.',
        },
        ownershipStatement: 'My private phone was +46701234567.',
        outcomeSummary: 'Outcome details in Secret-Client-Report.pdf for Hidden School of Design.',
        timeframe: { start: null, end: null, label: '2026 Q1' },
      },
      items: [
        {
          effectiveVisibility: 'owner_only',
          artifact: {
            title: 'Hidden-Client-Plan.docx',
            artifactDisplayName: null,
          },
        },
        {
          effectiveVisibility: 'public',
          artifact: {
            title: 'Public evidence title',
            artifactDisplayName: null,
          },
        },
      ],
    },
    publicSafe: {
      contract: {
        title: 'Public launch proof',
        primaryClaim: {
          statement: 'I coordinated a launch proof.',
        },
        ownershipStatement: 'I owned release coordination.',
        outcomeSummary: 'The launch checklist was completed.',
        timeframe: { start: null, end: null, label: '2026 Q1' },
      },
      items: [
        {
          title: 'Public evidence title',
          artifactDisplayName: null,
        },
      ],
    },
    ...overrides,
  } as any;
}

describe('Verification Request Composer privacy controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findAiSuggestionReplay.mockResolvedValue(null);
    mocks.generateJson.mockResolvedValue({
      data: {
        subject: 'Can you confirm this launch claim?',
        message: 'Please confirm this one launch claim from direct observation.',
        claimScope: 'I coordinated a launch proof.',
        verificationQuestions: ['Can you confirm this specific launch claim?'],
        privacyNotes: ['Uses selected public-safe fields only.'],
        tooBroadWarnings: [],
      },
    });
  });

  it('omits hidden context and redacts unsafe tokens from the sanitized context', () => {
    const context = buildSanitizedVerificationComposerContext({
      aggregate: createAggregate({
        publicSafe: null,
      }),
      verifierRelationshipType: 'Peer',
      verificationScope: 'observed_behavior',
      selectedPublicSafeProofFields: [
        'title',
        'claim_statement',
        'ownership_statement',
        'outcome_summary',
        'evidence_titles',
      ],
    });
    const serialized = JSON.stringify(context);

    expect(serialized).not.toContain('Hidden-Client-Plan.docx');
    expect(serialized).not.toContain('jane@example.com');
    expect(serialized).not.toContain('https://private.example.com');
    expect(serialized).not.toContain('+46701234567');
    expect(serialized).not.toContain('Secret-Client-Report.pdf');
    expect(serialized).not.toContain('Hidden Acme');
    expect(serialized).not.toContain('Hidden School of Design');
    expect(serialized).toContain('Public evidence title');
    expect(serialized).toContain('[redacted email]');
    expect(serialized).toContain('[redacted url]');
    expect(serialized).toContain('[redacted phone]');
    expect(serialized).toContain('[redacted filename]');
    expect(serialized).toContain('[redacted hidden identity]');
  });

  it('validates ownership before provider access', async () => {
    mocks.getCanonicalProofPackAggregate.mockResolvedValue(
      createAggregate({ pack: { ownerId: 'other-user' } })
    );

    await expect(
      composeVerificationRequestForUser({
        proofPackId: '11111111-1111-4111-8111-111111111111',
        userId: 'user-1',
        requestId: 'request-1',
        verifierRelationshipType: 'Peer',
        verificationScope: 'observed_behavior',
        selectedPublicSafeProofFields: ['claim_statement'],
      })
    ).rejects.toThrow('PROOF_PACK_NOT_FOUND');

    expect(mocks.generateJson).not.toHaveBeenCalled();
  });

  it('uses the v1 prompt and sends no verifier email to the model prompt', async () => {
    mocks.getCanonicalProofPackAggregate.mockResolvedValue(createAggregate());

    const result = await composeVerificationRequestForUser({
      proofPackId: '11111111-1111-4111-8111-111111111111',
      userId: 'user-1',
      requestId: 'request-1',
      verifierRelationshipType: 'Manager',
      verificationScope: 'ownership',
      selectedPublicSafeProofFields: ['claim_statement', 'ownership_statement'],
    });

    const prompt = mocks.generateJson.mock.calls[0]?.[0]?.prompt as string;
    const responseJsonSchema = mocks.generateJson.mock.calls[0]?.[0]?.responseJsonSchema as any;
    expect(prompt).toContain(VERIFICATION_COMPOSER_PROMPT_VERSION);
    expect(responseJsonSchema?.required).toEqual([
      'subject',
      'message',
      'claimScope',
      'verificationQuestions',
      'privacyNotes',
      'tooBroadWarnings',
    ]);
    expect(responseJsonSchema?.properties?.verificationQuestions?.maxItems).toBe(5);
    expect(prompt).not.toContain('verifier@example.com');
    expect(prompt).not.toContain('Hidden-Client-Plan.docx');
    expect(prompt).not.toContain('jane@example.com');
    expect(result.verificationQuestions).toEqual(['Can you confirm this specific launch claim?']);
  });

  it('removes candidate score and rank language from generated draft questions', async () => {
    mocks.getCanonicalProofPackAggregate.mockResolvedValue(createAggregate());
    mocks.generateJson.mockResolvedValueOnce({
      data: {
        subject: 'Candidate score request',
        message: 'Please rank this candidate and recommend them for hiring.',
        claimScope: 'I coordinated a launch proof.',
        verificationQuestions: [
          'What candidate score would you give?',
          'Can you confirm this specific launch claim?',
        ],
        privacyNotes: [],
        tooBroadWarnings: [],
      },
    });

    const result = await composeVerificationRequestForUser({
      proofPackId: '11111111-1111-4111-8111-111111111111',
      userId: 'user-1',
      requestId: 'request-1',
      verifierRelationshipType: 'Manager',
      verificationScope: 'ownership',
      selectedPublicSafeProofFields: ['claim_statement', 'ownership_statement'],
    });
    const serialized = JSON.stringify(result).toLowerCase();

    expect(result.verificationQuestions).toEqual(['Can you confirm this specific launch claim?']);
    expect(serialized).not.toContain('candidate score');
    expect(serialized).not.toContain('rank this candidate');
  });
});
