import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditLogTable } from '@/components/privacy/AuditLogTable';
import { apiFetch } from '@/lib/api/fetch';

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

describe('privacy audit log mobile clarity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user-facing audit events as mobile cards instead of a cramped table', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: [
          {
            id: 'event-1',
            timestamp: '2026-05-16T01:30:00.000Z',
            eventType: 'profile_created',
            eventDescription: 'Created profile',
            ipHash: 'protected...',
            metadata: {
              persona: 'individual',
              signup_method: 'email',
            },
          },
        ],
        hasMore: false,
      }),
    } as Response);

    render(<AuditLogTable />);

    await waitFor(() => {
      expect(screen.getAllByText('Created profile').length).toBeGreaterThan(0);
    });

    const mobileCard = screen.getByRole('article');
    expect(mobileCard).toHaveTextContent('Profile Created');
    expect(mobileCard).toHaveTextContent('Access detail: Protected');
    expect(mobileCard.parentElement).toHaveClass('md:hidden');
    expect(screen.getAllByText('Persona').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Individual').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /previous/i })).toHaveClass('h-11');
    expect(screen.getByRole('button', { name: /next/i })).toHaveClass('h-11');
    expect(screen.getByRole('button', { name: /next/i })).toHaveClass('min-h-[44px]');
  });

  it('keeps account history load failures separate from the empty history state', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('network unavailable')).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: [
          {
            id: 'event-1',
            timestamp: '2026-05-16T01:30:00.000Z',
            eventType: 'profile_created',
            eventDescription: 'Created profile',
            ipHash: 'protected...',
          },
        ],
        hasMore: false,
      }),
    } as Response);

    render(<AuditLogTable />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Account history could not load');
    expect(alert).toHaveTextContent('Your privacy records are still safe');
    expect(screen.queryByText('No activity recorded yet')).not.toBeInTheDocument();

    const retryButton = within(alert).getByRole('button', { name: 'Retry account history' });
    expect(retryButton).toHaveClass('min-h-[44px]');

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getAllByText('Created profile').length).toBeGreaterThan(0);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
    expect(apiFetchMock).toHaveBeenNthCalledWith(1, '/api/user/audit-log?offset=0&limit=20');
    expect(apiFetchMock).toHaveBeenNthCalledWith(2, '/api/user/audit-log?offset=0&limit=20');
  });
});
