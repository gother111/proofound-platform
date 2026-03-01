import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Step4Practicals } from '@/components/matching/assignment-steps/Step4Practicals';

vi.mock('@/components/location/CityCountryAutocompleteFields', () => ({
  CityCountryAutocompleteFields: ({ onCountryChange, onCityChange }: any) => (
    <div data-testid="city-country-autocomplete">
      <button type="button" onClick={() => onCountryChange('Sweden', 'SE')}>
        set-country
      </button>
      <button type="button" onClick={() => onCityChange('Stockholm')}>
        set-city
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...rest }: any) => (
    <label htmlFor={htmlFor} {...rest}>
      {children}
    </label>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: (props: any) => <div data-testid="progress" {...props} />,
}));

vi.mock('@/components/ui/slider', () => ({
  Slider: ({ value = [0], onValueChange, min = 0, max = 100, step = 1, ...rest }: any) => (
    <input
      type="range"
      value={value[0]}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onValueChange?.([Number(event.target.value)])}
      {...rest}
    />
  ),
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...rest }: any) => (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      {...rest}
    />
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
  SelectValue: ({ children }: any) => <span>{children}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
}));

function createMockForm(initialLocationMode: 'remote' | 'onsite' | 'hybrid' = 'hybrid') {
  const state: Record<string, unknown> = {
    compMin: 50000,
    compMax: 70000,
    currency: 'USD',
    hoursMin: 20,
    hoursMax: 40,
    duration: '12mo',
    locationMode: initialLocationMode,
    verificationGates: [],
    country: '',
    city: '',
  };

  const setValue = vi.fn((field: string, value: unknown) => {
    state[field] = value;
  });

  return {
    form: {
      register: (field: string) => ({
        name: field,
        onChange: () => {},
        onBlur: () => {},
        ref: () => {},
      }),
      watch: (field: string) => state[field],
      setValue,
      formState: { errors: {} },
    } as any,
    setValue,
  };
}

describe('Step4Practicals location autocomplete integration', () => {
  it('updates form city and country values from autocomplete callbacks', () => {
    const { form, setValue } = createMockForm('hybrid');

    render(<Step4Practicals form={form} onNext={() => {}} onBack={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'set-country' }));
    fireEvent.click(screen.getByRole('button', { name: 'set-city' }));

    expect(setValue).toHaveBeenCalledWith(
      'country',
      'Sweden',
      expect.objectContaining({ shouldDirty: true, shouldTouch: true })
    );
    expect(setValue).toHaveBeenCalledWith(
      'city',
      'Stockholm',
      expect.objectContaining({ shouldDirty: true, shouldTouch: true })
    );
  });

  it('hides city/country autocomplete when location mode is remote', () => {
    const { form } = createMockForm('remote');

    render(<Step4Practicals form={form} onNext={() => {}} onBack={() => {}} />);

    expect(screen.queryByTestId('city-country-autocomplete')).not.toBeInTheDocument();
  });
});
