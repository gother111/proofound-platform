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
    | 'signup_auth'
    | 'portfolio_publish_render'
    | 'assignment_publish'
    | 'shortlist_generation'
    | 'invite_redemption'
    | 'verification_request'
    | 'feedback_submission'
    | 'export'
    | 'delete_unpublish';
  label: string;
  severity: LaunchAlertSeverity;
  testFiles: string[];
  expectedState: string;
  allowedFallbackModes?: OperationalFallbackMode[];
};

export const LAUNCH_SMOKE_MATRIX: LaunchSmokeScenario[] = [
  {
    id: 'signup_auth',
    label: 'Signup and auth',
    severity: 'p1',
    testFiles: ['tests/actions/auth.test.ts'],
    expectedState: 'auth_flow_completed',
  },
  {
    id: 'portfolio_publish_render',
    label: 'Portfolio publish and render',
    severity: 'p1',
    testFiles: [
      'tests/actions/onboarding.test.ts',
      'tests/api/public-portfolio-summary-route.test.ts',
    ],
    expectedState: 'public_portfolio_live',
    allowedFallbackModes: ['proof_building_weak_coverage', 'trust_pending_verification'],
  },
  {
    id: 'assignment_publish',
    label: 'Assignment publish',
    severity: 'p2',
    testFiles: ['tests/api/assignments-publish-route.test.ts'],
    expectedState: 'assignment_published',
  },
  {
    id: 'shortlist_generation',
    label: 'Shortlist generation or named fallback',
    severity: 'p2',
    testFiles: ['tests/api/core-matching-assignment-route.test.ts'],
    expectedState: 'shortlist_or_named_fallback',
    allowedFallbackModes: [
      'browse_only_low_candidate_supply',
      'fairness_suppressed_ranking',
      'intro_hold_insufficient_qualified_intros',
    ],
  },
  {
    id: 'invite_redemption',
    label: 'Invite redemption',
    severity: 'p1',
    testFiles: ['tests/api/candidate-invite-claim-route.test.ts'],
    expectedState: 'invite_redeemed',
  },
  {
    id: 'verification_request',
    label: 'Verification request',
    severity: 'p2',
    testFiles: ['tests/api/verification-skill-request-route.test.ts'],
    expectedState: 'verification_request_created',
    allowedFallbackModes: ['trust_pending_verification'],
  },
  {
    id: 'feedback_submission',
    label: 'Feedback submission',
    severity: 'p2',
    testFiles: ['tests/api/feedback-submit-route.test.ts'],
    expectedState: 'structured_feedback_submitted',
  },
  {
    id: 'export',
    label: 'Export visibility',
    severity: 'p1',
    testFiles: [
      'tests/api/portfolio-export-route.test.ts',
      'tests/api/portfolio-org-export-route.test.ts',
      'tests/api/public-portfolio-export-route.test.ts',
    ],
    expectedState: 'export_visible_and_safe',
  },
  {
    id: 'delete_unpublish',
    label: 'Delete and unpublish',
    severity: 'p1',
    testFiles: ['tests/lib/lifecycle-reconciliation.test.ts'],
    expectedState: 'public_projection_removed',
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
