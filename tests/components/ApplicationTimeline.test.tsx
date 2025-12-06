import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ApplicationTimeline } from '@/components/applications/ApplicationTimeline';

const mockApiFetch = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => mockApiFetch(...args),
}));

describe('ApplicationTimeline component', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('renders stages from API response', async () => {
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        timeline: {
          id: 't1',
          assignmentId: 'a1',
          currentStageCode: 'applied',
          stageHistory: [{ stage: 'applied', entered_at: new Date().toISOString() }],
        },
        stages: [
          {
            id: 's1',
            code: 'applied',
            label: 'Application Received',
            description: 'Received',
            displayOrder: 1,
            defaultDaysToComplete: 2,
            icon: null,
            color: null,
          },
        ],
      }),
    });

    render(<ApplicationTimeline timelineId="t1" assignmentRole="Engineer" />);

    await waitFor(() => {
      expect(screen.getByText(/Application Received/)).toBeInTheDocument();
    });
  });
});
