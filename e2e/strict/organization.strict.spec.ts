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
  gotoWithReadyState,
  loginWithUi,
  seedPortfolioReadyCandidate,
  type StrictFixtureState,
  type StrictRuntimeAssignment,
  type StrictRuntimeConversation,
  type StrictRuntimeMatch,
  type StrictRuntimeOrganization,
  type StrictSkillRequirement,
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
  let strictCandidateSkillRequirements: StrictSkillRequirement[] = [];
  const strictLifecycleBusinessValue =
    'Improve hiring quality by turning vague role scoping into a concrete, proof-backed assignment review workflow for the team.';
  const strictLifecycleDescription =
    'Lead the assignment review corridor, define the real work to be done, and keep internal reviewers aligned on what evidence actually counts.';
  const strictLifecycleImpact =
    'Convincing proof includes shipped work, clear ownership signals, and thoughtful explanations of delivery tradeoffs from comparable assignments.';
  const strictDraftBusinessValue =
    'Clarify the role purpose in concrete terms so the organization can review candidates through real proof instead of generic hiring language.';
  const strictDraftDescription =
    'Document the actual work, the constraints, and the candidate proof expectations so internal review can approve a credible public assignment.';
  const strictDraftImpact =
    'Strong submissions should show delivered work, evidence of ownership, and grounded explanations of the decisions behind that work.';

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

    const seededCandidate = await seedPortfolioReadyCandidate(candidateUser, {
      verifierProfileId: orgUser.id,
    });
    strictCandidateSkillRequirements = seededCandidate.skillRequirements;

    viewerUser = await createRuntimeUser(fixture, {
      persona: 'org_member',
      prefix: 'strict-org-viewer',
      displayName: 'Strict Org Reviewer',
    });

    organization = await createRuntimeOrganization(fixture, orgUser.id, {
      prefix: 'strict-org',
      displayName: 'Strict Organization',
    });

    // Add reviewer role member for permission tests.
    const supabase = adminClient();
    const { error: viewerMembershipError } = await supabase.from('organization_members').insert({
      org_id: organization.id,
      user_id: viewerUser.id,
      role: 'org_reviewer',
      state: 'active',
    });

    if (viewerMembershipError) {
      throw new Error(
        `Failed to add strict org viewer membership: ${viewerMembershipError.message}`
      );
    }

    seededAssignment = await createRuntimeAssignment(fixture, organization.id, {
      role: 'Strict Organization Seeded Role',
      status: 'active',
      mustHaveSkills: strictCandidateSkillRequirements,
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

    await gotoWithReadyState(page, `/app/o/${organization.slug}/home`, async () => {
      await expect(page.getByRole('heading', { name: organization.displayName })).toBeVisible();
    });
    await expect(page.getByText('Organization review cockpit')).toBeVisible();
    await expect(
      page.getByText('A focused launch desk for one clean hiring corridor')
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Corridor Queue' })).toBeVisible();
    await expect(page.getByText('Trust profile · Verified path:')).toBeVisible();
    await expect(page.getByText('One assignment path · Purpose, real work')).toBeVisible();
    await expect(page.getByRole('link', { name: /Create first assignment/i })).toHaveAttribute(
      'href',
      `/app/o/${organization.slug}/assignments/new`
    );
    await expect(page.getByRole('heading', { name: 'Minimal Access' })).toBeVisible();
    await expect(
      page.getByText('Launch roles are limited to owner, manager, and reviewer.')
    ).toBeVisible();
    await expect(page.getByText('You are currently signed in as Owner.')).toBeVisible();

    await gotoWithReadyState(page, `/app/o/${organization.slug}/profile`, async () => {
      await expect(page.getByRole('heading', { name: 'Organization trust profile' })).toBeVisible();
    });
    await expect(page.getByRole('textbox', { name: 'Organization name' })).toHaveValue(
      organization.displayName
    );
  });

  test('O-05..O-07 and O-17 assignment create/publish/manage lifecycle is strict', async ({
    page,
  }) => {
    await loginWithUi(page, orgUser);

    const createAssignmentResponse = await apiPostJson(
      page.request,
      '/api/assignments',
      {
        orgId: organization.id,
        role: 'Strict Lifecycle Assignment',
        description: strictLifecycleDescription,
        businessValue: strictLifecycleBusinessValue,
        expectedImpact: strictLifecycleImpact,
        status: 'draft',
        valuesRequired: ['integrity'],
        causeTags: ['education'],
        mustHaveSkills: strictCandidateSkillRequirements,
        niceToHaveSkills: [],
        locationMode: 'remote',
        compMin: 95000,
        compMax: 145000,
        currency: 'USD',
      },
      {
        timeoutMs: 120_000,
      }
    );
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
        orgId: organization.id,
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

    const internalReviewResponse = await apiPutJson(
      page.request,
      `/api/assignments/${assignmentId}`,
      {
        orgId: organization.id,
        creationStatus: 'pending_review',
        status: 'draft',
      }
    );
    expect(internalReviewResponse.ok()).toBeTruthy();

    const publishAssignmentResponse = await apiPostJson(
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
    expect(publishAssignmentResponse.status()).toBe(200);
    const publishPayload = (await publishAssignmentResponse.json()) as {
      assignment?: { status?: string; creationStatus?: string };
      error?: string;
      details?: { blocks?: unknown[]; missing?: unknown[] };
    };
    expect(publishPayload.assignment?.status).toBe('active');
    expect(publishPayload.assignment?.creationStatus).toBe('review_ready');
    if (assignmentForLifecycle) {
      assignmentForLifecycle.status = 'active';
    }

    const pipelineStepResponse = await apiPostJson(
      page.request,
      `/api/assignments/${assignmentId}/pipeline`,
      {
        orgId: organization.id,
        stepOrder: 1,
        stepName: 'Define role',
        stakeholderRole: 'owner',
        status: 'completed',
      }
    );
    expect(pipelineStepResponse.ok()).toBeTruthy();

    const pipelineStateResponse = await page.request.get(
      `/api/assignments/${assignmentId}/pipeline?orgId=${organization.id}`
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

    const assignmentDetailResponse = await page.request.get(
      `/api/assignments/${assignmentId}?orgId=${organization.id}`
    );
    expect(assignmentDetailResponse.ok()).toBeTruthy();

    const assignmentsListResponse = await page.request.get(
      `/api/assignments?limit=50&orgId=${organization.id}`
    );
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
    test.setTimeout(300_000);

    await loginWithUi(page, orgUser);
    const assignmentId =
      assignmentForLifecycle?.status === 'active' ? assignmentForLifecycle.id : seededAssignment.id;

    let rankedMatchesResponse = await apiPostJson(
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
    if (!rankedMatchesResponse.ok() && rankedMatchesResponse.status() >= 500) {
      await page.waitForTimeout(1_500);
      rankedMatchesResponse = await apiPostJson(
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
    }
    expect(rankedMatchesResponse.ok()).toBeTruthy();

    const orgInterestResponse = await apiPostJson(page.request, '/api/match/interest', {
      assignmentId,
      targetProfileId: candidateUser.id,
    });
    expect([200, 409]).toContain(orgInterestResponse.status());
    const orgInterestPayload = (await orgInterestResponse.json()) as {
      revealed?: boolean;
      browseStillAvailable?: boolean;
      error?: string;
    };
    if (orgInterestResponse.status() === 200) {
      expect(typeof orgInterestPayload.revealed).toBe('boolean');
    } else {
      expect(orgInterestPayload.browseStillAvailable).toBe(true);
      expect(orgInterestPayload.error).toBeTruthy();
    }

    await page.context().clearCookies();
    await loginWithUi(page, candidateUser);
    const candidateInterestResponse = await apiPostJson(page.request, '/api/match/interest', {
      assignmentId,
    });
    expect([200, 409]).toContain(candidateInterestResponse.status());
    const candidateInterestPayload = (await candidateInterestResponse.json()) as {
      revealed?: boolean;
      browseStillAvailable?: boolean;
      error?: string;
    };
    if (candidateInterestResponse.status() === 200) {
      expect(typeof candidateInterestPayload.revealed).toBe('boolean');
    } else {
      expect(candidateInterestPayload.browseStillAvailable).toBe(true);
      expect(candidateInterestPayload.error).toBeTruthy();
    }

    await page.context().clearCookies();
    await loginWithUi(page, orgUser);

    const shortlistResponse = await page.request.get(`/api/org/${organization.slug}/shortlist`);
    expect(shortlistResponse.ok()).toBeTruthy();
    const shortlistPayload = (await shortlistResponse.json()) as {
      items?: Array<{ candidateId?: string; candidate_id?: string }>;
    };
    expect(Array.isArray(shortlistPayload.items)).toBe(true);
    const shortlistIncludesCandidate = (shortlistPayload.items ?? []).some(
      (item) => item.candidateId === candidateUser.id || item.candidate_id === candidateUser.id
    );
    if (orgInterestResponse.status() === 200 && candidateInterestResponse.status() === 200) {
      expect(shortlistIncludesCandidate).toBe(false);
    }

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

    await gotoWithReadyState(page, `/app/o/${organization.slug}/messages`, async () => {
      await expect(page.getByRole('heading', { name: 'Messages', level: 1 })).toBeVisible();
    });
  });

  test('O-07b draft autosave/update and resume-to-publish contract is strict', async ({ page }) => {
    await loginWithUi(page, orgUser);

    const uniqueRole = `Strict Draft Resume ${Date.now()}`;
    const createDraftResponse = await apiPostJson(
      page.request,
      '/api/assignments',
      {
        orgId: organization.id,
        role: uniqueRole,
        description: strictDraftDescription,
        businessValue: strictDraftBusinessValue,
        expectedImpact: strictDraftImpact,
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
      },
      {
        timeoutMs: 120_000,
      }
    );
    expect(createDraftResponse.status()).toBe(201);
    const createDraftPayload = (await createDraftResponse.json()) as {
      assignment?: { id?: string };
    };
    const draftId = createDraftPayload.assignment?.id;
    if (!draftId) throw new Error('Draft creation did not return assignment id');
    fixture.assignmentIds.add(draftId);

    const autosaveUpdateResponse = await apiPutJson(page.request, `/api/assignments/${draftId}`, {
      orgId: organization.id,
      businessValue:
        'Update the role purpose with concrete reviewer guidance so the assignment can move cleanly through internal review before publish.',
      expectedImpact:
        'Approved proof should show delivered work, ownership of the outcome, and clear explanations of why the candidate made those choices.',
      creationStatus: 'draft',
      status: 'draft',
    });
    expect(autosaveUpdateResponse.ok()).toBeTruthy();

    await expect
      .poll(
        async () => {
          const assignmentResponse = await page.request.get(
            `/api/assignments/${draftId}?orgId=${organization.id}`
          );
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
      .toBe(
        'Update the role purpose with concrete reviewer guidance so the assignment can move cleanly through internal review before publish.'
      );

    const listResponse = await page.request.get(
      `/api/assignments?limit=100&orgSlug=${organization.slug}`
    );
    expect(listResponse.ok()).toBeTruthy();
    const listPayload = (await listResponse.json()) as { items?: Array<{ role?: string }> };
    const sameRoleAssignments = (listPayload.items ?? []).filter(
      (item) => item.role === uniqueRole
    );
    expect(sameRoleAssignments.length).toBe(1);

    await gotoWithReadyState(
      page,
      `/app/o/${organization.slug}/assignments/new?draftId=${draftId}`,
      async () => {
        await expect(
          page.getByRole('heading', { name: 'Step 2: What work will actually be done' })
        ).toBeVisible();
      }
    );
    await expect(page.getByLabel(/^What work will actually be done \*$/i)).toHaveValue(
      strictDraftDescription
    );

    const outcomesResponse = await apiPostJson(
      page.request,
      `/api/assignments/${draftId}/outcomes`,
      {
        orgId: organization.id,
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

    const pendingReviewResponse = await apiPutJson(page.request, `/api/assignments/${draftId}`, {
      orgId: organization.id,
      creationStatus: 'pending_review',
      status: 'draft',
    });
    expect(pendingReviewResponse.ok()).toBeTruthy();

    const publishResponse = await apiPostJson(
      page.request,
      `/api/assignments/${draftId}/publish`,
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
    expect(publishResponse.status()).toBe(200);
    const publishPayload = (await publishResponse.json()) as {
      assignment?: { status?: string; creationStatus?: string };
      error?: string;
    };
    expect(publishPayload.assignment?.status).toBe('active');
    expect(publishPayload.assignment?.creationStatus).toBe('review_ready');
  });

  test('O-13..O-16 interview, archived contract gating, and verification surfaces stay aligned', async ({
    page,
  }) => {
    await loginWithUi(page, orgUser);
    await gotoWithReadyState(page, `/app/o/${organization.slug}/interviews`, async () => {
      await expect(page.getByRole('heading', { name: 'Interviews' })).toBeVisible();
    });

    const interviewListResponse = await page.request.get('/api/interviews/schedule');
    expect(interviewListResponse.ok()).toBeTruthy();

    const archivedContractsResponse = await page.request.get('/api/contracts');
    expect(archivedContractsResponse.status()).toBe(410);

    const verificationStatusResponse = await page.request.get('/api/verification/status');
    expect(verificationStatusResponse.ok()).toBeTruthy();
  });

  test('O-18..O-20 team permissions and compliance settings are strict', async ({
    browser,
    page,
  }) => {
    await loginWithUi(page, orgUser);

    const teamResponse = await page.request.get(`/api/organizations/${organization.id}/team`);
    expect(teamResponse.ok()).toBeTruthy();

    await page.goto(`/app/o/${organization.slug}/settings`);
    await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible();
    await expect(
      page.getByText('This page is outside the locked launch MVP corridor.')
    ).toBeVisible();
    await expect(
      page.getByText(
        /The org settings hub stays hard-gated for launch so the active corridor remains centered on trust, assignments, and review\./
      )
    ).toBeVisible();

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
    };
    expect(healthPayload.status).toBe('ok');
    expect(healthPayload).not.toHaveProperty('warnings');
    expect(healthPayload).not.toHaveProperty('database');
    expect(healthPayload).not.toHaveProperty('version');
  });
});
