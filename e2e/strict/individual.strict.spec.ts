import { expect, test } from '@playwright/test';
import {
  adminClient,
  apiPostJson,
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

test.describe('Strict MVP Individual Flows (I-01..I-20)', () => {
  test.describe.configure({ mode: 'serial' });

  let fixture: StrictFixtureState;
  let individualUser: StrictRuntimeUser;
  let orgUser: StrictRuntimeUser;
  let onboardingUser: StrictRuntimeUser;
  let organization: StrictRuntimeOrganization;
  let assignment: StrictRuntimeAssignment;
  let match: StrictRuntimeMatch;
  let seededConversation: StrictRuntimeConversation;

  test.beforeAll(async () => {
    fixture = createFixtureState();

    individualUser = await createRuntimeUser(fixture, {
      persona: 'individual',
      prefix: 'strict-individual',
      displayName: 'Strict Individual',
    });

    orgUser = await createRuntimeUser(fixture, {
      persona: 'org_member',
      prefix: 'strict-org-member',
      displayName: 'Strict Org Member',
    });

    onboardingUser = await createRuntimeUser(fixture, {
      persona: 'unknown',
      prefix: 'strict-onboarding',
      displayName: 'Strict Onboarding',
      handle: null,
    });

    organization = await createRuntimeOrganization(fixture, orgUser.id, {
      prefix: 'strict-individual-org',
      displayName: 'Strict Individual Org',
    });

    assignment = await createRuntimeAssignment(fixture, organization.id, {
      role: 'Strict Full Stack Role',
      status: 'active',
    });

    if (assignment.orgId !== organization.id) {
      const supabase = adminClient();
      const { error: fallbackMembershipError } = await supabase
        .from('organization_members')
        .insert({
          org_id: assignment.orgId,
          user_id: orgUser.id,
          role: 'owner',
          status: 'active',
        });

      if (fallbackMembershipError && fallbackMembershipError.code !== '23505') {
        throw new Error(
          `Failed to grant org user access to fallback assignment org: ${fallbackMembershipError.message}`
        );
      }
    }

    match = await createRuntimeMatch(fixture, assignment.id, individualUser.id);

    seededConversation = await createRuntimeConversation(
      fixture,
      match.id,
      assignment.id,
      individualUser.id,
      orgUser.id
    );
  });

  test.afterAll(async () => {
    await cleanupFixtureData(fixture);
  });

  test('I-03 guided onboarding is reachable and actionable for unknown persona', async ({
    page,
  }) => {
    await loginWithUi(page, onboardingUser);
    await page.goto('/onboarding');

    await expect(page.getByText('Welcome to Proofound')).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue as Individual/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue as Organization/i })).toBeVisible();
  });

  test('I-04..I-09 profile, expertise, proofs, verification contracts persist', async ({
    page,
  }) => {
    await loginWithUi(page, individualUser);

    await page.goto('/app/i/profile');
    await expect(page.getByText(individualUser.displayName).first()).toBeVisible();

    const completenessResponse = await page.request.get('/api/profile/completeness');
    expect(completenessResponse.ok()).toBeTruthy();
    const completenessPayload = (await completenessResponse.json()) as { percentage?: number };
    expect(typeof completenessPayload.percentage).toBe('number');

    const addSkillResponse = await apiPostJson(page.request, '/api/expertise/user-skills', {
      cat_id: 1,
      subcat_id: 1,
      l3_id: 1,
      custom_skill_name: 'Strict Contract Skill',
      level: 4,
      relevance: 'current',
      months_experience: 24,
    });

    expect([201, 409]).toContain(addSkillResponse.status());

    const skillsResponse = await page.request.get('/api/expertise/user-skills');
    expect(skillsResponse.ok()).toBeTruthy();
    const skillsPayload = (await skillsResponse.json()) as {
      skills?: Array<{ skill_code?: string | null; skill_id?: string }>;
    };
    expect(Array.isArray(skillsPayload.skills)).toBeTruthy();
    expect(
      (skillsPayload.skills ?? []).some(
        (skill) =>
          skill.skill_id?.includes('strict-contract-skill') ||
          skill.skill_code === 'strict-contract-skill'
      )
    ).toBeTruthy();

    const verificationStatusResponse = await page.request.get('/api/verification/status');
    expect(verificationStatusResponse.ok()).toBeTruthy();
    const verificationStatusPayload = (await verificationStatusResponse.json()) as {
      verificationStatus?: string;
    };
    expect(typeof verificationStatusPayload.verificationStatus).toBe('string');
  });

  test('I-10..I-14 matching preferences, feed, opportunities, and interest action are real', async ({
    page,
  }) => {
    await loginWithUi(page, individualUser);

    const supabase = adminClient();
    const { error: matchingProfileError } = await supabase.from('matching_profiles').upsert(
      {
        profile_id: individualUser.id,
        values_tags: ['integrity'],
        cause_tags: ['education'],
        work_mode: 'remote',
        country: 'US',
        city: 'New York',
        hours_min: 30,
        hours_max: 40,
        comp_min: 80000,
        comp_max: 140000,
        currency: 'USD',
        weights: {
          mission: 0.25,
          expertise: 0.35,
          tools: 0.1,
          logistics: 0.2,
          recency: 0.1,
        },
        availability_earliest: new Date().toISOString().slice(0, 10),
        availability_latest: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
          .toISOString()
          .slice(0, 10),
      },
      { onConflict: 'profile_id' }
    );
    expect(matchingProfileError).toBeNull();

    const feedResponse = await apiPostJson(page.request, '/api/match/profile', {});
    expect(feedResponse.ok()).toBeTruthy();
    const feedPayload = (await feedResponse.json()) as { items?: unknown[] };
    expect(Array.isArray(feedPayload.items)).toBeTruthy();

    const interestResponse = await apiPostJson(page.request, '/api/match/interest', {
      assignmentId: assignment.id,
    });
    expect(interestResponse.ok()).toBeTruthy();
    const interestPayload = (await interestResponse.json()) as { revealed?: boolean };
    expect(typeof interestPayload.revealed).toBe('boolean');

    await page.goto('/app/i/matching');
    await expect(page.getByRole('heading', { name: 'Matching' })).toBeVisible();

    await page.goto('/app/i/opportunities');
    await expect(page.getByRole('heading', { name: 'Opportunities' })).toBeVisible();
  });

  test('I-15..I-17 messaging, interview scheduling, and offer attestation work', async ({
    page,
  }) => {
    await loginWithUi(page, individualUser);

    const sendMessageResponse = await apiPostJson(page.request, '/api/messages', {
      conversationId: seededConversation.id,
      content: 'Strict contract message from individual flow test.',
    });
    expect(sendMessageResponse.status()).toBe(201);
    const sendMessagePayload = (await sendMessageResponse.json()) as {
      message?: { id?: string };
    };
    expect(typeof sendMessagePayload.message?.id).toBe('string');

    const listMessagesResponse = await page.request.get(
      `/api/messages?conversationId=${seededConversation.id}`
    );
    expect(listMessagesResponse.ok()).toBeTruthy();
    const listMessagesPayload = (await listMessagesResponse.json()) as {
      messages?: Array<{ id?: string }>;
    };
    expect(
      (listMessagesPayload.messages ?? []).some(
        (message) => message.id === sendMessagePayload.message?.id
      )
    ).toBeTruthy();

    await page.context().clearCookies();
    await loginWithUi(page, orgUser);

    const scheduledAt = new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString();
    const scheduleInterviewResponse = await apiPostJson(page.request, '/api/interviews/schedule', {
      matchId: match.id,
      scheduledAt,
      platform: 'manual',
      participantUserIds: [individualUser.id, orgUser.id],
      manualMeetingLink: 'https://meet.google.com/strict-individual-manual',
    });

    const scheduleInterviewRaw = await scheduleInterviewResponse.text();
    expect(
      scheduleInterviewResponse.ok(),
      `Interview scheduling failed with HTTP ${scheduleInterviewResponse.status()}: ${scheduleInterviewRaw}`
    ).toBeTruthy();
    const scheduleInterviewPayload = JSON.parse(scheduleInterviewRaw) as {
      interview?: { id?: string };
    };
    if (scheduleInterviewPayload.interview?.id) {
      fixture.interviewIds.add(scheduleInterviewPayload.interview.id);
    }

    await page.context().clearCookies();
    await loginWithUi(page, individualUser);

    const individualInterviewsResponse = await page.request.get(
      `/api/interviews/schedule?matchId=${match.id}`
    );
    expect(individualInterviewsResponse.ok()).toBeTruthy();
    const individualInterviewsPayload = (await individualInterviewsResponse.json()) as {
      interviews?: Array<{ id?: string }>;
    };
    expect(
      (individualInterviewsPayload.interviews ?? []).some(
        (interview) => interview.id === scheduleInterviewPayload.interview?.id
      )
    ).toBeTruthy();

    const contractResponse = await apiPostJson(page.request, '/api/contracts', {
      assignmentId: assignment.id,
      userId: individualUser.id,
      contractType: 'contract',
      userAttestation: true,
      notes: 'Strict individual offer attestation',
    });
    expect(contractResponse.ok()).toBeTruthy();
    const contractPayload = (await contractResponse.json()) as {
      contract?: { id?: string; userAttestation?: boolean };
    };
    expect(contractPayload.contract?.userAttestation).toBe(true);
    if (contractPayload.contract?.id) {
      fixture.contractIds.add(contractPayload.contract.id);
    }
  });

  test('I-18..I-20 projects, post-engagement artifacts, and privacy/account controls are real', async ({
    page,
  }) => {
    await loginWithUi(page, individualUser);

    const createProjectResponse = await apiPostJson(page.request, '/api/projects', {
      title: 'Strict Delivery Project',
      description: 'Strict project used for MVP readiness verification',
      projectType: 'work',
      status: 'ongoing',
      startDate: new Date().toISOString(),
      organizationName: organization.displayName,
      roleTitle: 'Contract Engineer',
      impactSummary: 'Delivered measurable MVP outcomes',
      tags: ['strict', 'mvp'],
      visibility: 'public',
    });
    expect(createProjectResponse.status()).toBe(201);
    const createProjectPayload = (await createProjectResponse.json()) as {
      project?: { id?: string };
    };
    if (createProjectPayload.project?.id) {
      fixture.projectIds.add(createProjectPayload.project.id);
    }

    const listProjectsResponse = await page.request.get('/api/projects');
    expect(listProjectsResponse.ok()).toBeTruthy();
    const listProjectsPayload = (await listProjectsResponse.json()) as {
      projects?: Array<{ id?: string }>;
    };
    expect(
      (listProjectsPayload.projects ?? []).some(
        (project) => project.id === createProjectPayload.project?.id
      )
    ).toBeTruthy();

    const updateVisibilityResponse = await apiPostJson(page.request, '/api/profile/visibility', {
      location: 'private',
      mission: 'public',
      skills: 'network_only',
    });
    expect(updateVisibilityResponse.ok()).toBeTruthy();

    const getVisibilityResponse = await page.request.get('/api/profile/visibility');
    expect(getVisibilityResponse.ok()).toBeTruthy();
    const visibilityPayload = (await getVisibilityResponse.json()) as {
      location?: string;
      mission?: string;
      skills?: string;
    };
    expect(visibilityPayload.location).toBe('private');
    expect(visibilityPayload.mission).toBe('public');
    expect(visibilityPayload.skills).toBe('network_only');

    const dataExportResponse = await page.request.get('/api/data-export');
    expect(dataExportResponse.ok()).toBeTruthy();
    const dataExportPayload = (await dataExportResponse.json()) as { userId?: string };
    expect(dataExportPayload.userId).toBe(individualUser.id);

    const accountStatusResponse = await page.request.get('/api/user/account');
    expect(accountStatusResponse.ok()).toBeTruthy();
    const accountStatusPayload = (await accountStatusResponse.json()) as { accountStatus?: string };
    expect(typeof accountStatusPayload.accountStatus).toBe('string');
  });
});
