import { afterEach, describe, expect, it } from 'vitest';

import {
  buildPublicEmbedURLFromPublicPageURL,
  generateEmbedCodeFromUrl,
  resolvePublicSiteBaseUrl,
} from '@/lib/profile/snippet-generator';

const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

describe('Public Page share helpers', () => {
  afterEach(() => {
    if (ORIGINAL_SITE_URL === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      return;
    }
    process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE_URL;
  });

  it('rewrites legacy hosts to the canonical public site host', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.com';

    expect(resolvePublicSiteBaseUrl()).toBe('https://proofound.io');
  });

  it('builds embeds from launch Public Page URLs instead of archived snippet routes', () => {
    const publicPageUrl = 'https://proofound.io/portfolio/jane';

    expect(buildPublicEmbedURLFromPublicPageURL(publicPageUrl)).toBe(
      'https://proofound.io/portfolio/jane/embed'
    );

    const embed = generateEmbedCodeFromUrl(publicPageUrl);
    expect(embed).toContain('https://proofound.io/portfolio/jane/embed?format=card');
    expect(embed).not.toContain('/p/');
  });
});
