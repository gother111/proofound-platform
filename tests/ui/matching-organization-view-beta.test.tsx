import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MatchingOrganizationView } from '@/components/matching/MatchingOrganizationView';

const apiFetchMock = vi.fn();
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'acme' }),
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('@/components/matching/MatchResultCard', () => ({
  MatchResultCard: ({ result }: { result: any }) => (
    <div data-testid="match-card">{result?.id}</div>
  ),
}));

vi.mock('@/lib/ui/recovery-actions', () => ({
  getOrganizationRecoveryActions: () => [],
}));

describe('MatchingOrganizationView launch corridor', () => {
  const assignments = [
    {
      id: 'assignment-1',
      orgId: 'org-1',
      role: 'Designer',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render the archived beta test initiation CTA', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/no matches yet/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /initiate test/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/mission-first/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/skills-first/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/balanced/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /weights & filters/i })).not.toBeInTheDocument();
  });

  it('stays on the assignment match API and never calls archived test-match endpoints', async () => {
    apiFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/match/assignment') {
        return {
          ok: true,
          json: async () => ({ items: [] }),
        };
      }

      throw new Error(`Unexpected url: ${url}`);
    });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/match/assignment',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    expect(apiFetchMock.mock.calls.some(([url]) => String(url).includes('/test-matches'))).toBe(
      false
    );
  });
});
