import { createHash, randomUUID } from 'node:crypto';

import { expect, test, type Page } from '@playwright/test';

import {
  adminClient,
  apiPostJson,
  apiPutJson,
  cleanupFixtureData,
  createFixtureState,
  createRuntimeMatch,
  createRuntimeOrganization,
  createRuntimeUser,
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
  const response = await page.evaluate(
    async ({ requestUrl, requestMethod, requestData }) => {
      const csrfResponse = await fetch(`/api/csrf-token?ts=${Date.now()}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'cache-control': 'no-store',
          pragma: 'no-cache',
        },
      });

      const csrfPayload = (await csrfResponse.json()) as { token?: string };
      if (!csrfResponse.ok || !csrfPayload.token) {
        throw new Error(`Failed to fetch browser CSRF token: HTTP ${csrfResponse.status}`);
      }

      const response = await fetch(requestUrl, {
        method: requestMethod,
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': csrfPayload.token,
        },
        body: JSON.stringify(requestData),
      });

      return {
        ok: response.ok,
        status: response.status,
        text: await response.text(),
      };
    },
    {
      requestUrl: url,
      requestMethod: method,
      requestData: data,
    }
  );

  return {
    ok: () => response.ok,
    status: () => response.status,
    text: async () => response.text,
    json: async () => JSON.parse(response.text),
  };
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
  }) => {
    test.setTimeout(300_000);

    await loginWithUi(page, orgOwner);
    await page.goto(`/app/o/${organization.slug}/home`);
    await expect(page.getByRole('heading', { name: organization.displayName })).toBeVisible();
    await expect(page.getByLabel('Collaborator email')).toBeVisible();
    await expect(page.getByLabel('Launch role')).toBeVisible();

    await page.goto(`/app/o/${organization.slug}/profile`);
    await expect(page.getByRole('heading', { name: 'Organization trust profile' })).toBeVisible();

    await page.goto(`/app/o/${organization.slug}/home`);
    await page.getByLabel('Collaborator email').fill(reviewer.email);
    await page.getByLabel('Launch role').selectOption('org_reviewer');
    await page.getByRole('button', { name: 'Send collaborator invite' }).click();

    const rawInviteToken = await materializeKnownInviteToken({
      orgId: organization.id,
      email: reviewer.email,
    });

    const reviewerContext = await browser.newContext();
    try {
      const reviewerPage = await reviewerContext.newPage();
      await loginWithUi(reviewerPage, reviewer);
      await reviewerPage.goto(`/accept-invite?token=${rawInviteToken}`);
      await reviewerPage.waitForLoadState('networkidle');
      await reviewerPage.getByRole('button', { name: /accept invitation/i }).click();
      await reviewerPage.waitForURL(`**/app/o/${organization.slug}/home`);
      await expect(
        reviewerPage.getByText('You are currently signed in as Reviewer.')
      ).toBeVisible();
    } finally {
      await reviewerContext.close();
    }

    const assignmentDraftResponse = await apiPostJson(
      page.request,
      '/api/assignments',
      {
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
      },
      {
        timeoutMs: 120_000,
      }
    );
    expect(assignmentDraftResponse.status()).toBe(201);
    const assignmentDraftPayload = (await assignmentDraftResponse.json()) as {
      assignment?: { id?: string };
    };
    const assignmentId = assignmentDraftPayload.assignment?.id;
    if (!assignmentId) {
      throw new Error('Assignment draft creation did not return an id');
    }
    fixture.assignmentIds.add(assignmentId);

    const outcomesResponse = await apiPostJson(
      page.request,
      `/api/assignments/${assignmentId}/outcomes`,
      {
        outcomes: [
          {
            outcomeType: 'continuous',
            title: 'Run the authenticated org corridor',
            description: 'Validate shortlist, reveal, interview, and hiring decisions end to end.',
            metrics: [{ name: 'Milestones', target: '5', unit: 'count', current: '0' }],
            successCriteria: 'Deliver the full launch-binding corridor with consented reveal.',
          },
        ],
      }
    );
    expect(outcomesResponse.ok()).toBeTruthy();

    const assignmentUpdateResponse = await apiPutJson(
      page.request,
      `/api/assignments/${assignmentId}`,
      {
        orgId: organization.id,
        creationStatus: 'pending_review',
        status: 'draft',
        businessValue: 'Updated corridor business value to confirm edit-before-publish stays live.',
      }
    );
    expect(assignmentUpdateResponse.ok()).toBeTruthy();

    const publishResponse = await apiPostJson(
      page.request,
      `/api/assignments/${assignmentId}/publish`,
      {
        principalContext: {
          principalType: 'organization',
          orgId: organization.id,
        },
      },
      {
        timeoutMs: 120_000,
      }
    );
    expect(publishResponse.ok()).toBeTruthy();

    const corridorMatch = await createRuntimeMatch(fixture, assignmentId, candidate.id);

    const rankedMatchesResponse = await apiPostJson(
      page.request,
      '/api/match/assignment',
      {
        assignmentId,
        mode: 'balanced',
        k: 20,
      },
      {
        timeoutMs: 120_000,
      }
    );
    expect(rankedMatchesResponse.ok()).toBeTruthy();
    const rankedMatchesPayload = (await rankedMatchesResponse.json()) as {
      items?: Array<{
        id?: string | null;
        profileId?: string;
        reviewStage?: string;
        revealScope?: string;
        visibleIdentityFields?: string[];
        why?: { reasonCodes?: string[]; summary?: string[] };
        profile?: { displayName?: string | null; handle?: string | null };
      }>;
    };
    const blindMatch = (rankedMatchesPayload.items ?? []).find(
      (item) => item.profileId === candidate.id
    );
    const activeMatchId = blindMatch?.id ?? corridorMatch.id;
    expect(activeMatchId).toBeTruthy();
    expect(blindMatch?.reviewStage).toBe('blind_review');
    expect(blindMatch?.revealScope).toBe('blind');
    expect(blindMatch?.visibleIdentityFields ?? []).toEqual([]);
    expect(blindMatch?.profile?.displayName ?? null).toBeNull();
    expect(blindMatch?.profile?.handle ?? null).toBeNull();

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
    expect(shortlistResponse.ok()).toBeTruthy();

    const shortlistViewResponse = await page.request.get(`/api/org/${organization.slug}/shortlist`);
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

    await page.context().clearCookies();
    await loginWithUi(page, candidate);
    const candidateInterestResponse = await browserRequestJson(
      page,
      'POST',
      '/api/match/interest',
      {
        assignmentId,
      }
    );
    expect(candidateInterestResponse.ok()).toBeTruthy();

    await page.context().clearCookies();
    await loginWithUi(page, orgOwner);

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

    await page.context().clearCookies();
    await loginWithUi(page, candidate);

    const candidateConversationState = await page.request.get(
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
      page,
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

    await page.context().clearCookies();
    await loginWithUi(page, orgOwner);

    const revealedShortlistResponse = await page.request.get(
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

    await page.goto(`/app/o/${organization.slug}/interviews`);
    await expect(page.getByText('Decision: hire')).toBeVisible();
    await expect(page.getByText(/Engagement:/)).toBeVisible();

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
