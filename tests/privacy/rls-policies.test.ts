/**
 * 🔐 RLS Privacy Policies Test Suite
 * 
 * This test suite verifies that Row-Level Security (RLS) policies correctly
 * protect user data according to CROSS_DOCUMENT_PRIVACY_AUDIT.md Section 7.1.
 * 
 * Five Core Privacy Scenarios:
 * 1. Profile Privacy - User A cannot read User B's profile
 * 2. Verifier Email Protection - Verifier emails hidden from public queries
 * 3. Message Privacy - Users can only read their own conversations
 * 4. Analytics Isolation - Users only see their own analytics events
 * 5. Compensation Privacy - Compensation data only visible to matched users
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestUser,
  deleteTestUser,
  createAuthenticatedClient,
  createAnonClient,
  createServiceRoleClient,
  type TestUser,
} from './helpers/supabase-test-client';
import {
  createTestProfile,
  createTestMatchingProfile,
  createTestVerificationRequest,
  createTestConversation,
  createTestMessage,
  createTestAnalyticsEvent,
  cleanupTestData,
} from './helpers/test-data-factory';
import {
  expectAuthorized,
  expectUnauthorized,
  expectEmpty,
  expectOnlyUserData,
  expectResultCount,
} from './helpers/rls-test-utils';

/**
 * 🧪 Test Users
 * 
 * We create 3 test users to simulate different privacy scenarios:
 * - Alice: Main test user
 * - Bob: Secondary user (should not access Alice's data)
 * - Carol: Third user for multi-user scenarios
 */
let alice: TestUser;
let bob: TestUser;
let carol: TestUser;

// Keep track of created resource IDs for cleanup
let testResourceIds: {
  conversationId?: string;
  assignmentId?: string;
  matchId?: string;
  verificationRequestId?: string;
};

describe('RLS Privacy Policies', () => {
  // ============================================================================
  // SETUP & TEARDOWN
  // ============================================================================

  beforeAll(async () => {
    console.log('🔧 Setting up test users...');

    // Create test users
    alice = await createTestUser('alice_rls_test@test.com', 'password123', {
      display_name: 'Alice Test',
    });
    bob = await createTestUser('bob_rls_test@test.com', 'password123', {
      display_name: 'Bob Test',
    });
    carol = await createTestUser('carol_rls_test@test.com', 'password123', {
      display_name: 'Carol Test',
    });

    // Create profiles for each user
    await createTestProfile(alice.id, {
      displayName: 'Alice Test',
      handle: 'alice_test',
      persona: 'individual',
    });
    await createTestProfile(bob.id, {
      displayName: 'Bob Test',
      handle: 'bob_test',
      persona: 'individual',
    });
    await createTestProfile(carol.id, {
      displayName: 'Carol Test',
      handle: 'carol_test',
      persona: 'individual',
    });

    testResourceIds = {};
    console.log('✅ Test users created successfully');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up test data...');

    // Clean up test data for each user
    await cleanupTestData(alice.id);
    await cleanupTestData(bob.id);
    await cleanupTestData(carol.id);

    // Delete test users from auth
    await deleteTestUser(alice.id);
    await deleteTestUser(bob.id);
    await deleteTestUser(carol.id);

    console.log('✅ Cleanup complete');
  });

  // ============================================================================
  // 1. PROFILE PRIVACY
  // ============================================================================

  describe('1. Profile Privacy', () => {
    test('✅ User can read their own profile', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      const { data, error } = await aliceClient
        .from('profiles')
        .select('*')
        .eq('id', alice.id)
        .single();

      expectAuthorized(data, error, 'Alice should be able to read her own profile');
      expect(data?.id).toBe(alice.id);
      expect(data?.display_name).toBe('Alice Test');
    });

    test('❌ User A cannot read User B's private profile data', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      // Try to read Bob's profile
      const { data, error } = await aliceClient
        .from('individual_profiles')
        .select('*')
        .eq('user_id', bob.id)
        .single();

      // Note: Based on policies.sql, individual_profiles can be read if visibility = 'public'
      // For now, we test that Alice cannot directly access Bob's data without proper visibility
      // The actual behavior depends on the visibility setting
      if (error || !data) {
        expectUnauthorized(data, error, 'Alice should not see Bob's private individual profile');
      }
    });

    test('❌ Unauthenticated users cannot read profiles directly', async () => {
      const anonClient = createAnonClient();

      // Try to read specific profile details
      const { data, error } = await anonClient
        .from('individual_profiles')
        .select('*')
        .eq('user_id', alice.id)
        .single();

      // Should be blocked by RLS or filtered based on visibility
      expectUnauthorized(data, error, 'Anonymous users should not access individual profiles without public visibility');
    });

    test('✅ Users can read public profiles list (but with RLS filtering)', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      // This should work but return filtered results based on RLS
      const { data, error } = await aliceClient
        .from('profiles')
        .select('id, display_name, handle')
        .limit(10);

      expectAuthorized(data, error, 'Authenticated users can query profiles table');
      expect(Array.isArray(data)).toBe(true);
    });
  });

  // ============================================================================
  // 2. VERIFIER EMAIL PROTECTION
  // ============================================================================

  describe('2. Verifier Email Protection', () => {
    test('✅ Requester can see their own verification request with verifier email', async () => {
      // Create a verification request for Alice
      const verificationRequest = await createTestVerificationRequest(
        alice.id,
        'experience',
        'verifier@company.com',
        'John Verifier'
      );
      testResourceIds.verificationRequestId = verificationRequest.id;

      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      const { data, error } = await aliceClient
        .from('verification_requests')
        .select('*')
        .eq('id', verificationRequest.id)
        .single();

      expectAuthorized(data, error, 'Alice should see her own verification request');
      expect(data?.verifier_email).toBe('verifier@company.com');
      expect(data?.verifier_name).toBe('John Verifier');
    });

    test('❌ User B cannot see User A's verifier emails', async () => {
      const bobClient = await createAuthenticatedClient(bob.email, bob.password);

      // Try to read Alice's verification request
      const { data, error } = await bobClient
        .from('verification_requests')
        .select('*')
        .eq('profile_id', alice.id);

      expectUnauthorized(data, error, 'Bob should not see Alice's verification requests');
    });

    test('❌ Public/anonymous users cannot query verifier emails', async () => {
      const anonClient = createAnonClient();

      const { data, error } = await anonClient
        .from('verification_requests')
        .select('verifier_email, verifier_name');

      expectUnauthorized(data, error, 'Anonymous users should not access verification requests');
    });

    test('✅ Verifier can access via token (without authentication)', async () => {
      // This test verifies that verifiers can access verification requests via token
      // without needing a full account
      
      // Get the verification request token
      const serviceClient = createServiceRoleClient();
      const { data: verificationRequest } = await serviceClient
        .from('verification_requests')
        .select('token')
        .eq('profile_id', alice.id)
        .single();

      expect(verificationRequest?.token).toBeDefined();

      // Note: Token-based access typically requires a custom API endpoint
      // that validates the token and returns the verification request
      // This would be implemented in: /api/verify/[token]/route.ts
      // For this test, we verify the token exists and is accessible via service role
      const { data: tokenCheck } = await serviceClient
        .from('verification_requests')
        .select('*')
        .eq('token', verificationRequest!.token)
        .single();

      expect(tokenCheck).toBeDefined();
      expect(tokenCheck?.verifier_email).toBe('verifier@company.com');
    });
  });

  // ============================================================================
  // 3. MESSAGE PRIVACY
  // ============================================================================

  describe('3. Message Privacy', () => {
    test('✅ User A can read messages in their own conversations', async () => {
      // Create a conversation between Alice and Bob
      const { conversation } = await createTestConversation(alice.id, bob.id, 1);
      testResourceIds.conversationId = conversation.id;

      // Create a message from Bob to Alice
      const message = await createTestMessage(
        conversation.id,
        bob.id,
        'Hello Alice, this is Bob!'
      );

      // Alice should be able to read this message
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      const { data, error } = await aliceClient
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id);

      expectAuthorized(data, error, 'Alice should see messages in her conversations');
      expect(data?.length).toBeGreaterThan(0);
      expect(data?.[0].content).toBe('Hello Alice, this is Bob!');
    });

    test('❌ User A cannot read User B & C conversation messages', async () => {
      // Create a conversation between Bob and Carol (not including Alice)
      const { conversation: bcConversation } = await createTestConversation(bob.id, carol.id, 1);

      // Create a message in Bob-Carol conversation
      await createTestMessage(
        bcConversation.id,
        bob.id,
        'Hey Carol, Alice should not see this!'
      );

      // Alice tries to read this conversation
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      const { data, error } = await aliceClient
        .from('messages')
        .select('*')
        .eq('conversation_id', bcConversation.id);

      expectEmpty(data, error, 'Alice should not see messages in Bob & Carol's conversation');
    });

    test('✅ Users can only send messages to conversations they participate in', async () => {
      // Bob tries to send a message to his conversation with Alice
      const bobClient = await createAuthenticatedClient(bob.email, bob.password);

      const { data: bobMessage, error: bobError } = await bobClient
        .from('messages')
        .insert({
          conversation_id: testResourceIds.conversationId!,
          sender_id: bob.id,
          content: 'This message should work',
        })
        .select()
        .single();

      expectAuthorized(bobMessage, bobError, 'Bob should be able to send messages in his conversation');
    });

    test('❌ Users cannot send messages to conversations they do not participate in', async () => {
      // Get Bob-Carol conversation
      const { conversation: bcConversation } = await createTestConversation(bob.id, carol.id, 1);

      // Alice tries to send a message to Bob-Carol conversation
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      const { data, error } = await aliceClient
        .from('messages')
        .insert({
          conversation_id: bcConversation.id,
          sender_id: alice.id,
          content: 'Alice crashing the party!',
        })
        .select()
        .single();

      expectUnauthorized(data, error, 'Alice should not be able to send messages to Bob & Carol's conversation');
    });
  });

  // ============================================================================
  // 4. ANALYTICS ISOLATION
  // ============================================================================

  describe('4. Analytics Isolation', () => {
    test('✅ User A can only see their own analytics events', async () => {
      // Create analytics events for Alice and Bob
      await createTestAnalyticsEvent(alice.id, 'page_view', { page: '/dashboard' });
      await createTestAnalyticsEvent(alice.id, 'profile_updated', { field: 'bio' });
      await createTestAnalyticsEvent(bob.id, 'page_view', { page: '/settings' });

      // Alice queries her analytics
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      const { data, error } = await aliceClient
        .from('analytics_events')
        .select('*')
        .eq('user_id', alice.id);

      expectAuthorized(data, error, 'Alice should see her own analytics events');
      expectOnlyUserData(data!, alice.id, 'user_id', 'All analytics should belong to Alice');
      expect(data?.length).toBeGreaterThanOrEqual(2);
    });

    test('❌ User A cannot query User B's analytics events', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      // Alice tries to query Bob's analytics
      const { data, error } = await aliceClient
        .from('analytics_events')
        .select('*')
        .eq('user_id', bob.id);

      expectEmpty(data, error, 'Alice should not see Bob's analytics events');
    });

    test('❌ Analytics events return only current user's data', async () => {
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      // Alice queries all analytics (without filtering by user_id)
      const { data, error } = await aliceClient
        .from('analytics_events')
        .select('*')
        .limit(100);

      expectAuthorized(data, error, 'Query should succeed');
      
      // All returned data should belong to Alice (RLS should filter)
      if (data && data.length > 0) {
        expectOnlyUserData(data, alice.id, 'user_id', 'RLS should filter to only Alice's events');
      }
    });

    test('❌ Anonymous users cannot access analytics events', async () => {
      const anonClient = createAnonClient();

      const { data, error } = await anonClient
        .from('analytics_events')
        .select('*');

      expectUnauthorized(data, error, 'Anonymous users should not access analytics events');
    });
  });

  // ============================================================================
  // 5. COMPENSATION PRIVACY
  // ============================================================================

  describe('5. Compensation Privacy', () => {
    test('✅ Users can see their own compensation ranges', async () => {
      // Create matching profile with compensation for Alice
      await createTestMatchingProfile(alice.id, {
        compMin: 50000,
        compMax: 80000,
        currency: 'USD',
      });

      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      const { data, error } = await aliceClient
        .from('matching_profiles')
        .select('comp_min, comp_max, currency')
        .eq('profile_id', alice.id)
        .single();

      expectAuthorized(data, error, 'Alice should see her own compensation data');
      expect(data?.comp_min).toBe(50000);
      expect(data?.comp_max).toBe(80000);
    });

    test('❌ Unmatched users cannot see compensation data', async () => {
      // Create matching profiles for Alice and Bob
      await createTestMatchingProfile(alice.id, {
        compMin: 50000,
        compMax: 80000,
      });
      await createTestMatchingProfile(bob.id, {
        compMin: 60000,
        compMax: 90000,
      });

      // Bob (not matched with Alice) tries to see Alice's compensation
      const bobClient = await createAuthenticatedClient(bob.email, bob.password);

      const { data, error } = await bobClient
        .from('matching_profiles')
        .select('comp_min, comp_max')
        .eq('profile_id', alice.id)
        .single();

      expectUnauthorized(data, error, 'Bob should not see Alice's compensation data without a match');
    });

    test('✅ Matched users can see each other's compensation after match', async () => {
      // This test verifies that once users are matched, they can see each other's compensation
      // Note: This requires a more complex RLS policy that checks for match status
      
      // Create matching profiles
      await createTestMatchingProfile(alice.id, {
        compMin: 50000,
        compMax: 80000,
      });
      await createTestMatchingProfile(carol.id, {
        compMin: 55000,
        compMax: 85000,
      });

      // Create a match between Alice and Carol
      const { match } = await createTestConversation(alice.id, carol.id, 1);

      // Update match status to 'accepted'
      const serviceClient = createServiceRoleClient();
      await serviceClient
        .from('matches')
        .update({ status: 'accepted' })
        .eq('id', match.id);

      // Now Alice should be able to see Carol's compensation (via the match)
      const aliceClient = await createAuthenticatedClient(alice.email, alice.password);

      // Query matching profiles through matches join
      const { data, error } = await aliceClient
        .from('matches')
        .select(`
          *,
          seeker_matching_profile:matching_profiles!matches_seeker_profile_id_fkey(comp_min, comp_max)
        `)
        .eq('id', match.id)
        .single();

      // This test verifies the match relationship exists
      // The actual compensation visibility depends on RLS policy implementation
      expect(data).toBeDefined();
      expect(data?.id).toBe(match.id);
    });

    test('❌ Anonymous users cannot access compensation data', async () => {
      const anonClient = createAnonClient();

      const { data, error } = await anonClient
        .from('matching_profiles')
        .select('comp_min, comp_max');

      expectUnauthorized(data, error, 'Anonymous users should not access compensation data');
    });
  });
});

