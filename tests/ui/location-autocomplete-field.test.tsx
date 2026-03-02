import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';

import { LocationAutocompleteField } from '@/components/location/LocationAutocompleteField';

let fetchMock: ReturnType<typeof vi.fn>;

function ControlledField({
  initialValue = '',
  onValueChange = vi.fn(),
}: {
  initialValue?: string;
  onValueChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <LocationAutocompleteField
      value={value}
      onChange={(next) => {
        setValue(next);
        onValueChange(next);
      }}
    />
  );
}

async function runDebounce(ms = 260) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
  });
}

describe('LocationAutocompleteField', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts fetch only after debounce', async () => {
    fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ items: [] }),
    }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    render(<ControlledField />);

    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Sto' } });
    expect(fetchMock).not.toHaveBeenCalled();

    await runDebounce();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/location/autocomplete?type=city&q=Sto&limit=10'),
      expect.any(Object)
    );
  });

  it('renders city suggestions as datalist options', async () => {
    fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [{ city: 'Stockholm', country: 'Sweden', label: 'Stockholm, Sweden' }],
      }),
    }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    render(<ControlledField initialValue="Stock" />);
    await runDebounce();

    const input = screen.getByLabelText('Location') as HTMLInputElement;
    const listId = input.getAttribute('list');
    expect(listId).toBeTruthy();

    const datalist = document.getElementById(listId!) as HTMLDataListElement | null;
    expect(datalist).not.toBeNull();
    const options = Array.from(datalist?.querySelectorAll('option') || []);
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].getAttribute('value')).toBe('Stockholm, Sweden');
  });

  it('supports selecting or typing values in one field', () => {
    fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ items: [] }),
    }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const onValueChange = vi.fn();
    render(<ControlledField onValueChange={onValueChange} />);

    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'Stockholm, Sweden' },
    });

    expect(onValueChange).toHaveBeenCalledWith('Stockholm, Sweden');
    expect(screen.getByLabelText('Location')).toHaveValue('Stockholm, Sweden');
  });

  it('keeps manual input usable when API fails', async () => {
    fetchMock = vi.fn(async () => {
      throw new Error('network down');
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    render(<ControlledField />);

    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'My Custom Place' },
    });

    await runDebounce();

    expect(screen.getByLabelText('Location')).toHaveValue('My Custom Place');
  });

  it('searches only by city segment before first comma', async () => {
    fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ items: [] }),
    }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    render(<ControlledField initialValue="Stockholm, Sweden" />);
    await runDebounce();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/location/autocomplete?type=city&q=Stockholm&limit=10'),
      expect.any(Object)
    );
  });
});
