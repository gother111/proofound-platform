import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SocialSignInButtons from '@/components/auth/social-sign-in-buttons';

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

vi.mock('@/actions/auth', () => ({
  signInWithOAuth: vi.fn(async () => ({ error: null })),
}));

describe('SocialSignInButtons', () => {
  it('keeps Google and LinkedIn social login available', async () => {
    const { container } = render(<SocialSignInButtons nextPath="/app/i/verifications" />);

    expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /LinkedIn/i })).toBeInTheDocument();
    expect(screen.getByTestId('oauth-google-submit')).toBeInTheDocument();
    expect(screen.getByTestId('oauth-linkedin-submit')).toBeInTheDocument();
    expect(container.querySelector('input[name="provider"][value="google"]')).not.toBeNull();
    expect(container.querySelector('input[name="provider"][value="linkedin_oidc"]')).not.toBeNull();
    expect(
      container.querySelector('input[name="next"][value="/app/i/verifications"]')
    ).not.toBeNull();
    await waitFor(() => {
      expect(
        container.querySelector('input[name="requestOrigin"][value="http://localhost:3000"]')
      ).not.toBeNull();
    });
  });
});
