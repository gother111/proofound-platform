// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { containsUnsafeAiRequestPayload } from '@/lib/ai/request-safety';

describe('AI request safety guard', () => {
  it('rejects signed URLs, private storage URLs, and secret-shaped request fields', () => {
    expect(
      containsUnsafeAiRequestPayload({
        fields: [
          {
            label: 'proof',
            value: 'https://storage.googleapis.com/private/file.pdf?X-Goog-Signature=abc&expires=1',
          },
        ],
      })
    ).toBe(true);

    expect(
      containsUnsafeAiRequestPayload({
        metadata: {
          signedUrl: 'https://example.com/file.pdf',
        },
      })
    ).toBe(true);

    expect(
      containsUnsafeAiRequestPayload({
        text: 'Raw file lives at gs://private-bucket/cv.pdf',
      })
    ).toBe(true);
  });

  it('allows ordinary text and non-tokenized public URLs', () => {
    expect(
      containsUnsafeAiRequestPayload({
        text: 'Public writeup: https://example.com/projects/launch-proof',
        idempotencyKey: 'click-1',
      })
    ).toBe(false);
  });
});
