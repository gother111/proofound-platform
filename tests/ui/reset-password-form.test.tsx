import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ResetPasswordForm } from '@/app/(auth)/reset-password/ResetPasswordForm';

vi.mock('@/actions/auth', () => ({
  requestPasswordReset: vi.fn(async () => ({ error: null })),
}));

describe('ResetPasswordForm', () => {
  it('uses a page-level heading for the reset screen', () => {
    render(<ResetPasswordForm />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Reset your password' })
    ).toBeInTheDocument();
  });
});
