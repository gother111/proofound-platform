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
    warning: vi.fn(),
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
    // The component probes connection status on mount. In JSDOM, fetch requires an absolute URL,
    // so we mock it explicitly to avoid URL parsing errors.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ connected: true }),
      }))
    );

    const { apiFetch } = await import('@/lib/api/fetch');
    (apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        linkedinVerificationStatus: 'pending',
        identityGranted: false,
        hasIdentityVerification: false,
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

    const button = await screen.findByRole('button', { name: /start verification check/i });
    fireEvent.click(button);

    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    expect(apiFetch).toHaveBeenCalledWith(
      '/api/verification/linkedin/initiate',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('shows auto-approved messaging when LinkedIn identity signal is detected', async () => {
    const { apiFetch } = await import('@/lib/api/fetch');
    (apiFetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        linkedinVerificationStatus: 'verified',
        identityGranted: true,
        hasIdentityVerification: true,
        automatedCheck: {
          confidence: 100,
          hasVerificationBadge: true,
          recommendation: 'approve',
          sources: ['linkedin-api'],
        },
        message: 'LinkedIn identity verification signal detected.',
      }),
    });

    render(<LinkedInVerification />);

    const button = await screen.findByRole('button', { name: /start verification check/i });
    fireEvent.click(button);

    await waitFor(() =>
      expect(screen.getByText(/LinkedIn Verification Approved!/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/No further action is required/i)).toBeInTheDocument();
  });

  it('shows pending-review messaging when identity signal is not detected', async () => {
    render(<LinkedInVerification />);

    const button = await screen.findByRole('button', { name: /start verification check/i });
    fireEvent.click(button);

    await waitFor(() =>
      expect(screen.getAllByText(/pending admin review/i).length).toBeGreaterThan(0)
    );
  });
});
