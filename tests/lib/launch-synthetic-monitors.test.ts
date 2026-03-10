import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { db } from '@/db';
import { getLatestLaunchSyntheticStatus } from '@/lib/launch/synthetic-monitors';

describe('launch synthetic monitor persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the latest monitor state when drizzle returns array rows', async () => {
    (db.execute as any).mockResolvedValue([
      {
        monitor_key: 'site_root',
        monitor_group: 'endpoint',
        status: 'pass',
        severity: 'p2',
        response_time_ms: 42,
        expected_state: 'landing_live',
        observed_state: 'landing_live',
        failure_class: null,
        checked_at: '2026-03-10T16:52:51.803Z',
        details: {},
      },
      {
        monitor_key: 'login_entry',
        monitor_group: 'endpoint',
        status: 'pass',
        severity: 'p1',
        response_time_ms: 51,
        expected_state: 'login_live',
        observed_state: 'login_live',
        failure_class: null,
        checked_at: '2026-03-10T16:52:54.501Z',
        details: {},
      },
      {
        monitor_key: 'api_health',
        monitor_group: 'endpoint',
        status: 'pass',
        severity: 'p1',
        response_time_ms: 80,
        expected_state: 'health_contract_ok',
        observed_state: 'health_contract_ok',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
      {
        monitor_key: 'signup_auth',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p1',
        response_time_ms: 100,
        expected_state: 'auth_flow_completed',
        observed_state: 'auth_flow_completed',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
      {
        monitor_key: 'portfolio_publish_render',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p1',
        response_time_ms: 100,
        expected_state: 'public_portfolio_live',
        observed_state: 'public_portfolio_live',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
      {
        monitor_key: 'assignment_publish',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p2',
        response_time_ms: 100,
        expected_state: 'assignment_published',
        observed_state: 'assignment_published',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
      {
        monitor_key: 'shortlist_generation',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p2',
        response_time_ms: 100,
        expected_state: 'shortlist_or_named_fallback',
        observed_state: 'shortlist_or_named_fallback',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
      {
        monitor_key: 'invite_redemption',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p1',
        response_time_ms: 100,
        expected_state: 'invite_redeemed',
        observed_state: 'invite_redeemed',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
      {
        monitor_key: 'verification_request',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p2',
        response_time_ms: 100,
        expected_state: 'verification_request_created',
        observed_state: 'verification_request_created',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
      {
        monitor_key: 'feedback_submission',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p2',
        response_time_ms: 100,
        expected_state: 'structured_feedback_submitted',
        observed_state: 'structured_feedback_submitted',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
      {
        monitor_key: 'export',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p1',
        response_time_ms: 100,
        expected_state: 'export_visible_and_safe',
        observed_state: 'export_visible_and_safe',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
      {
        monitor_key: 'delete_unpublish',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p1',
        response_time_ms: 100,
        expected_state: 'public_projection_removed',
        observed_state: 'public_projection_removed',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
    ]);

    const result = await getLatestLaunchSyntheticStatus(new Date('2026-03-10T16:53:25.057Z'));

    expect(result.rows).toHaveLength(12);
    expect(result.missingMonitorKeys).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
