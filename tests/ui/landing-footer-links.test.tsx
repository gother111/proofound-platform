import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FooterSection } from '@/components/landing/sections/FooterSection';

describe('landing footer links', () => {
  it('keeps only launch-safe legal and sign-in links', () => {
    render(<FooterSection />);

    expect(screen.getByRole('link', { name: /cookies/i })).toHaveAttribute('href', '/cookies');
    expect(screen.getByRole('link', { name: /cookie settings/i })).toHaveAttribute(
      'href',
      '/cookies/settings'
    );
    expect(screen.getByRole('link', { name: /privacy/i })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: /terms/i })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');

    expect(screen.queryByRole('link', { name: /about/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /contact/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /support/i })).not.toBeInTheDocument();
  });
});
