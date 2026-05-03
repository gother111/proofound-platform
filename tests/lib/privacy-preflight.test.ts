// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateJson: vi.fn(),
  hashAiContent: vi.fn(() => 'privacy-input-hash'),
}));

vi.mock('@/lib/ai/provider', () => ({
  generateJson: (...args: unknown[]) => mocks.generateJson(...args),
}));

vi.mock('@/lib/ai/usage-ledger', () => ({
  hashAiContent: (...args: unknown[]) => mocks.hashAiContent(...args),
}));

import { runPrivacyPreflightCheck } from '@/lib/ai/privacy-preflight';

describe('privacy preflight assistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generateJson.mockResolvedValue({
      data: {
        notes: ['Review whether the redacted terms are intended to be public.'],
      },
    });
  });

  it('sends only short deterministic-redacted text to optional Gemini review', async () => {
    const result = await runPrivacyPreflightCheck({
      userId: 'user-1',
      requestId: 'req-1',
      input: {
        surface: 'proof_publication',
        includeModelReview: true,
        fields: [
          {
            label: 'claim',
            value:
              'Jane can be reached at jane@example.com. Token sk_test_1234567890abcdefghijklmnop. See Jane_Resume.pdf for Acme Climate AB.',
            visibility: 'visible',
          },
        ],
        hiddenTerms: ['Acme Climate AB'],
      },
    });

    const prompt = mocks.generateJson.mock.calls[0]?.[0]?.prompt as string;
    const responseJsonSchema = mocks.generateJson.mock.calls[0]?.[0]?.responseJsonSchema as any;
    expect(prompt).toContain('ai-privacy-preflight-v1');
    expect(responseJsonSchema?.required).toEqual(['notes']);
    expect(responseJsonSchema?.properties?.notes?.maxItems).toBe(6);
    expect(prompt).not.toContain('jane@example.com');
    expect(prompt).not.toContain('sk_test_1234567890abcdefghijklmnop');
    expect(prompt).not.toContain('Jane_Resume.pdf');
    expect(prompt).not.toContain('Acme Climate AB');
    expect(prompt).toContain('[redacted email]');
    expect(prompt).toContain('[redacted access token]');
    expect(prompt).toContain('[redacted filename]');
    expect(prompt).toContain('[redacted hidden term]');
    expect(result.riskLevel).toBe('high');
    expect(result.modelReview.used).toBe(true);
  });

  it('allows low-risk publication flow without invoking Gemini by default', async () => {
    const result = await runPrivacyPreflightCheck({
      requestId: 'req-2',
      input: {
        surface: 'public_portfolio',
        fields: [{ label: 'summary', value: 'Built a launch checklist for a proof workflow.' }],
      },
    });

    expect(result.riskLevel).toBe('low');
    expect(result.flags).toEqual([]);
    expect(result.safeToPublishSuggestion).toContain('No high-risk deterministic flags');
    expect(result.safeToPublishSuggestion.toLowerCase()).not.toContain('certified');
    expect(result.notes.join(' ')).toContain('not a privacy guarantee');
    expect(mocks.generateJson).not.toHaveBeenCalled();
  });
});
