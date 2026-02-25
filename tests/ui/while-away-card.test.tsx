import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WhileAwayCard } from '../../src/components/dashboard/WhileAwayCard';

describe('WhileAwayCard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses only /api/updates and does not call momentum summary when updates are empty', async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ updates: [] }),
    });

    const onVisibilityChange = vi.fn();

    render(<WhileAwayCard onVisibilityChange={onVisibilityChange} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/updates');
    const calledSummaryRoute = fetchMock.mock.calls.some((call) =>
      String(call[0]).includes('/api/momentum/summary')
    );
    expect(calledSummaryRoute).toBe(false);

    await waitFor(() => {
      expect(onVisibilityChange).toHaveBeenCalledWith(false);
    });
  });

  it('renders update events from /api/updates and reports visible', async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        updates: [
          {
            text: 'New candidate match generated',
            actionUrl: '/app/i/matching',
          },
        ],
      }),
    });

    const onVisibilityChange = vi.fn();

    render(<WhileAwayCard onVisibilityChange={onVisibilityChange} />);

    expect(
      await screen.findByRole('link', { name: 'New candidate match generated' })
    ).toHaveAttribute('href', '/app/i/matching');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(onVisibilityChange).toHaveBeenCalledWith(true);
    });
  });
});
