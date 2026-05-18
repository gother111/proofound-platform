import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuditLogTable } from '@/components/privacy/AuditLogTable';
import { apiFetch } from '@/lib/api/fetch';

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

describe('privacy audit log mobile clarity', () => {
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
    expect(screen.getAllByText('individual').length).toBeGreaterThan(0);
  });
});
