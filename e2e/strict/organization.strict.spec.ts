import { expect, test } from '@playwright/test';
import {
  adminClient,
  apiPostJson,
  apiPutJson,
  cleanupFixtureData,
  createFixtureState,
  createRuntimeAssignment,
  createRuntimeConversation,
  createRuntimeMatch,
  createRuntimeOrganization,
  createRuntimeUser,
  loginWithUi,
  type StrictFixtureState,
  type StrictRuntimeAssignment,
  type StrictRuntimeConversation,
  type StrictRuntimeMatch,
  type StrictRuntimeOrganization,
  type StrictRuntimeUser,
} from '../helpers/strict-fixtures';

test.describe('Strict MVP Organization Flows (O-01..O-20)', () => {
  test.describe.configure({ mode: 'serial' });

  let fixture: StrictFixtureState;
  let orgUser: StrictRuntimeUser;
  let candidateUser: StrictRuntimeUser;
  let viewerUser: StrictRuntimeUser;
  let organization: StrictRuntimeOrganization;
  let seededAssignment: StrictRuntimeAssignment;
  let seededMatch: StrictRuntimeMatch;
  let seededConversation: StrictRuntimeConversation;
  let assignmentForLifecycle: StrictRuntimeAssignment | null = null;

  test.beforeAll(async () => {
    fixture = createFixtureState();

    orgUser = await createRuntimeUser(fixture, {
      persona: 'org_member',
      prefix: 'strict-org-owner',
      displayName: 'Strict Org Owner',
    });

    candidateUser = await createRuntimeUser(fixture, {
      persona: 'individual',
      prefix: 'strict-org-candidate',
      displayName: 'Strict Org Candidate',
    });

    viewerUser = await createRuntimeUser(fixture, {
      persona: 'org_member',
      prefix: 'strict-org-viewer',
      displayName: 'Strict Org Viewer',
    });

    organization = await createRuntimeOrganization(fixture, orgUser.id, {
      prefix: 'strict-org',
      displayName: 'Strict Organization',
    });

    // Add viewer role member for permission tests.
    const supabase = adminClient();
    const { error: viewerMembershipError } = await supabase.from('organization_members').insert({
      org_id: organization.id,
      user_id: viewerUser.id,
      role: 'viewer',
      status: 'active',
    });

    if (viewerMembershipError) {
      throw new Error(
        `Failed to add strict org viewer membership: ${viewerMembershipError.message}`
      );
    }

    seededAssignment = await createRuntimeAssignment(fixture, organization.id, {
      role: 'Strict Organization Seeded Role',
      status: 'active',
    });
    seededMatch = await createRuntimeMatch(fixture, seededAssignment.id, candidateUser.id);
    seededConversation = await createRuntimeConversation(
      fixture,
      seededMatch.id,
      seededAssignment.id,
      candidateUser.id,
      orgUser.id
    );
  });

  test.afterAll(async () => {
    await cleanupFixtureData(fixture);
  });

  test('O-02..O-04 org setup, team roles, and profile contracts are verifiable', async ({
    page,
  }) => {
    await loginWithUi(page, orgUser);

    await page.goto(`/app/o/${organization.slug}/home`);
    await expect(page).toHaveURL(new RegExp(`/app/o/${organization.slug}/home(?:\\?.*)?$`));
    await expect(page.getByRole('main')).toBeVisible();

    const orgResponse = await page.request.get(`/api/organizations/${organization.id}`);
    expect(orgResponse.ok()).toBeTruthy();
    const orgPayload = (await orgResponse.json()) as {
      organization?: { id?: string; display_name?: string; displayName?: string };
    };
    expect(orgPayload.organization?.id).toBe(organization.id);

    const teamResponse = await page.request.get(`/api/organizations/${organization.id}/team`);
    expect(teamResponse.ok()).toBeTruthy();
    const teamPayload = (await teamResponse.json()) as {
      stats?: { total?: number; owners?: number };
    };
    expect((teamPayload.stats?.total ?? 0) >= 2).toBeTruthy();
    expect((teamPayload.stats?.owners ?? 0) >= 1).toBeTruthy();

    await page.goto(`/app/o/${organization.slug}/profile`);
    await expect(page.getByRole('heading', { name: organization.displayName })).toBeVisible();
  });

  test('O-05..O-07 and O-17 assignment create/publish/manage lifecycle is strict', async ({
    page,
  }) => {
    await loginWithUi(page, orgUser);

    const createAssignmentResponse = await apiPostJson(page.request, '/api/assignments', {
      orgId: organization.id,
      role: 'Strict Lifecycle Assignment',
      description: 'Lifecycle assignment for strict org flow validation',
      businessValue: 'Strict lifecycle assignment business value',
      status: 'draft',
      valuesRequired: ['integrity'],
      causeTags: ['education'],
      mustHaveSkills: [
        { id: 'strict.skill.1', level: 3 },
        { id: 'strict.skill.2', level: 3 },
        { id: 'strict.skill.3', level: 2 },
      ],
      niceToHaveSkills: [],
      locationMode: 'remote',
      compMin: 95000,
      compMax: 145000,
      currency: 'USD',
    });
    expect(createAssignmentResponse.status()).toBe(201);

    const createAssignmentPayload = (await createAssignmentResponse.json()) as {
      assignment?: { id?: string; role?: string };
    };
    const assignmentId = createAssignmentPayload.assignment?.id;
    if (!assignmentId) {
      throw new Error('Assignment creation did not return id');
    }
    fixture.assignmentIds.add(assignmentId);
    assignmentForLifecycle = {
      id: assignmentId,
      orgId: organization.id,
      role: createAssignmentPayload.assignment?.role ?? 'Strict Lifecycle Assignment',
      status: 'draft',
      managed: true,
    };

    const outcomesResponse = await apiPostJson(
      page.request,
      `/api/assignments/${assignmentId}/outcomes`,
      {
        outcomes: [
          {
            outcomeType: 'continuous',
            title: 'Ship strict lifecycle',
            description: 'Validate end-to-end lifecycle',
            metrics: [{ name: 'Milestones', target: '3', unit: 'count', current: '0' }],
            successCriteria: 'Deliver all lifecycle milestones',
          },
        ],
      }
    );
    expect(outcomesResponse.ok()).toBeTruthy();

    const publishAssignmentResponse = await apiPostJson(
      page.request,
      `/api/assignments/${assignmentId}/publish`,
      {}
    );
    expect(publishAssignmentResponse.ok()).toBeTruthy();
    const publishPayload = (await publishAssignmentResponse.json()) as {
      assignment?: { status?: string; creationStatus?: string };
    };
    expect(publishPayload.assignment?.status).toBe('active');
    expect(publishPayload.assignment?.creationStatus).toBe('published');

    const pipelineStepResponse = await apiPostJson(
      page.request,
      `/api/assignments/${assignmentId}/pipeline`,
      {
        stepOrder: 1,
        stepName: 'Define role',
        stakeholderRole: 'owner',
        status: 'completed',
      }
    );
    expect(pipelineStepResponse.ok()).toBeTruthy();

    const pipelineStateResponse = await page.request.get(
      `/api/assignments/${assignmentId}/pipeline`
    );
    expect(pipelineStateResponse.ok()).toBeTruthy();
    const pipelineStatePayload = (await pipelineStateResponse.json()) as {
      steps?: Array<{ stepOrder?: number; status?: string }>;
    };
    expect(
      (pipelineStatePayload.steps ?? []).some(
        (step) => step.stepOrder === 1 && step.status === 'completed'
      )
    ).toBeTruthy();

    const assignmentDetailResponse = await page.request.get(`/api/assignments/${assignmentId}`);
    expect(assignmentDetailResponse.ok()).toBeTruthy();

    const assignmentsListResponse = await page.request.get('/api/assignments?limit=50');
    expect(assignmentsListResponse.ok()).toBeTruthy();
    const assignmentsListPayload = (await assignmentsListResponse.json()) as {
      items?: Array<{ id?: string }>;
    };
    expect(
      (assignmentsListPayload.items ?? []).some((item) => item.id === assignmentId)
    ).toBeTruthy();
  });

  test('O-08..O-12 ranked matches, shortlist, messaging, and interview prep are strict', async ({
    page,
  }) => {
    await loginWithUi(page, orgUser);
    const assignmentId = assignmentForLifecycle?.id ?? seededAssignment.id;

    const rankedMatchesResponse = await apiPostJson(page.request, '/api/match/assignment', {
      assignmentId,
      mode: 'balanced',
      k: 20,
    });
    expect(rankedMatchesResponse.ok()).toBeTruthy();

    const orgInterestResponse = await apiPostJson(page.request, '/api/match/interest', {
      assignmentId,
      targetProfileId: candidateUser.id,
    });
    expect(orgInterestResponse.ok()).toBeTruthy();

    await page.context().clearCookies();
    await loginWithUi(page, candidateUser);
    const candidateInterestResponse = await apiPostJson(page.request, '/api/match/interest', {
      assignmentId,
    });
    expect(candidateInterestResponse.ok()).toBeTruthy();

    await page.context().clearCookies();
    await loginWithUi(page, orgUser);

    const shortlistResponse = await page.request.get(`/api/org/${organization.slug}/shortlist`);
    expect(shortlistResponse.ok()).toBeTruthy();
    const shortlistPayload = (await shortlistResponse.json()) as {
      items?: Array<{ candidateId?: string; candidate_id?: string }>;
    };
    expect(
      (shortlistPayload.items ?? []).some(
        (item) => item.candidateId === candidateUser.id || item.candidate_id === candidateUser.id
      )
    ).toBeTruthy();

    const sendMessageResponse = await apiPostJson(
      page.request,
      `/api/conversations/${seededConversation.id}/messages`,
      {
        content: 'Strict organization message in shortlist workflow.',
      }
    );
    expect(sendMessageResponse.status()).toBe(201);

    const messageListResponse = await page.request.get(
      `/api/conversations/${seededConversation.id}/messages`
    );
    expect(messageListResponse.ok()).toBeTruthy();

    await page.goto(`/app/o/${organization.slug}/messages`);
    await expect(page.getByText(/Select a conversation/i)).toBeVisible();
  });

  test('O-07b draft autosave/update and resume-to-publish contract is strict', async ({ page }) => {
    await loginWithUi(page, orgUser);

    const uniqueRole = `Strict Draft Resume ${Date.now()}`;
    const createDraftResponse = await apiPostJson(page.request, '/api/assignments', {
      orgId: organization.id,
      role: uniqueRole,
      description: 'Initial strict draft description',
      businessValue: 'Initial strict draft business value',
      status: 'draft',
      mustHaveSkills: [
        { id: 'strict.resume.skill.1', level: 3 },
        { id: 'strict.resume.skill.2', level: 3 },
        { id: 'strict.resume.skill.3', level: 2 },
      ],
      locationMode: 'hybrid',
      compMin: 120000,
      compMax: 160000,
      currency: 'USD',
    });
    expect(createDraftResponse.status()).toBe(201);
    const createDraftPayload = (await createDraftResponse.json()) as {
      assignment?: { id?: string };
    };
    const draftId = createDraftPayload.assignment?.id;
    if (!draftId) throw new Error('Draft creation did not return assignment id');
    fixture.assignmentIds.add(draftId);

    const autosaveUpdateResponse = await apiPutJson(page.request, `/api/assignments/${draftId}`, {
      businessValue: 'Updated strict draft business value',
      creationStatus: 'pipeline_in_progress',
      status: 'draft',
    });
    expect(autosaveUpdateResponse.ok()).toBeTruthy();

    await expect
      .poll(
        async () => {
          const assignmentResponse = await page.request.get(`/api/assignments/${draftId}`);
          if (!assignmentResponse.ok()) {
            return null;
          }

          const assignmentPayload = (await assignmentResponse.json()) as {
            assignment?: { businessValue?: string };
          };
          return assignmentPayload.assignment?.businessValue ?? null;
        },
        {
          timeout: 15000,
          message: 'Draft assignment should persist business value before resume assertions',
        }
      )
      .toBe('Updated strict draft business value');

    const listResponse = await page.request.get(
      `/api/assignments?limit=100&orgSlug=${organization.slug}`
    );
    expect(listResponse.ok()).toBeTruthy();
    const listPayload = (await listResponse.json()) as { items?: Array<{ role?: string }> };
    const sameRoleAssignments = (listPayload.items ?? []).filter(
      (item) => item.role === uniqueRole
    );
    expect(sameRoleAssignments.length).toBe(1);

    await page.goto(`/app/o/${organization.slug}/assignments/new?draftId=${draftId}`);
    await expect(page.getByLabel(/role title/i)).toHaveValue(uniqueRole);
    await expect(page.getByLabel(/business value/i)).toHaveValue(
      'Updated strict draft business value'
    );

    const outcomesResponse = await apiPostJson(
      page.request,
      `/api/assignments/${draftId}/outcomes`,
      {
        outcomes: [
          {
            outcomeType: 'continuous',
            title: 'Strict resume outcome',
            description: 'Validate strict resume path',
            metrics: [{ name: 'Outcome', target: '1', unit: 'count', current: '0' }],
            successCriteria: 'Outcome completed',
          },
        ],
      }
    );
    expect(outcomesResponse.ok()).toBeTruthy();

    const publishResponse = await apiPostJson(
      page.request,
      `/api/assignments/${draftId}/publish`,
      {}
    );
    expect(publishResponse.ok()).toBeTruthy();
    const publishPayload = (await publishResponse.json()) as {
      assignment?: { status?: string; creationStatus?: string };
    };
    expect(publishPayload.assignment?.status).toBe('active');
    expect(publishPayload.assignment?.creationStatus).toBe('published');
  });

  test('O-13..O-16 feedback, offer, deliverables, and verification paths are strict', async ({
    page,
  }) => {
    await loginWithUi(page, orgUser);

    const scheduledAt = new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString();
    const scheduleInterviewResponse = await apiPostJson(page.request, '/api/interviews/schedule', {
      matchId: seededMatch.id,
      scheduledAt,
      platform: 'manual',
      manualMeetingProvider: 'google_meet',
      participantUserIds: [candidateUser.id, orgUser.id],
      manualMeetingLink: 'https://meet.google.com/strict-org-manual',
    });
    expect(scheduleInterviewResponse.ok()).toBeTruthy();
    const scheduleInterviewPayload = (await scheduleInterviewResponse.json()) as {
      interview?: { id?: string };
    };
    const interviewId = scheduleInterviewPayload.interview?.id;
    if (interviewId) {
      fixture.interviewIds.add(interviewId);
    }

    if (interviewId) {
      const feedbackResponse = await page.request.get(`/api/feedback/${interviewId}`);
      expect(feedbackResponse.ok()).toBeTruthy();
    }

    const contractResponse = await apiPostJson(page.request, '/api/contracts', {
      assignmentId: seededAssignment.id,
      userId: candidateUser.id,
      contractType: 'contract',
      orgAttestation: true,
      notes: 'Strict org-side offer confirmation',
    });
    expect(contractResponse.ok()).toBeTruthy();
    const contractPayload = (await contractResponse.json()) as {
      contract?: { id?: string; orgAttestation?: boolean };
    };
    expect(contractPayload.contract?.orgAttestation).toBe(true);
    if (contractPayload.contract?.id) {
      fixture.contractIds.add(contractPayload.contract.id);
    }

    const deliverablesResponse = await page.request.get(
      `/api/organizations/${organization.id}/projects`
    );
    expect(deliverablesResponse.ok()).toBeTruthy();

    const verificationStatusResponse = await page.request.get('/api/verification/status');
    expect(verificationStatusResponse.ok()).toBeTruthy();
  });

  test('O-18..O-20 team permissions, analytics snapshot, and compliance settings are strict', async ({
    browser,
    page,
  }) => {
    await loginWithUi(page, orgUser);

    const teamResponse = await page.request.get(`/api/organizations/${organization.id}/team`);
    expect(teamResponse.ok()).toBeTruthy();

    const analyticsResponse = await page.request.get(
      `/api/analytics/org/next-actions?orgId=${organization.id}`
    );
    expect(analyticsResponse.ok()).toBeTruthy();
    const analyticsPayload = (await analyticsResponse.json()) as { actions?: unknown[] };
    expect(Array.isArray(analyticsPayload.actions)).toBeTruthy();

    await page.goto(`/app/o/${organization.slug}/settings`);
    await expect(page.getByText('Organization Settings')).toBeVisible();

    // Viewer role should not have admin update permission.
    const viewerContext = await browser.newContext();
    const viewerPage = await viewerContext.newPage();
    try {
      await loginWithUi(viewerPage, viewerUser);
      const forbiddenUpdateResponse = await apiPutJson(
        viewerPage.request,
        `/api/organizations/${organization.id}`,
        {
          displayName: 'Unauthorized Update Attempt',
        }
      );
      expect(forbiddenUpdateResponse.status()).toBe(403);
    } finally {
      await viewerContext.close();
    }

    const healthResponse = await page.request.get('/api/health');
    expect(healthResponse.ok()).toBeTruthy();
    const healthPayload = (await healthResponse.json()) as {
      status?: string;
      warnings?: unknown[];
    };
    expect(['healthy', 'degraded']).toContain(healthPayload.status);
    if (healthPayload.status === 'degraded') {
      expect(Array.isArray(healthPayload.warnings)).toBeTruthy();
    }
  });
});
