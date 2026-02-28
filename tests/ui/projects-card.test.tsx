import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectsCard } from '../../src/components/dashboard/ProjectsCard';

const apiFetchMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

describe('ProjectsCard', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uses individual projects endpoint by default', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        projects: [
          {
            id: 'proj-1',
            title: 'AI Operations Migration',
            projectType: 'work',
            status: 'ongoing',
            startDate: '2025-01-01',
            endDate: null,
            organizationName: 'Proofound',
          },
        ],
        stats: {
          total: 1,
          ongoing: 1,
          concluded: 0,
          paused: 0,
        },
      }),
    });

    render(<ProjectsCard />);

    expect(await screen.findByText('AI Operations Migration')).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledWith('/api/projects?limit=5');
    expect(screen.getByRole('link', { name: /view all/i })).toHaveAttribute(
      'href',
      '/app/i/projects'
    );
  });

  it('uses organization projects endpoint and links for organization persona', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        projects: [
          {
            id: 'org-proj-1',
            title: 'Green Hiring Initiative',
            description: 'Scale mission-aligned hiring plans.',
            status: 'active',
            start_date: '2025-03-01',
            end_date: null,
            created_at: '2025-03-01T00:00:00.000Z',
          },
        ],
      }),
    });

    render(<ProjectsCard persona="organization" orgId="org-123" orgSlug="acme" />);

    expect(await screen.findByText('Green Hiring Initiative')).toBeInTheDocument();

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith('/api/organizations/org-123/projects');
    });

    expect(screen.getByRole('link', { name: /view all/i })).toHaveAttribute(
      'href',
      '/app/o/acme/projects'
    );
  });
});
