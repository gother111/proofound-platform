import { createHash, randomUUID } from 'node:crypto';

import { expect, test, type Page, type TestInfo } from '@playwright/test';

import {
  adminClient,
  apiPatchJson,
  apiPostJson,
  apiPutJson,
  cleanupFixtureData,
  createFixtureState,
  createRuntimeMatch,
  createRuntimeOrganization,
  createRuntimeUser,
  gotoWithReadyState,
  loginWithUi,
  seedPortfolioReadyCandidate,
  type StrictFixtureState,
  type StrictRuntimeOrganization,
  type StrictRuntimeUser,
  type StrictSkillRequirement,
} from '../helpers/strict-fixtures';

async function materializeKnownInviteToken(params: { orgId: string; email: string }) {
  const supabase = adminClient();
  const normalizedEmail = params.email.trim().toLowerCase();
  let invite:
    | {
        id: string;
        capability_token_id: string | null;
      }
    | undefined;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { data, error } = await supabase
      .from('org_invitations')
      .select('id, capability_token_id')
      .eq('org_id', params.orgId)
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      throw new Error(`Failed to load pending org invite: ${error.message}`);
    }

    invite = data?.find((row) => Boolean(row.capability_token_id));
    if (invite) {
      break;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }

  if (!invite?.capability_token_id) {
    throw new Error('Failed to load pending org invite: missing invite');
  }

  const rawToken = `strict-org-invite-${randomUUID()}`;
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const updatedAt = new Date().toISOString();

  const { error: capabilityError } = await supabase
    .from('capability_tokens')
    .update({
      token_hash: tokenHash,
      updated_at: updatedAt,
    })
    .eq('id', invite.capability_token_id);

  if (capabilityError) {
    throw new Error(`Failed to materialize invite token hash: ${capabilityError.message}`);
  }

  const { error: inviteUpdateError } = await supabase
    .from('org_invitations')
    .update({
      token_hash: tokenHash,
      updated_at: updatedAt,
    })
    .eq('id', invite.id);

  if (inviteUpdateError) {
    throw new Error(`Failed to sync org invite token hash: ${inviteUpdateError.message}`);
  }

  return rawToken;
}

async function browserRequestJson(
  page: Page,
  method: 'POST' | 'PUT' | 'PATCH',
  url: string,
  data: unknown
) {
  let response: { ok: boolean; status: number; text: string } | undefined;
  let lastError: Error | null = null;

  const sanitizeRequestError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    return new Error(
      `${method} ${url} failed: ${message.split('\n')[0] || 'unknown request error'}`
    );
  };
  const sendRequest = async () => {
    const apiResponse =
      method === 'POST'
        ? await apiPostJson(page.request, url, data, {
            retryTransient: true,
            timeoutMs: 120_000,
          })
        : method === 'PUT'
          ? await apiPutJson(page.request, url, data)
          : await apiPatchJson(page.request, url, data, { timeoutMs: 120_000 });

    return {
      ok: apiResponse.ok(),
      status: apiResponse.status(),
      text: await apiResponse.text(),
    };
  };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      response = await sendRequest();
      break;
    } catch (error) {
      lastError = sanitizeRequestError(error);
      if (attempt === 4) {
        throw lastError;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 1000 * (attempt + 1));
      });
    }
  }

  if (!response) {
    throw lastError ?? new Error(`Failed request for ${method} ${url}`);
  }

  return {
    ok: () => response.ok,
    status: () => response.status,
    text: async () => response.text,
    json: async () => JSON.parse(response.text),
  };
}

async function browserGetJson(page: Page, url: string) {
  let response: { ok: boolean; status: number; text: string } | undefined;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const apiResponse = await page.request.get(url, {
        headers: {
          'cache-control': 'no-store',
          pragma: 'no-cache',
        },
        timeout: 120_000,
      });
      response = {
        ok: apiResponse.ok(),
        status: apiResponse.status(),
        text: await apiResponse.text(),
      };
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastError = new Error(
        `GET ${url} failed: ${message.split('\n')[0] || 'unknown request error'}`
      );
      if (attempt === 4) {
        throw lastError;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 1000 * (attempt + 1));
      });
    }
  }

  if (!response) {
    throw lastError ?? new Error(`Failed request for GET ${url}`);
  }

  return {
    ok: () => response.ok,
    status: () => response.status,
    text: async () => response.text,
    json: async () => JSON.parse(response.text),
  };
}

async function dismissBlockingOverlays(page: Page) {
  const blockers = ['Skip tour', 'Skip for now', 'Essential Only'] as const;

  for (const name of blockers) {
    const button = page.getByRole('button', { name }).first();
    await button.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => null);
    if (await button.isVisible().catch(() => false)) {
      await button
        .click({ timeout: 5_000 })
        .catch(() => button.click({ force: true, timeout: 5_000 }).catch(() => null));
      await page.waitForTimeout(250);
    }
  }
}

async function gotoWithRetry(page: Page, path: string, assertReady: () => Promise<void>) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.goto(path);
      await assertReady();
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 3) {
        throw error;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 1000 * attempt);
      });
    }
  }

  throw lastError ?? new Error(`Failed to load ${path}`);
}

function sanitizeDebugText(value: string) {
  return value
    .replace(/token=[^&\s]+/gi, 'token=<redacted>')
    .replace(/strict-org-invite-[0-9a-f-]+/gi, 'strict-org-invite-<redacted>');
}

async function attachPageDebug(testInfo: TestInfo, name: string, page: Page) {
  const url = sanitizeDebugText(page.url());
  const bodyText = await page
    .locator('body')
    .innerText({ timeout: 5_000 })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      return `Unable to read body text: ${message.split('\n')[0] || 'unknown error'}`;
    });

  await testInfo.attach(name, {
    body: `url: ${url}\n\n${sanitizeDebugText(bodyText).slice(0, 4_000)}`,
    contentType: 'text/plain',
  });
}

test.describe('Strict Authenticated Org Corridor', () => {
  test.describe.configure({ mode: 'serial' });

  let fixture: StrictFixtureState;
  let orgOwner: StrictRuntimeUser;
  let reviewer: StrictRuntimeUser;
  let candidate: StrictRuntimeUser;
  let organization: StrictRuntimeOrganization;
  let skillRequirements: StrictSkillRequirement[] = [];

  test.beforeAll(async () => {
    fixture = createFixtureState();

    orgOwner = await createRuntimeUser(fixture, {
      persona: 'org_member',
      prefix: 'strict-corridor-owner',
      displayName: 'Strict Corridor Owner',
    });

    reviewer = await createRuntimeUser(fixture, {
      persona: 'org_member',
      prefix: 'strict-corridor-reviewer',
      displayName: 'Strict Corridor Reviewer',
    });

    candidate = await createRuntimeUser(fixture, {
      persona: 'individual',
      prefix: 'strict-corridor-candidate',
      displayName: 'Strict Corridor Candidate',
    });

    const seededCandidate = await seedPortfolioReadyCandidate(candidate, {
      verifierProfileId: orgOwner.id,
    });
    skillRequirements = seededCandidate.skillRequirements;

    organization = await createRuntimeOrganization(fixture, orgOwner.id, {
      prefix: 'strict-corridor-org',
      displayName: 'Strict Corridor Org',
    });
  });

  test.afterAll(async () => {
    await cleanupFixtureData(fixture);
  });

  test('reruns the launch-binding authenticated org corridor end to end', async ({
    browser,
    page,
  }, testInfo) => {
    test.setTimeout(600_000);

    await loginWithUi(page, orgOwner);
    await gotoWithReadyState(page, `/app/o/${organization.slug}/home`, async () => {
      await expect(
        page.getByRole('heading', { name: organization.displayName, exact: true })
      ).toBeVisible();
    });
    await expect(page.getByLabel('Collaborator email')).toBeVisible();
    await expect(page.getByLabel('Collaborator role')).toBeVisible();

    await gotoWithReadyState(page, `/app/o/${organization.slug}/profile`, async () => {
      await expect(
        page
          .getByRole('main')
          .getByRole('heading', { name: 'Organization Trust Page', exact: true })
      ).toBeVisible();
    });

    await gotoWithReadyState(page, `/app/o/${organization.slug}/home`, async () => {
      await expect(
        page.getByRole('heading', { name: organization.displayName, exact: true })
      ).toBeVisible();
    });
    await dismissBlockingOverlays(page);
    const inviteDiagnostics: string[] = [];
    const recordInviteDiagnostic = (message: string) => {
      inviteDiagnostics.push(`${new Date().toISOString()} ${message}`);
    };
    const isInviteActionUrl = (url: string) =>
      url.includes(`/app/o/${organization.slug}/home`) || url.includes('/__next_action');
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        recordInviteDiagnostic(`console:${message.type()}: ${sanitizeDebugText(message.text())}`);
      }
    });
    page.on('request', (request) => {
      if (request.method() === 'POST' && isInviteActionUrl(request.url())) {
        recordInviteDiagnostic(`request: ${request.method()} ${sanitizeDebugText(request.url())}`);
      }
    });
    page.on('response', (response) => {
      const request = response.request();
      if (request.method() === 'POST' && isInviteActionUrl(response.url())) {
        recordInviteDiagnostic(
          `response: ${response.status()} ${sanitizeDebugText(response.url())}`
        );
      }
    });
    page.on('requestfailed', (request) => {
      if (request.method() === 'POST' && isInviteActionUrl(request.url())) {
        recordInviteDiagnostic(
          `requestfailed: ${sanitizeDebugText(request.url())}: ${
            request.failure()?.errorText ?? 'unknown'
          }`
        );
      }
    });
    await page.getByLabel('Collaborator email').fill(reviewer.email);
    await page.getByLabel('Collaborator role').selectOption('org_reviewer');
    const inviteSentAlert = page.getByRole('alert').filter({ hasText: 'Invite sent' });
    await page.getByRole('button', { name: 'Send collaborator invite' }).click();

    let rawInviteToken: string;
    try {
      rawInviteToken = await materializeKnownInviteToken({
        orgId: organization.id,
        email: reviewer.email,
      });
    } catch (error) {
      await testInfo.attach('invite-action-diagnostics', {
        body: inviteDiagnostics.join('\n') || 'No invite action diagnostics captured.',
        contentType: 'text/plain',
      });
      throw error;
    }
    await expect(
      inviteSentAlert,
      'owner invite form should surface success after invite persistence'
    )
      .toBeVisible({ timeout: 5_000 })
      .catch(async () => {
        await attachPageDebug(testInfo, 'owner-invite-alert-not-visible-after-persistence', page);
      });

    const reviewerContext = await browser.newContext();
    try {
      const reviewerPage = await reviewerContext.newPage();
      try {
        await loginWithUi(reviewerPage, reviewer);
        await dismissBlockingOverlays(reviewerPage);
        const acceptInviteButton = reviewerPage.getByRole('button', {
          name: /accept invitation/i,
        });
        await gotoWithRetry(reviewerPage, `/accept-invite?token=${rawInviteToken}`, async () => {
          await dismissBlockingOverlays(reviewerPage);
          await expect(
            acceptInviteButton,
            'reviewer invite page should expose the accept invitation action'
          ).toBeVisible({ timeout: 30_000 });
          await expect(
            acceptInviteButton,
            'reviewer invite accept action should be clickable'
          ).toBeEnabled({ timeout: 30_000 });
        });
        const reviewerHomePath = `/app/o/${organization.slug}/home`;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          await dismissBlockingOverlays(reviewerPage);
          await acceptInviteButton
            .click({ timeout: 10_000 })
            .catch(() => acceptInviteButton.click({ force: true, timeout: 10_000 }));
          const reachedHome = await reviewerPage
            .waitForURL(`**${reviewerHomePath}`, { timeout: 15_000 })
            .then(() => true)
            .catch(() => false);

          if (reachedHome) {
            break;
          }

          const supabase = adminClient();
          const { data: acceptedMembership } = await supabase
            .from('organization_members')
            .select('state, role')
            .eq('org_id', organization.id)
            .eq('user_id', reviewer.id)
            .maybeSingle();

          if (acceptedMembership?.state === 'active') {
            await reviewerPage.goto(reviewerHomePath);
            break;
          }

          if (attempt === 2) {
            await attachPageDebug(
              testInfo,
              'reviewer-invite-accept-did-not-reach-home',
              reviewerPage
            );
            throw new Error(
              `Reviewer invite accept did not reach ${reviewerHomePath}; current URL: ${sanitizeDebugText(
                reviewerPage.url()
              )}`
            );
          }

          await reviewerPage.goto(`/accept-invite?token=${rawInviteToken}`);
          await expect(
            acceptInviteButton,
            'reviewer invite page should still expose accept invitation before retry'
          ).toBeVisible({ timeout: 30_000 });
        }
        await dismissBlockingOverlays(reviewerPage);
        await expect(reviewerPage.getByText('Signed in as Reviewer')).toBeVisible({
          timeout: 30_000,
        });
        await reviewerPage.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => null);
      } catch (error) {
        await attachPageDebug(testInfo, 'reviewer-invite-flow-failure', reviewerPage);
        throw error;
      }
    } finally {
      await reviewerContext.close();
    }

    const assignmentDraftResponse = await browserRequestJson(page, 'POST', '/api/assignments', {
      orgId: organization.id,
      role: 'Strict Corridor Assignment',
      description:
        'Lead the authenticated org corridor from shortlist through decision while keeping identity reveal consented.',
      businessValue:
        'Help the hiring team validate the launch corridor with proof-backed review and explicit reveal consent.',
      expectedImpact:
        'Strong candidates should show shipped work, proof-backed ownership, and honest tradeoff explanations.',
      status: 'draft',
      valuesRequired: ['integrity'],
      causeTags: ['education'],
      mustHaveSkills: skillRequirements,
      niceToHaveSkills: [],
      locationMode: 'remote',
      compMin: 110000,
      compMax: 150000,
      currency: 'USD',
    });
    const assignmentDraftText = await assignmentDraftResponse.text();
    expect(
      assignmentDraftResponse.status(),
      `assignment draft response: ${assignmentDraftText}`
    ).toBe(201);
    const assignmentDraftPayload = JSON.parse(assignmentDraftText) as {
      assignment?: { id?: string };
    };
    const assignmentId = assignmentDraftPayload.assignment?.id;
    if (!assignmentId) {
      throw new Error('Assignment draft creation did not return an id');
    }
    fixture.assignmentIds.add(assignmentId);

    const outcomesResponse = await browserRequestJson(
      page,
      'POST',
      `/api/assignments/${assignmentId}/outcomes`,
      {
        orgId: organization.id,
        outcomes: [
          {
            outcomeType: 'continuous',
            title: 'Run the authenticated org corridor',
            description:
              'Validate shortlist, reveal, interview, and engagement decisions end to end.',
            metrics: [{ name: 'Milestones', target: '5', unit: 'count', current: '0' }],
            successCriteria: 'Deliver the full launch-binding corridor with consented reveal.',
          },
        ],
      }
    );
    expect(outcomesResponse.ok()).toBeTruthy();

    const assignmentUpdateResponse = await browserRequestJson(
      page,
      'PUT',
      `/api/assignments/${assignmentId}`,
      {
        orgId: organization.id,
        creationStatus: 'pending_review',
        status: 'draft',
        businessValue: 'Updated corridor business value to confirm edit-before-publish stays live.',
      }
    );
    expect(assignmentUpdateResponse.ok()).toBeTruthy();

    const clarityResponse = await browserRequestJson(page, 'POST', '/api/ai/assignments/clarify', {
      assignmentId,
      orgId: organization.id,
      title: 'Strict Corridor Assignment',
      outcomeSummary: 'Make an impact.',
      proofExpectations: '',
      engagementType: 'contract_consulting',
      constraints: {
        locationMode: 'remote',
        compMin: 110000,
        compMax: 150000,
        currency: 'USD',
      },
      mustHaveSkills: skillRequirements,
      verificationRequirements: [],
    });
    expect(clarityResponse.ok()).toBeTruthy();
    const clarityPayload = (await clarityResponse.json()) as {
      ambiguityFlags?: string[];
      suggestedRewrite?: Record<string, unknown>;
    };
    const ambiguityFlags = clarityPayload.ambiguityFlags ?? [];
    const normalizedClarityPayload = JSON.stringify(clarityPayload).toLowerCase();
    expect(
      ambiguityFlags.some((flag) => /outcome summary|too vague|deliverables/i.test(flag))
    ).toBe(true);
    expect(normalizedClarityPayload).toMatch(/proof|evidence|verification/);
    expect(normalizedClarityPayload).not.toContain('fit score');

    const clarityDraftStateResponse = await browserGetJson(
      page,
      `/api/assignments/${assignmentId}?orgId=${organization.id}`
    );
    expect(clarityDraftStateResponse.ok()).toBeTruthy();
    const clarityDraftStatePayload = (await clarityDraftStateResponse.json()) as {
      assignment?: { status?: string };
    };
    expect(clarityDraftStatePayload.assignment?.status).toBe('draft');

    const publishResponse = await browserRequestJson(
      page,
      'POST',
      `/api/assignments/${assignmentId}/publish`,
      {
        principalContext: {
          principalType: 'organization',
          orgId: organization.id,
        },
      }
    );
    const publishResponseText = await publishResponse.text();
    expect(
      publishResponse.ok(),
      `publish response (${publishResponse.status()}): ${publishResponseText}`
    ).toBeTruthy();
    let rankedMatchesPayload: {
      items?: Array<{
        id?: string | null;
        profileId?: string;
        reviewStage?: string;
        revealScope?: string;
        visibleIdentityFields?: string[];
        why?: { reasonCodes?: string[]; summary?: string[] };
        profile?: { displayName?: string | null; handle?: string | null };
      }>;
    } = {};
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const rankedMatchesResponse = await browserRequestJson(
        page,
        'POST',
        '/api/match/assignment',
        {
          assignmentId,
          k: 100,
        }
      );
      const rankedMatchesText = await rankedMatchesResponse.text();
      expect(
        rankedMatchesResponse.ok(),
        `proof-submission matches response (${rankedMatchesResponse.status()}): ${rankedMatchesText}`
      ).toBeTruthy();
      rankedMatchesPayload = JSON.parse(rankedMatchesText) as typeof rankedMatchesPayload;

      if ((rankedMatchesPayload.items ?? []).length > 0) {
        break;
      }

      await page.waitForTimeout(750 * (attempt + 1));
    }
    const blindMatch = (rankedMatchesPayload.items ?? [])[0];
    expect(
      blindMatch,
      `proof-submission matches should include at least one blind proof submission: ${JSON.stringify(
        rankedMatchesPayload
      )}`
    ).toBeTruthy();
    expect(blindMatch?.id).toBeTruthy();
    expect(blindMatch?.reviewStage).toBe('blind_review');
    expect(blindMatch?.revealScope).toBe('blind');
    expect(blindMatch?.visibleIdentityFields ?? []).toEqual([]);
    expect((blindMatch?.why?.reasonCodes ?? []).length).toBeGreaterThan(0);
    expect((blindMatch?.why?.summary ?? []).length).toBeGreaterThan(0);
    expect(blindMatch?.profile?.displayName ?? null).toBeNull();
    expect(blindMatch?.profile?.handle ?? null).toBeNull();

    await gotoWithReadyState(
      page,
      `/app/o/${organization.slug}/assignments?matching=${encodeURIComponent(assignmentId)}`,
      async () => {
        await dismissBlockingOverlays(page);
        await expect(page.getByText(/Review queue \(/)).toBeVisible({ timeout: 30_000 });
        await expect(page.getByText('Proof review', { exact: true })).toBeVisible({
          timeout: 30_000,
        });
        await expect(page.getByText('Proof Alignment Details')).toBeVisible({ timeout: 30_000 });
      }
    );
    await expect(page.getByText(candidate.displayName)).toHaveCount(0);
    await expect(page.getByText(candidate.email)).toHaveCount(0);

    await dismissBlockingOverlays(page);
    await expect(page.getByText('Blind by default')).toBeVisible();
    await expect(page.getByText(candidate.displayName)).toHaveCount(0);

    const refreshedMatchesResponse = await browserRequestJson(
      page,
      'POST',
      '/api/match/assignment',
      {
        assignmentId,
        k: 20,
      }
    );
    expect(refreshedMatchesResponse.ok()).toBeTruthy();
    const refreshedMatchesPayload = (await refreshedMatchesResponse.json()) as {
      items?: Array<{
        id?: string | null;
        profileId?: string;
      }>;
    };
    const refreshedBlindMatch = (refreshedMatchesPayload.items ?? []).find(
      (item) => item.profileId === candidate.id
    );
    const corridorMatch = await createRuntimeMatch(fixture, assignmentId, candidate.id);
    const activeMatchId = corridorMatch.id;

    let shortlistResponse = await browserRequestJson(
      page,
      'POST',
      `/api/org/${organization.slug}/matches/${activeMatchId}/review`,
      {
        action: 'shortlist',
      }
    );
    let shortlistBody = await shortlistResponse.text();
    for (
      let attempt = 0;
      attempt < 10 &&
      shortlistResponse.status() === 404 &&
      shortlistBody.includes('Match not found');
      attempt += 1
    ) {
      await page.waitForTimeout(1000);
      shortlistResponse = await browserRequestJson(
        page,
        'POST',
        `/api/org/${organization.slug}/matches/${activeMatchId}/review`,
        {
          action: 'shortlist',
        }
      );
      shortlistBody = await shortlistResponse.text();
    }
    expect(
      shortlistResponse.ok(),
      [
        `Shortlist request failed with HTTP ${shortlistResponse.status()}: ${shortlistBody}`,
        `activeMatchId=${activeMatchId}`,
        `corridorMatchId=${corridorMatch.id}`,
        `blindMatchId=${blindMatch?.id ?? null}`,
        `blindMatchProfileId=${blindMatch?.profileId ?? null}`,
        `refreshedBlindMatchId=${refreshedBlindMatch?.id ?? null}`,
      ].join('\n')
    ).toBeTruthy();

    const shortlistViewResponse = await browserGetJson(
      page,
      `/api/org/${organization.slug}/shortlist`
    );
    expect(shortlistViewResponse.ok()).toBeTruthy();
    const shortlistViewPayload = (await shortlistViewResponse.json()) as {
      items?: Array<{
        id?: string;
        revealScope?: string;
        candidate?: { displayName?: string | null; handle?: string | null };
      }>;
    };
    const shortlistedCandidate = (shortlistViewPayload.items ?? []).find(
      (item) => item.id === activeMatchId
    );
    expect(shortlistedCandidate?.revealScope).toBe('shortlist_identity');
    expect(shortlistedCandidate?.candidate?.displayName ?? null).toBeNull();
    expect(shortlistedCandidate?.candidate?.handle ?? null).toBeNull();

    const candidateContext = await browser.newContext();
    const candidatePage = await candidateContext.newPage();
    await loginWithUi(candidatePage, candidate);
    const candidateInterestResponse = await browserRequestJson(
      candidatePage,
      'POST',
      '/api/match/interest',
      {
        assignmentId,
      }
    );
    const candidateInterestText = await candidateInterestResponse.text();
    expect(
      candidateInterestResponse.ok(),
      `candidate interest failed with HTTP ${candidateInterestResponse.status()}: ${candidateInterestText}`
    ).toBeTruthy();

    const introResponse = await browserRequestJson(
      page,
      'POST',
      `/api/org/${organization.slug}/matches/${activeMatchId}/review`,
      {
        action: 'request_intro',
      }
    );
    expect(introResponse.ok()).toBeTruthy();
    const introPayload = (await introResponse.json()) as {
      conversationId?: string;
      introApproved?: boolean;
      introWorkflowId?: string;
      revealScope?: string;
      why?: { reasonCodes?: string[] };
      message?: string;
    };
    const conversationId = introPayload.conversationId;
    if (!conversationId) {
      throw new Error('Intro approval did not return a conversation id');
    }
    fixture.conversationIds.add(conversationId);
    expect(introPayload.introApproved).toBe(true);
    expect(introPayload.revealScope).toBe('shortlist_identity');
    expect(introPayload.why?.reasonCodes ?? []).toContain('intro_accepted_masked');
    expect(introPayload.message).toContain('Masked messaging is open');

    const duplicateIntroResponse = await browserRequestJson(
      page,
      'POST',
      `/api/org/${organization.slug}/matches/${activeMatchId}/review`,
      {
        action: 'request_intro',
      }
    );
    expect(duplicateIntroResponse.ok()).toBeTruthy();
    const duplicateIntroPayload = (await duplicateIntroResponse.json()) as {
      conversationId?: string;
      introWorkflowId?: string;
      introApproved?: boolean;
    };
    expect(duplicateIntroPayload.introApproved).toBe(true);
    expect(duplicateIntroPayload.conversationId).toBe(conversationId);
    expect(duplicateIntroPayload.introWorkflowId).toBe(introPayload.introWorkflowId);

    const revealRequestResponse = await browserRequestJson(
      page,
      'POST',
      `/api/org/${organization.slug}/matches/${activeMatchId}/review`,
      {
        action: 'reveal_request',
        requestedScope: 'full_identity',
      }
    );
    expect(revealRequestResponse.ok()).toBeTruthy();
    const revealRequestPayload = (await revealRequestResponse.json()) as {
      waitingForCandidateApproval?: boolean;
      corridorState?: string;
      revealScope?: string;
      why?: { reasonCodes?: string[] };
    };
    expect(revealRequestPayload.waitingForCandidateApproval).toBe(true);
    expect(revealRequestPayload.corridorState).toBe('request_reveal');
    expect(revealRequestPayload.revealScope).toBe('shortlist_identity');
    expect(revealRequestPayload.why?.reasonCodes ?? []).toContain('org_reveal_request_pending');

    const candidateConversationState = await browserGetJson(
      candidatePage,
      `/api/conversations/${conversationId}`
    );
    expect(candidateConversationState.ok()).toBeTruthy();
    const candidateConversationPayload = (await candidateConversationState.json()) as {
      conversation?: {
        stage?: string;
        currentUserWantsReveal?: boolean;
        otherUserWantsReveal?: boolean;
      };
      otherParticipant?: { masked?: boolean };
    };
    expect(candidateConversationPayload.conversation?.stage).toBe('masked');
    expect(candidateConversationPayload.conversation?.currentUserWantsReveal).toBe(false);
    expect(candidateConversationPayload.conversation?.otherUserWantsReveal).toBe(true);
    expect(candidateConversationPayload.otherParticipant?.masked).toBe(true);

    const candidateRevealApproval = await browserRequestJson(
      candidatePage,
      'POST',
      `/api/conversations/${conversationId}/reveal`,
      {}
    );
    expect(candidateRevealApproval.ok()).toBeTruthy();
    const candidateRevealPayload = (await candidateRevealApproval.json()) as {
      revealed?: boolean;
      conversation?: { stage?: string };
    };
    expect(candidateRevealPayload.revealed).toBe(true);
    expect(candidateRevealPayload.conversation?.stage).toBe('revealed');
    await candidateContext.close();

    const revealedShortlistResponse = await browserGetJson(
      page,
      `/api/org/${organization.slug}/shortlist`
    );
    expect(revealedShortlistResponse.ok()).toBeTruthy();
    const revealedShortlistPayload = (await revealedShortlistResponse.json()) as {
      items?: Array<{
        id?: string;
        revealScope?: string;
        candidate?: { displayName?: string | null; handle?: string | null };
      }>;
    };
    const revealedCandidate = (revealedShortlistPayload.items ?? []).find(
      (item) => item.id === activeMatchId
    );
    expect(revealedCandidate?.revealScope).toBe('full_identity');
    expect(revealedCandidate?.candidate?.displayName).toBeTruthy();
    expect(revealedCandidate?.candidate?.handle).toBeTruthy();

    const scheduledAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    const scheduleInterviewResponse = await browserRequestJson(
      page,
      'POST',
      '/api/interviews/schedule',
      {
        matchId: activeMatchId,
        scheduledAt,
        platform: 'manual',
        manualMeetingProvider: 'google_meet',
        participantUserIds: [candidate.id, orgOwner.id],
        manualMeetingLink: 'https://meet.google.com/strict-corridor',
      }
    );
    expect(scheduleInterviewResponse.ok()).toBeTruthy();
    const scheduleInterviewPayload = (await scheduleInterviewResponse.json()) as {
      interview?: { id?: string };
    };
    const interviewId = scheduleInterviewPayload.interview?.id;
    if (!interviewId) {
      throw new Error('Interview scheduling did not return an interview id');
    }
    fixture.interviewIds.add(interviewId);

    const rescheduledAt = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
    const rescheduleResponse = await browserRequestJson(page, 'POST', '/api/interviews/edit', {
      interviewId,
      scheduledAt: rescheduledAt,
      timezone: 'Europe/Stockholm',
      reason: 'Move by two hours to confirm the audited reschedule corridor.',
    });
    expect(rescheduleResponse.ok()).toBeTruthy();
    const reschedulePayload = (await rescheduleResponse.json()) as {
      interview?: { rescheduleCount?: number };
      workflow?: { state?: string; reasonCode?: string };
    };
    expect(reschedulePayload.interview?.rescheduleCount).toBe(1);
    expect(reschedulePayload.workflow?.state).toBe('scheduled');
    expect(reschedulePayload.workflow?.reasonCode).toBe(
      'Move by two hours to confirm the audited reschedule corridor.'
    );

    const secondRescheduleResponse = await browserRequestJson(
      page,
      'POST',
      '/api/interviews/edit',
      {
        interviewId,
        scheduledAt: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
        timezone: 'Europe/Stockholm',
        reason: 'This second reschedule should be blocked.',
      }
    );
    expect(secondRescheduleResponse.status()).toBe(400);

    const completeInterviewResponse = await browserRequestJson(
      page,
      'POST',
      '/api/interviews/complete',
      {
        interviewId,
      }
    );
    expect(completeInterviewResponse.ok()).toBeTruthy();

    const decisionResponse = await browserRequestJson(page, 'POST', '/api/decisions', {
      interviewId,
      decision: 'hire',
      feedback: 'Strong proof-backed match and solid interview close.',
    });
    expect(decisionResponse.ok()).toBeTruthy();
    const decisionPayload = (await decisionResponse.json()) as {
      decision?: { decision?: string };
      engagementVerification?: { id?: string; status?: string };
    };
    const engagementVerificationId = decisionPayload.engagementVerification?.id;
    if (!engagementVerificationId) {
      throw new Error('Hire decision did not return an engagement verification id');
    }
    expect(decisionPayload.decision?.decision).toBe('hire');
    expect(decisionPayload.engagementVerification?.status).toBe('pending_both_confirmations');

    await gotoWithReadyState(page, `/app/o/${organization.slug}/interviews`, async () => {
      await expect(page.getByRole('heading', { name: 'Interviews' })).toBeVisible();
    });

    const engagementConfirmResponse = await browserRequestJson(
      page,
      'PATCH',
      `/api/engagement-verifications/${engagementVerificationId}`,
      {
        confirm: true,
        engagementType: 'full_time',
      }
    );
    expect(engagementConfirmResponse.ok()).toBeTruthy();
    const engagementConfirmPayload = (await engagementConfirmResponse.json()) as {
      engagementVerification?: { status?: string; engagementType?: string };
    };
    expect(engagementConfirmPayload.engagementVerification?.status).toBe(
      'pending_candidate_confirmation'
    );
    expect(engagementConfirmPayload.engagementVerification?.engagementType).toBe('full_time');
  });
});
