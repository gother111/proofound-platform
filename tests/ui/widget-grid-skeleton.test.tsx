import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WidgetGridSkeleton } from '../../src/components/dashboard/WidgetGridSkeleton';

describe('WidgetGridSkeleton', () => {
  it('renders the individual dashboard variant by default', () => {
    render(<WidgetGridSkeleton />);

    expect(screen.getByTestId('widget-grid-skeleton-individualDashboard')).toBeInTheDocument();
    expect(screen.getByTestId('widget-grid-skeleton-individualDashboard')).toHaveClass('gap-6');
    expect(
      screen.getByTestId('widget-grid-skeleton-tile-individualDashboard-5')
    ).toBeInTheDocument();
  });

  it('renders the organization dashboard variant layout', () => {
    render(<WidgetGridSkeleton variant="organizationDashboard" />);

    expect(screen.getByTestId('widget-grid-skeleton-organizationDashboard')).toBeInTheDocument();
    expect(screen.getByTestId('widget-grid-skeleton-organizationDashboard')).toHaveClass('gap-4');
    expect(
      screen.getByTestId('widget-grid-skeleton-tile-organizationDashboard-4')
    ).toBeInTheDocument();
  });
});
