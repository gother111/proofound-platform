import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailManager } from '@/components/settings/EmailManager';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: toastErrorMock,
  },
}));

const apiFetchMock = vi.mocked(apiFetch);
const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);

describe('EmailManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps email update failures safe, diagnostic, and retryable', async () => {
    const rawFailure = 'provider stack leaked-ish';
    apiFetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: rawFailure }), { status: 500 })
    );
    const onEmailUpdated = vi.fn();

    render(<EmailManager currentEmail="old@example.com" onEmailUpdated={onEmailUpdated} />);

    fireEvent.click(screen.getByRole('button', { name: /change email/i }));
    fireEvent.change(screen.getByPlaceholderText('Enter new email'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Email was not updated. Your current email is still active; review the new address and try again.'
    );
    expect(screen.queryByText(rawFailure)).not.toBeInTheDocument();
    expect(JSON.stringify(toastErrorMock.mock.calls)).not.toContain(rawFailure);
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Email was not updated. Your current email is still active; review the new address and try again.'
    );
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'settings.email.update_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      rawFailure
    );
    await waitFor(() => expect(screen.getByRole('button', { name: /save/i })).toBeEnabled());
    expect(screen.getByPlaceholderText('Enter new email')).toHaveValue('new@example.com');
    expect(onEmailUpdated).not.toHaveBeenCalled();
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/user/email',
      expect.objectContaining({ method: 'PUT' })
    );
  });
});
