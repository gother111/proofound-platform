import type { OperationalFallbackMode } from '@/lib/contracts/launch-operations';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';

export const LAUNCH_ALERT_SEVERITY_VALUES = ['p1', 'p2'] as const;
export type LaunchAlertSeverity = (typeof LAUNCH_ALERT_SEVERITY_VALUES)[number];

export const LAUNCH_MONITOR_STATUS_VALUES = ['pass', 'degraded', 'fail'] as const;
export type LaunchMonitorStatus = (typeof LAUNCH_MONITOR_STATUS_VALUES)[number];

export const REQUIRED_SAFE_MODE_FLAGS = [
  FEATURE_FLAG_KEYS.QUALIFIED_INTRO_CORRIDOR,
  FEATURE_FLAG_KEYS.EXACT_RANK_EXPOSURE,
  FEATURE_FLAG_KEYS.KILL_SWITCH_INTROS,
  FEATURE_FLAG_KEYS.KILL_SWITCH_EXACT_RANK,
] as const;

export type LaunchSmokeScenario = {
  id:
    | 'first_proof_first_individual'
    | 'public_portfolio_publish'
    | 'privacy_reveal_enforcement'
    | 'assignment_publish'
    | 'intro_reveal_interview_decision'
    | 'engagement_verification';
  label: string;
  severity: LaunchAlertSeverity;
  testFiles: string[];
  expectedState: string;
  allowedFallbackModes?: OperationalFallbackMode[];
};

export const LAUNCH_SMOKE_MATRIX: LaunchSmokeScenario[] = [
  {
    id: 'first_proof_first_individual',
    label: 'First proof first individual corridor',
    severity: 'p1',
    testFiles: ['tests/actions/onboarding.test.ts'],
    expectedState: 'first_proof_first_corridor_live',
  },
  {
    id: 'public_portfolio_publish',
    label: 'Public portfolio publish',
    severity: 'p1',
    testFiles: ['tests/api/public-portfolio-summary-route.test.ts'],
    expectedState: 'public_portfolio_live',
    allowedFallbackModes: ['proof_building_weak_coverage', 'trust_pending_verification'],
  },
  {
    id: 'privacy_reveal_enforcement',
    label: 'Privacy and reveal enforcement',
    severity: 'p1',
    testFiles: [
      'tests/api/org-match-review-route.test.ts',
      'tests/lib/matching-review-contract.test.ts',
      'tests/lib/effective-visibility.test.ts',
    ],
    expectedState: 'privacy_and_reveal_enforced',
  },
  {
    id: 'assignment_publish',
    label: 'Assignment publish',
    severity: 'p2',
    testFiles: ['tests/lib/launch-assignment-publish-smoke.test.ts'],
    expectedState: 'assignment_published',
  },
  {
    id: 'intro_reveal_interview_decision',
    label: 'Intro reveal interview decision corridor',
    severity: 'p1',
    testFiles: [
      'tests/api/org-match-review-route.test.ts',
      'tests/api/interviews-schedule-route.test.ts',
      'tests/api/decisions-route.test.ts',
    ],
    expectedState: 'intro_reveal_interview_decision_live',
  },
  {
    id: 'engagement_verification',
    label: 'Engagement verification',
    severity: 'p2',
    testFiles: ['tests/lib/launch-engagement-verification-smoke.test.ts'],
    expectedState: 'engagement_verification_live',
  },
];

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
    payloadChecks: [{ key: 'status' }],
  },
  ...LAUNCH_SMOKE_MATRIX.map<LaunchMonitorDefinition>((scenario) => ({
    monitorKey: scenario.id,
    label: scenario.label,
    monitorGroup: 'synthetic-smoke',
    severity: scenario.severity,
    kind: 'smoke_artifact',
    smokeScenarioId: scenario.id,
    expectedState: scenario.expectedState,
    maxAgeMinutes: 24 * 60,
    alertAfterConsecutiveFailures: scenario.severity === 'p1' ? 1 : 2,
    failureClass: `${scenario.id}_regression`,
  })),
];
