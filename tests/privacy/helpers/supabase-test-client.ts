/**
 * 🔐 Supabase Test Client Factory
 * 
 * This module provides utilities for creating Supabase clients with different
 * authentication contexts for testing Row-Level Security (RLS) policies.
 * 
 * Three types of clients:
 * 1. Service Role Client - Bypasses RLS, used for setup/teardown
 * 2. Authenticated Client - Logged in as specific user, respects RLS
 * 3. Anonymous Client - No authentication, tests public access
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for test Supabase instance
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your test environment.'
  );
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

/**
 * 🔧 Create a Service Role client (bypasses RLS)
 * 
 * Use this for:
 * - Setting up test data in beforeAll/beforeEach
 * - Cleaning up test data in afterAll/afterEach
 * - Creating users programmatically
 * - Verifying data that RLS would normally block
 */
export function createServiceRoleClient(): SupabaseClient {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for service role operations. ' +
      'This key bypasses RLS and should NEVER be exposed to the client.'
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 🔓 Create an Anonymous client (no authentication)
 * 
 * Use this for:
 * - Testing that unauthenticated users cannot access protected data
 * - Verifying public access is properly restricted
 * - Testing RLS policies that should block anonymous access
 */
export function createAnonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 👤 Create an Authenticated client for a specific user
 * 
 * This function signs in a user and returns a client that respects RLS
 * policies for that user's session.
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Authenticated Supabase client
 * 
 * Example:
 * ```typescript
 * const aliceClient = await createAuthenticatedClient('alice@test.com', 'password123');
 * const { data } = await aliceClient.from('profiles').select('*');
 * // Returns only profiles Alice is authorized to see
 * ```
 */
export async function createAuthenticatedClient(
  email: string,
  password: string
): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Retry to reduce flakiness from auth rate limits
  const maxAttempts = 5;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.session) {
      return client;
    }

    lastError = error ?? new Error(`No session created for ${email}`);

    // Exponential backoff with cap (300ms, 600ms, 1.2s, 2.4s)
    const backoffMs = Math.min(300 * 2 ** (attempt - 1), 2400);
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
  }

  throw new Error(
    `Failed to authenticate as ${email} after ${maxAttempts} attempts: ${lastError?.message ?? 'Unknown error'}`
  );

  return client;
}

/**
 * 🆕 Create a test user account
 * 
 * Creates a new user in Supabase Auth using the service role client.
 * Useful for setting up test users in beforeAll hooks.
 * 
 * @param email - Email for the test user (should be unique)
 * @param password - Password for the test user
 * @param metadata - Optional user metadata (e.g., display_name)
 * @returns TestUser object with id, email, and password
 * 
 * Example:
 * ```typescript
 * const alice = await createTestUser('alice@test.com', 'password123', {
 *   display_name: 'Alice Test'
 * });
 * ```
 */
export async function createTestUser(
  email: string,
  password: string,
  metadata?: Record<string, any>
): Promise<TestUser> {
  const serviceClient = createServiceRoleClient();

  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip email verification for tests
    user_metadata: metadata || {},
  });

  if (error) {
    throw new Error(`Failed to create test user ${email}: ${error.message}`);
  }

  if (!data.user) {
    throw new Error(`No user returned when creating ${email}`);
  }

  return {
    id: data.user.id,
    email,
    password,
  };
}

/**
 * 🗑️ Delete a test user account
 * 
 * Removes a user from Supabase Auth using the service role client.
 * Useful for cleanup in afterAll hooks.
 * 
 * @param userId - UUID of the user to delete
 * 
 * Example:
 * ```typescript
 * await deleteTestUser(alice.id);
 * ```
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const serviceClient = createServiceRoleClient();

  const { error } = await serviceClient.auth.admin.deleteUser(userId);

  if (error) {
    console.warn(`Warning: Failed to delete test user ${userId}: ${error.message}`);
    // Don't throw - cleanup should continue even if one deletion fails
  }
}

/**
 * 🔄 Sign out a client
 * 
 * Signs out the current session for a client.
 * Useful for testing transitions between authenticated and anonymous states.
 * 
 * @param client - Supabase client to sign out
 */
export async function signOutClient(client: SupabaseClient): Promise<void> {
  const { error } = await client.auth.signOut();
  
  if (error) {
    console.warn(`Warning: Failed to sign out: ${error.message}`);
  }
}

/**
 * 🧪 Get current user ID from client
 * 
 * Helper to get the current authenticated user's ID.
 * Returns null if not authenticated.
 * 
 * @param client - Supabase client
 * @returns User ID or null
 */
export async function getCurrentUserId(client: SupabaseClient): Promise<string | null> {
  const { data: { user } } = await client.auth.getUser();
  return user?.id || null;
}

