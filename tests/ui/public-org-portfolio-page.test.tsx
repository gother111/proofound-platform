import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('@/lib/portfolio/public-organization', () => ({
  getPublicOrganizationPortfolioBySlug: vi.fn(),
}));

import OrganizationPortfolioPublicPage from '@/app/portfolio/org/[slug]/page';
import { getPublicOrganizationPortfolioBySlug } from '@/lib/portfolio/public-organization';

describe('Organization public portfolio page', () => {
  it('renders public org portfolio content', async () => {
    (getPublicOrganizationPortfolioBySlug as any).mockResolvedValue({
      slug: 'acme',
      displayName: 'Acme',
      tagline: 'Build trust',
      mission: 'Ship impact',
      vision: null,
      causes: ['Climate'],
      website: 'https://acme.org/',
      typeLabel: 'company',
      foundedYear: 2019,
      logoUrl: null,
      hasVisibleContent: true,
    });

    const element = await OrganizationPortfolioPublicPage({
      params: Promise.resolve({ slug: 'acme' }),
    });

    render(element);

    expect(screen.getByRole('heading', { name: 'Acme' })).toBeInTheDocument();
    expect(screen.getByText(/public portfolio/i)).toBeInTheDocument();
    expect(screen.getByText('Ship impact')).toBeInTheDocument();
  });

  it('calls notFound when slug has no public portfolio', async () => {
    (getPublicOrganizationPortfolioBySlug as any).mockResolvedValue(null);

    await expect(
      OrganizationPortfolioPublicPage({ params: Promise.resolve({ slug: 'missing' }) })
    ).rejects.toThrow('NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
