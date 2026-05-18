import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VisibilitySettingsModal } from '@/components/privacy/VisibilitySettingsModal';

let resolveUser: (response: Response) => void = () => {};
const apiFetchMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
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

    const userPromise = new Promise<Response>((resolve) => {
      resolveUser = resolve;
    });

    apiFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/user/me') {
        return userPromise;
      }

      throw new Error(`Unexpected apiFetch call: ${url}`);
    });
  });

  it('names the loading state before field visibility controls load', async () => {
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
});
