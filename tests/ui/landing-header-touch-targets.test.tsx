import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProofoundLanding } from '@/components/ProofoundLanding';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('next/image', () => ({
  default: ({
    alt = '',
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) =>
    React.createElement('img', { alt, ...props }),
}));

vi.mock('@/components/landing/sections/ScrollytellingSection', () => ({
  ScrollytellingSection: () => <main data-testid="landing-story" />,
}));

vi.mock('@/components/landing/sections/FinalCTASection', () => ({
  FinalCTASection: () => <section data-testid="landing-final-cta" />,
}));

vi.mock('@/components/landing/sections/FooterSection', () => ({
  FooterSection: () => <footer data-testid="landing-footer" />,
}));

describe('landing header touch targets', () => {
  it('keeps header navigation and primary actions finger-friendly', () => {
    render(<ProofoundLanding />);

    expect(screen.getByRole('link', { name: 'Proofound home' })).toHaveClass('min-h-11');
    expect(screen.getByRole('link', { name: 'How it works' })).toHaveClass('min-h-11');
    expect(screen.getByRole('link', { name: 'Old way vs Proofound' })).toHaveClass('min-h-11');
    expect(screen.getByRole('link', { name: 'Privacy and trust' })).toHaveClass('min-h-11');
    expect(screen.getAllByRole('link', { name: 'Sign in' })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ className: expect.stringContaining('min-h-11') }),
      ])
    );
    expect(screen.getByTestId('landing-header-organization-cta')).toHaveClass('min-h-11');
  });
});
