import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DashboardWidget } from '../../src/lib/dashboard/layout';
import { DraggableDashboard } from '../../src/components/dashboard/DraggableDashboard';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/dashboard/WhileAwayCard', () => ({
  WhileAwayCard: ({ onVisibilityChange }: { onVisibilityChange?: (visible: boolean) => void }) => {
    React.useEffect(() => {
      onVisibilityChange?.(false);
    }, [onVisibilityChange]);

    return <div data-testid="while-away-card">while-away</div>;
  },
}));

vi.mock('@/components/dashboard/GoalsCard', () => ({
  GoalsCard: () => <div data-testid="goals-card">goals</div>,
}));

vi.mock('@/components/dashboard/TasksCard', () => ({
  TasksCard: () => <div>tasks</div>,
}));
vi.mock('@/components/dashboard/ProjectsCard', () => ({
  ProjectsCard: () => <div>projects</div>,
}));
vi.mock('@/components/dashboard/MatchingResultsCard', () => ({
  MatchingResultsCard: () => <div>matching-results</div>,
}));
vi.mock('@/components/dashboard/ImpactSnapshotCard', () => ({
  ImpactSnapshotCard: () => <div>impact-snapshot</div>,
}));
vi.mock('@/components/dashboard/ExploreCard', () => ({
  ExploreCard: () => <div>explore</div>,
}));
vi.mock('@/components/dashboard/GapMapWidget', () => ({
  GapMapWidget: () => <div>gap-map</div>,
}));
vi.mock('@/components/dashboard/NextBestActionsWidget', () => ({
  NextBestActionsWidget: () => <div>next-best-actions</div>,
}));
vi.mock('@/components/dashboard/ProfileActivationCard', () => ({
  ProfileActivationCard: () => <div>profile-activation</div>,
}));
vi.mock('@/components/dashboard/MatchingReadinessCard', () => ({
  MatchingReadinessCard: () => <div>matching-readiness</div>,
}));
vi.mock('@/components/dashboard/InterviewsFeedbackCard', () => ({
  InterviewsFeedbackCard: () => <div>interviews-feedback</div>,
}));
vi.mock('@/components/dashboard/MomentumMetricsCard', () => ({
  MomentumMetricsCard: () => <div>momentum-metrics</div>,
}));
vi.mock('@/components/dashboard/ZenSnapshotCard', () => ({
  ZenSnapshotCard: () => <div>zen-snapshot</div>,
}));
vi.mock('@/components/dashboard/NotificationsCard', () => ({
  NotificationsCard: () => <div>notifications</div>,
}));

describe('DraggableDashboard while-away visibility', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('removes while-away tile when child reports no updates', async () => {
    const layout: DashboardWidget[] = [
      {
        widgetId: 'while-away',
        position: 0,
        visible: true,
        size: 'default',
        settings: {},
      },
      {
        widgetId: 'goals',
        position: 1,
        visible: true,
        size: 'default',
        settings: {},
      },
    ];

    render(<DraggableDashboard initialLayout={layout} />);

    await waitFor(() => {
      expect(screen.getByTestId('goals-card')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('while-away-card')).not.toBeInTheDocument();
    });
  });
});
