// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { containsForbiddenAiOutput, containsUnsafeAiRequestPayload } from '@/lib/ai/request-safety';

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

    expect(
      containsUnsafeAiRequestPayload({
        originalFilename: 'Jane-Doe-Resume.pdf',
      })
    ).toBe(true);

    expect(
      containsUnsafeAiRequestPayload({
        cookie: 'session=abcdef1234567890',
      })
    ).toBe(true);

    expect(
      containsUnsafeAiRequestPayload({
        fields: [{ value: 'private object path user-uploads-private/user/file.pdf' }],
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

  it('detects forbidden AI decision outputs', () => {
    expect(containsForbiddenAiOutput({ text: 'This is the best candidate.' })).toBe(true);
    expect(containsForbiddenAiOutput({ text: 'Recommended to interview.' })).toBe(true);
    expect(containsForbiddenAiOutput({ text: 'Use this as a verification approval.' })).toBe(true);
    expect(containsForbiddenAiOutput({ text: 'Ask for concrete ownership evidence.' })).toBe(false);
  });
});
