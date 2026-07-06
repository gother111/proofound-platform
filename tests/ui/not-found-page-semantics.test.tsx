import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import NotFound from '@/app/not-found';
import OrgNotFound from '@/app/app/o/[slug]/not-found';

describe('NotFound', () => {
  it('uses a page-level heading for the not-found title', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });

  it('keeps organization workspace fallbacks privacy-safe and actionable', () => {
    render(<OrgNotFound />);

    expect(
      screen.getByRole('region', { name: 'Organization workspace unavailable' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Organization workspace unavailable',
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/not available to your current account/i)).toBeInTheDocument();
    expect(
      screen.getByText(/No proof, assignment, or organization data is exposed/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/doesn.t exist or you don.t have access/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return to individual home' })).toHaveAttribute(
      'href',
      '/app/i/home'
    );
  });
});
