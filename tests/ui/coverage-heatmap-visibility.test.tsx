import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CoverageHeatmap } from '@/app/app/i/expertise/widgets/CoverageHeatmap';

describe('CoverageHeatmap visibility behavior', () => {
  it('shows only L1 sections that have data', () => {
    render(
      <CoverageHeatmap
        data={[
          { l1: 1, l2: 10, count: 2, avgLevel: 3.2, l2Name: 'Core Skills' },
          { l1: 3, l2: 20, count: 1, avgLevel: 4.1, l2Name: 'Tooling' },
        ]}
        onCellClick={vi.fn()}
      />
    );

    expect(screen.getByText('Universal Capabilities')).toBeInTheDocument();
    expect(screen.getByText('Tools & Technologies')).toBeInTheDocument();
    expect(screen.queryByText('Functional Competencies')).not.toBeInTheDocument();
    expect(screen.queryByText('No skills yet')).not.toBeInTheDocument();
  });

  it('renders empty state when no coverage data is available', () => {
    render(<CoverageHeatmap data={[]} onCellClick={vi.fn()} />);

    expect(screen.getByText('No skills to display')).toBeInTheDocument();
  });
});
