import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PortfolioVisibilityCard } from '@/components/settings/PortfolioVisibilityCard';

const apiFetchMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

describe('PortfolioVisibilityCard AI privacy preflight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === '/api/feature-flags') {
        return {
          ok: true,
          json: async () => ({ flags: { assistiveAiUi: true } }),
        } as Response;
      }

      if (url === '/api/portfolio/visibility') {
        return {
          ok: true,
          json: async () => ({
            visibility: {
              header: true,
              proofBar: true,
              workEmail: false,
              linkedin: false,
              identity: true,
              skills: false,
              bio: false,
              contact: false,
            },
            publicPageEnabled: true,
            searchIndexingEnabled: false,
          }),
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    }) as any;

    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        riskLevel: 'low',
        flags: [],
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('names the visibility loading state while controls are loading', async () => {
    let resolveVisibility: (response: Response) => void = () => {};
    const visibilityPromise = new Promise<Response>((resolve) => {
      resolveVisibility = resolve;
    });

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === '/api/feature-flags') {
        return {
          ok: true,
          json: async () => ({ flags: { assistiveAiUi: true } }),
        } as Response;
      }

      if (url === '/api/portfolio/visibility') {
        return visibilityPromise;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    }) as any;

    render(<PortfolioVisibilityCard />);

    expect(await screen.findByRole('status')).toHaveTextContent(
      /Loading Public Page visibility controls/i
    );

    resolveVisibility({
      ok: true,
      json: async () => ({
        visibility: {
          header: true,
          proofBar: true,
          workEmail: false,
          linkedin: false,
          identity: true,
          skills: false,
          bio: false,
          contact: false,
        },
        publicPageEnabled: true,
        searchIndexingEnabled: false,
      }),
    } as Response);

    expect(
      await screen.findByRole('button', { name: /check privacy before publishing/i })
    ).toBeInTheDocument();
  });

  it('shows Check privacy before publishing and reports a clear safe-mode result', async () => {
    render(<PortfolioVisibilityCard />);

    const button = await screen.findByRole('button', {
      name: /check privacy before publishing/i,
    });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/No high-risk privacy concerns were found/i)).toBeInTheDocument();
    });
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/ai/privacy-preflight/check',
      expect.objectContaining({ method: 'POST' })
    );
    expect(JSON.parse(String(apiFetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      surface: 'public_portfolio',
      includeModelReview: false,
    });
  });

  it('hides the privacy preflight button and shows manual guidance when AI UI is disabled', async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/feature-flags') {
        return {
          ok: true,
          json: async () => ({ flags: { assistiveAiUi: false } }),
        } as Response;
      }
      if (url === '/api/portfolio/visibility') {
        return {
          ok: true,
          json: async () => ({
            visibility: {
              header: true,
              proofBar: true,
              workEmail: false,
              linkedin: false,
              identity: true,
              skills: false,
              bio: false,
              contact: false,
            },
            publicPageEnabled: true,
            searchIndexingEnabled: false,
          }),
        } as Response;
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    }) as any;

    render(<PortfolioVisibilityCard />);

    expect(await screen.findByText(/Manual guidance: review visible fields/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /check privacy before publishing/i })
    ).not.toBeInTheDocument();
  });

  it('names each visibility switch so mobile controls remain clear', async () => {
    render(<PortfolioVisibilityCard />);

    expect(await screen.findByRole('switch', { name: /public page enabled/i })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /proof bar block/i })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /contact section/i })).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: /LinkedIn/i })).not.toBeInTheDocument();
  });

  it('confirms visibility saves inline without a browser alert', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    render(<PortfolioVisibilityCard />);

    fireEvent.click(await screen.findByRole('button', { name: /save visibility/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Visibility saved. Your Public Page remains shareable by direct link.'
    );
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/portfolio/visibility',
      expect.objectContaining({ method: 'POST' })
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows recoverable visibility save failure inline without a browser alert', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'save failed' }),
    });
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    render(<PortfolioVisibilityCard />);

    fireEvent.click(await screen.findByRole('button', { name: /save visibility/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Visibility could not be saved. Your previous settings are unchanged.'
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('clears stale save confirmation when visibility is edited again', async () => {
    render(<PortfolioVisibilityCard />);

    fireEvent.click(await screen.findByRole('button', { name: /save visibility/i }));

    expect(await screen.findByText(/Visibility saved/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('switch', { name: /public page enabled/i }));

    expect(screen.queryByText(/Visibility saved/i)).not.toBeInTheDocument();
  });

  it('reports precise high-risk privacy concerns without claiming safety', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        riskLevel: 'high',
        safeToPublishSuggestion:
          'Review required before publishing. Remove or rewrite the flagged private details first.',
        flags: [
          {
            field: 'public bio',
            message: 'Email-like contact information appears in text intended for publication.',
          },
        ],
      }),
    });

    render(<PortfolioVisibilityCard />);

    fireEvent.click(
      await screen.findByRole('button', { name: /check privacy before publishing/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/1 privacy concern found/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/public bio: Email-like contact information/i)).toBeInTheDocument();
    expect(screen.queryByText(/\bsafe\b/i)).not.toBeInTheDocument();
  });

  it('falls back to a manual checklist when privacy preflight is disabled', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({
        error: 'AI assist is disabled',
        fallbackAvailable: true,
      }),
    });

    render(<PortfolioVisibilityCard />);

    fireEvent.click(
      await screen.findByRole('button', { name: /check privacy before publishing/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/Privacy check is temporarily unavailable/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Manual checklist:/i)).toBeInTheDocument();
  });
});
