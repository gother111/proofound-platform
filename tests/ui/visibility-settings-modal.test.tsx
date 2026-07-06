import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VisibilitySettingsModal } from '@/components/privacy/VisibilitySettingsModal';

let resolveUser: (response: Response) => void = () => {};
const apiFetchMock = vi.fn();
const dispatchClientErrorDiagnosticMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: (...args: unknown[]) => dispatchClientErrorDiagnosticMock(...args),
}));

vi.mock('@/hooks/use-responsive-modal-mode', () => ({
  useResponsiveModalMode: () => true,
}));

vi.mock('@/components/privacy/FieldVisibilityControls', () => ({
  FieldVisibilityControls: ({ userId }: { userId: string }) => (
    <div data-testid="field-visibility-controls">Controls for {userId}</div>
  ),
}));

describe('VisibilitySettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockPendingUserLoad() {
    const userPromise = new Promise<Response>((resolve) => {
      resolveUser = resolve;
    });

    apiFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/user/me') {
        return userPromise;
      }

      throw new Error(`Unexpected apiFetch call: ${url}`);
    });
  }

  it('names the loading state before field visibility controls load', async () => {
    mockPendingUserLoad();

    render(<VisibilitySettingsModal open onOpenChange={vi.fn()} />);

    expect(await screen.findByRole('status')).toHaveTextContent(
      /Loading privacy visibility controls/i
    );

    resolveUser({
      ok: true,
      json: async () => ({ id: 'user-1' }),
    } as Response);

    expect(await screen.findByTestId('field-visibility-controls')).toHaveTextContent(
      'Controls for user-1'
    );
  });

  it('lets users retry when the modal cannot identify the current user', async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'user-2' }),
      } as Response);

    render(<VisibilitySettingsModal open onOpenChange={vi.fn()} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Privacy controls could not open');
    expect(alert).toHaveTextContent('Retry before changing field visibility.');
    expect(screen.queryByTestId('field-visibility-controls')).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'privacy.visibility_modal.user_load_failed',
      expect.any(Error)
    );

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry privacy controls' }));

    expect(await screen.findByTestId('field-visibility-controls')).toHaveTextContent(
      'Controls for user-2'
    );
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
  });
});
