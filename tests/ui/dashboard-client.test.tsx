import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardClient } from '../../src/app/app/i/home/DashboardClient';

const draggableDashboardMock = vi.fn();

vi.mock('@/components/dashboard/DraggableDashboard', () => ({
  DraggableDashboard: (props: any) => {
    draggableDashboardMock(props);
    return <div data-testid="draggable-dashboard">Mock Dashboard</div>;
  },
}));

describe('DashboardClient', () => {
  beforeEach(() => {
    draggableDashboardMock.mockClear();
  });

  it('shows loading text while dashboard is loading', () => {
    render(<DashboardClient />);

    expect(screen.getByText('Dashboard loading…')).toBeInTheDocument();
    expect(screen.getByTestId('draggable-dashboard')).toBeInTheDocument();
  });

  it('hides loading text when dashboard reports loading complete', () => {
    render(<DashboardClient />);

    const lastCall = draggableDashboardMock.mock.calls.at(-1);
    const props = lastCall?.[0];
    expect(props).toBeDefined();

    act(() => {
      props.onLoadingChange(false);
    });

    expect(screen.queryByText('Dashboard loading…')).not.toBeInTheDocument();
    expect(screen.getByTestId('draggable-dashboard')).toBeInTheDocument();
  });

  it('shows error fallback and stops loading text when dashboard reports error', () => {
    render(<DashboardClient />);

    const lastCall = draggableDashboardMock.mock.calls.at(-1);
    const props = lastCall?.[0];
    expect(props).toBeDefined();

    act(() => {
      props.onError('Failed to load dashboard layout');
    });

    expect(
      screen.getByText('The dashboard failed to load. Please refresh or try again.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Dashboard loading…')).not.toBeInTheDocument();
  });
});
