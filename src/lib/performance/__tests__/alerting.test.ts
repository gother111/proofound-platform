import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resendSend: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: mocks.resendSend,
    },
  })),
}));

vi.mock('@/db', () => ({
  db: {},
}));

import { sendAlertNotifications } from '../alerting';

const highViolation = {
  metric: 'app_route_load',
  route: '/app/i/home',
  threshold: 2000,
  actual: 4200,
  severity: 'high',
};

describe('performance alerting launch-ops links', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('uses the canonical internal ops URL for email alerts', async () => {
    vi.stubEnv('RESEND_API_KEY', 'resend-test-key');
    vi.stubEnv('PERFORMANCE_ALERT_EMAILS', 'ops@proofound.io');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://proofound.io/');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://legacy.example');

    await sendAlertNotifications([highViolation]);

    expect(mocks.resendSend).toHaveBeenCalledTimes(1);
    const payload = mocks.resendSend.mock.calls[0]?.[0];

    expect(payload.to).toEqual(['ops@proofound.io']);
    expect(payload.html).toContain('href="https://proofound.io/admin"');
    expect(payload.html).toContain('Open Internal Ops');
    expect(payload.html).not.toContain('NEXT_PUBLIC_APP_URL');
    expect(payload.html).not.toContain('undefined/admin');
    expect(payload.html).not.toContain('View Dashboard');
  });

  it('uses the canonical internal ops URL for Slack alerts', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('SLACK_PERFORMANCE_WEBHOOK_URL', 'https://hooks.example/slack');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://proofound.io/');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://legacy.example');

    await sendAlertNotifications([highViolation]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const action = body.blocks[2].elements[0];

    expect(action.text.text).toBe('Open Internal Ops');
    expect(action.url).toBe('https://proofound.io/admin');
    expect(JSON.stringify(body)).not.toContain('View Dashboard');
    expect(JSON.stringify(body)).not.toContain('undefined/admin');
  });

  it('falls back to a relative internal ops URL in production-like runtimes', async () => {
    vi.stubEnv('RESEND_API_KEY', 'resend-test-key');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('SITE_URL', '');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'production');

    await sendAlertNotifications([highViolation]);

    const payload = mocks.resendSend.mock.calls[0]?.[0];

    expect(payload.html).toContain('href="/admin"');
    expect(payload.html).not.toContain('undefined/admin');
    expect(payload.html).not.toContain('View Dashboard');
  });
});
