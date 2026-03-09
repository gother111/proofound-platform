import { describe, expect, it } from 'vitest';
import {
  buildPublicProfileMetadata,
  buildUnavailablePublicProfileMetadata,
} from '@/lib/seo/public-profile-metadata';

describe('public profile metadata helpers', () => {
  it('builds canonical metadata for public profile paths', () => {
    const metadata = buildPublicProfileMetadata({
      title: 'Jane Doe | Proofound Public Portfolio',
      description: 'Public profile summary',
      path: '/portfolio/jane',
    });

    expect(metadata.title).toBe('Jane Doe | Proofound Public Portfolio');
    expect(metadata.description).toBe('Public profile summary');
    expect(metadata.alternates?.canonical).toContain('/portfolio/jane');
    expect(metadata.openGraph?.type).toBe('website');
    expect(metadata.twitter?.card).toBe('summary_large_image');
  });

  it('normalizes repeated slashes in paths', () => {
    const metadata = buildPublicProfileMetadata({
      title: 'Example',
      description: 'Example',
      path: '//p//abc123',
    });

    expect(metadata.alternates?.canonical).toContain('/p/abc123');
  });

  it('normalizes missing leading slash in paths', () => {
    const metadata = buildPublicProfileMetadata({
      title: 'Example',
      description: 'Example',
      path: 'portfolio/jane',
    });

    expect(metadata.alternates?.canonical).toContain('/portfolio/jane');
  });

  it('omits canonical URL when canonicalPath is null', () => {
    const metadata = buildPublicProfileMetadata({
      title: 'Snippet',
      description: 'Snippet metadata',
      path: '/p/abc123',
      canonicalPath: null,
    });

    expect(metadata.alternates?.canonical).toBeUndefined();
  });

  it('returns safe unavailable metadata copy', () => {
    const metadata = buildUnavailablePublicProfileMetadata('/p/missing-token');
    expect(metadata.title).toBe('Public Profile Unavailable | Proofound');
    expect(String(metadata.description)).toContain('unavailable');
    expect(metadata.alternates?.canonical).toContain('/p/missing-token');
  });
});
