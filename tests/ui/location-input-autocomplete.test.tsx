import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { LocationInput, type LocationPreference } from '@/components/matching/LocationInput';

let fetchMock: ReturnType<typeof vi.fn>;

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

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
}));

describe('LocationInput autocomplete behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('type=country')) {
        return {
          ok: true,
          json: async () => ({
            items: [{ name: 'Sweden', code: 'SE', label: 'Sweden (SE)' }],
          }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({
          items: [
            { city: 'Stockholm', country: 'Sweden', countryCode: 'SE', label: 'Stockholm, Sweden' },
          ],
        }),
      } as Response;
    });

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts suggestion fetch after debounce', async () => {
    const onChange = vi.fn();
    const value: LocationPreference = { workMode: 'hybrid', country: '', city: '' };

    render(<LocationInput value={value} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'Swe' } });

    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(260);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/location/autocomplete?type=country&q=Swe&limit=10'),
      expect.any(Object)
    );
  });

  it('persists manual city input via onChange callback', () => {
    const onChange = vi.fn();
    const value: LocationPreference = { workMode: 'hybrid', country: 'Sweden', city: '' };

    render(<LocationInput value={value} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('City (Optional)'), {
      target: { value: 'My custom city' },
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        workMode: 'hybrid',
        country: 'Sweden',
        city: 'My custom city',
      })
    );
  });
});
