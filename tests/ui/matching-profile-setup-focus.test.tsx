import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MatchingProfileSetup } from '@/components/matching/MatchingProfileSetup';

const apiFetchMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/matching/TypeaheadChips', () => ({
  TypeaheadChips: ({ onChange }: any) => (
    <button onClick={() => onChange(['value-a', 'value-b', 'value-c'])}>set chips</button>
  ),
}));

vi.mock('@/components/matching/LocationInput', () => ({
  LocationInput: ({ onChange }: any) => (
    <button onClick={() => onChange({ workMode: 'remote', country: 'US' })}>set location</button>
  ),
}));

vi.mock('@/components/matching/CompensationInput', () => ({
  CompensationInput: ({ onChange }: any) => (
    <button
      onClick={() => onChange({ min: 90000, max: 120000, currency: 'USD', period: 'monthly' })}
    >
      set compensation
    </button>
  ),
}));

vi.mock('@/components/matching/DateWindowInput', () => ({
  DateWindowInput: ({ onChange }: any) => (
    <button onClick={() => onChange({ earliest: '2026-03-01', latest: '2026-04-01' })}>
      set availability
    </button>
  ),
}));

vi.mock('@/components/matching/CEFRLanguageRow', () => ({
  CEFRLanguageRow: () => <div>language row</div>,
}));

vi.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange, min = 0, max = 100, step = 1, ...rest }: any) => (
    <input
      type="range"
      value={value?.[0] ?? 0}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onValueChange?.([Number(event.target.value)])}
      {...rest}
    />
  ),
}));

describe('MatchingProfileSetup focus and weighting step', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetchMock.mockImplementation(async (url: string, options?: any) => {
      if (url === '/api/taxonomy/values') {
        return { ok: true, json: async () => ({ items: [] }) };
      }
      if (url === '/api/taxonomy/causes') {
        return { ok: true, json: async () => ({ items: [] }) };
      }
      if (url === '/api/expertise/stats') {
        return { ok: true, json: async () => ({ totalL4Skills: 12 }) };
      }
      if (url === '/api/matching-profile' && options?.method === 'PUT') {
        return { ok: true, json: async () => ({ profile: { profileId: 'user-1' } }) };
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  it('submits focus arrays and computed weights from slider bias', async () => {
    const onComplete = vi.fn();

    render(<MatchingProfileSetup onComplete={onComplete} onCancel={vi.fn()} />);

    expect(screen.queryByRole('tab', { name: /languages/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /next: focus & weights/i }));

    fireEvent.change(screen.getByPlaceholderText(/software engineer, product manager/i), {
      target: { value: 'Software Engineer' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0]);
    fireEvent.click(screen.getByLabelText('Startup'));
    fireEvent.change(screen.getByLabelText('Mission vs skills weighting'), {
      target: { value: '80' },
    });

    fireEvent.click(screen.getByRole('button', { name: /next: values & causes/i }));
    fireEvent.click(screen.getAllByRole('button', { name: 'set chips' })[0]);

    fireEvent.click(screen.getByRole('button', { name: /next: work preferences/i }));
    fireEvent.click(screen.getByRole('button', { name: 'set location' }));
    fireEvent.click(screen.getByRole('button', { name: 'set compensation' }));
    fireEvent.click(screen.getByRole('button', { name: 'set availability' }));

    fireEvent.click(screen.getByRole('button', { name: /review & activate/i }));
    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });

    const putCall = apiFetchMock.mock.calls.find(
      ([url, options]) => url === '/api/matching-profile' && options?.method === 'PUT'
    );

    expect(putCall).toBeTruthy();
    const payload = JSON.parse(putCall[1].body);

    expect(payload.desiredRoles).toEqual(['Software Engineer']);
    expect(payload.orgTypes).toEqual(['startup']);
    expect(payload.weightBias).toBe(80);
    expect(payload.compPeriod).toBe('monthly');
    expect(payload).not.toHaveProperty('languages');
    expect(typeof payload.weights).toBe('object');
    expect(
      Object.values(payload.weights).reduce((acc: number, n: any) => acc + Number(n), 0)
    ).toBeCloseTo(1, 4);
  });

  it('allows intermediate empty/zero edits but blocks progressing to Review from Work when final value is 0', async () => {
    render(<MatchingProfileSetup onComplete={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /next: focus & weights/i }));
    fireEvent.click(screen.getByRole('button', { name: /next: values & causes/i }));
    fireEvent.click(screen.getByRole('button', { name: /next: work preferences/i }));

    const minInput = screen.getByLabelText('Minimum desired');
    fireEvent.change(minInput, { target: { value: '' } });
    expect(minInput).toHaveValue(null);

    fireEvent.change(minInput, { target: { value: '30' } });
    expect(minInput).toHaveValue(30);

    fireEvent.change(minInput, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /review & activate/i }));

    expect(
      screen.getByText('Minimum desired hours is 1. Enter values above 0 to continue.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Review Your Profile')).not.toBeInTheDocument();
  });
});
