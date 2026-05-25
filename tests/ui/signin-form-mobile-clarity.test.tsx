import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SignIn } from '@/components/auth/SignIn';

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
  signIn: vi.fn(async () => ({ error: null })),
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

describe('signin mobile clarity', () => {
  it('keeps the login shell stable and the remember control touch-friendly', () => {
    const { container } = render(<SignIn />);

    const termsLink = screen.getByRole('link', { name: 'Terms of Service' });
    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });

    expect(container.querySelectorAll('main')).toHaveLength(1);
    expect(screen.getByTestId('login-form-shell')).toHaveClass('px-0');
    expect(screen.getByRole('checkbox', { name: /Remember me/i })).toHaveClass('h-6');
    expect(termsLink).toHaveClass('min-h-11');
    expect(privacyLink).toHaveClass('min-h-11');
  });

  it('focuses the visible error and marks only the field that needs action', async () => {
    render(<SignIn />);

    fireEvent.click(screen.getByTestId('login-submit'));

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter your email address.');
    expect(screen.getByTestId('login-email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId('login-password')).toHaveAttribute('aria-invalid', 'false');

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toHaveFocus();
    });
  });
});
