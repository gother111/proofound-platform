import { expect, test } from '@playwright/test';
import {
  apiPostJson,
  cleanupFixtureData,
  createFixtureState,
  createRuntimeAssignment,
  createRuntimeMatch,
  createRuntimeOrganization,
  createRuntimeUser,
  getManagedProviderUser,
  loginWithUi,
  type StrictFixtureState,
  type StrictRuntimeAssignment,
  type StrictRuntimeMatch,
  type StrictRuntimeOrganization,
  type StrictRuntimeUser,
} from '../helpers/strict-fixtures';

test.describe('Strict MVP Provider Flows (Zoom, Google, LinkedIn)', () => {
  test.describe.configure({ mode: 'serial' });

  let fixture: StrictFixtureState;
  let providerUser: StrictRuntimeUser;
  let unconnectedUser: StrictRuntimeUser;
  let candidateUser: StrictRuntimeUser;
  let orgOwner: StrictRuntimeUser;
  let organization: StrictRuntimeOrganization;
  let noProviderAssignment: StrictRuntimeAssignment;
  let zoomAssignment: StrictRuntimeAssignment;
  let googleAssignment: StrictRuntimeAssignment;
  let noProviderMatch: StrictRuntimeMatch;
  let zoomMatch: StrictRuntimeMatch;
  let googleMatch: StrictRuntimeMatch;

  test.beforeAll(async () => {
    fixture = createFixtureState();
    const hasManagedProviderCredentials = Boolean(
      process.env.E2E_PROVIDER_USER_ID?.trim() &&
        process.env.E2E_PROVIDER_USER_EMAIL?.trim() &&
        process.env.E2E_PROVIDER_USER_PASSWORD?.trim()
    );

    providerUser = hasManagedProviderCredentials
      ? getManagedProviderUser()
      : await createRuntimeUser(fixture, {
          persona: 'individual',
          prefix: 'strict-provider-managed-fallback',
          displayName: 'Strict Provider Fallback User',
        });

    unconnectedUser = await createRuntimeUser(fixture, {
      persona: 'individual',
      prefix: 'strict-provider-unconnected',
      displayName: 'Strict Provider Unconnected User',
    });
    candidateUser = await createRuntimeUser(fixture, {
      persona: 'individual',
      prefix: 'strict-provider-candidate',
      displayName: 'Strict Provider Candidate',
    });
    orgOwner = await createRuntimeUser(fixture, {
      persona: 'org_member',
      prefix: 'strict-provider-org',
      displayName: 'Strict Provider Org',
    });
    organization = await createRuntimeOrganization(fixture, orgOwner.id, {
      prefix: 'strict-provider-org',
      displayName: 'Strict Provider Org',
    });
    noProviderAssignment = await createRuntimeAssignment(fixture, organization.id, {
      role: 'Strict Provider Assignment No Provider',
      status: 'active',
    });
    zoomAssignment = await createRuntimeAssignment(fixture, organization.id, {
      role: 'Strict Provider Assignment Zoom',
      status: 'active',
    });
    googleAssignment = await createRuntimeAssignment(fixture, organization.id, {
      role: 'Strict Provider Assignment Google',
      status: 'active',
    });

    noProviderMatch = await createRuntimeMatch(
      fixture,
      noProviderAssignment.id,
      unconnectedUser.id
    );
    zoomMatch = await createRuntimeMatch(fixture, zoomAssignment.id, providerUser.id);
    googleMatch = await createRuntimeMatch(fixture, googleAssignment.id, providerUser.id);
  });

  test.afterAll(async () => {
    await cleanupFixtureData(fixture);
  });

  test('Zoom connect redirects to provider and callback rejects invalid state', async ({
    page,
  }) => {
    await loginWithUi(page, providerUser);

    const connectResponse = await page.request.get('/api/integrations/zoom/connect', {
      maxRedirects: 0,
    });
    if (connectResponse.status() === 500) {
      const connectPayload = (await connectResponse.json()) as { error?: string };
      expect(connectPayload.error).toMatch(/failed to initiate zoom oauth|failed to initiate/i);
    } else {
      expect([302, 307]).toContain(connectResponse.status());
      const connectLocation = connectResponse.headers()['location'] ?? '';
      expect(connectLocation.toLowerCase()).toContain('zoom');
      expect(connectResponse.headers()['set-cookie'] ?? '').toContain('zoom_oauth_state=');
    }

    const invalidStateResponse = await page.request.get(
      '/api/integrations/zoom/callback?code=fake-code&state=invalid-state',
      {
        maxRedirects: 0,
      }
    );
    expect(invalidStateResponse.status()).toBe(200);
    const invalidStateHtml = await invalidStateResponse.text();
    expect(invalidStateHtml).toMatch(/Invalid or expired OAuth state|zoom_auth_failed/i);
  });

  test('Google connect redirects to provider and callback rejects invalid state', async ({
    page,
  }) => {
    await loginWithUi(page, providerUser);

    const connectResponse = await page.request.get('/api/integrations/google/connect', {
      maxRedirects: 0,
    });
    if (connectResponse.status() === 500) {
      const connectPayload = (await connectResponse.json()) as { error?: string };
      expect(connectPayload.error).toMatch(/failed to initiate google oauth|failed to initiate/i);
    } else {
      expect([302, 307]).toContain(connectResponse.status());
      const connectLocation = connectResponse.headers()['location'] ?? '';
      expect(connectLocation.toLowerCase()).toContain('google');
      expect(connectResponse.headers()['set-cookie'] ?? '').toContain('google_oauth_state=');
    }

    const invalidStateResponse = await page.request.get(
      '/api/integrations/google/callback?code=fake-code&state=invalid-state',
      {
        maxRedirects: 0,
      }
    );
    expect(invalidStateResponse.status()).toBe(200);
    const invalidStateHtml = await invalidStateResponse.text();
    expect(invalidStateHtml).toMatch(/Invalid or expired OAuth state|google_auth_failed/i);
  });

  test('LinkedIn connect redirects to provider and callback rejects invalid state', async ({
    page,
  }) => {
    await loginWithUi(page, providerUser);

    const connectResponse = await page.request.get('/api/auth/linkedin', {
      maxRedirects: 0,
    });
    expect([302, 307]).toContain(connectResponse.status());
    const connectLocation = connectResponse.headers()['location'] ?? '';
    const setCookieHeader = connectResponse.headers()['set-cookie'] ?? '';
    const hasLinkedInStateCookie =
      setCookieHeader.includes('linkedin_oauth_state=') &&
      setCookieHeader.includes('linkedin_oauth_user=');

    if (hasLinkedInStateCookie) {
      expect(connectLocation.toLowerCase()).toContain('linkedin');
      expect(setCookieHeader).toContain('linkedin_oauth_state=');
      expect(setCookieHeader).toContain('linkedin_oauth_user=');
    } else {
      expect(connectLocation).toContain('/app/i/settings');
      expect(connectLocation).toContain('linkedin_auth_failed');
    }

    const invalidStateResponse = await page.request.get(
      '/api/auth/linkedin/callback?code=fake-code&state=invalid-state',
      {
        maxRedirects: 0,
      }
    );
    expect([302, 307]).toContain(invalidStateResponse.status());
    const redirectLocation = invalidStateResponse.headers()['location'] ?? '';
    expect(redirectLocation).toContain('/app/i/settings');
    expect(redirectLocation).toContain('linkedin_auth_failed');
  });

  test('Provider schedule fails without connected integration token', async ({ page }) => {
    await loginWithUi(page, orgOwner);

    const scheduleZoomResponse = await apiPostJson(page.request, '/api/interviews/schedule', {
      matchId: noProviderMatch.id,
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
      platform: 'zoom',
      participantUserIds: [unconnectedUser.id, orgOwner.id],
    });
    expect(scheduleZoomResponse.status()).toBe(400);
    const scheduleZoomPayload = (await scheduleZoomResponse.json()) as { error?: string };
    expect(scheduleZoomPayload.error).toMatch(/not connected/i);
  });

  test('Live provider scheduling contract requires connected provider in strict mode', async ({
    page,
  }) => {
    const hasManagedProviderCredentials = Boolean(
      process.env.E2E_PROVIDER_USER_ID?.trim() &&
        process.env.E2E_PROVIDER_USER_EMAIL?.trim() &&
        process.env.E2E_PROVIDER_USER_PASSWORD?.trim()
    );
    const requireConnected = process.env.STRICT_PROVIDER_E2E_REQUIRE_CONNECTED === 'true';
    const requireBoth = process.env.STRICT_PROVIDER_E2E_REQUIRE_BOTH === 'true';

    if (!hasManagedProviderCredentials && !requireConnected && !requireBoth) {
      return;
    }

    await loginWithUi(page, providerUser);

    const statusResponse = await page.request.get('/api/integrations/video/status');
    expect(statusResponse.ok()).toBeTruthy();
    const statusPayload = (await statusResponse.json()) as {
      zoom?: { connected?: boolean };
      google?: { connected?: boolean };
    };

    const zoomConnected = statusPayload.zoom?.connected === true;
    const googleConnected = statusPayload.google?.connected === true;
    const hasConnectedProvider = zoomConnected || googleConnected;

    if (requireBoth && (!zoomConnected || !googleConnected)) {
      throw new Error(
        'Strict provider gate requires both connected providers (Zoom and Google). ' +
          'Connect deterministic staging accounts and set E2E_PROVIDER_USER_* to that user.'
      );
    }

    if (!hasConnectedProvider && requireConnected && !requireBoth) {
      throw new Error(
        'Strict provider gate requires at least one connected provider (Zoom or Google). ' +
          'Connect a deterministic staging provider account or set STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=false for diagnostic runs.'
      );
    }

    if (!hasConnectedProvider) {
      return;
    }

    const scheduleAndAssertMeeting = async (
      matchId: string,
      platform: 'zoom' | 'google_meet',
      hourOffset: number
    ) => {
      const scheduleResponse = await apiPostJson(page.request, '/api/interviews/schedule', {
        matchId,
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * hourOffset).toISOString(),
        platform,
        participantUserIds: [providerUser.id, candidateUser.id],
      });

      expect(scheduleResponse.ok()).toBeTruthy();
      const schedulePayload = (await scheduleResponse.json()) as {
        interview?: { id?: string; meeting_link?: string; meetingLink?: string };
      };
      if (schedulePayload.interview?.id) {
        fixture.interviewIds.add(schedulePayload.interview.id);
      }
      const meetingLink =
        schedulePayload.interview?.meetingLink ?? schedulePayload.interview?.meeting_link ?? '';
      expect(typeof meetingLink).toBe('string');
      expect(meetingLink.length).toBeGreaterThan(10);
    };

    if (zoomConnected) {
      await scheduleAndAssertMeeting(zoomMatch.id, 'zoom', 5);
    }

    if (googleConnected) {
      await scheduleAndAssertMeeting(googleMatch.id, 'google_meet', 6);
    }
  });
});
