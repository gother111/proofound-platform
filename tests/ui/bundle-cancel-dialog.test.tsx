import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BundleCancelDialog } from '@/app/app/i/verifications/components/BundleCancelDialog';

const { apiFetchMock, clientDiagnosticMock, errorDiagnosticMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  clientDiagnosticMock: vi.fn(),
  errorDiagnosticMock: vi.fn(),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: (...args: unknown[]) => clientDiagnosticMock(...args),
  dispatchClientErrorDiagnostic: (...args: unknown[]) => errorDiagnosticMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('BundleCancelDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a recoverable bundle-details load error and retries in place', async () => {
    const rawFailure = 'bundle lookup leaked storage policy';
    apiFetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: rawFailure }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          request: {
            id: 'bundle-1',
            verifier_email: 'mentor@example.com',
            verifier_relationship: 'mentor_coach',
            status: 'pending',
            items: [
              {
                id: 'bundle-item-1',
                artifact_type: 'skill',
                artifact_id: 'skill-1',
                display_label: 'TypeScript proof pack',
                status: 'pending',
              },
            ],
          },
        }),
      });

    render(
      <BundleCancelDialog open requestId="bundle-1" onOpenChange={vi.fn()} onCanceled={vi.fn()} />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Bundle details could not load');
    expect(
      screen.getByText(
        'No verification request was canceled. Retry bundle details before choosing artifacts.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel selected/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Retry bundle details' }));

    expect(await screen.findByText('TypeScript proof pack')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
    expect(clientDiagnosticMock).toHaveBeenCalledWith(
      'verifications.bundle_cancel.details_load_returned_error',
      {
        status: 500,
        hasReturnedError: true,
      }
    );
    expect(errorDiagnosticMock).toHaveBeenCalledWith(
      'verifications.bundle_cancel.details_load_failed',
      expect.any(Error)
    );
    expect((errorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      'bundle_cancel_details_load_request_failed'
    );
    expect(JSON.stringify(clientDiagnosticMock.mock.calls)).not.toContain(rawFailure);
    expect(JSON.stringify(errorDiagnosticMock.mock.calls)).not.toContain(rawFailure);
  });

  it('keeps failed selected-artifact cancellations safe, visible, and retryable', async () => {
    const onCanceled = vi.fn();
    const onOpenChange = vi.fn();
    apiFetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          request: {
            id: 'bundle-1',
            verifier_email: 'mentor@example.com',
            verifier_relationship: 'mentor_coach',
            status: 'pending',
            items: [
              {
                id: 'bundle-item-1',
                artifact_type: 'skill',
                artifact_id: 'skill-1',
                display_label: 'TypeScript proof pack',
                status: 'pending',
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Bundle cancellation is temporarily unavailable.' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ removedSkillRequestIds: ['skill-request-1'] }),
      });

    render(
      <BundleCancelDialog
        open
        requestId="bundle-1"
        onOpenChange={onOpenChange}
        onCanceled={onCanceled}
      />
    );

    await screen.findByText('TypeScript proof pack');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Cancel selected \(1\)/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Selected artifacts could not be canceled');
    expect(alert).toHaveTextContent(
      'Your bundle request is unchanged; review the selected items and try again.'
    );
    expect(alert).not.toHaveTextContent('Bundle cancellation is temporarily unavailable.');
    expect(screen.getByText('TypeScript proof pack')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(clientDiagnosticMock).toHaveBeenCalledWith(
      'verifications.bundle_cancel.selected_cancel_returned_error',
      {
        status: 409,
        hasReturnedError: true,
      }
    );
    expect(errorDiagnosticMock).toHaveBeenCalledWith(
      'verifications.bundle_cancel.selected_cancel_failed',
      expect.any(Error)
    );
    expect((errorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      'bundle_cancel_selected_cancel_request_failed'
    );
    expect(JSON.stringify(clientDiagnosticMock.mock.calls)).not.toContain(
      'Bundle cancellation is temporarily unavailable.'
    );
    expect(JSON.stringify(errorDiagnosticMock.mock.calls)).not.toContain(
      'Bundle cancellation is temporarily unavailable.'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry cancel' }));

    await waitFor(() => {
      expect(onCanceled).toHaveBeenCalledWith(['skill-request-1']);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(apiFetchMock).toHaveBeenCalledTimes(3);
  });
});
