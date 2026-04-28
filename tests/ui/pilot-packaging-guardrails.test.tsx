import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DayOneSurfacesSection } from '@/components/landing/sections/DayOneSurfacesSection';
import { FinalCTASection } from '@/components/landing/sections/FinalCTASection';
import { HiringTeamsSection } from '@/components/landing/sections/HiringTeamsSection';
import { SignupContent } from '@/app/(auth)/signup/SignupContent';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
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

vi.mock('framer-motion', () => ({
  useInView: () => true,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 {...props}>{children}</h2>
    ),
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p {...props}>{children}</p>
    ),
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button {...props}>{children}</button>
    ),
  },
}));

vi.mock('@/components/NetworkBackground', () => ({
  NetworkBackground: () => <div data-testid="network-background" />,
}));

vi.mock('@/components/auth/SignupForm', () => ({
  SignupForm: () => <div data-testid="signup-form" />,
}));

vi.mock('@/components/ui/magnetic-button', () => ({
  MagneticButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

describe('pilot packaging guardrails', () => {
  it('keeps landing CTA surfaces inside the narrow MVP promise', () => {
    render(
      <>
        <DayOneSurfacesSection />
        <HiringTeamsSection />
        <FinalCTASection />
      </>
    );

    expect(screen.getAllByText(/request a pilot/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/public proof portfolio/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/trust page \+ assignment corridor/i)).toBeInTheDocument();
    expect(screen.getByText(/not another talent feed/i)).toBeInTheDocument();
    expect(screen.getByText(/privacy-safe shortlist/i)).toBeInTheDocument();

    expect(screen.queryByText(/marketplace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ats/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/directory/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/social platform/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pricing/i)).not.toBeInTheDocument();
  });

  it('keeps the organization signup choice scoped to the pilot corridor', () => {
    render(<SignupContent />);

    expect(screen.getByTestId('signup-choice-organization')).toBeInTheDocument();
    expect(screen.getByText(/credible trust page on day 1/i)).toBeInTheDocument();
    expect(screen.getByText(/one assignment and a privacy-safe shortlist/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/candidate matching and hiring workflows after that/i)
    ).not.toBeInTheDocument();
  });
});
