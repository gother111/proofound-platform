import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TasksCard } from '../../src/components/dashboard/TasksCard';

describe('TasksCard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches individual momentum summary and renders actions', async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        persona: 'individual',
        marketActivityLow: false,
        summary: 'Momentum is healthy.',
        topActions: [
          {
            id: 'complete-profile',
            title: 'Complete profile details',
            description: 'Add proof and constraints to improve matching readiness.',
            priority: 'high',
            category: 'profile',
            actionUrl: '/app/i/profile',
          },
        ],
        updates: [],
        metrics: {},
        generatedAt: new Date().toISOString(),
      }),
    });

    render(<TasksCard persona="individual" />);

    expect(await screen.findByRole('link', { name: /complete profile details/i })).toHaveAttribute(
      'href',
      '/app/i/profile'
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/api/momentum/summary?persona=individual'
    );
  });

  it('fetches organization momentum summary with org reference', async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        persona: 'organization',
        marketActivityLow: true,
        summary: 'Pipeline volume is low.',
        topActions: [
          {
            id: 'create-assignment',
            title: 'Create first assignment',
            description: 'Publish one assignment to start candidate flow.',
            priority: 'high',
            category: 'assignment',
            actionUrl: '/app/o/acme/assignments/new',
          },
        ],
        updates: [],
        metrics: {},
        generatedAt: new Date().toISOString(),
      }),
    });

    render(<TasksCard persona="organization" orgRef="acme" />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const requestUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestUrl).toContain('/api/momentum/summary?');
    expect(requestUrl).toContain('persona=organization');
    expect(requestUrl).toContain('org=acme');
    expect(await screen.findByRole('link', { name: /create first assignment/i })).toHaveAttribute(
      'href',
      '/app/o/acme/assignments/new'
    );
  });
});
