import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SignupContent } from '@/app/(auth)/signup/SignupContent';
import { SignupForm } from '@/components/auth/SignupForm';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: vi.fn((_action, initialState) => [initialState, vi.fn(), false]),
  };
});

vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    useFormStatus: vi.fn(() => ({ pending: false })),
  };
});

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

vi.mock('@/actions/auth', () => ({
  signUp: vi.fn(async () => ({ error: null, success: false })),
}));

vi.mock('@/components/NetworkBackground', () => ({
  NetworkBackground: () => <div data-testid="network-background" />,
}));

vi.mock('@/components/auth/social-sign-in-buttons', () => ({
  default: () => <div data-testid="social-sign-in-buttons" />,
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverStub as typeof ResizeObserver;
window.scrollTo = vi.fn();
HTMLElement.prototype.scrollIntoView = vi.fn();

describe('signup mobile clarity', () => {
  it('keeps the account choice cards full-width and free of motion offsets', () => {
    render(<SignupContent />);

    const individual = screen.getByTestId('signup-choice-individual');
    const organization = screen.getByTestId('signup-choice-organization');
    const backButton = screen.getByRole('button', { name: 'Back' });
    const termsLink = screen.getByRole('link', { name: 'Terms of Service' });
    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });

    expect(individual).toHaveClass('w-full');
    expect(organization).toHaveClass('w-full');
    expect(individual.parentElement).toHaveClass('min-w-0');
    expect(organization.parentElement).toHaveClass('min-w-0');
    expect(backButton).toHaveClass('left-4');
    expect(backButton).not.toHaveClass('-mx-2');
    expect(termsLink).toHaveClass('min-h-11');
    expect(privacyLink).toHaveClass('min-h-11');
  });

  it('uses clear, named consent checkboxes and client validation', async () => {
    render(<SignupForm accountType="individual" onBack={vi.fn()} />);

    const requiredConsent = screen.getByRole('checkbox', {
      name: /I agree to the Privacy Policy and Terms of Service/i,
    });
    const marketing = screen.getByRole('checkbox', {
      name: /Send me updates about new features/i,
    });
    const backButton = screen.getByRole('button', { name: 'Back' });
    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });
    const termsLink = screen.getByRole('link', { name: 'Terms of Service' });

    expect(requiredConsent).toHaveClass('h-6');
    expect(marketing).toHaveClass('h-6');
    expect(backButton).toHaveClass('left-4');
    expect(backButton).not.toHaveClass('-mx-2');
    expect(privacyLink).toHaveClass('min-h-11');
    expect(termsLink).toHaveClass('min-h-11');

    fireEvent.click(screen.getByTestId('signup-submit'));

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter your email address.');
    await waitFor(() => {
      expect(screen.getByTestId('signup-error')).toHaveFocus();
    });
  });
});
