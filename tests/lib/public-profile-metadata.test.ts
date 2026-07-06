import { describe, expect, it } from 'vitest';
import {
  buildPublicProfileMetadata,
  buildUnavailablePublicProfileMetadata,
} from '@/lib/seo/public-profile-metadata';

describe('Public Page metadata helpers', () => {
  it('builds canonical metadata for Public Page paths', () => {
    const metadata = buildPublicProfileMetadata({
      title: 'Proofound Public Page',
      description: 'Public Page summary',
      path: '/portfolio/jane',
    });

    expect(metadata.title).toBe('Proofound Public Page');
    expect(metadata.description).toBe('Public Page summary');
    expect(metadata.alternates?.canonical).toContain('/portfolio/jane');
    expect(metadata.openGraph?.type).toBe('website');
    expect(metadata.twitter?.card).toBe('summary_large_image');
  });

  it('normalizes repeated slashes in paths', () => {
    const metadata = buildPublicProfileMetadata({
      title: 'Example',
      description: 'Example',
      path: '//portfolio//jane',
    });

    expect(metadata.alternates?.canonical).toContain('/portfolio/jane');
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
      title: 'Public Page',
      description: 'Public Page metadata',
      path: '/portfolio/jane',
      canonicalPath: null,
    });

    expect(metadata.alternates?.canonical).toBeUndefined();
  });

  it('returns safe unavailable metadata copy', () => {
    const metadata = buildUnavailablePublicProfileMetadata('/portfolio/missing-handle');
    expect(metadata.title).toBe('Public Page Unavailable | Proofound');
    expect(String(metadata.description)).toContain('unavailable');
    expect(metadata.alternates?.canonical).toBeUndefined();
  });
});
