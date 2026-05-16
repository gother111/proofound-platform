import type { OperationalFallbackMode } from '@/lib/contracts/launch-operations';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import {
  SEEDED_PUBLIC_ORG_TRUST_MONITOR_KEY,
  SEEDED_PUBLIC_ORG_TRUST_PATH,
  SEEDED_PUBLIC_ORG_TRUST_SLUG,
  shouldMonitorSeededPublicOrgTrustPage,
} from '@/lib/launch/public-org-trust-fixture';

export const LAUNCH_ALERT_SEVERITY_VALUES = ['p1', 'p2'] as const;
export type LaunchAlertSeverity = (typeof LAUNCH_ALERT_SEVERITY_VALUES)[number];

export const LAUNCH_MONITOR_STATUS_VALUES = ['pass', 'degraded', 'fail'] as const;
export type LaunchMonitorStatus = (typeof LAUNCH_MONITOR_STATUS_VALUES)[number];

export const LAUNCH_READINESS_STATE_VALUES = ['ready', 'blocked'] as const;
export type LaunchReadinessState = (typeof LAUNCH_READINESS_STATE_VALUES)[number];

export const LAUNCH_NOT_READY_REASON_CODE_VALUES = [
  'smoke_corridor_failure',
  'stale_smoke_artifact',
  'missing_smoke_artifact',
  'live_endpoint_failure',
  'stale_persisted_monitor_evidence',
  'missing_persisted_monitor_evidence',
  'missing_rate_limit_dependency',
  'missing_email_provider_dependency',
  'ai_raw_prompt_logging_enabled',
  'ai_budget_cap_not_configured',
  'ai_budget_exhausted',
] as const;
export type LaunchNotReadyReasonCode = (typeof LAUNCH_NOT_READY_REASON_CODE_VALUES)[number];

export const LAUNCH_NOT_READY_REASON_SOURCE_VALUES = [
  'smoke_artifact',
  'persisted_http',
  'live_http',
  'dependency',
] as const;
export type LaunchNotReadyReasonSource = (typeof LAUNCH_NOT_READY_REASON_SOURCE_VALUES)[number];

export type LaunchNotReadyReason = {
  code: LaunchNotReadyReasonCode;
  message: string;
  monitorKeys: string[];
  source: LaunchNotReadyReasonSource;
  freshnessState: LaunchSmokeFreshnessState;
  checkedAt: Array<string | null>;
  lastSuccessfulCheckedAt: Array<string | null>;
  liveRefreshAttempted: boolean;
};

export const LAUNCH_SMOKE_CORRIDOR_VALUES = [
  'individual',
  'organization',
  'trust_privacy',
] as const;
export type LaunchSmokeCorridor = (typeof LAUNCH_SMOKE_CORRIDOR_VALUES)[number];

export const LAUNCH_SMOKE_SCOPE_VALUES = ['repo', 'full'] as const;
export type LaunchSmokeScope = (typeof LAUNCH_SMOKE_SCOPE_VALUES)[number];

export const LAUNCH_SMOKE_FRESHNESS_STATE_VALUES = ['fresh', 'stale', 'missing'] as const;
export type LaunchSmokeFreshnessState = (typeof LAUNCH_SMOKE_FRESHNESS_STATE_VALUES)[number];

export const LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES = 60;

const LOCAL_LAUNCH_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function isLocalLaunchBaseUrl(baseUrl: string): boolean {
  try {
    const parsed = new URL(baseUrl);
    return LOCAL_LAUNCH_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function normalizeLaunchBaseUrl(rawBaseUrl: string): string {
  try {
    const parsed = new URL(rawBaseUrl);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return rawBaseUrl.trim().replace(/\/+$/, '');
  }
}

export const REQUIRED_SAFE_MODE_FLAGS = [
  FEATURE_FLAG_KEYS.QUALIFIED_INTRO_CORRIDOR,
  FEATURE_FLAG_KEYS.EXACT_RANK_EXPOSURE,
  FEATURE_FLAG_KEYS.KILL_SWITCH_INTROS,
  FEATURE_FLAG_KEYS.KILL_SWITCH_EXACT_RANK,
] as const;

export type LaunchSmokeScenario = {
  id:
    | 'public_individual_portfolio_visible'
    | 'proof_creation_case'
    | 'public_org_trust_fixture_live'
    | 'full_org_corridor_review_to_engagement_verification'
    | 'hidden_portfolio_protected'
    | 'privacy_no_leak_case';
  label: string;
  corridor: LaunchSmokeCorridor;
  severity: LaunchAlertSeverity;
  expectedState: string;
  allowedFallbackModes?: OperationalFallbackMode[];
  runner:
    | {
        kind: 'vitest';
        label: 'vitest';
        testFiles: string[];
      }
    | {
        kind: 'command';
        label: string;
        command: string[];
        preCommands?: Array<{
          label: string;
          command: string[];
        }>;
        env?: Record<string, string>;
      };
  evidence?: Record<string, string>;
};

export const LAUNCH_SMOKE_MATRIX: LaunchSmokeScenario[] = [
  {
    id: 'public_individual_portfolio_visible',
    label: 'Public individual portfolio visible case',
    corridor: 'individual',
    severity: 'p1',
    runner: {
      kind: 'vitest',
      label: 'vitest',
      testFiles: ['tests/ui/public-portfolio-access-consistency.test.tsx'],
    },
    expectedState: 'public_individual_portfolio_visible',
  },
  {
    id: 'proof_creation_case',
    label: 'Proof creation case',
    corridor: 'individual',
    severity: 'p1',
    runner: {
      kind: 'vitest',
      label: 'vitest',
      testFiles: ['tests/api/expertise-user-skill-proofs-route.test.ts'],
    },
    expectedState: 'proof_creation_case_live',
    allowedFallbackModes: ['proof_building_weak_coverage', 'trust_pending_verification'],
  },
  {
    id: 'public_org_trust_fixture_live',
    label: 'Seeded public org trust fixture live',
    corridor: 'organization',
    severity: 'p2',
    runner: {
      kind: 'command',
      label: 'seeded_public_org_trust_smoke',
      preCommands: [
        {
          label: 'seed_public_org_trust_fixture',
          command: ['npm', 'run', 'seed:public-org-trust-fixture'],
        },
      ],
      command: ['npm', 'run', 'test:e2e:org-trust:smoke'],
    },
    expectedState: 'public_org_trust_fixture_live',
    evidence: {
      fixtureSlug: SEEDED_PUBLIC_ORG_TRUST_SLUG,
      fixturePath: SEEDED_PUBLIC_ORG_TRUST_PATH,
    },
  },
  {
    id: 'full_org_corridor_review_to_engagement_verification',
    label: 'Full org corridor review to engagement verification case',
    corridor: 'organization',
    severity: 'p1',
    runner: {
      kind: 'command',
      label: 'strict_org_corridor_smoke',
      command: [
        'node',
        './scripts/playwright-node24.mjs',
        'test',
        'e2e/strict/org-corridor.strict.spec.ts',
        '--project=chromium',
        '--reporter=line',
        '--workers=1',
      ],
      env: {
        NEXT_PUBLIC_USE_MOCK_SUPABASE: 'false',
      },
    },
    expectedState: 'full_org_corridor_review_to_engagement_verification_live',
  },
  {
    id: 'hidden_portfolio_protected',
    label: 'Hidden portfolio protected case',
    corridor: 'trust_privacy',
    severity: 'p1',
    runner: {
      kind: 'vitest',
      label: 'vitest',
      testFiles: ['tests/ui/public-portfolio-access-consistency.test.tsx'],
    },
    expectedState: 'hidden_portfolio_protected',
  },
  {
    id: 'privacy_no_leak_case',
    label: 'Privacy no-leak case',
    corridor: 'trust_privacy',
    severity: 'p1',
    runner: {
      kind: 'vitest',
      label: 'vitest',
      testFiles: [
        'tests/api/org-match-review-route.test.ts',
        'tests/lib/effective-visibility.test.ts',
        'tests/lib/profile-fetcher.test.ts',
        'tests/api/conversation-reveal-route.test.ts',
      ],
    },
    expectedState: 'privacy_no_leak_enforced',
  },
];

export const REPO_READY_LAUNCH_SMOKE_SCENARIO_IDS = [
  'public_individual_portfolio_visible',
  'proof_creation_case',
  'public_org_trust_fixture_live',
  'hidden_portfolio_protected',
  'privacy_no_leak_case',
] as const satisfies readonly LaunchSmokeScenario['id'][];

export function getLaunchSmokeMatrix(scope: LaunchSmokeScope = 'full'): LaunchSmokeScenario[] {
  if (scope === 'full') {
    return LAUNCH_SMOKE_MATRIX;
  }

  const repoScenarioIds = new Set<string>(REPO_READY_LAUNCH_SMOKE_SCENARIO_IDS);
  return LAUNCH_SMOKE_MATRIX.filter((scenario) => repoScenarioIds.has(scenario.id));
}

export type LaunchMonitorDefinition =
  | {
      monitorKey: string;
      label: string;
      monitorGroup: 'endpoint' | 'synthetic-smoke';
      severity: LaunchAlertSeverity;
      kind: 'http';
      method: 'GET';
      path: string;
      expectedStatus: number;
      expectedState: string;
      maxAgeMinutes: number;
      alertAfterConsecutiveFailures: number;
      failureClass: string;
      payloadChecks?: Array<{ key: string; expectedValue?: string }>;
    }
  | {
      monitorKey: string;
      label: string;
      monitorGroup: 'endpoint' | 'synthetic-smoke';
      severity: LaunchAlertSeverity;
      kind: 'smoke_artifact';
      smokeScenarioId: LaunchSmokeScenario['id'];
      expectedState: string;
      maxAgeMinutes: number;
      alertAfterConsecutiveFailures: number;
      failureClass: string;
    };

export const LAUNCH_MONITOR_DEFINITIONS: LaunchMonitorDefinition[] = [
  {
    monitorKey: 'site_root',
    label: 'Landing page',
    monitorGroup: 'endpoint',
    severity: 'p2',
    kind: 'http',
    method: 'GET',
    path: '/',
    expectedStatus: 200,
    expectedState: 'landing_live',
    maxAgeMinutes: 30,
    alertAfterConsecutiveFailures: 2,
    failureClass: 'availability_regression',
  },
  {
    monitorKey: 'login_entry',
    label: 'Login route',
    monitorGroup: 'endpoint',
    severity: 'p1',
    kind: 'http',
    method: 'GET',
    path: '/login',
    expectedStatus: 200,
    expectedState: 'login_live',
    maxAgeMinutes: 30,
    alertAfterConsecutiveFailures: 1,
    failureClass: 'auth_entry_unavailable',
  },
  {
    monitorKey: 'api_health',
    label: 'Health endpoint',
    monitorGroup: 'endpoint',
    severity: 'p1',
    kind: 'http',
    method: 'GET',
    path: '/api/health',
    expectedStatus: 200,
    expectedState: 'health_contract_ok',
    maxAgeMinutes: 15,
    alertAfterConsecutiveFailures: 1,
    failureClass: 'health_contract_broken',
    payloadChecks: [{ key: 'status', expectedValue: 'ok' }],
  },
  ...(shouldMonitorSeededPublicOrgTrustPage()
    ? [
        {
          monitorKey: SEEDED_PUBLIC_ORG_TRUST_MONITOR_KEY,
          label: 'Seeded public org trust page',
          monitorGroup: 'endpoint',
          severity: 'p2',
          kind: 'http',
          method: 'GET',
          path: SEEDED_PUBLIC_ORG_TRUST_PATH,
          expectedStatus: 200,
          expectedState: 'seeded_public_org_trust_page_live',
          maxAgeMinutes: 30,
          alertAfterConsecutiveFailures: 2,
          failureClass: 'seeded_public_org_trust_page_unavailable',
        } satisfies LaunchMonitorDefinition,
      ]
    : []),
  ...LAUNCH_SMOKE_MATRIX.map<LaunchMonitorDefinition>((scenario) => ({
    monitorKey: scenario.id,
    label: scenario.label,
    monitorGroup: 'synthetic-smoke',
    severity: scenario.severity,
    kind: 'smoke_artifact',
    smokeScenarioId: scenario.id,
    expectedState: scenario.expectedState,
    maxAgeMinutes: LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES,
    alertAfterConsecutiveFailures: scenario.severity === 'p1' ? 1 : 2,
    failureClass: `${scenario.id}_regression`,
  })),
];
