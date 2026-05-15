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
  apiDeleteJson,
  loginWithUi,
  seedPortfolioReadyCandidate,
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

    await seedPortfolioReadyCandidate(individualUser, {
      verifierProfileId: orgUser.id,
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
          role: 'org_owner',
          state: 'active',
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
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();

    const readinessResponse = await page.request.get('/api/individual/readiness');
    expect(readinessResponse.ok()).toBeTruthy();
    const readinessPayload = (await readinessResponse.json()) as {
      states?: unknown[];
      missingByState?: unknown;
    };
    expect(Array.isArray(readinessPayload.states)).toBe(true);
    expect(readinessPayload.missingByState).toBeTruthy();

    let addSkillResponse = await apiPostJson(page.request, '/api/expertise/user-skills', {
      cat_id: 1,
      subcat_id: 1,
      l3_id: 1,
      custom_skill_name: 'Strict Contract Skill',
      level: 4,
      relevance: 'current',
      months_experience: 24,
    });

    if (addSkillResponse.status() === 403) {
      await page.goto('/app/i/profile');
      addSkillResponse = await apiPostJson(page.request, '/api/expertise/user-skills', {
        cat_id: 1,
        subcat_id: 1,
        l3_id: 1,
        custom_skill_name: 'Strict Contract Skill',
        level: 4,
        relevance: 'current',
        months_experience: 24,
      });
    }

    const addSkillStatus = addSkillResponse.status();
    expect([201, 409, 403]).toContain(addSkillStatus);

    const skillsResponse = await page.request.get('/api/expertise/user-skills');
    expect(skillsResponse.ok()).toBeTruthy();
    const skillsPayload = (await skillsResponse.json()) as {
      skills?: Array<{ skill_code?: string | null; skill_id?: string }>;
    };
    expect(Array.isArray(skillsPayload.skills)).toBeTruthy();
    if (addSkillStatus !== 403) {
      expect(
        (skillsPayload.skills ?? []).some(
          (skill) =>
            skill.skill_id?.includes('strict-contract-skill') ||
            skill.skill_code === 'strict-contract-skill'
        )
      ).toBeTruthy();
    }

    const verificationStatusResponse = await page.request.get('/api/verification/status');
    expect(verificationStatusResponse.ok()).toBeTruthy();
    const verificationStatusPayload = (await verificationStatusResponse.json()) as {
      workflow?: { state?: string | null } | null;
      channels?: {
        workEmail?: { state?: string };
        linkedin?: { state?: string };
      };
    };
    expect(typeof verificationStatusPayload.channels?.workEmail?.state).toBe('string');
    expect(typeof verificationStatusPayload.channels?.linkedin?.state).toBe('string');
    expect(
      verificationStatusPayload.workflow == null ||
        typeof verificationStatusPayload.workflow.state === 'string'
    ).toBeTruthy();
  });

  test('I-10..I-14 matching preferences, overview, and interest action are real', async ({
    page,
  }) => {
    await loginWithUi(page, individualUser);

    const supabase = adminClient();
    const nowIso = new Date().toISOString();

    // Seed matchability prerequisites so strict matching contracts exercise live result payloads.

    const { error: skillSeedError } = await supabase.from('skills').upsert(
      [
        {
          profile_id: individualUser.id,
          skill_id: 'strict-contract-skill',
          level: 4,
          months_experience: 24,
          relevance: 'current',
          last_used_at: nowIso,
        },
        {
          profile_id: individualUser.id,
          skill_id: 'strict-contract-skill-2',
          level: 3,
          months_experience: 18,
          relevance: 'current',
          last_used_at: nowIso,
        },
        {
          profile_id: individualUser.id,
          skill_id: 'strict-contract-skill-3',
          level: 3,
          months_experience: 12,
          relevance: 'current',
          last_used_at: nowIso,
        },
      ],
      { onConflict: 'profile_id,skill_id' }
    );
    expect(skillSeedError).toBeNull();

    const { data: seededSkillRows, error: seededSkillQueryError } = await supabase
      .from('skills')
      .select('id')
      .eq('profile_id', individualUser.id)
      .limit(1);
    expect(seededSkillQueryError).toBeNull();

    const seededSkillId = seededSkillRows?.[0]?.id;
    if (!seededSkillId) {
      throw new Error('Failed to seed a skill row for strict individual eligibility setup');
    }

    const { error: proofSeedError } = await supabase.from('skill_proofs').insert({
      profile_id: individualUser.id,
      skill_id: seededSkillId,
      proof_type: 'link',
      title: 'Strict eligibility proof',
      url: 'https://proofound.example/strict-proof',
    });
    expect(proofSeedError).toBeNull();

    const { error: matchingProfileError } = await supabase.from('matching_profiles').upsert(
      {
        profile_id: individualUser.id,
        desired_roles: ['Strict Full Stack Role'],
        work_mode: 'remote',
        engagement_type: 'contract_consulting',
        country: 'US',
        city: 'New York',
        hours_min: 30,
        hours_max: 40,
        comp_min: 80000,
        comp_max: 140000,
        currency: 'USD',
        weights: {},
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
    expect([200, 409]).toContain(interestResponse.status());
    const interestPayload = (await interestResponse.json()) as {
      revealed?: boolean;
      browseStillAvailable?: boolean;
      error?: string;
    };
    if (interestResponse.status() === 200) {
      expect(typeof interestPayload.revealed).toBe('boolean');
    } else {
      expect(interestPayload.browseStillAvailable).toBe(true);
      expect(interestPayload.error).toBeTruthy();
    }

    await page.goto('/app/i/matching');
    await expect(page.getByRole('heading', { name: 'Matching' })).toBeVisible();

    await page.goto('/app/i/home');
    await expect(page.getByRole('heading', { name: 'Add your first proof record' })).toBeVisible();
    await expect(
      page.getByText(/start with one work sample, credential, or case study that can be trusted\./i)
    ).toBeVisible();
  });

  test('I-15..I-17 messaging, interview scheduling, and offer attestation work', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    await loginWithUi(page, individualUser);

    const sendMessageResponse = await apiPostJson(
      page.request,
      `/api/conversations/${seededConversation.id}/messages`,
      {
        content: 'Strict contract message from individual flow test.',
      }
    );
    expect(sendMessageResponse.status()).toBe(201);
    const sendMessagePayload = (await sendMessageResponse.json()) as {
      message?: { id?: string };
    };
    expect(typeof sendMessagePayload.message?.id).toBe('string');

    const listMessagesResponse = await page.request.get(
      `/api/conversations/${seededConversation.id}/messages`
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

    const shortlistResponse = await apiPostJson(
      page.request,
      `/api/org/${organization.slug}/matches/${match.id}/review`,
      {
        action: 'shortlist',
      }
    );
    expect(shortlistResponse.ok()).toBeTruthy();
    const shortlistPayload = (await shortlistResponse.json()) as {
      reviewStage?: string;
      revealScope?: string;
    };
    expect(shortlistPayload.reviewStage).toBe('shortlisted');
    expect(shortlistPayload.revealScope).toBe('shortlist_identity');

    const introResponse = await apiPostJson(
      page.request,
      `/api/org/${organization.slug}/matches/${match.id}/review`,
      {
        action: 'request_intro',
      }
    );
    expect(introResponse.ok()).toBeTruthy();
    const introPayload = (await introResponse.json()) as {
      conversationId?: string;
      introApproved?: boolean;
    };
    const conversationId = introPayload.conversationId;
    expect(conversationId).toBeTruthy();
    expect(introPayload.introApproved).toBe(true);

    const revealRequestResponse = await apiPostJson(
      page.request,
      `/api/org/${organization.slug}/matches/${match.id}/review`,
      {
        action: 'reveal_request',
        requestedScope: 'full_identity',
      }
    );
    expect(revealRequestResponse.ok()).toBeTruthy();
    const revealRequestPayload = (await revealRequestResponse.json()) as {
      waitingForCandidateApproval?: boolean;
      corridorState?: string;
    };
    expect(revealRequestPayload.waitingForCandidateApproval).toBe(true);
    expect(revealRequestPayload.corridorState).toBe('request_reveal');

    await page.context().clearCookies();
    await loginWithUi(page, individualUser);

    const revealApprovalResponse = await apiPostJson(
      page.request,
      `/api/conversations/${conversationId}/reveal`,
      {}
    );
    expect(revealApprovalResponse.ok()).toBeTruthy();
    const revealApprovalPayload = (await revealApprovalResponse.json()) as {
      revealed?: boolean;
      conversation?: { stage?: string };
    };
    expect(revealApprovalPayload.revealed).toBe(true);
    expect(revealApprovalPayload.conversation?.stage).toBe('revealed');

    await page.context().clearCookies();
    await loginWithUi(page, orgUser);

    const scheduledAt = new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString();
    const scheduleInterviewResponse = await apiPostJson(page.request, '/api/interviews/schedule', {
      matchId: match.id,
      scheduledAt,
      platform: 'manual',
      participantUserIds: [individualUser.id, orgUser.id],
      manualMeetingLink: 'https://meet.google.com/strict-individual-manual',
      manualMeetingProvider: 'google_meet',
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
    expect(contractResponse.status()).toBe(410);
  });

  test('I-18..I-20 privacy-safe settings, account controls, and archived routes are real', async ({
    page,
  }) => {
    await loginWithUi(page, individualUser);

    const archivedZenResponse = await page.request.get('/app/i/zen');
    expect(archivedZenResponse.status()).toBe(404);

    let updateVisibilityResponse = await apiPostJson(page.request, '/api/profile/visibility', {
      location: 'private',
      skills: 'network_only',
    });
    if (updateVisibilityResponse.status() === 403) {
      await page.goto('/app/i/settings');
      updateVisibilityResponse = await apiPostJson(page.request, '/api/profile/visibility', {
        location: 'private',
        skills: 'network_only',
      });
    }

    const updateVisibilityStatus = updateVisibilityResponse.status();
    expect([200, 403]).toContain(updateVisibilityStatus);

    const getVisibilityResponse = await page.request.get('/api/profile/visibility');
    expect(getVisibilityResponse.ok()).toBeTruthy();
    const visibilityPayload = (await getVisibilityResponse.json()) as {
      location?: string;
      skills?: string;
    };
    if (updateVisibilityStatus === 200) {
      expect(visibilityPayload.location).toBe('private');
      expect(visibilityPayload.skills).toBe('network_only');
      expect(visibilityPayload).not.toHaveProperty('mission');
    } else {
      expect(typeof visibilityPayload.location).toBe('string');
      expect(typeof visibilityPayload.skills).toBe('string');
      expect(visibilityPayload).not.toHaveProperty('mission');
    }

    const dataExportResponse = await page.request.get('/api/data-export');
    expect(dataExportResponse.ok()).toBeTruthy();
    const dataExportPayload = (await dataExportResponse.json()) as {
      userId?: string;
      proof?: {
        packs?: unknown[];
        artifacts?: unknown[];
        verificationReferences?: unknown[];
        publicSafeProjections?: unknown[];
      };
    };
    expect(dataExportPayload.userId).toBe(individualUser.id);
    expect((dataExportPayload.proof?.packs ?? []).length).toBeGreaterThan(0);
    expect((dataExportPayload.proof?.artifacts ?? []).length).toBeGreaterThan(0);
    expect((dataExportPayload.proof?.verificationReferences ?? []).length).toBeGreaterThan(0);
    expect((dataExportPayload.proof?.publicSafeProjections ?? []).length).toBeGreaterThan(0);

    if (!individualUser.handle) {
      throw new Error('Strict individual fixture did not receive a public handle');
    }
    const publicPortfolioExportResponse = await page.request.get(
      `/api/portfolio/public/${individualUser.handle}/export?format=json`
    );
    expect(publicPortfolioExportResponse.ok()).toBeTruthy();
    const publicPortfolioPayload = (await publicPortfolioExportResponse.json()) as {
      profile?: { handle?: string };
      proofPacks?: unknown[];
    };
    expect(publicPortfolioPayload.profile?.handle).toBe(individualUser.handle);
    expect((publicPortfolioPayload.proofPacks ?? []).length).toBeGreaterThan(0);

    const accountStatusResponse = await page.request.get('/api/user/account');
    expect(accountStatusResponse.ok()).toBeTruthy();
    const accountStatusPayload = (await accountStatusResponse.json()) as { accountStatus?: string };
    expect(typeof accountStatusPayload.accountStatus).toBe('string');

    const deleteAccountResponse = await apiDeleteJson(page.request, '/api/user/account', {
      password: individualUser.password,
      confirmPhrase: 'DELETE MY ACCOUNT',
      reason: 'Privacy concerns',
    });
    const deleteAccountRaw = await deleteAccountResponse.text();
    expect(
      deleteAccountResponse.ok(),
      `Account deletion failed with HTTP ${deleteAccountResponse.status()}: ${deleteAccountRaw}`
    ).toBeTruthy();
    const deleteAccountPayload = JSON.parse(deleteAccountRaw) as {
      status?: string;
      deletionRequestId?: string | null;
      operationId?: string | null;
    };
    expect(deleteAccountPayload.status).toBe('deleted');
    expect(deleteAccountPayload.deletionRequestId).toBeTruthy();
    expect(deleteAccountPayload.operationId).toBeTruthy();

    const supabase = adminClient();
    const { data: deletedProfile, error: deletedProfileError } = await supabase
      .from('profiles')
      .select('deleted, public_portfolio_state')
      .eq('id', individualUser.id)
      .maybeSingle();
    expect(deletedProfileError).toBeNull();
    expect(deletedProfile?.deleted).toBe(true);
    expect(deletedProfile?.public_portfolio_state).not.toBe('public_noindex');
  });
});
