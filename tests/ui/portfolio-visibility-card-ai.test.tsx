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
      name: /check privacy before publishing/i,
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
});
