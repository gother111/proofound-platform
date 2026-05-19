import { render, screen } from '@testing-library/react';
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

  it('does not fetch archived project endpoints by default', () => {
    render(<ProjectsCard />);

    expect(apiFetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /open proof packs/i })).toHaveAttribute(
      'href',
      '/app/i/portfolio'
    );
  });

  it('renders provided organization data and links to active assignment surface', () => {
    render(
      <ProjectsCard
        persona="organization"
        orgSlug="acme"
        initialData={{
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
        }}
      />
    );

    expect(screen.getByText('Green Hiring Initiative')).toBeInTheDocument();
    expect(apiFetchMock).not.toHaveBeenCalled();

    expect(screen.getByRole('link', { name: /view all/i })).toHaveAttribute(
      'href',
      '/app/o/acme/assignments'
    );
  });
});
