import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import AdminAiSpendPage from '@/app/admin/ai-spend/page';

const apiFetchMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

describe('Admin AI spend page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders spend analytics data from the admin API', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        totals: {
          cost_ore: 150,
          requests: 4,
          unique_users: 2,
        },
        period: {
          days: 30,
          start_date: '2026-02-01T00:00:00.000Z',
          end_date: '2026-03-01T00:00:00.000Z',
          month_start: '2026-03-01',
        },
        per_day_spend: [
          {
            day: '2026-02-28',
            cost_ore: 150,
            requests: 4,
          },
        ],
        per_user_spend: [
          {
            user_id: 'user-1',
            user_label: 'User One',
            cost_ore: 100,
            requests: 3,
          },
        ],
        top_users: [
          {
            user_id: 'user-1',
            user_label: 'User One',
            cost_ore: 100,
            requests: 3,
          },
        ],
        key_slot_budgets: [
          {
            key_slot: 'primary',
            monthly_limit_ore: 8500,
            spent_ore: 100,
            reserved_ore: 0,
            remaining_ore: 8400,
            status: 'active',
            currency: 'SEK',
          },
          {
            key_slot: 'secondary',
            monthly_limit_ore: 8500,
            spent_ore: 50,
            reserved_ore: 0,
            remaining_ore: 8450,
            status: 'active',
            currency: 'SEK',
          },
        ],
        failure_breakdown: [
          {
            failure_code: 'CV_IMPORT_GEMINI_INVALID_JSON',
            count: 1,
          },
        ],
      }),
    });

    render(<AdminAiSpendPage />);

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith('/api/admin/analytics/cv-import-spend?days=30');
    });

    expect(await screen.findByText('AI Spend Dashboard')).toBeInTheDocument();
    expect(screen.getAllByText('1.50 SEK').length).toBeGreaterThan(0);
    expect(screen.getByText('User One')).toBeInTheDocument();
    expect(screen.getByText('Top failure: CV_IMPORT_GEMINI_INVALID_JSON (1)')).toBeInTheDocument();
  });

  it('renders backend error message when analytics loading fails', async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Admin access required',
      }),
    });

    render(<AdminAiSpendPage />);

    expect(await screen.findByText('Admin access required')).toBeInTheDocument();
  });
});
