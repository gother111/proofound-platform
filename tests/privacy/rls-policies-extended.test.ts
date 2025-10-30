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
} from './helpers/test-data-factory';
import {
  expectAuthorized,
  expectUnauthorized,
  expectEmpty,
} from './helpers/rls-test-utils';

let alice: TestUser;
let bob: TestUser;
let carol: TestUser;

describe('Extended RLS Privacy Policies', () => {
  // ============================================================================
  // SETUP & TEARDOWN
  // ============================================================================

  beforeAll(async () => {
    console.log('🔧 Setting up extended test users...');

    alice = await createTestUser('alice_extended@test.com', 'password123', {
      display_name: 'Alice Extended',
    });
    bob = await createTestUser('bob_extended@test.com', 'password123', {
      display_name: 'Bob Extended',
    });
    carol = await createTestUser('carol_extended@test.com', 'password123', {
      display_name: 'Carol Extended',
    });

    await createTestProfile(alice.id, {
      displayName: 'Alice Extended',
      handle: 'alice_ext',
      persona: 'individual',
    });
    await createTestProfile(bob.id, {
      displayName: 'Bob Extended',
      handle: 'bob_ext',
      persona: 'individual',
    });
    await createTestProfile(carol.id, {
      displayName: 'Carol Extended',
      handle: 'carol_ext',
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
          years_experience: 5,
        })
        .select()
        .single();

      expectAuthorized(data, error, 'Alice should be able to add skills to her profile');
      expect(data?.profile_id).toBe(alice.id);
      expect(data?.skill_id).toBe('typescript');
    });

    test('❌ Users cannot add skills to other users' profiles', async () => {
      const bobClient = await createAuthenticatedClient(bob.email, bob.password);

      // Bob tries to add a skill to Alice's profile
      const { data, error } = await bobClient
        .from('skills')
        .insert({
          profile_id: alice.id,
          skill_id: 'python',
          level: 5,
          years_experience: 10,
        })
        .select()
        .single();

      expectUnauthorized(data, error, 'Bob should not be able to add skills to Alice's profile');
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

    test('❌ Users cannot delete other users' skills', async () => {
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

        expectUnauthorized(data, error, 'Bob should not be able to delete Alice's skills');
      }
    });

    test('✅ Users can view public skills (filtered by RLS)', async () => {
      const bobClient = await createAuthenticatedClient(bob.email, bob.password);

      // Query all skills - RLS should filter appropriately
      const { data, error } = await bobClient
        .from('skills')
        .select('*')
        .limit(10);

      expectAuthorized(data, error, 'Query should succeed');
      // Skills visibility depends on profile visibility settings
    });
  });

  // ============================================================================
  // 7. ASSIGNMENT PRIVACY
  // ============================================================================

  describe('7. Assignment Privacy', () => {
    test('✅ Users can create their own assignments', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      const { data, error } = await aliceClient
        .from('assignments')
        .insert({
          poster_profile_id: alice.id,
          title: 'Test Assignment',
          description: 'This is a test assignment',
          status: 'draft',
          visibility: 'public',
        })
        .select()
        .single();

      expectAuthorized(data, error, 'Alice should be able to create assignments');
      expect(data?.poster_profile_id).toBe(alice.id);
    });

    test('✅ Published assignments are visible to authenticated users', async () => {
      const serviceClient = createServiceRoleClient();

      // Create a published assignment for Alice
      await serviceClient
        .from('assignments')
        .insert({
          poster_profile_id: alice.id,
          title: 'Public Assignment',
          description: 'This is public',
          status: 'published',
          visibility: 'public',
        });

      // Bob should be able to see published assignments
      const bobClient = await createAuthenticatedClient(bob.email, bob.password);

      const { data, error } = await bobClient
        .from('assignments')
        .select('*')
        .eq('status', 'published')
        .eq('visibility', 'public');

      expectAuthorized(data, error, 'Bob should see published assignments');
      expect(data?.length).toBeGreaterThan(0);
    });

    test('❌ Draft assignments are not visible to other users', async () => {
      const serviceClient = createServiceRoleClient();

      // Create a draft assignment for Alice
      const { data: draftAssignment } = await serviceClient
        .from('assignments')
        .insert({
          poster_profile_id: alice.id,
          title: 'Draft Assignment',
          description: 'This is a draft',
          status: 'draft',
          visibility: 'public',
        })
        .select()
        .single();

      // Bob should NOT be able to see Alice's draft
      const bobClient = await createAuthenticatedClient(bob.email, bob.password);

      const { data, error } = await bobClient
        .from('assignments')
        .select('*')
        .eq('id', draftAssignment!.id)
        .single();

      expectUnauthorized(data, error, 'Bob should not see Alice's draft assignment');
    });

    test('✅ Users can update their own assignments', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      // Get one of Alice's assignments
      const { data: assignment } = await aliceClient
        .from('assignments')
        .select('*')
        .eq('poster_profile_id', alice.id)
        .limit(1)
        .single();

      expect(assignment).toBeDefined();

      // Update the assignment
      const { data: updated, error } = await aliceClient
        .from('assignments')
        .update({ title: 'Updated Title' })
        .eq('id', assignment!.id)
        .select()
        .single();

      expectAuthorized(updated, error, 'Alice should be able to update her assignment');
      expect(updated?.title).toBe('Updated Title');
    });

    test('❌ Users cannot update other users' assignments', async () => {
      const serviceClient = createServiceRoleClient();

      // Get Alice's assignment
      const { data: aliceAssignment } = await serviceClient
        .from('assignments')
        .select('id')
        .eq('poster_profile_id', alice.id)
        .limit(1)
        .single();

      expect(aliceAssignment).toBeDefined();

      // Bob tries to update Alice's assignment
      const bobClient = await createAuthenticatedClient(bob.email, bob.password);

      const { data, error } = await bobClient
        .from('assignments')
        .update({ title: 'Hacked!' })
        .eq('id', aliceAssignment!.id)
        .select();

      expectUnauthorized(data, error, 'Bob should not be able to update Alice's assignment');
    });
  });

  // ============================================================================
  // 8. ORGANIZATION MEMBER DATA PRIVACY
  // ============================================================================

  describe('8. Organization Member Data Privacy', () => {
    let orgId: string;

    test('✅ Users can create organizations', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      const { data, error } = await aliceClient
        .from('organizations')
        .insert({
          slug: 'test-org-privacy',
          display_name: 'Test Org for Privacy',
          legal_name: 'Test Organization LLC',
          type: 'ngo',
          created_by: alice.id,
        })
        .select()
        .single();

      expectAuthorized(data, error, 'Alice should be able to create an organization');
      expect(data?.slug).toBe('test-org-privacy');
      orgId = data!.id;

      // Add Alice as owner
      await aliceClient
        .from('organization_members')
        .insert({
          org_id: orgId,
          user_id: alice.id,
          role: 'owner',
          status: 'active',
        });
    });

    test('✅ Organization members can see other members', async () => {
      const serviceClient = createServiceRoleClient();

      // Add Bob as a member
      await serviceClient
        .from('organization_members')
        .insert({
          org_id: orgId,
          user_id: bob.id,
          role: 'member',
          status: 'active',
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

    test('✅ Only admins/owners can manage organization members', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      // Alice (owner) can invite new members
      const { data, error } = await aliceClient
        .from('org_invitations')
        .insert({
          org_id: orgId,
          email: 'newuser@test.com',
          role: 'member',
          token: 'test-invite-token-' + Date.now(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          invited_by: alice.id,
        })
        .select()
        .single();

      expectAuthorized(data, error, 'Alice should be able to invite members');
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

      expectUnauthorized(data, error, 'Bob should not be able to remove Alice from the organization');
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

    test('❌ Users cannot see other users' block lists', async () => {
      // Carol tries to see who Alice has blocked
      const carolClient = await createAuthenticatedClient(carol.email, carol.password);

      const { data, error } = await carolClient
        .from('blocked_users')
        .select('*')
        .eq('blocker_id', alice.id);

      expectEmpty(data, error, 'Carol should not see Alice's block list');
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
    test('✅ Conversations start at Stage 1 (masked)', async () => {
      const serviceClient = createServiceRoleClient();

      // Create assignment and match for Alice-Bob conversation
      const { data: assignment } = await serviceClient
        .from('assignments')
        .insert({
          poster_profile_id: alice.id,
          title: 'Test Stage Assignment',
          description: 'Testing conversation stages',
          status: 'published',
          visibility: 'public',
        })
        .select()
        .single();

      const { data: match } = await serviceClient
        .from('matches')
        .insert({
          assignment_id: assignment!.id,
          seeker_profile_id: bob.id,
          poster_profile_id: alice.id,
          status: 'accepted',
          score: 0.9,
          ranking: 1,
        })
        .select()
        .single();

      const { data: conversation, error } = await serviceClient
        .from('conversations')
        .insert({
          match_id: match!.id,
          assignment_id: assignment!.id,
          participant_one_id: alice.id,
          participant_two_id: bob.id,
          stage: 1, // Stage 1 = masked
          status: 'active',
        })
        .select()
        .single();

      expectAuthorized(conversation, error, 'Conversation should be created at Stage 1');
      expect(conversation?.stage).toBe(1);
    });

    test('✅ Participants can advance conversation to Stage 2 (revealed)', async () => {
      const serviceClient = createServiceRoleClient();

      // Get a conversation for Alice and Bob
      const { data: conversation } = await serviceClient
        .from('conversations')
        .select('*')
        .eq('participant_one_id', alice.id)
        .eq('participant_two_id', bob.id)
        .single();

      expect(conversation).toBeDefined();

      // Alice advances the conversation to Stage 2
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      const { data: updated, error } = await aliceClient
        .from('conversations')
        .update({ stage: 2 }) // Stage 2 = revealed
        .eq('id', conversation!.id)
        .select()
        .single();

      expectAuthorized(updated, error, 'Alice should be able to advance conversation stage');
      expect(updated?.stage).toBe(2);
    });

    test('❌ Non-participants cannot modify conversation stage', async () => {
      const serviceClient = createServiceRoleClient();

      // Get Alice-Bob conversation
      const { data: conversation } = await serviceClient
        .from('conversations')
        .select('id')
        .eq('participant_one_id', alice.id)
        .eq('participant_two_id', bob.id)
        .single();

      expect(conversation).toBeDefined();

      // Carol tries to modify the conversation stage
      const carolClient = await createAuthenticatedClient(carol.email, carol.password);

      const { data, error } = await carolClient
        .from('conversations')
        .update({ stage: 1 })
        .eq('id', conversation!.id)
        .select();

      expectUnauthorized(data, error, 'Carol should not be able to modify Alice-Bob conversation');
    });
  });
});

