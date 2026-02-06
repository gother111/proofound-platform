import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LinkedInVerification } from '../../src/components/settings/LinkedInVerification';

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Keep this test focused on the network call wiring (CSRF header attachment happens inside apiFetch).
vi.mock('../../src/components/ui/card', () => ({
  Card: (props: any) => <div {...props} />,
}));

vi.mock('../../src/components/ui/button', () => ({
  Button: (props: any) => <button {...props} />,
}));

vi.mock('../../src/components/ui/alert', () => ({
  Alert: (props: any) => <div {...props} />,
  AlertDescription: (props: any) => <div {...props} />,
}));

vi.mock('../../src/components/ui/badge', () => ({
  Badge: (props: any) => <span {...props} />,
}));

describe('LinkedInVerification', () => {
  beforeEach(async () => {
    const { apiFetch } = await import('@/lib/api/fetch');
    (apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        automatedCheck: {
          confidence: 55,
          hasVerificationBadge: false,
          recommendation: 'review_manually',
          sources: ['playwright'],
        },
        message: 'ok',
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses apiFetch for the initiate verification POST', async () => {
    const { apiFetch } = await import('@/lib/api/fetch');

    render(<LinkedInVerification />);

    fireEvent.click(screen.getByRole('button', { name: /start verification check/i }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    expect(apiFetch).toHaveBeenCalledWith(
      '/api/verification/linkedin/initiate',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
