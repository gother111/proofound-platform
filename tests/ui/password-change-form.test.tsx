import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PasswordChangeForm } from '@/components/settings/PasswordChangeForm';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: vi.fn(),
  dispatchClientErrorDiagnostic: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: toastErrorMock,
  },
}));

const apiFetchMock = vi.mocked(apiFetch);
const dispatchClientDiagnosticMock = vi.mocked(dispatchClientDiagnostic);
const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);

describe('PasswordChangeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses named, touch-sized password visibility controls', () => {
    render(<PasswordChangeForm />);

    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    expect(screen.getByRole('button', { name: /show current password/i })).toHaveClass('h-11');
    expect(screen.getByRole('button', { name: /show new password/i })).toHaveClass('h-11');
    expect(screen.getByRole('button', { name: /show confirmed password/i })).toHaveClass('h-11');

    fireEvent.click(screen.getByRole('button', { name: /show current password/i }));

    expect(screen.getByRole('button', { name: /hide current password/i })).toBeInTheDocument();
  });

  it('keeps password update failures safe, diagnostic, and retryable', async () => {
    const rawFailure = 'database password leaked-ish';
    apiFetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: rawFailure }), { status: 500 })
    );

    render(<PasswordChangeForm />);

    fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'CurrentPassword123!' },
    });
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Password was not updated. Your password has not changed; review the entries and try again.'
    );
    expect(screen.queryByText(rawFailure)).not.toBeInTheDocument();
    expect(JSON.stringify(toastErrorMock.mock.calls)).not.toContain(rawFailure);
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Password was not updated. Your password has not changed; review the entries and try again.'
    );
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'settings.password.update_failed',
      expect.any(Error)
    );
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'settings.password.update_returned_error',
      expect.objectContaining({
        hasReturnedError: true,
        errorKind: 'password_update_request_failed',
      })
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      'password_update_request_failed'
    );
    expect(
      [
        ...dispatchClientDiagnosticMock.mock.calls,
        ...dispatchClientErrorDiagnosticMock.mock.calls,
      ].some((call) => JSON.stringify(call).includes(rawFailure))
    ).toBe(false);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /update password/i })).toBeEnabled()
    );
    expect(screen.getByLabelText('Current Password')).toHaveValue('CurrentPassword123!');
    expect(screen.getByLabelText('New Password')).toHaveValue('NewPassword123!');
    expect(screen.getByLabelText('Confirm New Password')).toHaveValue('NewPassword123!');
  });
});
