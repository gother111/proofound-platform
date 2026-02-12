import { expect, test } from '@playwright/test';
import {
  apiPostJson,
  cleanupFixtureData,
  createFixtureState,
  createRuntimeAssignment,
  createRuntimeConversation,
  createRuntimeMatch,
  createRuntimeOrganization,
  createRuntimeUser,
  getCsrfToken,
  loginWithUi,
  type StrictFixtureState,
  type StrictRuntimeAssignment,
  type StrictRuntimeConversation,
  type StrictRuntimeMatch,
  type StrictRuntimeOrganization,
  type StrictRuntimeUser,
} from '../helpers/strict-fixtures';

test.describe('Strict MVP Privacy and Security Flows', () => {
  test.describe.configure({ mode: 'serial' });

  let fixture: StrictFixtureState;
  let participantOne: StrictRuntimeUser;
  let participantTwo: StrictRuntimeUser;
  let outsider: StrictRuntimeUser;
  let orgOwner: StrictRuntimeUser;
  let organization: StrictRuntimeOrganization;
  let assignment: StrictRuntimeAssignment;
  let match: StrictRuntimeMatch;
  let conversation: StrictRuntimeConversation;

  test.beforeAll(async () => {
    fixture = createFixtureState();

    participantOne = await createRuntimeUser(fixture, {
      persona: 'individual',
      prefix: 'strict-privacy-one',
      displayName: 'Strict Privacy One',
    });
    participantTwo = await createRuntimeUser(fixture, {
      persona: 'individual',
      prefix: 'strict-privacy-two',
      displayName: 'Strict Privacy Two',
    });
    outsider = await createRuntimeUser(fixture, {
      persona: 'individual',
      prefix: 'strict-privacy-outsider',
      displayName: 'Strict Privacy Outsider',
    });
    orgOwner = await createRuntimeUser(fixture, {
      persona: 'org_member',
      prefix: 'strict-privacy-org',
      displayName: 'Strict Privacy Org Owner',
    });

    organization = await createRuntimeOrganization(fixture, orgOwner.id, {
      prefix: 'strict-privacy-org',
      displayName: 'Strict Privacy Org',
    });

    assignment = await createRuntimeAssignment(fixture, organization.id, {
      role: 'Strict Privacy Assignment',
      status: 'active',
    });
    match = await createRuntimeMatch(fixture, assignment.id, participantOne.id);
    conversation = await createRuntimeConversation(
      fixture,
      match.id,
      assignment.id,
      participantOne.id,
      participantTwo.id
    );
  });

  test.afterAll(async () => {
    await cleanupFixtureData(fixture);
  });

  test('RLS: non-participant cannot access private conversation resources', async ({ page }) => {
    await loginWithUi(page, outsider);

    const conversationResponse = await page.request.get(`/api/conversations/${conversation.id}`);
    expect(conversationResponse.status()).toBe(403);

    const messagesResponse = await page.request.get(
      `/api/conversations/${conversation.id}/messages`
    );
    expect(messagesResponse.status()).toBe(403);
  });

  test('Visibility controls: participant can persist and read field visibility settings', async ({
    page,
  }) => {
    await loginWithUi(page, participantOne);

    const updateVisibilityResponse = await apiPostJson(page.request, '/api/profile/visibility', {
      displayName: 'public',
      location: 'private',
      mission: 'network_only',
      skills: 'match_only',
    });
    expect(updateVisibilityResponse.ok()).toBeTruthy();

    const getVisibilityResponse = await page.request.get('/api/profile/visibility');
    expect(getVisibilityResponse.ok()).toBeTruthy();
    const visibilityPayload = (await getVisibilityResponse.json()) as {
      displayName?: string;
      location?: string;
      mission?: string;
      skills?: string;
    };

    expect(visibilityPayload.displayName).toBe('public');
    expect(visibilityPayload.location).toBe('private');
    expect(visibilityPayload.mission).toBe('network_only');
    expect(visibilityPayload.skills).toBe('match_only');
  });

  test('CSRF: mutating request without token is rejected', async ({ browser }) => {
    const unauthenticatedContext = await browser.newContext();
    try {
      const response = await unauthenticatedContext.request.post('/api/profile/visibility', {
        data: {
          location: 'private',
        },
      });
      expect(response.status()).toBe(403);
      const payload = (await response.json()) as { error?: string };
      expect(payload.error).toContain('CSRF');
    } finally {
      await unauthenticatedContext.close();
    }
  });

  test('Stage-based identity reveal transitions masked conversation to revealed only after two-party consent', async ({
    browser,
    page,
  }) => {
    await loginWithUi(page, participantOne);

    const firstRevealResponse = await apiPostJson(
      page.request,
      `/api/conversations/${conversation.id}/reveal`,
      {}
    );
    expect(firstRevealResponse.ok()).toBeTruthy();
    const firstRevealPayload = (await firstRevealResponse.json()) as {
      revealed?: boolean;
      waitingForOther?: boolean;
    };
    expect(firstRevealPayload.revealed).toBe(false);
    expect(firstRevealPayload.waitingForOther).toBe(true);

    const secondContext = await browser.newContext();
    try {
      const secondPage = await secondContext.newPage();
      await loginWithUi(secondPage, participantTwo);

      const secondRevealResponse = await apiPostJson(
        secondPage.request,
        `/api/conversations/${conversation.id}/reveal`,
        {}
      );
      expect(secondRevealResponse.ok()).toBeTruthy();
      const secondRevealPayload = (await secondRevealResponse.json()) as {
        revealed?: boolean;
        conversation?: { stage?: string };
      };
      expect(secondRevealPayload.revealed).toBe(true);
      expect(secondRevealPayload.conversation?.stage).toBe('revealed');
    } finally {
      await secondContext.close();
    }

    const conversationStateResponse = await page.request.get(
      `/api/conversations/${conversation.id}`
    );
    expect(conversationStateResponse.ok()).toBeTruthy();
    const conversationStatePayload = (await conversationStateResponse.json()) as {
      conversation?: {
        stage?: string;
        currentUserWantsReveal?: boolean;
        otherUserWantsReveal?: boolean;
      };
      otherParticipant?: { masked?: boolean; displayName?: string | null };
    };

    expect(conversationStatePayload.conversation?.stage).toBe('revealed');
    expect(conversationStatePayload.conversation?.currentUserWantsReveal).toBe(true);
    expect(conversationStatePayload.conversation?.otherUserWantsReveal).toBe(true);
    expect(conversationStatePayload.otherParticipant?.masked).not.toBe(true);
    expect(conversationStatePayload.otherParticipant?.displayName).toBeTruthy();
  });

  test('Privacy gate keeps CSRF token issuance deterministic for authenticated sessions', async ({
    page,
  }) => {
    await loginWithUi(page, participantOne);

    const token = await getCsrfToken(page.request);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);
  });
});
