import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { cvImportAiBudgets } from '@/db/schema';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';
import { getRows } from '@/lib/db/rows';
import { resolveStockholmMonthStart } from '@/lib/expertise/gemini/budget-ledger';
import { resolveMonthlyBudgetOre } from '@/lib/expertise/gemini/config';

export const dynamic = 'force-dynamic';

type PerDayRow = {
  day: string;
  cost_ore: number | string;
  requests: number | string;
};

type PerUserRow = {
  user_id: string;
  user_label: string;
  requests: number | string;
  cost_ore: number | string;
};

type FailureRow = {
  failure_code: string | null;
  count: number | string;
};

type BudgetRow = {
  key_slot: 'primary' | 'secondary';
  month_start: string;
  monthly_limit_ore: number | string;
  spent_ore: number | string;
  reserved_ore: number | string;
  status: 'active' | 'exhausted' | 'disabled';
  currency: 'SEK';
};

function asInt(value: unknown): number {
  if (typeof value === 'number') {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  }
  return 0;
}

function parseDays(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 30;
  }
  return Math.max(1, Math.min(90, Math.floor(parsed)));
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requirePlatformAdminJson();
    if (adminUser instanceof NextResponse) {
      return adminUser;
    }

    const days = parseDays(request.nextUrl.searchParams.get('days'));
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const monthStart = resolveStockholmMonthStart(now);

    const [perDayResult, perUserResult, failureResult, budgetResult] = await Promise.all([
      db.execute(sql`
        SELECT
          to_char((created_at AT TIME ZONE 'Europe/Stockholm')::date, 'YYYY-MM-DD') AS day,
          COALESCE(SUM(cost_ore), 0)::int AS cost_ore,
          COUNT(*)::int AS requests
        FROM public.cv_import_ai_usage_logs
        WHERE created_at >= ${startDate}
        GROUP BY 1
        ORDER BY 1 DESC
      `),
      db.execute(sql`
        SELECT
          l.user_id::text AS user_id,
          COALESCE(NULLIF(TRIM(p.display_name), ''), NULLIF(TRIM(p.handle), ''), l.user_id::text) AS user_label,
          COUNT(*)::int AS requests,
          COALESCE(SUM(l.cost_ore), 0)::int AS cost_ore
        FROM public.cv_import_ai_usage_logs l
        LEFT JOIN public.profiles p ON p.id = l.user_id
        WHERE l.created_at >= ${startDate}
        GROUP BY 1, 2
        ORDER BY cost_ore DESC, requests DESC
      `),
      db.execute(sql`
        SELECT
          COALESCE(NULLIF(error_code, ''), status) AS failure_code,
          COUNT(*)::int AS count
        FROM public.cv_import_ai_usage_logs
        WHERE created_at >= ${startDate}
          AND status NOT IN ('success', 'fallback_success', 'in_progress')
        GROUP BY 1
        ORDER BY count DESC
      `),
      db
        .select({
          key_slot: cvImportAiBudgets.keySlot,
          month_start: cvImportAiBudgets.monthStart,
          monthly_limit_ore: cvImportAiBudgets.monthlyLimitOre,
          spent_ore: cvImportAiBudgets.spentOre,
          reserved_ore: cvImportAiBudgets.reservedOre,
          status: cvImportAiBudgets.status,
          currency: cvImportAiBudgets.currency,
        })
        .from(cvImportAiBudgets)
        .where(
          sql`${cvImportAiBudgets.provider} = 'gemini' AND ${cvImportAiBudgets.monthStart} = ${monthStart}`
        ),
    ]);

    const perDay = (getRows(perDayResult) as PerDayRow[]).map((row) => ({
      day: row.day,
      cost_ore: asInt(row.cost_ore),
      requests: asInt(row.requests),
    }));

    const perUser = (getRows(perUserResult) as PerUserRow[]).map((row) => ({
      user_id: row.user_id,
      user_label: row.user_label,
      requests: asInt(row.requests),
      cost_ore: asInt(row.cost_ore),
    }));

    const failureBreakdown = (getRows(failureResult) as FailureRow[]).map((row) => ({
      failure_code: row.failure_code || 'unknown',
      count: asInt(row.count),
    }));

    const budgetRows = budgetResult as BudgetRow[];
    const budgetBySlot = new Map(budgetRows.map((row) => [row.key_slot, row]));
    const keySlotBudgets = (['primary', 'secondary'] as const).map((slot) => {
      const row = budgetBySlot.get(slot);
      const monthlyLimitOre = row ? asInt(row.monthly_limit_ore) : resolveMonthlyBudgetOre(slot);
      const spentOre = row ? asInt(row.spent_ore) : 0;
      const reservedOre = row ? asInt(row.reserved_ore) : 0;
      const remainingOre = Math.max(0, monthlyLimitOre - spentOre - reservedOre);

      return {
        key_slot: slot,
        month_start: row?.month_start || monthStart,
        monthly_limit_ore: monthlyLimitOre,
        spent_ore: spentOre,
        reserved_ore: reservedOre,
        remaining_ore: remainingOre,
        status: row?.status || 'active',
        currency: row?.currency || 'SEK',
      };
    });

    const totalCostOre = perDay.reduce((sum, row) => sum + row.cost_ore, 0);
    const totalRequests = perDay.reduce((sum, row) => sum + row.requests, 0);

    return NextResponse.json({
      success: true,
      period: {
        days,
        start_date: startDate.toISOString(),
        end_date: now.toISOString(),
        month_start: monthStart,
      },
      totals: {
        cost_ore: totalCostOre,
        requests: totalRequests,
        unique_users: perUser.length,
      },
      per_day_spend: perDay,
      per_user_spend: perUser,
      top_users: perUser.slice(0, 10),
      key_slot_budgets: keySlotBudgets,
      failure_breakdown: failureBreakdown,
      generated_at: now.toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch CV import spend analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
