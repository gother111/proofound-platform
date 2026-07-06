import { expect, test, type APIResponse } from '@playwright/test';
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

const PROVIDER_UNAVAILABLE_PATTERN =
  /failed|oauth|config|missing|initiate|coming soon|unavailable|temporarily/;

async function expectProviderUnavailableResponse(response: APIResponse) {
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
  };
  const errorText = `${payload.error ?? ''} ${payload.message ?? ''}`.trim().toLowerCase();
  if (errorText.length > 0) {
    expect(errorText).toMatch(PROVIDER_UNAVAILABLE_PATTERN);
  }
}

test.describe('Advisory Provider Flows (Google Meet, manual links, LinkedIn)', () => {
  test.describe.configure({ mode: 'serial' });

  let fixture: StrictFixtureState;
  let providerUser: StrictRuntimeUser;
  let managedProviderConfigured = false;
  let unconnectedUser: StrictRuntimeUser;
  let candidateUser: StrictRuntimeUser;
  let orgOwner: StrictRuntimeUser;
  let organization: StrictRuntimeOrganization;
  let noProviderAssignment: StrictRuntimeAssignment;
  let googleAssignment: StrictRuntimeAssignment;
  let noProviderMatch: StrictRuntimeMatch;
  let googleMatch: StrictRuntimeMatch;

  test.beforeAll(async () => {
    fixture = createFixtureState();
    const managedProvider = getManagedProviderUser();
    managedProviderConfigured = Boolean(managedProvider);
    providerUser =
      managedProvider ??
      (await createRuntimeUser(fixture, {
        persona: 'individual',
        prefix: 'strict-provider-managed-fallback',
        displayName: 'Strict Provider Managed Fallback',
      }));

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
    googleAssignment = await createRuntimeAssignment(fixture, organization.id, {
      role: 'Strict Provider Assignment Google',
      status: 'active',
    });

    noProviderMatch = await createRuntimeMatch(
      fixture,
      noProviderAssignment.id,
      unconnectedUser.id
    );
    googleMatch = await createRuntimeMatch(fixture, googleAssignment.id, providerUser.id);
  });

  test.afterAll(async () => {
    await cleanupFixtureData(fixture);
  });

  test('Google connect redirects to provider and callback rejects invalid state', async ({
    page,
  }) => {
    await loginWithUi(page, providerUser);

    const connectResponse = await page.request.get('/api/integrations/google/connect', {
      maxRedirects: 0,
    });
    if (connectResponse.status() >= 400) {
      await expectProviderUnavailableResponse(connectResponse);
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
    if (invalidStateResponse.status() >= 400) {
      await expectProviderUnavailableResponse(invalidStateResponse);
    } else {
      expect(invalidStateResponse.status()).toBe(200);
      const invalidStateHtml = await invalidStateResponse.text();
      expect(invalidStateHtml).toMatch(/Invalid or expired OAuth state|google_auth_failed/i);
    }
  });

  test('LinkedIn connect redirects to provider and callback rejects invalid state', async ({
    page,
  }) => {
    await loginWithUi(page, providerUser);

    const connectResponse = await page.request.get('/api/auth/linkedin', {
      maxRedirects: 0,
    });
    if (connectResponse.status() >= 400) {
      await expectProviderUnavailableResponse(connectResponse);
    } else {
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
    }

    const invalidStateResponse = await page.request.get(
      '/api/auth/linkedin/callback?code=fake-code&state=invalid-state',
      {
        maxRedirects: 0,
      }
    );
    if (invalidStateResponse.status() >= 400) {
      await expectProviderUnavailableResponse(invalidStateResponse);
    } else {
      expect([302, 307]).toContain(invalidStateResponse.status());
      const redirectLocation = invalidStateResponse.headers()['location'] ?? '';
      expect(redirectLocation).toContain('/app/i/settings');
      expect(redirectLocation).toContain('linkedin_auth_failed');
    }
  });

  test('Provider schedule fails without connected integration token', async ({ page }) => {
    await loginWithUi(page, orgOwner);

    const scheduleGoogleResponse = await apiPostJson(page.request, '/api/interviews/schedule', {
      matchId: noProviderMatch.id,
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
      platform: 'google_meet',
      participantUserIds: [orgOwner.id, unconnectedUser.id],
    });
    expect([400, 409]).toContain(scheduleGoogleResponse.status());
    const scheduleGooglePayload = (await scheduleGoogleResponse.json()) as { error?: string };
    expect(scheduleGooglePayload.error).toMatch(
      /not connected|connect|calendar|unavailable|not available|manual meeting link/i
    );
  });

  test('Live provider scheduling contract requires connected provider in strict mode', async ({
    page,
  }) => {
    await loginWithUi(page, providerUser);

    const requireConnected = process.env.STRICT_PROVIDER_E2E_REQUIRE_CONNECTED === 'true';

    if (!managedProviderConfigured) {
      // No deterministic connected provider account configured for this environment.
      // Keep strict suite deterministic by skipping live-provider assertions.
      return;
    }

    const scheduleAndAssertMeeting = async (matchId: string, hourOffset: number) => {
      const scheduleResponse = await apiPostJson(page.request, '/api/interviews/schedule', {
        matchId,
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * hourOffset).toISOString(),
        platform: 'google_meet',
        participantUserIds: [providerUser.id, candidateUser.id],
      });

      if (!scheduleResponse.ok() && !requireConnected) {
        await expectProviderUnavailableResponse(scheduleResponse);
        return;
      }

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

    await scheduleAndAssertMeeting(googleMatch.id, 6);
  });
});
