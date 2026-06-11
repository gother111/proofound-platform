import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CompensationInput } from '@/components/matching/CompensationInput';
import { LocationInput } from '@/components/matching/LocationInput';

describe('matching input accessibility', () => {
  it('names the work-mode select trigger', () => {
    render(<LocationInput value={{ workMode: '' }} onChange={vi.fn()} />);

    expect(screen.getByRole('combobox', { name: 'Work mode' })).toBeInTheDocument();
  });

  it('names compensation select triggers', () => {
    render(
      <CompensationInput
        value={{ min: 0, max: 0, currency: 'USD', period: 'annual' }}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole('combobox', { name: 'Compensation currency' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Compensation period' })).toBeInTheDocument();
  });
});
