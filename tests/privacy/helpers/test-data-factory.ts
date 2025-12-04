/**
 * 🏭 Test Data Factory
 * 
 * This module provides functions to create test data for RLS policy testing.
 * All functions use the service role client to bypass RLS when creating test data.
 * 
 * Test data is prefixed with 'test_' for easy identification and cleanup.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from './supabase-test-client';

/**
 * 📝 Create a test profile
 * 
 * Creates a profile record linked to a Supabase Auth user.
 * 
 * @param userId - Auth user ID (from createTestUser)
 * @param data - Profile data (display_name, handle, etc.)
 * @returns Created profile
 */
export async function createTestProfile(
  userId: string,
  data: {
    displayName?: string;
    handle?: string;
    persona?: 'individual' | 'org_member' | 'unknown';
  } = {}
) {
  const client = createServiceRoleClient();

  // Ensure a clean slate for this user ID (handles reruns)
  await client.from('profiles').delete().eq('id', userId);

  const { data: profile, error } = await client
    .from('profiles')
    .insert({
      id: userId,
      display_name: data.displayName || `test_user_${userId.slice(0, 8)}`,
      handle: data.handle || `test_${userId.slice(0, 8)}`,
      persona: data.persona || 'individual',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test profile: ${error.message}`);
  }

  return profile;
}

/**
 * 💰 Create a test matching profile with compensation data
 * 
 * Creates a matching profile with compensation ranges (sensitive data).
 * 
 * @param userId - Profile/User ID
 * @param compData - Compensation range
 * @returns Created matching profile
 */
export async function createTestMatchingProfile(
  userId: string,
  compData: {
    compMin?: number;
    compMax?: number;
    currency?: string;
  } = {}
) {
  const client = createServiceRoleClient();

  // Clean existing matching profile to avoid PK conflicts on reruns
  await client.from('matching_profiles').delete().eq('profile_id', userId);

  const { data: matchingProfile, error } = await client
    .from('matching_profiles')
    .insert({
      profile_id: userId,
      comp_min: compData.compMin || 50000,
      comp_max: compData.compMax || 80000,
      currency: compData.currency || 'USD',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test matching profile: ${error.message}`);
  }

  return matchingProfile;
}

/**
 * ✅ Create a test verification request
 * 
 * Creates a verification request with a verifier email (Tier 1 PII).
 * This tests that verifier emails are properly protected by RLS.
 * 
 * @param profileId - User requesting verification
 * @param claimType - Type of claim being verified
 * @param verifierEmail - Email of the verifier (should be protected)
 * @returns Created verification request
 */
export async function createTestVerificationRequest(
  profileId: string,
  claimType: 'experience' | 'education' | 'volunteering' | 'impact_story' | 'capability',
  verifierEmail: string,
  verifierName?: string
) {
  const client = createServiceRoleClient();

  // Generate a unique token for verifier access
  const token = `test_token_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

  const { data: request, error } = await client
    .from('verification_requests')
    .insert({
      profile_id: profileId,
      claim_type: claimType,
      claim_data: 'test_claim',
      verifier_email: verifierEmail,
      verifier_name: verifierName || 'Test Verifier',
      token,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test verification request: ${error.message}`);
  }

  return request;
}

/**
 * 💬 Create a test conversation between two users
 * 
 * Creates a conversation linked to a match and assignment.
 * This tests that users can only see their own conversations.
 * 
 * @param participantOneId - First participant user ID
 * @param participantTwoId - Second participant user ID
 * @param stage - Conversation stage (1 = masked, 2 = revealed)
 * @returns Created conversation
 */
export async function createTestConversation(
  participantOneId: string,
  participantTwoId: string,
  stage: number | 'masked' | 'revealed' = 1
) {
  const client = createServiceRoleClient();
  const stageValue = stage === 2 || stage === 'revealed' ? 'revealed' : 'masked';

  // Create a dummy organization to satisfy NOT NULL org_id on assignments
  const slug = `test-org-${Math.random().toString(36).slice(2, 8)}`;
  const { data: org, error: orgError } = await client
    .from('organizations')
    .insert({
      slug,
      display_name: `Test Org ${slug}`,
      type: 'company',
    })
    .select()
    .single();

  if (orgError || !org) {
    throw new Error(`Failed to create test organization: ${orgError?.message}`);
  }

  // Add both participants as members for assignment/match visibility
  await client.from('organization_members').delete().eq('org_id', org.id).in('user_id', [participantOneId, participantTwoId]);
  await client
    .from('organization_members')
    .insert([
      {
        org_id: org.id,
        user_id: participantOneId,
        role: 'admin',
        status: 'active',
      },
      {
        org_id: org.id,
        user_id: participantTwoId,
        role: 'member',
        status: 'active',
      },
    ]);

  // First create a dummy assignment (required by FK)
  const { data: assignment, error: assignmentError } = await client
    .from('assignments')
    .insert({
      org_id: org.id,
      role: 'Test Assignment',
      description: 'Test assignment for RLS testing',
      status: 'active',
      values_required: [],
      cause_tags: [],
      must_have_skills: [],
      nice_to_have_skills: [],
    })
    .select()
    .single();

  if (assignmentError) {
    throw new Error(`Failed to create test assignment: ${assignmentError.message}`);
  }

  // Create a dummy match
  const { data: match, error: matchError } = await client
    .from('matches')
    .insert({
      assignment_id: assignment.id,
      profile_id: participantOneId,
      score: 0.85,
      vector: {},
      weights: {},
      subscores: {},
    })
    .select()
    .single();

  if (matchError) {
    throw new Error(`Failed to create test match: ${matchError.message}`);
  }

  // Create conversation
  const { data: conversation, error: conversationError } = await client
    .from('conversations')
    .insert({
      match_id: match.id,
      assignment_id: assignment.id,
      participant_one_id: participantOneId,
      participant_two_id: participantTwoId,
      stage: stageValue,
    })
    .select()
    .single();

  if (conversationError) {
    throw new Error(`Failed to create test conversation: ${conversationError.message}`);
  }

  return { conversation, match, assignment };
}

/**
 * 💬 Create a test message in a conversation
 * 
 * Creates a message in an existing conversation.
 * Tests that users can only read messages from their own conversations.
 * 
 * @param conversationId - Conversation ID
 * @param senderId - User sending the message
 * @param content - Message content
 * @returns Created message
 */
export async function createTestMessage(
  conversationId: string,
  senderId: string,
  content: string
) {
  const client = createServiceRoleClient();

  const { data: message, error } = await client
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test message: ${error.message}`);
  }

  return message;
}

/**
 * 📊 Create a test analytics event
 * 
 * Creates an analytics event with hashed IP (GDPR-compliant).
 * Tests that users can only see their own analytics data.
 * 
 * @param userId - User ID for the event
 * @param eventType - Type of event (e.g., 'page_view', 'match_accepted')
 * @param properties - Additional event properties
 * @returns Created analytics event
 */
export async function createTestAnalyticsEvent(
  userId: string,
  eventType: string,
  properties: Record<string, any> = {}
) {
  const client = createServiceRoleClient();

  const { data: event, error } = await client
    .from('analytics_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      properties,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test analytics event: ${error.message}`);
  }

  return event;
}

/**
 * 🗑️ Cleanup all test data for a user
 * 
 * Deletes all test data associated with a user ID.
 * Call this in afterAll hooks to clean up.
 * 
 * @param userId - User ID to cleanup
 */
export async function cleanupTestData(userId: string): Promise<void> {
  const client = createServiceRoleClient();

  // Delete in order of dependencies (child tables first)
  const tables = [
    'messages',
    'conversations',
    'matches',
    'assignments',
    'organizations',
    'verification_requests',
    'analytics_events',
    'matching_profiles',
    'individual_profiles',
    'profiles',
  ];

  for (const table of tables) {
    try {
      if (table === 'messages') {
        // Messages reference conversations via conversation_id
        await client.from(table).delete().eq('sender_id', userId);
      } else if (table === 'conversations') {
        // Conversations have two participant columns
        await client
          .from(table)
          .delete()
          .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`);
      } else if (table === 'matches') {
        await client.from(table).delete().eq('profile_id', userId);
      } else if (table === 'assignments') {
        await client.from(table).delete().eq('role', 'Test Assignment');
      } else if (table === 'organizations') {
        await client.from(table).delete().like('slug', 'test-org-%');
      } else if (table === 'verification_requests') {
        await client.from(table).delete().eq('profile_id', userId);
      } else if (table === 'analytics_events') {
        await client.from(table).delete().eq('user_id', userId);
      } else if (table === 'matching_profiles') {
        await client.from(table).delete().eq('profile_id', userId);
      } else if (table === 'individual_profiles') {
        await client.from(table).delete().eq('user_id', userId);
      } else if (table === 'profiles') {
        await client.from(table).delete().eq('id', userId);
      }
    } catch (error) {
      console.warn(`Warning: Failed to cleanup ${table} for user ${userId}:`, error);
      // Continue cleanup even if one table fails
    }
  }
}

/**
 * 🗑️ Cleanup specific test data items
 * 
 * Deletes specific records by ID.
 * 
 * @param table - Table name
 * @param ids - Array of record IDs to delete
 */
export async function cleanupTestRecords(table: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const client = createServiceRoleClient();

  try {
    await client.from(table).delete().in('id', ids);
  } catch (error) {
    console.warn(`Warning: Failed to cleanup ${table} records:`, error);
  }
}

