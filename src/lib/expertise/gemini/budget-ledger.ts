import { createHash } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { cvImportAiBudgets, cvImportAiUsageLogs } from '@/db/schema';
import { getRows } from '@/lib/db/rows';
import {
  GEMINI_CURRENCY,
  GEMINI_PROVIDER,
  resolveMonthlyBudgetOre,
  type GeminiKeySlot,
} from '@/lib/expertise/gemini/config';

export type CvImportUsageStatus =
  | 'in_progress'
  | 'success'
  | 'fallback_success'
  | 'budget_blocked'
  | 'quota_failover'
  | 'invalid_json'
  | 'model_error'
  | 'ocr_failed'
  | 'failed';

export type BudgetReservation = {
  budgetId: string;
  keySlot: GeminiKeySlot;
  monthStart: string;
  estimatedCostOre: number;
};

export type UsageReplay = {
  logId: string;
  payload: unknown;
  status: CvImportUsageStatus;
};

function asNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function omitUndefined<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));
}

export function resolveStockholmMonthStart(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);

  const year = parts.find((part) => part.type === 'year')?.value || '1970';
  const month = parts.find((part) => part.type === 'month')?.value || '01';
  return `${year}-${month}-01`;
}

export function buildCvImportIdempotencyKey(input: {
  userId: string;
  route: string;
  sourceHash: string;
  explicitKey?: string | null;
}): string {
  if (input.explicitKey && input.explicitKey.trim().length > 0) {
    return input.explicitKey.trim().slice(0, 128);
  }

  return createHash('sha256')
    .update(`${input.userId}:${input.route}:${input.sourceHash}`)
    .digest('hex')
    .slice(0, 64);
}

export async function findUsageReplay(params: {
  userId: string;
  route: string;
  idempotencyKey: string;
}): Promise<UsageReplay | null> {
  const [existing] = await db
    .select({
      id: cvImportAiUsageLogs.id,
      status: cvImportAiUsageLogs.status,
      responsePayload: cvImportAiUsageLogs.responsePayload,
    })
    .from(cvImportAiUsageLogs)
    .where(
      and(
        eq(cvImportAiUsageLogs.userId, params.userId),
        eq(cvImportAiUsageLogs.route, params.route),
        eq(cvImportAiUsageLogs.idempotencyKey, params.idempotencyKey)
      )
    )
    .limit(1);

  if (!existing) {
    return null;
  }

  if (
    existing.responsePayload &&
    (existing.status === 'success' || existing.status === 'fallback_success')
  ) {
    return {
      logId: existing.id,
      payload: existing.responsePayload,
      status: existing.status as CvImportUsageStatus,
    };
  }

  return null;
}

export async function ensureInProgressUsageLog(params: {
  requestId: string;
  userId: string;
  route: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}): Promise<{ logId: string; replay: UsageReplay | null }> {
  const replay = await findUsageReplay({
    userId: params.userId,
    route: params.route,
    idempotencyKey: params.idempotencyKey,
  });

  if (replay) {
    return {
      logId: replay.logId,
      replay,
    };
  }

  const payload = {
    requestId: params.requestId,
    userId: params.userId,
    route: params.route,
    status: 'in_progress' as CvImportUsageStatus,
    idempotencyKey: params.idempotencyKey,
    provider: GEMINI_PROVIDER,
    currency: GEMINI_CURRENCY,
    metadata: params.metadata || {},
    updatedAt: new Date(),
  };

  await db
    .insert(cvImportAiUsageLogs)
    .values(payload)
    .onConflictDoUpdate({
      target: [
        cvImportAiUsageLogs.userId,
        cvImportAiUsageLogs.route,
        cvImportAiUsageLogs.idempotencyKey,
      ],
      set: {
        requestId: params.requestId,
        updatedAt: new Date(),
      },
    });

  const [saved] = await db
    .select({ id: cvImportAiUsageLogs.id })
    .from(cvImportAiUsageLogs)
    .where(
      and(
        eq(cvImportAiUsageLogs.userId, params.userId),
        eq(cvImportAiUsageLogs.route, params.route),
        eq(cvImportAiUsageLogs.idempotencyKey, params.idempotencyKey)
      )
    )
    .limit(1);

  if (!saved) {
    throw new Error('Failed to initialize CV import usage log.');
  }

  return {
    logId: saved.id,
    replay: null,
  };
}

export async function updateUsageLog(
  logId: string,
  patch: {
    status?: CvImportUsageStatus;
    keySlot?: GeminiKeySlot | null;
    model?: string | null;
    promptTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    costOre?: number | null;
    reservedOre?: number | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    latencyMs?: number | null;
    responsePayload?: unknown;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const setValues = omitUndefined({
    status: patch.status,
    keySlot: patch.keySlot,
    model: patch.model,
    promptTokens: patch.promptTokens,
    outputTokens: patch.outputTokens,
    totalTokens: patch.totalTokens,
    costOre: patch.costOre,
    reservedOre: patch.reservedOre,
    errorCode: patch.errorCode,
    errorMessage: patch.errorMessage,
    latencyMs: patch.latencyMs,
    responsePayload: patch.responsePayload,
    metadata: patch.metadata,
    updatedAt: new Date(),
  });

  await db.update(cvImportAiUsageLogs).set(setValues).where(eq(cvImportAiUsageLogs.id, logId));
}

export async function reserveBudgetForSlot(params: {
  keySlot: GeminiKeySlot;
  estimatedCostOre: number;
}): Promise<
  | {
      ok: true;
      reservation: BudgetReservation;
      limitOre: number;
      spentOre: number;
      reservedOre: number;
    }
  | {
      ok: false;
      reason: 'budget_exceeded' | 'disabled';
      limitOre: number;
      spentOre: number;
      reservedOre: number;
    }
> {
  return db.transaction(async (tx) => {
    const monthStart = resolveStockholmMonthStart();
    const monthlyLimitOre = resolveMonthlyBudgetOre(params.keySlot);

    await tx
      .insert(cvImportAiBudgets)
      .values({
        provider: GEMINI_PROVIDER,
        keySlot: params.keySlot,
        monthStart,
        currency: GEMINI_CURRENCY,
        monthlyLimitOre,
        spentOre: 0,
        reservedOre: 0,
        status: 'active',
      })
      .onConflictDoNothing();

    const lockedResult = await tx.execute(sql`
      SELECT id, monthly_limit_ore, spent_ore, reserved_ore, status
      FROM public.cv_import_ai_budgets
      WHERE provider = ${GEMINI_PROVIDER}
        AND key_slot = ${params.keySlot}
        AND month_start = ${monthStart}
      FOR UPDATE
    `);
    const rows = getRows(lockedResult) as Array<{
      id: string;
      monthly_limit_ore: number | string;
      spent_ore: number | string;
      reserved_ore: number | string;
      status: string;
    }>;
    const row = rows[0];
    if (!row) {
      throw new Error('Budget row could not be locked.');
    }

    const limitOre = asNumber(row.monthly_limit_ore);
    const spentOre = asNumber(row.spent_ore);
    const reservedOre = asNumber(row.reserved_ore);
    const projected = spentOre + reservedOre + Math.max(0, params.estimatedCostOre);

    if (row.status === 'disabled') {
      return {
        ok: false as const,
        reason: 'disabled' as const,
        limitOre,
        spentOre,
        reservedOre,
      };
    }

    if (projected > limitOre) {
      const nextStatus = spentOre + reservedOre >= limitOre ? 'exhausted' : row.status;
      await tx
        .update(cvImportAiBudgets)
        .set({
          status: nextStatus === 'disabled' ? 'disabled' : 'exhausted',
          updatedAt: new Date(),
        })
        .where(eq(cvImportAiBudgets.id, row.id));

      return {
        ok: false as const,
        reason: 'budget_exceeded' as const,
        limitOre,
        spentOre,
        reservedOre,
      };
    }

    await tx
      .update(cvImportAiBudgets)
      .set({
        reservedOre: reservedOre + Math.max(0, params.estimatedCostOre),
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(cvImportAiBudgets.id, row.id));

    return {
      ok: true as const,
      reservation: {
        budgetId: row.id,
        keySlot: params.keySlot,
        monthStart,
        estimatedCostOre: Math.max(0, params.estimatedCostOre),
      },
      limitOre,
      spentOre,
      reservedOre,
    };
  });
}

export async function releaseBudgetReservation(reservation: BudgetReservation): Promise<void> {
  await db.transaction(async (tx) => {
    const lockedResult = await tx.execute(sql`
      SELECT id, reserved_ore
      FROM public.cv_import_ai_budgets
      WHERE id = ${reservation.budgetId}
      FOR UPDATE
    `);
    const rows = getRows(lockedResult) as Array<{ id: string; reserved_ore: number | string }>;
    const row = rows[0];
    if (!row) {
      return;
    }

    const reservedOre = asNumber(row.reserved_ore);
    const nextReserved = Math.max(0, reservedOre - reservation.estimatedCostOre);
    await tx
      .update(cvImportAiBudgets)
      .set({
        reservedOre: nextReserved,
        updatedAt: new Date(),
      })
      .where(eq(cvImportAiBudgets.id, row.id));
  });
}

export async function finalizeBudgetReservation(params: {
  reservation: BudgetReservation;
  actualCostOre: number;
}): Promise<void> {
  await db.transaction(async (tx) => {
    const lockedResult = await tx.execute(sql`
      SELECT id, monthly_limit_ore, spent_ore, reserved_ore, status
      FROM public.cv_import_ai_budgets
      WHERE id = ${params.reservation.budgetId}
      FOR UPDATE
    `);
    const rows = getRows(lockedResult) as Array<{
      id: string;
      monthly_limit_ore: number | string;
      spent_ore: number | string;
      reserved_ore: number | string;
      status: string;
    }>;
    const row = rows[0];
    if (!row) {
      return;
    }

    const limitOre = asNumber(row.monthly_limit_ore);
    const spentOre = asNumber(row.spent_ore);
    const reservedOre = asNumber(row.reserved_ore);
    const actualCostOre = Math.max(0, Math.round(params.actualCostOre));
    const nextReserved = Math.max(0, reservedOre - params.reservation.estimatedCostOre);
    const nextSpent = Math.max(0, spentOre + actualCostOre);
    const nextStatus =
      row.status === 'disabled' ? 'disabled' : nextSpent >= limitOre ? 'exhausted' : 'active';

    await tx
      .update(cvImportAiBudgets)
      .set({
        spentOre: nextSpent,
        reservedOre: nextReserved,
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(cvImportAiBudgets.id, row.id));
  });
}
