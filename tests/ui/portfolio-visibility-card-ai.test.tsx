import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
              linkedin: true,
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

  it('shows Check privacy before publishing and reports deterministic safe-mode result', async () => {
    render(<PortfolioVisibilityCard />);

    const button = await screen.findByRole('button', {
      name: /run privacy preflight/i,
    });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/No high-risk deterministic flags were found/i)).toBeInTheDocument();
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
              linkedin: true,
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
      screen.queryByRole('button', { name: /run privacy preflight/i })
    ).not.toBeInTheDocument();
  });
});
