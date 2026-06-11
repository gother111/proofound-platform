import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BundleCancelDialog } from '@/app/app/i/verifications/components/BundleCancelDialog';

const { apiFetchMock, diagnosticMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  diagnosticMock: vi.fn(),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: (...args: unknown[]) => diagnosticMock(...args),
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
    apiFetchMock.mockRejectedValueOnce(new Error('network unavailable')).mockResolvedValueOnce({
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
    expect(diagnosticMock).toHaveBeenCalledWith(
      'verifications.bundle_cancel.details_load_failed',
      expect.any(Error)
    );
  });
});
