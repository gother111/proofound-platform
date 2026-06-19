import { describe, expect, it } from 'vitest';

import { getRouteMeta } from '@/lib/ui/v2/routeMeta';

describe('route metadata copy', () => {
  it('keeps active app shell routes aligned with proof-review wording', () => {
    expect(getRouteMeta('/app/i/matching')).toMatchObject({
      title: 'Assignment Review',
      description: 'Review proof-aligned assignment introductions',
    });
    expect(getRouteMeta('/app/i/profile')).toMatchObject({
      title: 'Profile',
      description: 'Public-safe proof context',
    });
    expect(getRouteMeta('/app/i/settings')).toMatchObject({
      title: 'Settings',
      description: 'Account, privacy, and workflow preferences',
    });
    expect(getRouteMeta('/app/i/portfolio')).toMatchObject({
      title: 'Portfolio',
      description: 'Proof-backed work context',
    });
    expect(getRouteMeta('/app/o/acme/assignments')).toMatchObject({
      title: 'Assignments',
      description: 'Manage proof-review assignments',
    });
  });

  it('keeps archived launch-note routes aligned with assignment-review wording', () => {
    expect(getRouteMeta('/app/i/opportunities')).toMatchObject({
      title: 'Launch note',
      description: 'Assignment discovery stays inside matching for the MVP corridor',
    });
    expect(getRouteMeta('/app/o/acme/shortlist')).toMatchObject({
      title: 'Shortlist',
      description: 'Saved proof submissions for review',
    });
    expect(getRouteMeta('/app/o/acme/candidates')).toMatchObject({
      title: 'Submissions',
      description: 'Assignment review tracking',
    });
  });

  it('does not reintroduce generic app-shell or opportunity route copy', () => {
    const descriptions = [
      getRouteMeta('/app/i/matching').description,
      getRouteMeta('/app/i/profile').description,
      getRouteMeta('/app/i/settings').description,
      getRouteMeta('/app/i/portfolio').description,
      getRouteMeta('/app/o/acme/assignments').description,
      getRouteMeta('/app/o/acme/shortlist').description,
    ].join('\n');

    expect(descriptions).not.toContain('Browse aligned introductions');
    expect(descriptions).not.toContain('Your core identity');
    expect(descriptions).not.toContain('Account and application preferences');
    expect(descriptions).not.toContain('Your work showcase');
    expect(descriptions).not.toContain('Manage tasks and roles');
    expect(descriptions).not.toContain('Saved submissions and matches');

    expect(getRouteMeta('/app/i/matching').title).not.toBe('Matching');
  });
});
