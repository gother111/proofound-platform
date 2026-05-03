import { NextResponse } from 'next/server';

import { getAiLaunchOperationalSummary } from '@/lib/ai/usage-ledger';
import { requireInternalOpsRequest } from '@/lib/api/cron-auth';
import { getEmailProviderDependencyStatus } from '@/lib/email/config';
import { buildLaunchStatusReport } from '@/lib/launch/status-report';
import { getRateLimitDependencyStatus } from '@/lib/rate-limit/index';
import {
  getHttpMonitorKeysNeedingRefresh,
  getLaunchSyntheticStatusWithFreshHttpRevalidation,
  getPersistedLaunchSyntheticStatus,
} from '@/lib/launch/synthetic-monitors';
import type {
  LaunchLiveRefreshSummary,
  LaunchSyntheticStatusSnapshot,
} from '@/lib/launch/synthetic-monitors';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const unauthorized = requireInternalOpsRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const artifactPath =
    process.env.LAUNCH_SMOKE_ARTIFACT_PATH || '.artifacts/launch-smoke-report.json';

  try {
    const persisted = await getPersistedLaunchSyntheticStatus({
      artifactPath,
    });
    const refreshMonitorKeys = getHttpMonitorKeysNeedingRefresh(persisted);
    let latest: LaunchSyntheticStatusSnapshot = persisted;
    let liveRefreshOverride: Partial<LaunchLiveRefreshSummary> | undefined;

    if (refreshMonitorKeys.length > 0) {
      try {
        latest = await getLaunchSyntheticStatusWithFreshHttpRevalidation({
          baseUrl: new URL(request.url).origin,
          artifactPath,
          persistedStatus: persisted,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown live refresh error';
        console.error('Live launch-status refresh failed; returning persisted status', error);
        liveRefreshOverride = {
          attempted: true,
          refreshedMonitorKeys: refreshMonitorKeys,
          recoveredMonitorKeys: [],
          failedMonitorKeys: refreshMonitorKeys,
          finalHttpEvidenceSource: 'persisted',
          error: message,
        };
      }
    }

    const report = buildLaunchStatusReport(latest, {
      liveRefresh: liveRefreshOverride,
    });
    const aiSummary = await getAiLaunchOperationalSummary();
    const rateLimitDependency = getRateLimitDependencyStatus();
    const emailProviderDependency = getEmailProviderDependencyStatus();
    const dependencyReasons = [];
    const dependencies: Record<string, unknown> = {};

    if (!rateLimitDependency.ok) {
      dependencies.rateLimit = {
        ok: false,
        required: rateLimitDependency.required,
        configured: rateLimitDependency.configured,
        missing: rateLimitDependency.missing,
      };
      dependencyReasons.push({
        code: 'missing_rate_limit_dependency' as const,
        message:
          'Launch readiness is blocked because the required rate-limit KV dependency is not configured.',
        monitorKeys: ['rate_limit_dependency'],
        source: 'dependency' as const,
        freshnessState: 'missing' as const,
        checkedAt: [report.generatedAt],
        lastSuccessfulCheckedAt: [null],
        liveRefreshAttempted: report.liveRefresh.attempted,
      });
    }

    if (!emailProviderDependency.ok) {
      dependencies.emailProvider = {
        ok: false,
        required: emailProviderDependency.required,
        configured: emailProviderDependency.configured,
        missing: emailProviderDependency.missing,
        provider: emailProviderDependency.provider,
      };
      dependencyReasons.push({
        code: 'missing_email_provider_dependency' as const,
        message:
          'Launch readiness is blocked because the transactional email provider is not configured.',
        monitorKeys: ['email_provider_dependency'],
        source: 'dependency' as const,
        freshnessState: 'missing' as const,
        checkedAt: [report.generatedAt],
        lastSuccessfulCheckedAt: [null],
        liveRefreshAttempted: report.liveRefresh.attempted,
      });
    }

    if (aiSummary.aiBudgetState === 'raw_prompt_logging_blocked') {
      dependencies.aiRawPromptLogging = {
        ok: false,
        required: false,
        configured: true,
      };
      dependencyReasons.push({
        code: 'ai_raw_prompt_logging_enabled' as const,
        message:
          'Launch readiness is blocked because raw AI prompt logging is enabled in production.',
        monitorKeys: ['ai_raw_prompt_logging'],
        source: 'dependency' as const,
        freshnessState: 'fresh' as const,
        checkedAt: [report.generatedAt],
        lastSuccessfulCheckedAt: [null],
        liveRefreshAttempted: report.liveRefresh.attempted,
      });
    }

    if (aiSummary.aiBudgetState === 'cap_not_configured') {
      dependencies.aiBudget = {
        ok: false,
        required: true,
        configured: false,
        state: aiSummary.aiBudgetState,
      };
      dependencyReasons.push({
        code: 'ai_budget_cap_not_configured' as const,
        message:
          'Launch readiness is blocked because AI assistants are enabled without a configured monthly hard cap.',
        monitorKeys: ['ai_budget_cap'],
        source: 'dependency' as const,
        freshnessState: 'missing' as const,
        checkedAt: [report.generatedAt],
        lastSuccessfulCheckedAt: [null],
        liveRefreshAttempted: report.liveRefresh.attempted,
      });
    }

    if (aiSummary.aiBudgetState === 'exhausted') {
      dependencies.aiBudget = {
        ok: false,
        required: true,
        configured: true,
        state: aiSummary.aiBudgetState,
      };
      dependencyReasons.push({
        code: 'ai_budget_exhausted' as const,
        message:
          'Launch readiness is blocked because the configured AI monthly hard cap is exhausted.',
        monitorKeys: ['ai_budget_cap'],
        source: 'dependency' as const,
        freshnessState: 'fresh' as const,
        checkedAt: [report.generatedAt],
        lastSuccessfulCheckedAt: [null],
        liveRefreshAttempted: report.liveRefresh.attempted,
      });
    }

    const responseBody =
      dependencyReasons.length === 0
        ? {
            ...report,
            summary: {
              ...report.summary,
              ...aiSummary,
            },
          }
        : {
            ...report,
            ok: false,
            readinessState: 'blocked' as const,
            dependencies,
            summary: {
              ...report.summary,
              ...aiSummary,
              blockedMonitors: report.summary.blockedMonitors + dependencyReasons.length,
            },
            notReadyReasons: [...report.notReadyReasons, ...dependencyReasons],
          };

    return NextResponse.json(responseBody, {
      status: responseBody.readinessState === 'blocked' ? 503 : 200,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to load launch status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
