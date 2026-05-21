/** @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/launch/synthetic-monitors', () => ({
  getPersistedLaunchSyntheticStatus: vi.fn(),
  getLaunchSyntheticStatusWithFreshHttpRevalidation: vi.fn(),
  getHttpMonitorKeysNeedingRefresh: vi.fn(),
}));

vi.mock('@/lib/ai/usage-ledger', () => ({
  getAiLaunchOperationalSummary: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { GET } from '../launch-status/route';
import { getAiLaunchOperationalSummary } from '@/lib/ai/usage-ledger';
import { log } from '@/lib/log';
import {
  getHttpMonitorKeysNeedingRefresh,
  getPersistedLaunchSyntheticStatus,
  getLaunchSyntheticStatusWithFreshHttpRevalidation,
} from '@/lib/launch/synthetic-monitors';

const INDIVIDUAL_SMOKE_MONITOR_KEY = 'public_individual_portfolio_visible';
const ORG_SMOKE_MONITOR_KEY = 'full_org_corridor_review_to_engagement_verification';
const CRON_SECRET = 'launch-status-test-secret';

function authenticatedRequest() {
  return new Request('https://example.com/api/monitoring/launch-status', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

function buildLiveRefresh(overrides: Record<string, unknown> = {}) {
  return {
    attempted: false,
    refreshedMonitorKeys: [],
    recoveredMonitorKeys: [],
    failedMonitorKeys: [],
    finalHttpEvidenceSource: 'persisted',
    error: null,
    ...overrides,
  };
}

function buildMonitorRow(overrides: Record<string, unknown> = {}) {
  return {
    monitorKey: 'api_health',
    monitorGroup: 'endpoint',
    severity: 'p1',
    status: 'pass',
    responseTimeMs: 12,
    expectedState: 'health_contract_ok',
    observedState: 'health_contract_ok',
    failureClass: null,
    checkedAt: '2026-03-10T10:00:00.000Z',
    ageMinutes: 0,
    freshnessState: 'fresh',
    blocking: false,
    stale: false,
    lastSuccessfulCheckedAt: '2026-03-10T10:00:00.000Z',
    evidenceSource: 'persisted',
    refreshState: 'retained_persisted',
    details: {},
    ...overrides,
  };
}

function buildStatus(overrides: Record<string, unknown> = {}) {
  return {
    generatedAt: '2026-03-10T10:00:00.000Z',
    ok: true,
    readinessState: 'ready',
    source: 'persisted',
    liveRefresh: buildLiveRefresh(),
    evidence: {
      source: 'persisted',
      artifactPath: '.artifacts/launch-smoke-report.json',
      smokeArtifactSchemaVersion: 2,
      smokeArtifactGeneratedAt: '2026-03-10T09:59:00.000Z',
      smokeArtifactAgeMinutes: 1,
      smokeFreshnessThresholdMinutes: 60,
      smokeFreshnessState: 'fresh',
      persisted: true,
    },
    missingMonitorKeys: [],
    rows: [buildMonitorRow()],
    ...overrides,
  };
}

describe('/api/monitoring/launch-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', CRON_SECRET);
    vi.stubEnv('INTERNAL_API_SECRET', '');
    vi.stubEnv('RESEND_API_KEY', 're_launch_status_test');
    (getHttpMonitorKeysNeedingRefresh as any).mockReturnValue([]);
    (getAiLaunchOperationalSummary as any).mockResolvedValue({
      aiAssistantsEnabled: false,
      aiConfiguredModel: 'gemini-3.1-flash-lite',
      aiFallbackModel: null,
      aiFallbackModelState: 'unset',
      aiFallbackModelConfigured: false,
      aiFallbackModelVerified: false,
      aiLastSuccessfulProviderSmokeAt: null,
      aiMonthlyCapSek: 250,
      aiHardCapConfigured: true,
      aiSpendThisMonthSek: 0,
      currentAiMonthToDateSpendSek: 0,
      aiMonthlyHardCapSek: 250,
      aiMonthlyHardCapPercentUsed: 0,
      aiMonthlyHardCapExhausted: false,
      aiBudgetState: 'disabled',
      aiRateLimitHealth: {
        ok: true,
        globalDailyLimit: 250,
        userDailyLimit: 20,
        orgDailyLimit: 50,
        defaultFeatureDailyLimit: 500,
        perFeatureDailyLimits: {},
        configurablePerFeatureLimits: true,
      },
      aiRawPromptLoggingEnabled: false,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('requires internal launch-ops auth', async () => {
    const response = await GET(new Request('https://example.com/api/monitoring/launch-status'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(getPersistedLaunchSyntheticStatus).not.toHaveBeenCalled();
  });

  it('returns fresh green readiness with no blocking reasons', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue(
      buildStatus({
        rows: [
          buildMonitorRow(),
          buildMonitorRow({
            monitorKey: INDIVIDUAL_SMOKE_MONITOR_KEY,
            monitorGroup: 'synthetic-smoke',
            expectedState: 'public_individual_portfolio_visible',
            observedState: 'public_individual_portfolio_visible',
            lastSuccessfulCheckedAt: '2026-03-10T09:59:00.000Z',
            refreshState: 'not_applicable',
          }),
        ],
      })
    );

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.readinessState).toBe('ready');
    expect(body.summary.blockedMonitors).toBe(0);
    expect(body.summary).toEqual(
      expect.objectContaining({
        aiAssistantsEnabled: false,
        aiConfiguredModel: 'gemini-3.1-flash-lite',
        aiFallbackModelState: 'unset',
        aiFallbackModelConfigured: false,
        aiFallbackModelVerified: false,
        aiLastSuccessfulProviderSmokeAt: null,
        aiMonthlyCapSek: 250,
        aiHardCapConfigured: true,
        aiSpendThisMonthSek: 0,
        currentAiMonthToDateSpendSek: 0,
        aiMonthlyHardCapSek: 250,
        aiMonthlyHardCapPercentUsed: 0,
        aiMonthlyHardCapExhausted: false,
        aiRateLimitHealth: expect.objectContaining({
          ok: true,
          globalDailyLimit: 250,
          userDailyLimit: 20,
          orgDailyLimit: 50,
        }),
        aiBudgetState: 'disabled',
        aiRawPromptLoggingEnabled: false,
        gcpOcr: expect.objectContaining({
          status: 'disabled',
          enabled: false,
          available: false,
        }),
      })
    );
    expect(body.notReadyReasons).toEqual([]);
    expect(body.freshness).toEqual(
      expect.objectContaining({
        evaluatedAt: '2026-03-10T10:00:00.000Z',
        smokeArtifactGeneratedAt: '2026-03-10T09:59:00.000Z',
        smokeArtifactAgeMinutes: 1,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'fresh',
      })
    );
    expect(body.lastSuccessfulRuns.byMonitorKey.api_health).toBe('2026-03-10T10:00:00.000Z');
    expect(getLaunchSyntheticStatusWithFreshHttpRevalidation).not.toHaveBeenCalled();
  });

  it('blocks launch status when raw AI prompt logging is enabled in production', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue(buildStatus());
    (getAiLaunchOperationalSummary as any).mockResolvedValueOnce({
      aiAssistantsEnabled: true,
      aiConfiguredModel: 'gemini-3.1-flash-lite',
      aiFallbackModel: 'gemini-explicit-fallback',
      aiFallbackModelState: 'configured_verified',
      aiFallbackModelConfigured: true,
      aiFallbackModelVerified: true,
      aiLastSuccessfulProviderSmokeAt: '2026-03-10T09:58:00.000Z',
      aiMonthlyCapSek: 250,
      aiHardCapConfigured: true,
      aiSpendThisMonthSek: 12.5,
      currentAiMonthToDateSpendSek: 12.5,
      aiMonthlyHardCapSek: 250,
      aiMonthlyHardCapPercentUsed: 5,
      aiMonthlyHardCapExhausted: false,
      aiBudgetState: 'raw_prompt_logging_blocked',
      aiRateLimitHealth: {
        ok: true,
        globalDailyLimit: 250,
        userDailyLimit: 20,
        orgDailyLimit: 50,
        defaultFeatureDailyLimit: 500,
        perFeatureDailyLimits: {},
        configurablePerFeatureLimits: true,
      },
      aiRawPromptLoggingEnabled: true,
    });

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.readinessState).toBe('blocked');
    expect(body.summary).toEqual(
      expect.objectContaining({
        aiAssistantsEnabled: true,
        aiConfiguredModel: 'gemini-3.1-flash-lite',
        aiFallbackModel: 'gemini-explicit-fallback',
        aiFallbackModelState: 'configured_verified',
        aiFallbackModelConfigured: true,
        aiFallbackModelVerified: true,
        aiLastSuccessfulProviderSmokeAt: '2026-03-10T09:58:00.000Z',
        aiMonthlyCapSek: 250,
        aiHardCapConfigured: true,
        aiSpendThisMonthSek: 12.5,
        currentAiMonthToDateSpendSek: 12.5,
        aiMonthlyHardCapSek: 250,
        aiMonthlyHardCapPercentUsed: 5,
        aiMonthlyHardCapExhausted: false,
        aiBudgetState: 'raw_prompt_logging_blocked',
        aiRawPromptLoggingEnabled: true,
      })
    );
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'ai_raw_prompt_logging_enabled',
        source: 'dependency',
        monitorKeys: ['ai_raw_prompt_logging'],
      }),
    ]);
  });

  it('blocks launch status when AI assistants are enabled without a monthly hard cap', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue(buildStatus());
    (getAiLaunchOperationalSummary as any).mockResolvedValueOnce({
      aiAssistantsEnabled: true,
      aiConfiguredModel: 'gemini-3.1-flash-lite',
      aiFallbackModel: null,
      aiFallbackModelState: 'unset',
      aiFallbackModelConfigured: false,
      aiFallbackModelVerified: false,
      aiLastSuccessfulProviderSmokeAt: null,
      aiMonthlyCapSek: null,
      aiHardCapConfigured: false,
      aiSpendThisMonthSek: 0,
      currentAiMonthToDateSpendSek: 0,
      aiMonthlyHardCapSek: null,
      aiMonthlyHardCapPercentUsed: null,
      aiMonthlyHardCapExhausted: false,
      aiBudgetState: 'cap_not_configured',
      aiRateLimitHealth: {
        ok: true,
        globalDailyLimit: 250,
        userDailyLimit: 20,
        orgDailyLimit: 50,
        defaultFeatureDailyLimit: 500,
        perFeatureDailyLimits: {},
        configurablePerFeatureLimits: true,
      },
      aiRawPromptLoggingEnabled: false,
    });

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.dependencies.aiBudget).toEqual(
      expect.objectContaining({
        ok: false,
        required: true,
        configured: false,
        state: 'cap_not_configured',
      })
    );
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'ai_budget_cap_not_configured',
        source: 'dependency',
        monitorKeys: ['ai_budget_cap'],
      }),
    ]);
  });

  it('blocks launch status when the AI monthly hard cap is exhausted', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue(buildStatus());
    (getAiLaunchOperationalSummary as any).mockResolvedValueOnce({
      aiAssistantsEnabled: true,
      aiConfiguredModel: 'gemini-3.1-flash-lite',
      aiFallbackModel: null,
      aiFallbackModelState: 'unset',
      aiFallbackModelConfigured: false,
      aiFallbackModelVerified: false,
      aiLastSuccessfulProviderSmokeAt: null,
      aiMonthlyCapSek: 160,
      aiHardCapConfigured: true,
      aiSpendThisMonthSek: 160,
      currentAiMonthToDateSpendSek: 160,
      aiMonthlyHardCapSek: 160,
      aiMonthlyHardCapPercentUsed: 100,
      aiMonthlyHardCapExhausted: true,
      aiBudgetState: 'exhausted',
      aiRateLimitHealth: {
        ok: true,
        globalDailyLimit: 250,
        userDailyLimit: 20,
        orgDailyLimit: 50,
        defaultFeatureDailyLimit: 500,
        perFeatureDailyLimits: {},
        configurablePerFeatureLimits: true,
      },
      aiRawPromptLoggingEnabled: false,
    });

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.dependencies.aiBudget).toEqual(
      expect.objectContaining({
        ok: false,
        required: true,
        configured: true,
        state: 'exhausted',
      })
    );
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'ai_budget_exhausted',
        source: 'dependency',
        monitorKeys: ['ai_budget_cap'],
      }),
    ]);
  });

  it('blocks launch status when production rate limiting dependency is missing', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('KV_REST_API_URL', '');
    vi.stubEnv('KV_REST_API_TOKEN', '');
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue(buildStatus());

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.readinessState).toBe('blocked');
    expect(body.dependencies.rateLimit).toEqual(
      expect.objectContaining({
        ok: false,
        required: true,
        configured: false,
        missing: ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
      })
    );
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'missing_rate_limit_dependency',
        source: 'dependency',
        monitorKeys: ['rate_limit_dependency'],
      }),
    ]);
  });

  it('blocks launch status when transactional email provider config is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue(buildStatus());

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.readinessState).toBe('blocked');
    expect(body.dependencies.emailProvider).toEqual(
      expect.objectContaining({
        ok: false,
        required: true,
        configured: false,
        missing: ['RESEND_API_KEY'],
        deliverySkipped: false,
        provider: 'resend',
      })
    );
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'missing_email_provider_dependency',
        source: 'dependency',
        monitorKeys: ['email_provider_dependency'],
      }),
    ]);
  });

  it('blocks launch status when transactional email delivery is explicitly skipped', async () => {
    vi.stubEnv('PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY', 'true');
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue(buildStatus());

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.readinessState).toBe('blocked');
    expect(body.dependencies.emailProvider).toEqual(
      expect.objectContaining({
        ok: false,
        required: true,
        configured: false,
        missing: [],
        deliverySkipped: true,
        provider: 'resend',
      })
    );
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'missing_email_provider_dependency',
        source: 'dependency',
        monitorKeys: ['email_provider_dependency'],
      }),
    ]);
  });

  it('blocks launch status when live target env contains forbidden bypass keys', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('KV_REST_API_URL', 'https://kv.example.test');
    vi.stubEnv('KV_REST_API_TOKEN', 'kv-token');
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('MOCK_PLATFORM_ROLE', 'platform_admin');
    vi.stubEnv('PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK', '1');
    vi.stubEnv('PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE', '1');
    vi.stubEnv('DEBUG_INGEST_URL', 'https://debug.example/ingest');
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue(buildStatus());

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.readinessState).toBe('blocked');
    expect(body.dependencies.forbiddenLiveLaunchEnv).toEqual(
      expect.objectContaining({
        ok: false,
        required: true,
        forbiddenKeys: expect.arrayContaining([
          'NEXT_PUBLIC_USE_MOCK_SUPABASE',
          'PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK',
          'PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE',
          'DEBUG_INGEST_URL',
          'MOCK_PLATFORM_ROLE',
        ]),
      })
    );
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'forbidden_launch_environment_config',
        source: 'dependency',
        monitorKeys: ['launch_environment_config'],
      }),
    ]);
  });

  it('blocks launch status when GCP OCR is enabled without an expiry date', async () => {
    vi.stubEnv('GCP_CV_OCR_ENABLED', 'true');
    vi.stubEnv('GCP_CV_OCR_EXPIRES_AT', '');
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue(buildStatus());

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.readinessState).toBe('blocked');
    expect(body.summary.gcpOcr).toEqual(
      expect.objectContaining({
        status: 'fallback',
        enabled: true,
        available: false,
        unavailableReason: 'missing_expiry',
      })
    );
    expect(body.dependencies.gcpOcr).toEqual(
      expect.objectContaining({
        ok: false,
        status: 'fallback',
        unavailableReason: 'missing_expiry',
      })
    );
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'gcp_ocr_missing_expiry',
        source: 'dependency',
        monitorKeys: ['gcp_ocr_governance'],
      }),
    ]);
  });

  it('refreshes stale persisted endpoint rows and returns ready when live checks recover', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue(
      buildStatus({
        ok: false,
        readinessState: 'blocked',
        rows: [
          buildMonitorRow({
            status: 'degraded',
            observedState: 'stale',
            failureClass: 'stale_monitor_result',
            freshnessState: 'stale',
            blocking: false,
            stale: true,
            refreshState: 'not_attempted',
          }),
        ],
      })
    );
    (getHttpMonitorKeysNeedingRefresh as any).mockReturnValue(['api_health']);
    (getLaunchSyntheticStatusWithFreshHttpRevalidation as any).mockResolvedValue(
      buildStatus({
        generatedAt: '2026-03-10T10:01:00.000Z',
        source: 'live',
        liveRefresh: buildLiveRefresh({
          attempted: true,
          refreshedMonitorKeys: ['api_health'],
          recoveredMonitorKeys: ['api_health'],
          finalHttpEvidenceSource: 'live',
        }),
        evidence: {
          source: 'live',
          artifactPath: '.artifacts/launch-smoke-report.json',
          smokeArtifactSchemaVersion: 2,
          smokeArtifactGeneratedAt: '2026-03-10T09:59:00.000Z',
          smokeArtifactAgeMinutes: 2,
          smokeFreshnessThresholdMinutes: 60,
          smokeFreshnessState: 'fresh',
          persisted: false,
        },
        rows: [
          buildMonitorRow({
            checkedAt: '2026-03-10T10:01:00.000Z',
            lastSuccessfulCheckedAt: '2026-03-10T10:01:00.000Z',
            evidenceSource: 'live',
            refreshState: 'refreshed_from_stale',
          }),
        ],
      })
    );

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.readinessState).toBe('ready');
    expect(body.liveRefresh).toEqual(
      expect.objectContaining({
        attempted: true,
        refreshedMonitorKeys: ['api_health'],
        recoveredMonitorKeys: ['api_health'],
        failedMonitorKeys: [],
        finalHttpEvidenceSource: 'live',
      })
    );
    expect(body.monitors[0]).toEqual(
      expect.objectContaining({
        monitorKey: 'api_health',
        evidenceSource: 'live',
        refreshState: 'refreshed_from_stale',
        lastSuccessfulCheckedAt: '2026-03-10T10:01:00.000Z',
      })
    );
    expect(body.notReadyReasons).toEqual([]);
  });

  it('returns blocked when the smoke artifact is stale', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue(
      buildStatus({
        ok: false,
        readinessState: 'blocked',
        evidence: {
          source: 'persisted',
          artifactPath: '.artifacts/launch-smoke-report.json',
          smokeArtifactSchemaVersion: 2,
          smokeArtifactGeneratedAt: '2026-03-10T08:45:00.000Z',
          smokeArtifactAgeMinutes: 75,
          smokeFreshnessThresholdMinutes: 60,
          smokeFreshnessState: 'stale',
          persisted: true,
        },
        rows: [
          buildMonitorRow(),
          buildMonitorRow({
            monitorKey: INDIVIDUAL_SMOKE_MONITOR_KEY,
            monitorGroup: 'synthetic-smoke',
            status: 'fail',
            expectedState: 'public_individual_portfolio_visible',
            observedState: 'smoke_artifact_stale',
            failureClass: 'smoke_artifact_stale',
            freshnessState: 'stale',
            blocking: true,
            stale: true,
            lastSuccessfulCheckedAt: '2026-03-10T07:30:00.000Z',
            refreshState: 'not_applicable',
          }),
        ],
      })
    );

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.readinessState).toBe('blocked');
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'stale_smoke_artifact',
        source: 'smoke_artifact',
        freshnessState: 'stale',
        liveRefreshAttempted: false,
        monitorKeys: [INDIVIDUAL_SMOKE_MONITOR_KEY],
        checkedAt: ['2026-03-10T10:00:00.000Z'],
        lastSuccessfulCheckedAt: ['2026-03-10T07:30:00.000Z'],
      }),
    ]);
  });

  it('returns blocked when the org smoke corridor is failing', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue(
      buildStatus({
        ok: false,
        readinessState: 'blocked',
        rows: [
          buildMonitorRow(),
          buildMonitorRow({
            monitorKey: ORG_SMOKE_MONITOR_KEY,
            monitorGroup: 'synthetic-smoke',
            status: 'fail',
            expectedState: 'full_org_corridor_review_to_engagement_verification_live',
            observedState: 'full_org_corridor_review_to_engagement_verification_live',
            failureClass: 'launch_corridor_failed',
            blocking: true,
            lastSuccessfulCheckedAt: '2026-03-09T10:00:00.000Z',
            refreshState: 'not_applicable',
          }),
        ],
      })
    );

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'smoke_corridor_failure',
        monitorKeys: [ORG_SMOKE_MONITOR_KEY],
        source: 'smoke_artifact',
        freshnessState: 'fresh',
      }),
    ]);
  });

  it('returns blocked when the smoke artifact is missing', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue(
      buildStatus({
        ok: false,
        readinessState: 'blocked',
        evidence: {
          source: 'persisted',
          artifactPath: '.artifacts/launch-smoke-report.json',
          smokeArtifactSchemaVersion: null,
          smokeArtifactGeneratedAt: null,
          smokeArtifactAgeMinutes: null,
          smokeFreshnessThresholdMinutes: 60,
          smokeFreshnessState: 'missing',
          persisted: true,
        },
        rows: [
          buildMonitorRow(),
          buildMonitorRow({
            monitorKey: INDIVIDUAL_SMOKE_MONITOR_KEY,
            monitorGroup: 'synthetic-smoke',
            status: 'fail',
            responseTimeMs: 0,
            expectedState: 'public_individual_portfolio_visible',
            observedState: 'smoke_artifact_missing',
            failureClass: 'smoke_artifact_missing',
            freshnessState: 'missing',
            blocking: true,
            stale: true,
            lastSuccessfulCheckedAt: null,
            refreshState: 'not_applicable',
          }),
        ],
      })
    );

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.freshness.smokeArtifactGeneratedAt).toBeNull();
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'missing_smoke_artifact',
        monitorKeys: [INDIVIDUAL_SMOKE_MONITOR_KEY],
        freshnessState: 'missing',
      }),
    ]);
  });

  it('keeps launch blocked when live endpoint refresh reproduces a real failure', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue(
      buildStatus({
        ok: false,
        readinessState: 'blocked',
        rows: [
          buildMonitorRow({
            status: 'degraded',
            observedState: 'stale',
            failureClass: 'stale_monitor_result',
            freshnessState: 'stale',
            blocking: false,
            stale: true,
          }),
        ],
      })
    );
    (getHttpMonitorKeysNeedingRefresh as any).mockReturnValue(['api_health']);
    (getLaunchSyntheticStatusWithFreshHttpRevalidation as any).mockResolvedValue(
      buildStatus({
        generatedAt: '2026-03-10T10:01:00.000Z',
        ok: false,
        readinessState: 'blocked',
        source: 'live',
        liveRefresh: buildLiveRefresh({
          attempted: true,
          refreshedMonitorKeys: ['api_health'],
          failedMonitorKeys: ['api_health'],
          finalHttpEvidenceSource: 'live',
        }),
        evidence: {
          source: 'live',
          artifactPath: '.artifacts/launch-smoke-report.json',
          smokeArtifactSchemaVersion: 2,
          smokeArtifactGeneratedAt: '2026-03-10T09:59:00.000Z',
          smokeArtifactAgeMinutes: 2,
          smokeFreshnessThresholdMinutes: 60,
          smokeFreshnessState: 'fresh',
          persisted: false,
        },
        rows: [
          buildMonitorRow({
            status: 'fail',
            observedState: 'missing_payload_key',
            failureClass: 'payload_contract_mismatch',
            blocking: true,
            lastSuccessfulCheckedAt: '2026-03-09T23:00:00.000Z',
            evidenceSource: 'live',
            refreshState: 'refreshed_from_stale',
          }),
        ],
      })
    );

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.readinessState).toBe('blocked');
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'live_endpoint_failure',
        monitorKeys: ['api_health'],
        source: 'live_http',
        freshnessState: 'fresh',
        liveRefreshAttempted: true,
      }),
    ]);
  });

  it('returns blocked stale persisted monitor evidence when live refresh fails entirely', async () => {
    const refreshError = new Error('network exploded');
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue(
      buildStatus({
        ok: false,
        readinessState: 'blocked',
        rows: [
          buildMonitorRow({
            status: 'degraded',
            observedState: 'stale',
            failureClass: 'stale_monitor_result',
            freshnessState: 'stale',
            blocking: false,
            stale: true,
            lastSuccessfulCheckedAt: '2026-03-09T23:00:00.000Z',
          }),
        ],
      })
    );
    (getHttpMonitorKeysNeedingRefresh as any).mockReturnValue(['api_health']);
    (getLaunchSyntheticStatusWithFreshHttpRevalidation as any).mockRejectedValue(refreshError);

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.liveRefresh).toEqual(
      expect.objectContaining({
        attempted: true,
        refreshedMonitorKeys: ['api_health'],
        failedMonitorKeys: ['api_health'],
        finalHttpEvidenceSource: 'persisted',
        error: 'network exploded',
      })
    );
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'stale_persisted_monitor_evidence',
        monitorKeys: ['api_health'],
        liveRefreshAttempted: true,
        source: 'persisted_http',
      }),
    ]);
    expect(log.error).toHaveBeenCalledWith('launch_status.live_refresh_failed', {
      error: refreshError,
      monitorKeys: ['api_health'],
    });
  });

  it('returns 500 when persisted monitor loading fails', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockRejectedValue(new Error('db exploded'));

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Failed to load launch status');
    expect(body.message).toBe('db exploded');
  });
});
