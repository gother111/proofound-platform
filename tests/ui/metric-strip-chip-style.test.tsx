import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MetricStrip } from '@/components/ui/v2/MetricStrip';
import { DASHBOARD_TREND_CHIP_CLASS } from '@/components/dashboard/chipStyles';

function expectClassTokens(className: string, tokenString: string) {
  for (const token of tokenString.split(' ').filter(Boolean)) {
    expect(className).toContain(token);
  }
}

describe('MetricStrip trend chip styling', () => {
  it('applies shared multiline-safe chip classes and icon alignment', () => {
    render(
      <MetricStrip
        metrics={[
          {
            id: 'matches',
            title: 'Quality Matches',
            value: '12',
            trend: { direction: 'up', label: '80%+ fit suggestions' },
          },
          {
            id: 'applications',
            title: 'Active Applications',
            value: '3',
            trend: { direction: 'neutral', label: 'Assignments in progress' },
          },
        ]}
      />
    );

    const fitLabel = screen.getByText('80%+ fit suggestions');
    const fitChip = fitLabel.parentElement;
    expect(fitChip).toBeTruthy();
    expectClassTokens(fitChip?.className || '', DASHBOARD_TREND_CHIP_CLASS);
    expect(fitChip?.className || '').toContain('text-emerald-700');

    const fitIcon = fitChip?.querySelector('svg');
    expect(fitIcon).toBeTruthy();
    expect(fitIcon?.getAttribute('class') || '').toContain('shrink-0');
    expect(fitIcon?.getAttribute('class') || '').toContain('mt-0.5');

    const assignmentsLabel = screen.getByText('Assignments in progress');
    const assignmentsChip = assignmentsLabel.parentElement;
    expect(assignmentsChip).toBeTruthy();
    expectClassTokens(assignmentsChip?.className || '', DASHBOARD_TREND_CHIP_CLASS);
    expect(assignmentsChip?.className || '').toContain('text-slate-600');

    const assignmentsIcon = assignmentsChip?.querySelector('svg');
    expect(assignmentsIcon).toBeTruthy();
    expect(assignmentsIcon?.getAttribute('class') || '').toContain('shrink-0');
    expect(assignmentsIcon?.getAttribute('class') || '').toContain('mt-0.5');
  });
});
