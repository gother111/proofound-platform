import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

vi.mock('@/hooks/use-responsive-modal-mode', () => ({
  useResponsiveModalMode: () => true,
}));

vi.mock('@/components/matching/MatchResultCard', () => ({
  MatchResultCard: ({ result }: { result: any }) => (
    <div data-testid="match-card">{result?.id}</div>
  ),
}));

vi.mock('@/components/interviews/ScheduleInterviewButton', () => ({
  ScheduleInterviewButton: () => <button type="button">Schedule Interview</button>,
}));

vi.mock('@/lib/ui/recovery-actions', () => ({
  getOrganizationRecoveryActions: () => [],
}));

describe('MatchingOrganizationView beta test initiation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const assignments = [
    {
      id: 'assignment-1',
      orgId: 'org-1',
      role: 'Designer',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  it('shows Initiate test button when API returns canInitiateTest=true', async () => {
    apiFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/match/assignment') {
        return {
          ok: true,
          json: async () => ({ items: [] }),
        };
      }

      if (url.startsWith('/api/organizations/org-1/test-matches')) {
        return {
          ok: true,
          json: async () => ({
            items: [],
            permissions: { canInitiateTest: true },
          }),
        };
      }

      throw new Error(`Unexpected url: ${url}`);
    });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /initiate test/i })).toBeInTheDocument();
    });
  });

  it('hides Initiate test button when API returns canInitiateTest=false', async () => {
    apiFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/match/assignment') {
        return {
          ok: true,
          json: async () => ({ items: [] }),
        };
      }

      if (url.startsWith('/api/organizations/org-1/test-matches')) {
        return {
          ok: true,
          json: async () => ({
            items: [],
            permissions: { canInitiateTest: false },
          }),
        };
      }

      throw new Error(`Unexpected url: ${url}`);
    });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /initiate test/i })).not.toBeInTheDocument();
    });
  });

  it('allows continuous typing in tester email input without focus loss', async () => {
    apiFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/match/assignment') {
        return {
          ok: true,
          json: async () => ({ items: [] }),
        };
      }

      if (url.startsWith('/api/organizations/org-1/test-matches')) {
        return {
          ok: true,
          json: async () => ({
            items: [],
            permissions: { canInitiateTest: true },
          }),
        };
      }

      throw new Error(`Unexpected url: ${url}`);
    });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    const initiateButton = await screen.findByRole('button', { name: /initiate test/i });
    fireEvent.click(initiateButton);

    const testerEmailInput = await screen.findByLabelText(/tester email/i);
    testerEmailInput.focus();
    expect(document.activeElement).toBe(testerEmailInput);

    fireEvent.change(testerEmailInput, { target: { value: 't' } });
    expect(testerEmailInput).toHaveValue('t');
    expect(document.activeElement).toBe(testerEmailInput);

    fireEvent.change(testerEmailInput, { target: { value: 'tester@example.com' } });
    expect(testerEmailInput).toHaveValue('tester@example.com');
    expect(document.activeElement).toBe(testerEmailInput);
  });
});
