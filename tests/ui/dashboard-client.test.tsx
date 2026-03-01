import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardClient } from '../../src/app/app/i/home/DashboardClient';

const draggableDashboardMock = vi.fn();
const startTourMock = vi.fn();

vi.mock('@/components/dashboard/DraggableDashboard', () => ({
  DraggableDashboard: (props: any) => {
    draggableDashboardMock(props);
    return <div data-testid="draggable-dashboard">Mock Dashboard</div>;
  },
}));

vi.mock('@/components/ui/spotlight-provider', () => ({
  useSpotlight: () => ({ startTour: startTourMock }),
}));

function setDashboardLoaded() {
  const lastCall = draggableDashboardMock.mock.calls.at(-1);
  const props = lastCall?.[0];
  expect(props).toBeDefined();

  act(() => {
    props.onLoadingChange(false);
  });
}

describe('DashboardClient', () => {
  beforeEach(() => {
    draggableDashboardMock.mockClear();
    startTourMock.mockClear();
    document.body.innerHTML = '';
  });

  it('shows loading text while dashboard is loading', () => {
    render(<DashboardClient />);

    expect(screen.getByText('Dashboard loading…')).toBeInTheDocument();
    expect(screen.getByTestId('draggable-dashboard')).toBeInTheDocument();
  });

  it('hides loading text when dashboard reports loading complete', () => {
    render(<DashboardClient />);

    setDashboardLoaded();

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

  it('starts tour only for targets present in the current dashboard layout', () => {
    const profileTarget = document.createElement('div');
    profileTarget.id = 'widget-profile-activation';
    document.body.appendChild(profileTarget);

    const momentumTarget = document.createElement('div');
    momentumTarget.id = 'widget-momentum-metrics';
    document.body.appendChild(momentumTarget);

    render(<DashboardClient />);
    setDashboardLoaded();

    fireEvent.click(screen.getByRole('button', { name: /take a tour/i }));

    expect(startTourMock).toHaveBeenCalledTimes(1);
    const [steps] = startTourMock.mock.calls[0];
    expect(steps.map((step: { id: string }) => step.id)).toEqual([
      'widget-profile-activation',
      'widget-momentum-metrics',
    ]);
  });

  it('falls back to main content target when no preferred widgets are visible', () => {
    const mainTarget = document.createElement('main');
    mainTarget.id = 'main-content';
    document.body.appendChild(mainTarget);

    render(<DashboardClient />);
    setDashboardLoaded();

    fireEvent.click(screen.getByRole('button', { name: /take a tour/i }));

    expect(startTourMock).toHaveBeenCalledTimes(1);
    const [steps] = startTourMock.mock.calls[0];
    expect(steps).toEqual([
      {
        id: 'main-content',
        title: 'Dashboard',
        description: 'This is your personalized dashboard workspace.',
      },
    ]);
  });

  it('does not start tour when no valid targets are available', () => {
    render(<DashboardClient />);
    setDashboardLoaded();

    fireEvent.click(screen.getByRole('button', { name: /take a tour/i }));

    expect(startTourMock).not.toHaveBeenCalled();
  });
});
