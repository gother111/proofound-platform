import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/route-helpers', () => ({
  requirePlatformAdminJson: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
    select: vi.fn(),
  },
}));

vi.mock('@/lib/expertise/gemini/budget-ledger', () => ({
  resolveStockholmMonthStart: vi.fn(() => '2026-03-01'),
}));

vi.mock('@/lib/expertise/gemini/config', () => ({
  resolveMonthlyBudgetOre: vi.fn((slot: 'primary' | 'secondary') =>
    slot === 'primary' ? 8500 : 9000
  ),
}));

import { GET } from '@/app/api/admin/analytics/cv-import-spend/route';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';
import { db } from '@/db';
import { resolveMonthlyBudgetOre } from '@/lib/expertise/gemini/config';

describe('GET /api/admin/analytics/cv-import-spend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns guard response when requester is not a platform admin', async () => {
    vi.mocked(requirePlatformAdminJson).mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const request = new NextRequest('http://localhost/api/admin/analytics/cv-import-spend');
    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('returns aggregated spend analytics payload', async () => {
    vi.mocked(requirePlatformAdminJson).mockResolvedValue({
      userId: 'admin-1',
      adminLevel: 'platform_admin',
      email: 'admin@example.com',
      platformRole: 'platform_admin',
    } as any);

    (db.execute as any)
      .mockResolvedValueOnce({
        rows: [
          {
            day: '2026-02-28',
            cost_ore: 150,
            requests: 3,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            user_id: 'user-1',
            user_label: 'User One',
            requests: 3,
            cost_ore: 150,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            failure_code: 'CV_IMPORT_GEMINI_INVALID_JSON',
            count: 2,
          },
        ],
      });

    const whereMock = vi.fn().mockResolvedValue([
      {
        key_slot: 'primary',
        month_start: '2026-03-01',
        monthly_limit_ore: 8500,
        spent_ore: 500,
        reserved_ore: 100,
        status: 'active',
        currency: 'SEK',
      },
    ]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    (db.select as any).mockReturnValue({ from: fromMock });

    const request = new NextRequest('http://localhost/api/admin/analytics/cv-import-spend?days=30');
    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.totals).toEqual({
      cost_ore: 150,
      requests: 3,
      unique_users: 1,
    });
    expect(payload.per_day_spend).toHaveLength(1);
    expect(payload.per_user_spend).toHaveLength(1);
    expect(payload.top_users).toHaveLength(1);
    expect(payload.failure_breakdown).toEqual([
      {
        failure_code: 'CV_IMPORT_GEMINI_INVALID_JSON',
        count: 2,
      },
    ]);
    expect(payload.key_slot_budgets).toHaveLength(2);
    expect(payload.key_slot_budgets[0]).toEqual(
      expect.objectContaining({
        key_slot: 'primary',
        monthly_limit_ore: 8500,
        spent_ore: 500,
        reserved_ore: 100,
        remaining_ore: 7900,
      })
    );
    expect(payload.key_slot_budgets[1]).toEqual(
      expect.objectContaining({
        key_slot: 'secondary',
        monthly_limit_ore: 9000,
        spent_ore: 0,
        reserved_ore: 0,
        remaining_ore: 9000,
        status: 'active',
        currency: 'SEK',
      })
    );
    expect(resolveMonthlyBudgetOre).toHaveBeenCalledWith('secondary');
  });
});
