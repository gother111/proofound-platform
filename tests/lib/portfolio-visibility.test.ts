import { describe, expect, it } from 'vitest';

import { mergeVisibilityFlags } from '@/lib/portfolio/visibility';

describe('portfolio visibility flags', () => {
  it('does not treat legacy string visibility values as public boolean flags', () => {
    const visibility = mergeVisibilityFlags({
      skills: 'private',
      bio: 'private',
      contact: 'private',
      workEmail: 'private',
      header: 'private',
      proofBar: 'match_only',
      linkedin: 'network_only',
      identity: 'public',
    });

    expect(visibility).toMatchObject({
      skills: false,
      bio: false,
      contact: false,
      workEmail: false,
      header: false,
      proofBar: false,
      linkedin: false,
      identity: false,
    });
  });

  it('still preserves explicit boolean portfolio choices and defaults absent fields', () => {
    const visibility = mergeVisibilityFlags({
      bio: true,
      contact: true,
      workEmail: false,
    });

    expect(visibility.bio).toBe(true);
    expect(visibility.contact).toBe(true);
    expect(visibility.workEmail).toBe(false);
    expect(visibility.linkedin).toBe(false);
    expect(visibility.header).toBe(true);
    expect(visibility.skills).toBe(false);
  });

  it('keeps legacy LinkedIn visibility forced off for public launch surfaces', () => {
    const visibility = mergeVisibilityFlags({
      linkedin: true,
    });

    expect(visibility.linkedin).toBe(false);
  });
});
