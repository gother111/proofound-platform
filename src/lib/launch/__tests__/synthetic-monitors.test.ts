import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  executeMock: vi.fn(),
  getRowsMock: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: mocks.executeMock,
  },
}));

vi.mock('@/lib/db/rows', () => ({
  getRows: mocks.getRowsMock,
}));

import { getLatestLaunchSyntheticStatus } from '@/lib/launch/synthetic-monitors';

describe('getLatestLaunchSyntheticStatus', () => {
  beforeEach(() => {
    mocks.executeMock.mockReset();
    mocks.getRowsMock.mockReset();
  });

  it('filters out retired persisted monitor keys', async () => {
    mocks.executeMock.mockResolvedValue({});
    mocks.getRowsMock.mockReturnValue([
      {
        monitor_key: 'api_health',
        monitor_group: 'endpoint',
        status: 'pass',
        severity: 'p1',
        response_time_ms: 100,
        expected_state: 'health_contract_ok',
        observed_state: 'health_contract_ok',
        failure_class: null,
        checked_at: '2026-03-12T23:23:12.000Z',
        details: {},
      },
      {
        monitor_key: 'signup_auth',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p1',
        response_time_ms: 200,
        expected_state: 'auth_flow_completed',
        observed_state: 'auth_flow_completed',
        failure_class: null,
        checked_at: '2026-03-12T23:23:12.000Z',
        details: {},
      },
    ]);

    const result = await getLatestLaunchSyntheticStatus(new Date('2026-03-12T23:24:12.000Z'));

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.monitorKey).toBe('api_health');
    expect(result.missingMonitorKeys).not.toContain('api_health');
    expect(result.rows.some((row) => row.monitorKey === 'signup_auth')).toBe(false);
  });
});
