import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import FairnessPage from '@/app/fairness/page';

describe('Public fairness note', () => {
  it('renders the launch-safe transparency note without dashboard copy', () => {
    render(<FairnessPage />);

    expect(screen.getByText('Fairness is monitored, not productized')).toBeInTheDocument();
    expect(screen.queryByText(/Latest Fairness Note/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Historical Reports/i)).not.toBeInTheDocument();
  });
});
