/**
 * 🔐 Extended RLS Privacy Policies Test Suite
 *
 * This test suite provides extended coverage for Row-Level Security policies
 * beyond the 5 core scenarios. It tests privacy controls for:
 *
 * - Skills & Experience (users can only edit their own)
 * - Assignment Privacy (draft assignments not visible to others)
 * - Organization Member Data (only org members see internal data)
 * - Blocked Users (blocked users cannot see each other's data)
 * - Conversation Stage Transitions (Stage 1 masked, Stage 2 revealed)
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestUser,
  deleteTestUser,
  createAuthenticatedClient,
  createServiceRoleClient,
  type TestUser,
} from './helpers/supabase-test-client';
import {
  createTestProfile,
  cleanupTestData,
  createTestConversation,
} from './helpers/test-data-factory';
import { expectAuthorized, expectUnauthorized, expectEmpty } from './helpers/rls-test-utils';

let alice: TestUser;
let bob: TestUser;
let carol: TestUser;

describe('Extended RLS Privacy Policies', () => {
  // ============================================================================
  // SETUP & TEARDOWN
  // ============================================================================

  beforeAll(async () => {
    console.log('🔧 Setting up extended test users...');
    const ts = Date.now();

    alice = await createTestUser(`alice_extended+${ts}@test.com`, 'password123', {
      display_name: 'Alice Extended',
    });
    bob = await createTestUser(`bob_extended+${ts}@test.com`, 'password123', {
      display_name: 'Bob Extended',
    });
    carol = await createTestUser(`carol_extended+${ts}@test.com`, 'password123', {
      display_name: 'Carol Extended',
    });

    await createTestProfile(alice.id, {
      displayName: 'Alice Extended',
      handle: `alice_ext_${ts}`,
      persona: 'individual',
    });
    await createTestProfile(bob.id, {
      displayName: 'Bob Extended',
      handle: `bob_ext_${ts}`,
      persona: 'individual',
    });
    await createTestProfile(carol.id, {
      displayName: 'Carol Extended',
      handle: `carol_ext_${ts}`,
      persona: 'individual',
    });

    console.log('✅ Extended test users created');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up extended test data...');
    await cleanupTestData(alice.id);
    await cleanupTestData(bob.id);
    await cleanupTestData(carol.id);
    await deleteTestUser(alice.id);
    await deleteTestUser(bob.id);
    await deleteTestUser(carol.id);
    console.log('✅ Extended cleanup complete');
  });

  // ============================================================================
  // 6. SKILLS & EXPERIENCE PRIVACY
  // ============================================================================

  describe('6. Skills & Experience Privacy', () => {
    test('✅ Users can add skills to their own profile', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      const { data, error } = await aliceClient
        .from('skills')
        .insert({
          profile_id: alice.id,
          skill_id: 'typescript',
          level: 4,
          months_experience: 60,
        })
        .select()
        .single();

      expectAuthorized(data, error, 'Alice should be able to add skills to her profile');
      expect(data?.profile_id).toBe(alice.id);
      expect(data?.skill_id).toBe('typescript');
    });

    test("❌ Users cannot add skills to other users' profiles", async () => {
      const bobClient = await createAuthenticatedClient(bob.email, bob.password);

      // Bob tries to add a skill to Alice's profile
      const { data, error } = await bobClient
        .from('skills')
        .insert({
          profile_id: alice.id,
          skill_id: 'python',
          level: 5,
          months_experience: 120,
        })
        .select()
        .single();

      expectUnauthorized(data, error, "Bob should not be able to add skills to Alice's profile");
    });

    test('✅ Users can update their own skills', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      // First, get Alice's skill
      const { data: skill } = await aliceClient
        .from('skills')
        .select('*')
        .eq('profile_id', alice.id)
        .eq('skill_id', 'typescript')
        .single();

      expect(skill).toBeDefined();

      // Update the skill level
      const { data: updated, error } = await aliceClient
        .from('skills')
        .update({ level: 5 })
        .eq('id', skill!.id)
        .select()
        .single();

      expectAuthorized(updated, error, 'Alice should be able to update her own skills');
      expect(updated?.level).toBe(5);
    });

    test("❌ Users cannot delete other users' skills", async () => {
      const bobClient = await createAuthenticatedClient(bob.email, bob.password);

      // Get Alice's skill ID (using service role)
      const serviceClient = createServiceRoleClient();
      const { data: aliceSkill } = await serviceClient
        .from('skills')
        .select('id')
        .eq('profile_id', alice.id)
        .limit(1)
        .single();

      if (aliceSkill) {
        // Bob tries to delete Alice's skill
        const { data, error } = await bobClient
          .from('skills')
          .delete()
          .eq('id', aliceSkill.id)
          .select();

        expectUnauthorized(data, error, "Bob should not be able to delete Alice's skills");
      }
    });

    test('✅ Users can view public skills (filtered by RLS)', async () => {
      const bobClient = await createAuthenticatedClient(bob.email, bob.password);

      // Query all skills - RLS should filter appropriately
      const { data, error } = await bobClient.from('skills').select('*').limit(10);

      expectAuthorized(data, error, 'Query should succeed');
      // Skills visibility depends on profile visibility settings
    });
  });

  // ============================================================================
  // 7. ASSIGNMENT PRIVACY
  // ============================================================================

  describe('7. Assignment Privacy', () => {
    const createOrgForUser = async (userId: string) => {
      const serviceClient = createServiceRoleClient();
      const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const { data: org, error: orgError } = await serviceClient
        .from('organizations')
        .insert({
          slug: `test-org-assignment-${suffix}`,
          display_name: `Assignment Org ${suffix}`,
          legal_name: `Assignment Org ${suffix} LLC`,
          type: 'company',
          created_by: userId,
        })
        .select('id')
        .single();

      expectAuthorized(org, orgError, 'Setup should create an organization');

      const { error: membershipError } = await serviceClient.from('organization_members').insert({
        org_id: org!.id,
        user_id: userId,
        role: 'org_owner',
        state: 'active',
      });

      expect(membershipError).toBeNull();
      return org!.id as string;
    };

    test('✅ Users can create assignments in their organization', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);
      const orgId = await createOrgForUser(alice.id);

      const { data, error } = await aliceClient
        .from('assignments')
        .insert({
          org_id: orgId,
          role: 'Test Assignment',
          description: 'This is a test assignment',
          status: 'draft',
        })
        .select()
        .single();

      expectAuthorized(
        data,
        error,
        'Alice should be able to create assignments for her organization'
      );
      expect(data?.org_id).toBe(orgId);
    });

    test('✅ Active assignments are visible to authenticated users', async () => {
      const serviceClient = createServiceRoleClient();
      const orgId = await createOrgForUser(alice.id);

      // Create an active assignment for Alice's org
      const { data: activeAssignment, error: createError } = await serviceClient
        .from('assignments')
        .insert({
          org_id: orgId,
          role: 'Public Assignment',
          description: 'This is public',
          status: 'active',
        })
        .select('id')
        .single();

      expectAuthorized(activeAssignment, createError, 'Setup should create an active assignment');

      // Active assignments remain discoverable to authenticated users.
      const bobClient = await createAuthenticatedClient(bob.email, bob.password);

      const { data, error } = await bobClient
        .from('assignments')
        .select('id, status')
        .eq('id', activeAssignment!.id)
        .maybeSingle();

      expectAuthorized(data, error, 'Bob should see active assignments');
      expect(data?.id).toBe(activeAssignment!.id);
      expect(data?.status).toBe('active');
    });

    test('❌ Draft assignments are not visible to other users', async () => {
      const serviceClient = createServiceRoleClient();
      const orgId = await createOrgForUser(alice.id);

      // Create a draft assignment for Alice
      const { data: draftAssignment } = await serviceClient
        .from('assignments')
        .insert({
          org_id: orgId,
          role: 'Draft Assignment',
          description: 'This is a draft',
          status: 'draft',
        })
        .select()
        .single();

      // Bob should NOT be able to see Alice's draft
      const bobClient = await createAuthenticatedClient(bob.email, bob.password);

      const { data, error } = await bobClient
        .from('assignments')
        .select('*')
        .eq('id', draftAssignment!.id);

      expectUnauthorized(data, error, "Bob should not see Alice's draft assignment");
    });

    test('✅ Users can update assignments in their own organization', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);
      const serviceClient = createServiceRoleClient();
      const orgId = await createOrgForUser(alice.id);

      const { data: assignment, error: assignmentError } = await serviceClient
        .from('assignments')
        .insert({
          org_id: orgId,
          role: 'Mutable Assignment',
          description: 'Before update',
          status: 'draft',
        })
        .select('id')
        .single();

      expectAuthorized(assignment, assignmentError, 'Setup should create assignment to update');

      // Update the assignment
      const { data: updated, error } = await aliceClient
        .from('assignments')
        .update({ role: 'Updated Assignment Role' })
        .eq('id', assignment!.id)
        .select()
        .single();

      expectAuthorized(updated, error, 'Alice should be able to update her assignment');
      expect(updated?.role).toBe('Updated Assignment Role');
    });

    test("❌ Users cannot update other users' assignments", async () => {
      const serviceClient = createServiceRoleClient();
      const orgId = await createOrgForUser(alice.id);

      // Create Alice's assignment
      const { data: aliceAssignment, error: assignmentError } = await serviceClient
        .from('assignments')
        .insert({
          org_id: orgId,
          role: 'Protected Assignment',
          description: 'Bob should not update this',
          status: 'draft',
        })
        .select('id')
        .single();

      expectAuthorized(aliceAssignment, assignmentError, 'Setup should create assignment');

      // Bob tries to update Alice's assignment
      const bobClient = await createAuthenticatedClient(bob.email, bob.password);

      const { data, error } = await bobClient
        .from('assignments')
        .update({ role: 'Hacked!' })
        .eq('id', aliceAssignment!.id)
        .select();

      expectUnauthorized(data, error, "Bob should not be able to update Alice's assignment");
    });
  });

  // ============================================================================
  // 8. ORGANIZATION MEMBER DATA PRIVACY
  // ============================================================================

  describe('8. Organization Member Data Privacy', () => {
    let orgId: string;

    test('✅ Users can create organizations', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);
      const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const { data, error } = await aliceClient
        .from('organizations')
        .insert({
          slug: `test-org-privacy-${suffix}`,
          display_name: `Test Org for Privacy ${suffix}`,
          legal_name: 'Test Organization LLC',
          type: 'ngo',
          created_by: alice.id,
        })
        .select()
        .single();

      expectAuthorized(data, error, 'Alice should be able to create an organization');
      orgId = data!.id;
      expect(data?.slug.startsWith('test-org-privacy-')).toBe(true);

      // Bootstrap ownership through the trusted setup path.
      const serviceClient = createServiceRoleClient();
      const { data: ownerMembership, error: ownerMembershipError } = await serviceClient
        .from('organization_members')
        .insert({
          org_id: orgId,
          user_id: alice.id,
          role: 'org_owner',
          state: 'active',
        })
        .select()
        .single();

      expectAuthorized(
        ownerMembership,
        ownerMembershipError,
        'Setup should add Alice as org owner'
      );
    });

    test('✅ Organization members can see other members', async () => {
      const serviceClient = createServiceRoleClient();

      // Add Bob as a member
      await serviceClient.from('organization_members').insert({
        org_id: orgId,
        user_id: bob.id,
        role: 'org_reviewer',
        state: 'active',
      });

      // Alice (owner) should see Bob in members list
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      const { data, error } = await aliceClient
        .from('organization_members')
        .select('*')
        .eq('org_id', orgId);

      expectAuthorized(data, error, 'Alice should see organization members');
      expect(data?.length).toBeGreaterThan(1); // At least Alice and Bob
    });

    test('❌ Non-members cannot see organization member lists', async () => {
      // Carol (not a member) tries to see the org members
      const carolClient = await createAuthenticatedClient(carol.email, carol.password);

      const { data, error } = await carolClient
        .from('organization_members')
        .select('*')
        .eq('org_id', orgId);

      expectEmpty(data, error, 'Carol should not see organization members');
    });

    test('✅ Org owners can invite team members', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      // Alice (owner) can invite new members
      const { data, error } = await aliceClient
        .from('org_invitations')
        .insert({
          org_id: orgId,
          email: 'newuser@test.com',
          role: 'org_reviewer',
          token: 'test-invite-token-' + Date.now(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          invited_by: alice.id,
        })
        .select()
        .single();

      expectAuthorized(data, error, 'Alice should be able to invite members');
    });

    test('✅ Managers can read team data but cannot send collaborator invites', async () => {
      const serviceClient = createServiceRoleClient();

      await serviceClient.from('organization_members').insert({
        org_id: orgId,
        user_id: carol.id,
        role: 'org_manager',
        state: 'active',
      });

      const carolClient = await createAuthenticatedClient(carol.email, carol.password);

      const { data: members, error: membersError } = await carolClient
        .from('organization_members')
        .select('*')
        .eq('org_id', orgId);

      expectAuthorized(
        members,
        membersError,
        'Managers should be able to read organization members'
      );

      const { data, error } = await carolClient
        .from('org_invitations')
        .insert({
          org_id: orgId,
          email: 'manager-invite@test.com',
          role: 'org_reviewer',
          token: 'manager-team-invite-token-' + Date.now(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          invited_by: carol.id,
        })
        .select()
        .single();

      expectUnauthorized(data, error, 'Managers should not be able to send collaborator invites');
    });

    test('✅ Managers can create candidate invites but reviewers cannot', async () => {
      const buildInvite = (seed: string) => {
        const email = `${seed}+${Date.now()}@example.com`;
        return {
          org_id: orgId,
          invitee_email: email,
          invitee_email_normalized: email.toLowerCase(),
          token_hash: `${seed}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
      };

      const carolClient = await createAuthenticatedClient(carol.email, carol.password);
      const { data: managerInvite, error: managerInviteError } = await carolClient
        .from('org_candidate_invites')
        .insert(buildInvite('manager-candidate-invite'))
        .select()
        .single();

      expectAuthorized(
        managerInvite,
        managerInviteError,
        'Managers should be able to create candidate invites'
      );

      const bobClient = await createAuthenticatedClient(bob.email, bob.password);
      const { data: reviewerInvite, error: reviewerInviteError } = await bobClient
        .from('org_candidate_invites')
        .insert(buildInvite('reviewer-candidate-invite'))
        .select()
        .single();

      expectUnauthorized(
        reviewerInvite,
        reviewerInviteError,
        'Reviewers should not be able to create candidate invites'
      );
    });

    test('❌ Managers cannot remove other members', async () => {
      const carolClient = await createAuthenticatedClient(carol.email, carol.password);

      const { data, error } = await carolClient
        .from('organization_members')
        .delete()
        .eq('org_id', orgId)
        .eq('user_id', bob.id)
        .select();

      expectUnauthorized(data, error, 'Managers should not be able to remove other members');
    });

    test('❌ Regular members cannot remove other members', async () => {
      // Bob (regular member) tries to remove Alice (owner)
      const bobClient = await createAuthenticatedClient(bob.email, bob.password);

      const { data, error } = await bobClient
        .from('organization_members')
        .delete()
        .eq('org_id', orgId)
        .eq('user_id', alice.id)
        .select();

      expectUnauthorized(
        data,
        error,
        'Bob should not be able to remove Alice from the organization'
      );
    });

    test('✅ Org owners can remove team members', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      const { data, error } = await aliceClient
        .from('organization_members')
        .delete()
        .eq('org_id', orgId)
        .eq('user_id', carol.id)
        .select();

      expectAuthorized(data, error, 'Org owners should be able to remove team members');
    });
  });

  // ============================================================================
  // 9. BLOCKED USERS PRIVACY
  // ============================================================================

  describe('9. Blocked Users Privacy', () => {
    test('✅ Users can block other users', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      // Alice blocks Bob
      const { data, error } = await aliceClient
        .from('blocked_users')
        .insert({
          blocker_id: alice.id,
          blocked_id: bob.id,
          reason: 'Test blocking',
        })
        .select()
        .single();

      expectAuthorized(data, error, 'Alice should be able to block Bob');
      expect(data?.blocker_id).toBe(alice.id);
      expect(data?.blocked_id).toBe(bob.id);
    });

    test('✅ Users can see their own block list', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      const { data, error } = await aliceClient
        .from('blocked_users')
        .select('*')
        .eq('blocker_id', alice.id);

      expectAuthorized(data, error, 'Alice should see her block list');
      expect(data?.length).toBeGreaterThan(0);
    });

    test("❌ Users cannot see other users' block lists", async () => {
      // Carol tries to see who Alice has blocked
      const carolClient = await createAuthenticatedClient(carol.email, carol.password);

      const { data, error } = await carolClient
        .from('blocked_users')
        .select('*')
        .eq('blocker_id', alice.id);

      expectEmpty(data, error, "Carol should not see Alice's block list");
    });

    test('✅ Users can unblock other users', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      // Alice unblocks Bob
      const { data, error } = await aliceClient
        .from('blocked_users')
        .delete()
        .eq('blocker_id', alice.id)
        .eq('blocked_id', bob.id)
        .select();

      expectAuthorized(data, error, 'Alice should be able to unblock Bob');
    });
  });

  // ============================================================================
  // 10. CONVERSATION STAGE TRANSITIONS
  // ============================================================================

  describe('10. Conversation Stage Transitions', () => {
    const assertPresent = <T>(record: T | null | undefined, message: string): T => {
      if (!record) {
        throw new Error(message);
      }
      return record;
    };

    const ensureConversationForAliceBob = async () => {
      const { conversation } = await createTestConversation(alice.id, bob.id, 'masked');
      return assertPresent(conversation, 'Conversation creation failed for Alice/Bob');
    };

    test('✅ Conversations start at Stage 1 (masked)', async () => {
      const conversation = await ensureConversationForAliceBob();
      expect(conversation?.stage).toBe('masked');
    });

    test('✅ Participants can advance conversation to Stage 2 (revealed)', async () => {
      const conversation = await ensureConversationForAliceBob();

      // Alice advances the conversation to Stage 2
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      const { data: updated, error } = await aliceClient
        .from('conversations')
        .update({
          stage: 'revealed',
          revealed_at: new Date().toISOString(),
        })
        .eq('id', conversation.id)
        .select()
        .single();

      expectAuthorized(updated, error, 'Alice should be able to advance conversation stage');
      expect(updated?.stage).toBe('revealed');
    });

    test('❌ Non-participants cannot modify conversation stage', async () => {
      const conversation = await ensureConversationForAliceBob();

      // Carol tries to modify the conversation stage
      const carolClient = await createAuthenticatedClient(carol.email, carol.password);

      const { data, error } = await carolClient
        .from('conversations')
        .update({
          stage: 'revealed',
          revealed_at: new Date().toISOString(),
        })
        .eq('id', conversation.id)
        .select();

      expectUnauthorized(data, error, 'Carol should not be able to modify Alice-Bob conversation');
    });
  });
});
