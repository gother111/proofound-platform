// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { redactProofPackAssistantText } from '@/lib/ai/proof-pack-assistant';
import { evaluatePrivacyPreflightRules } from '@/lib/privacy/preflight-rules';

describe('AI redaction privacy guardrails', () => {
  it('redacts private identifiers before assistive AI prompt construction', () => {
    const result = redactProofPackAssistantText(
      'Email jane@example.com, call +46701234567, see https://private.example.com and Jane_Resume.pdf with sk_test_1234567890abcdefghijklmnop.'
    );

    expect(result.value).not.toContain('jane@example.com');
    expect(result.value).not.toContain('+46701234567');
    expect(result.value).not.toContain('https://private.example.com');
    expect(result.value).not.toContain('Jane_Resume.pdf');
    expect(result.value).not.toContain('sk_test_1234567890abcdefghijklmnop');
    expect(result.counts).toEqual(
      expect.objectContaining({
        emails: 1,
        phones: 1,
        urls: 1,
        filenames: 1,
        tokens: 1,
      })
    );
  });

  it('redacts hidden terms and filenames for privacy preflight checks', () => {
    const result = evaluatePrivacyPreflightRules({
      fields: [
        {
          label: 'proof summary',
          value:
            'Jane worked with Acme Climate AB. Evidence file was Jane_Resume.pdf and email jane@example.com.',
          visibility: 'visible',
        },
      ],
      hiddenTerms: ['Acme Climate AB'],
    });

    expect(result.riskLevel).toBe('high');
    expect(result.redactedText).not.toContain('Acme Climate AB');
    expect(result.redactedText).not.toContain('Jane_Resume.pdf');
    expect(result.redactedText).not.toContain('jane@example.com');
    expect(result.redactedText).toContain('[redacted hidden term]');
    expect(result.redactedText).toContain('[redacted filename]');
    expect(result.redactedText).toContain('[redacted email]');
  });
});
