import { NextResponse } from 'next/server';

import { getStartFromCvLaunchSummary } from '@/lib/ai/start-from-cv';
import { getAiLaunchOperationalSummary } from '@/lib/ai/usage-ledger';
import { requireInternalOpsRequest } from '@/lib/api/cron-auth';
import { getEmailProviderDependencyStatus } from '@/lib/email/config';
import { resolveGcpCvOcrSafeStatus } from '@/lib/expertise/gcp-cv-ocr-status';
import { buildLaunchStatusReport } from '@/lib/launch/status-report';
import { getRateLimitDependencyStatus } from '@/lib/rate-limit/index';
import { log } from '@/lib/log';
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

const truthyEnvValues = new Set(['1', 'true', 'yes', 'on']);
const forbiddenLiveLaunchBooleanEnvKeys = [
  'NEXT_PUBLIC_USE_MOCK_SUPABASE',
  'MOCK_ORG_MODE',
  'MOCK_ADMIN_MODE',
  'MOBILE_MOCK_AUTH',
  'PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK',
  'PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE',
  'DEBUG_INGEST_ENABLED',
] as const;
const forbiddenLiveLaunchPresenceEnvKeys = [
  'DEBUG_INGEST_URL',
  'NEXT_PUBLIC_DEBUG_INGEST_URL',
] as const;

function isTruthyEnvValue(value: string | undefined) {
  return truthyEnvValues.has((value ?? '').trim().toLowerCase());
}

function isLiveLaunchTarget() {
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV || process.env.APP_ENV)?.trim().toLowerCase();

  return (
    vercelEnv === 'production' ||
    vercelEnv === 'preview' ||
    appEnv === 'production' ||
    appEnv === 'staging'
  );
}

function getForbiddenLiveLaunchEnvKeys() {
  if (!isLiveLaunchTarget()) {
    return [];
  }

  const forbiddenKeys: string[] = [
    ...forbiddenLiveLaunchBooleanEnvKeys.filter((key) => isTruthyEnvValue(process.env[key])),
    ...forbiddenLiveLaunchPresenceEnvKeys.filter((key) => Boolean(process.env[key]?.trim())),
  ];
  const mockPlatformRole = process.env.MOCK_PLATFORM_ROLE?.trim();

  if (mockPlatformRole === 'platform_admin' || mockPlatformRole === 'super_admin') {
    forbiddenKeys.push('MOCK_PLATFORM_ROLE');
  }

  return forbiddenKeys;
}

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
        log.error('launch_status.live_refresh_failed', {
          error,
          monitorKeys: refreshMonitorKeys,
        });
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
    const startFromCvSummary = getStartFromCvLaunchSummary();
    const gcpOcrSummary = await resolveGcpCvOcrSafeStatus({ probeProvider: false });
    const rateLimitDependency = getRateLimitDependencyStatus();
    const emailProviderDependency = getEmailProviderDependencyStatus();
    const forbiddenLiveLaunchEnvKeys = getForbiddenLiveLaunchEnvKeys();
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
        deliverySkipped: emailProviderDependency.deliverySkipped,
        provider: emailProviderDependency.provider,
      };
      dependencyReasons.push({
        code: 'missing_email_provider_dependency' as const,
        message:
          'Launch readiness is blocked because the transactional email provider is not configured for live delivery.',
        monitorKeys: ['email_provider_dependency'],
        source: 'dependency' as const,
        freshnessState: 'missing' as const,
        checkedAt: [report.generatedAt],
        lastSuccessfulCheckedAt: [null],
        liveRefreshAttempted: report.liveRefresh.attempted,
      });
    }

    if (forbiddenLiveLaunchEnvKeys.length > 0) {
      dependencies.forbiddenLiveLaunchEnv = {
        ok: false,
        required: true,
        forbiddenKeys: forbiddenLiveLaunchEnvKeys,
      };
      dependencyReasons.push({
        code: 'forbidden_launch_environment_config' as const,
        message:
          'Launch readiness is blocked because live target environment contains local, mock, or debug-only configuration keys.',
        monitorKeys: ['launch_environment_config'],
        source: 'dependency' as const,
        freshnessState: 'fresh' as const,
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

    if (aiSummary.aiAssistantsEnabled && aiSummary.aiBudgetState === 'ok') {
      if (aiSummary.aiConfiguredModel !== 'gemini-3.1-flash-lite') {
        dependencies.aiConfiguredModel = {
          ok: false,
          required: true,
          configured: aiSummary.aiConfiguredModel,
          expected: 'gemini-3.1-flash-lite',
        };
        dependencyReasons.push({
          code: 'ai_default_model_mismatch' as const,
          message:
            'Launch readiness is blocked because the configured AI default model does not match the verified production target.',
          monitorKeys: ['ai_provider_model'],
          source: 'dependency' as const,
          freshnessState: 'fresh' as const,
          checkedAt: [report.generatedAt],
          lastSuccessfulCheckedAt: [null],
          liveRefreshAttempted: report.liveRefresh.attempted,
        });
      }

      if (!aiSummary.aiLastSuccessfulProviderSmokeAt) {
        dependencies.aiProviderSmoke = {
          ok: false,
          required: true,
          configured: false,
          model: aiSummary.aiConfiguredModel,
        };
        dependencyReasons.push({
          code: 'ai_provider_smoke_missing' as const,
          message:
            'Launch readiness is blocked because no successful live AI provider smoke is recorded for the configured model.',
          monitorKeys: ['ai_provider_smoke'],
          source: 'dependency' as const,
          freshnessState: 'missing' as const,
          checkedAt: [report.generatedAt],
          lastSuccessfulCheckedAt: [null],
          liveRefreshAttempted: report.liveRefresh.attempted,
        });
      }

      if (aiSummary.aiFallbackModelState === 'configured_unverified') {
        dependencies.aiFallbackModel = {
          ok: false,
          required: false,
          configured: aiSummary.aiFallbackModel,
          verified: false,
        };
        dependencyReasons.push({
          code: 'ai_fallback_model_unverified' as const,
          message:
            'Launch readiness is blocked because an AI fallback model is configured without successful live-provider verification.',
          monitorKeys: ['ai_provider_fallback'],
          source: 'dependency' as const,
          freshnessState: 'missing' as const,
          checkedAt: [report.generatedAt],
          lastSuccessfulCheckedAt: [null],
          liveRefreshAttempted: report.liveRefresh.attempted,
        });
      }
    }

    if (gcpOcrSummary.enabled && !gcpOcrSummary.available) {
      dependencies.gcpOcr = {
        ok: false,
        required: false,
        configured: false,
        status: gcpOcrSummary.status,
        unavailableReason: gcpOcrSummary.unavailableReason,
        expiresAt: gcpOcrSummary.expiresAt,
        hardBudgetCapConfigured: gcpOcrSummary.hardBudgetCapConfigured,
        budgetCapExhausted: gcpOcrSummary.budgetCapExhausted,
        cloudRunMaxInstancesDocumented: gcpOcrSummary.cloudRunMaxInstancesDocumented,
        publicInvocation: gcpOcrSummary.publicInvocation,
      };
      dependencyReasons.push({
        code: `gcp_ocr_${gcpOcrSummary.unavailableReason ?? 'not_ready'}` as const,
        message:
          'Launch readiness is blocked because GCP OCR is enabled but its cost, expiry, auth, provider, retention, or Cloud Run governance gate is not ready.',
        monitorKeys: ['gcp_ocr_governance'],
        source: 'dependency' as const,
        freshnessState: 'fresh' as const,
        checkedAt: [report.generatedAt],
        lastSuccessfulCheckedAt: [null],
        liveRefreshAttempted: report.liveRefresh.attempted,
      });
    }

    if (startFromCvSummary.enabled && !startFromCvSummary.ok) {
      dependencies.startFromCv = {
        ...startFromCvSummary,
      };
      dependencyReasons.push({
        code: 'start_from_cv_beta_blocked' as const,
        message:
          'Launch readiness is blocked because Start from CV is enabled with unsafe or incomplete gates.',
        monitorKeys: ['start_from_cv_beta'],
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
              startFromCvBeta: startFromCvSummary,
              gcpOcr: gcpOcrSummary,
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
              startFromCvBeta: startFromCvSummary,
              gcpOcr: gcpOcrSummary,
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
