import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { db } from '@/db';
import {
  defaultOrganizationDayOneVisibility,
  getPublicOrganizationPortfolioBySlug,
} from '@/lib/portfolio/public-organization';

describe('getPublicOrganizationPortfolioBySlug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies day-1 defaults when visibility row is missing', async () => {
    (db.execute as any)
      .mockResolvedValueOnce([
        {
          id: 'org-1',
          slug: 'acme',
          display_name: 'Acme',
          tagline: 'Build trust',
          mission: 'Ship impact',
          vision: 'Global trust',
          website: 'acme.org',
          causes: ['Climate'],
          type: 'company',
          founded_date: '2019-01-01',
          logo_url: 'https://cdn.example.com/logo.png',
        },
      ])
      .mockResolvedValueOnce([]);

    const portfolio = await getPublicOrganizationPortfolioBySlug('acme');

    expect(portfolio).toBeTruthy();
    expect(portfolio?.displayName).toBe('Acme');
    expect(portfolio?.mission).toBe('Ship impact');
    expect(portfolio?.causes).toEqual(['Climate']);
    expect(portfolio?.website).toBe('https://acme.org/');
    expect(portfolio?.hasVisibleContent).toBe(true);
  });

  it('hides non-public fields from the public portfolio', async () => {
    (db.execute as any)
      .mockResolvedValueOnce([
        {
          id: 'org-1',
          slug: 'acme',
          display_name: 'Acme',
          tagline: 'Build trust',
          mission: 'Ship impact',
          vision: 'Global trust',
          website: 'acme.org',
          causes: ['Climate'],
          type: 'company',
          founded_date: '2019-01-01',
          logo_url: 'https://cdn.example.com/logo.png',
        },
      ])
      .mockResolvedValueOnce([
        {
          display_name: 'internal_only',
          mission: 'internal_only',
          vision: 'internal_only',
          causes: 'internal_only',
        },
      ]);

    const portfolio = await getPublicOrganizationPortfolioBySlug('acme');

    expect(portfolio).toBeTruthy();
    expect(portfolio?.displayName).toBe('Organization');
    expect(portfolio?.mission).toBeNull();
    expect(portfolio?.vision).toBeNull();
    expect(portfolio?.causes).toEqual([]);
    expect(portfolio?.website).toBeNull();
  });

  it('defines safe default visibility levels for day-1 publish', () => {
    expect(defaultOrganizationDayOneVisibility()).toEqual({
      display_name: 'public',
      mission: 'public',
      vision: 'public',
      causes: 'public',
      work_culture: 'internal_only',
      structure: 'internal_only',
      projects: 'internal_only',
      partnerships: 'internal_only',
      goals: 'internal_only',
      impact: 'internal_only',
    });
  });
});
