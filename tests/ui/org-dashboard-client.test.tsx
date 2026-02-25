import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OrgDashboardClient } from '../../src/app/app/o/[slug]/home/OrgDashboardClient';

let orgPipelineVisible = true;

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/dashboard/OrgGoalsCard', () => ({
  OrgGoalsCard: () => <div>widget:org-goals</div>,
}));
vi.mock('@/components/dashboard/TasksCard', () => ({
  TasksCard: () => <div>widget:tasks</div>,
}));
vi.mock('@/components/dashboard/ProjectsCard', () => ({
  ProjectsCard: () => <div>widget:projects</div>,
}));
vi.mock('@/components/dashboard/OrgMatchingCard', () => ({
  OrgMatchingCard: ({
    onVisibilityChange,
  }: {
    onVisibilityChange?: (visible: boolean) => void;
  }) => {
    React.useEffect(() => {
      onVisibilityChange?.(orgPipelineVisible);
    }, [onVisibilityChange]);

    return <div>widget:org-pipeline</div>;
  },
}));
vi.mock('@/components/dashboard/org/OrgReadinessCard', () => ({
  OrgReadinessCard: () => <div>widget:org-readiness</div>,
}));
vi.mock('@/components/dashboard/TeamRolesCard', () => ({
  TeamRolesCard: () => <div>widget:team</div>,
}));
vi.mock('@/components/dashboard/ExploreCard', () => ({
  ExploreCard: () => <div>widget:explore</div>,
}));
vi.mock('@/components/dashboard/WhileAwayCard', () => ({
  WhileAwayCard: ({ onVisibilityChange }: { onVisibilityChange?: (visible: boolean) => void }) => {
    React.useEffect(() => {
      onVisibilityChange?.(false);
    }, [onVisibilityChange]);

    return <div>widget:while-away</div>;
  },
}));

describe('OrgDashboardClient', () => {
  beforeEach(() => {
    orgPipelineVisible = true;
    const storage = new Map<string, string>();
    const localStorageMock = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, String(value));
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      }),
      clear: vi.fn(() => {
        storage.clear();
      }),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      configurable: true,
    });
  });

  it('sanitizes malformed localStorage layouts before rendering widgets', async () => {
    localStorage.setItem(
      'org-dashboard-layout-org-123',
      JSON.stringify([
        { widgetId: 'org-pipeline', position: 0, visible: false, size: 'large', settings: {} },
        { widgetId: 'org-pipeline', position: 1, visible: true, size: 'large', settings: {} },
        { widgetId: 'team', position: 2, visible: true, size: 'default', settings: {} },
        { widgetId: 'unknown-widget', position: 3, visible: true, size: 'default', settings: {} },
        { widgetId: 'org-readiness', position: 4, visible: true, size: 'invalid', settings: {} },
      ])
    );

    render(<OrgDashboardClient orgSlug="acme" orgId="org-123" userRole="owner" />);

    await waitFor(() => {
      expect(screen.getByText('widget:org-pipeline')).toBeInTheDocument();
    });

    expect(screen.getAllByText('widget:org-pipeline')).toHaveLength(1);
    expect(screen.getAllByText('widget:team')).toHaveLength(1);
    expect(screen.getAllByText('widget:org-readiness')).toHaveLength(1);
    expect(screen.queryByText('widget:tasks')).not.toBeInTheDocument();
    expect(screen.queryByText('widget:org-goals')).not.toBeInTheDocument();
  });

  it('omits while-away widget when the card reports no updates', async () => {
    localStorage.setItem(
      'org-dashboard-layout-org-123',
      JSON.stringify([
        { widgetId: 'while-away', position: 0, visible: true, size: 'default', settings: {} },
        { widgetId: 'team', position: 1, visible: true, size: 'default', settings: {} },
      ])
    );

    render(<OrgDashboardClient orgSlug="acme" orgId="org-123" userRole="owner" />);

    await waitFor(() => {
      expect(screen.getByText('widget:team')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText('widget:while-away')).not.toBeInTheDocument();
    });
  });

  it('omits org-pipeline widget when the card reports no data', async () => {
    orgPipelineVisible = false;

    localStorage.setItem(
      'org-dashboard-layout-org-123',
      JSON.stringify([
        { widgetId: 'org-pipeline', position: 0, visible: true, size: 'large', settings: {} },
        { widgetId: 'team', position: 1, visible: true, size: 'default', settings: {} },
      ])
    );

    render(<OrgDashboardClient orgSlug="acme" orgId="org-123" userRole="owner" />);

    await waitFor(() => {
      expect(screen.getByText('widget:team')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText('widget:org-pipeline')).not.toBeInTheDocument();
    });
  });
});
