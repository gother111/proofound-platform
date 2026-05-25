import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuditLogTable } from '@/components/settings/AuditLogTable';
import { apiFetch } from '@/lib/api/fetch';

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

describe('settings account history mobile clarity', () => {
  it('renders account history as readable mobile activity cards', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: [
          {
            id: 'event-1',
            timestamp: '2026-05-16T01:30:00.000Z',
            action: 'Created profile',
            ipHash: 'protected-reference',
            device: 'Unknown browser on a very narrow mobile viewport',
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      }),
    } as Response);

    render(<AuditLogTable userId="current" />);

    await waitFor(() => {
      expect(screen.getAllByText('Created profile').length).toBeGreaterThan(0);
    });

    const mobileCard = screen.getByRole('article');
    expect(mobileCard).toHaveTextContent('Created profile');
    expect(mobileCard).toHaveTextContent('When');
    expect(mobileCard).toHaveTextContent('Access detail');
    expect(mobileCard).toHaveTextContent('Protected');
    expect(mobileCard).toHaveTextContent('Unknown browser on a very narrow mobile viewport');
    expect(mobileCard.parentElement).toHaveClass('md:hidden');
  });
});
