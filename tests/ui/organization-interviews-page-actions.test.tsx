import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import OrganizationInterviewsPage from '@/app/app/o/[slug]/interviews/page';

const getInterviewsMock = vi.fn();

vi.mock('@/app/actions/interviews', () => ({
  getInterviews: (...args: any[]) => getInterviewsMock(...args),
}));

vi.mock('@/components/ui/v2/AppSurface', () => ({
  AppSurface: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/decisions/DecisionDialog', () => ({
  DecisionDialog: () => <div data-testid="decision-dialog" />,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  DialogDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('organization interviews page actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getInterviewsMock.mockReset();
  });

  it('shows edit/cancel actions and calls edit + cancel APIs with refresh', async () => {
    const upcomingInterviewAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];

    getInterviewsMock.mockImplementation(async () => ({
      interviews: [
        {
          id: 'interview-1',
          matchId: 'match-1',
          scheduledAt: upcomingInterviewAt,
          duration: 30,
          platform: 'zoom',
          meetingUrl: 'https://zoom.us/j/example',
          status: 'scheduled',
          candidateName: 'Candidate',
          assignmentTitle: 'Engineer',
          matchAgreedAt: new Date().toISOString(),
        },
      ],
    }));

    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    );
    vi.stubGlobal(
      'prompt',
      vi.fn(() => 'Need to move due to conflict')
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        fetchCalls.push({ url, init });

        if (url === '/api/interviews/edit') {
          return {
            ok: true,
            json: async () => ({
              success: true,
            }),
          };
        }

        if (url === '/api/interviews/cancel') {
          return {
            ok: true,
            json: async () => ({
              success: true,
            }),
          };
        }

        return { ok: false, json: async () => ({ error: 'Unexpected route' }) };
      })
    );

    render(<OrganizationInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit interview/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel interview/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit interview/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(fetchCalls.some((call) => call.url === '/api/interviews/edit')).toBe(true);
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel interview/i }));

    await waitFor(() => {
      expect(fetchCalls.some((call) => call.url === '/api/interviews/cancel')).toBe(true);
    });

    await waitFor(() => {
      expect(getInterviewsMock.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });
});
