import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PasswordChangeForm } from '@/components/settings/PasswordChangeForm';

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

describe('PasswordChangeForm', () => {
  it('uses named, touch-sized password visibility controls', () => {
    render(<PasswordChangeForm />);

    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    expect(screen.getByRole('button', { name: /show current password/i })).toHaveClass('h-11');
    expect(screen.getByRole('button', { name: /show new password/i })).toHaveClass('h-11');
    expect(screen.getByRole('button', { name: /show confirmed password/i })).toHaveClass('h-11');

    fireEvent.click(screen.getByRole('button', { name: /show current password/i }));

    expect(screen.getByRole('button', { name: /hide current password/i })).toBeInTheDocument();
  });
});
