/**
 * 🧪 RLS Test Utilities
 * 
 * This module provides assertion helpers and common patterns for testing
 * Row-Level Security (RLS) policies.
 * 
 * The main goal is to make RLS tests more readable and maintainable.
 */

import { expect } from 'vitest';
import type { PostgrestError } from '@supabase/supabase-js';

/**
 * ✅ Assert that a query was AUTHORIZED (no error, has data)
 * 
 * Use this for positive tests where access should be allowed.
 * 
 * @param data - Query result data
 * @param error - Query error
 * @param message - Optional custom error message
 * 
 * Example:
 * ```typescript
 * const { data, error } = await userClient.from('profiles').select('*').eq('id', userId);
 * expectAuthorized(data, error, 'User should be able to read their own profile');
 * ```
 */
export function expectAuthorized(
  data: any,
  error: PostgrestError | null,
  message?: string
): void {
  const errorMsg = message || 'Expected query to be authorized';
  
  expect(error, `${errorMsg} - but got error: ${error?.message}`).toBeNull();
  expect(data, `${errorMsg} - but got no data`).toBeTruthy();
}

/**
 * ❌ Assert that a query was UNAUTHORIZED (error or empty data)
 * 
 * Use this for negative tests where access should be blocked by RLS.
 * 
 * Note: RLS policies can fail in two ways:
 * 1. Return an error (if policy is restrictive)
 * 2. Return empty data (if policy filters results to empty set)
 * 
 * This helper accepts both as "unauthorized".
 * 
 * @param data - Query result data
 * @param error - Query error
 * @param message - Optional custom error message
 * 
 * Example:
 * ```typescript
 * const { data, error } = await userAClient.from('profiles').select('*').eq('id', userBId);
 * expectUnauthorized(data, error, 'User A should not see User B's profile');
 * ```
 */
export function expectUnauthorized(
  data: any,
  error: PostgrestError | null,
  message?: string
): void {
  const errorMsg = message || 'Expected query to be unauthorized';

  // RLS can block in two ways:
  // 1. Return an explicit error
  // 2. Return empty results (filtered by RLS)
  
  const hasError = error !== null;
  const hasNoData = !data || (Array.isArray(data) && data.length === 0) || data === null;

  expect(
    hasError || hasNoData,
    `${errorMsg} - but query succeeded with data: ${JSON.stringify(data)}`
  ).toBe(true);
}

/**
 * 📭 Assert that a query returned EMPTY results (no error, but no data)
 * 
 * Use this when you expect RLS to filter results to an empty set,
 * but without returning an error.
 * 
 * @param data - Query result data
 * @param error - Query error
 * @param message - Optional custom error message
 */
export function expectEmpty(
  data: any,
  error: PostgrestError | null,
  message?: string
): void {
  const errorMsg = message || 'Expected query to return empty results';

  expect(error, `${errorMsg} - but got error: ${error?.message}`).toBeNull();
  
  if (Array.isArray(data)) {
    expect(data, `${errorMsg} - but got ${data.length} results`).toHaveLength(0);
  } else {
    expect(data, `${errorMsg} - but got data`).toBeNull();
  }
}

/**
 * 🔢 Assert that a query returned exactly N results
 * 
 * Use this when you expect RLS to filter results to a specific count.
 * 
 * @param data - Query result data
 * @param count - Expected number of results
 * @param error - Query error
 * @param message - Optional custom error message
 */
export function expectResultCount(
  data: any,
  count: number,
  error: PostgrestError | null,
  message?: string
): void {
  const errorMsg = message || `Expected query to return ${count} results`;

  expect(error, `${errorMsg} - but got error: ${error?.message}`).toBeNull();
  expect(Array.isArray(data), `${errorMsg} - but data is not an array`).toBe(true);
  expect((data as any[]).length, errorMsg).toBe(count);
}

/**
 * 🆔 Assert that results only contain records for a specific user
 * 
 * Use this to verify that RLS filters results to only the current user's data.
 * 
 * @param data - Query result data (array)
 * @param userId - Expected user ID
 * @param userIdField - Field name containing user ID (default: 'user_id')
 * @param message - Optional custom error message
 */
export function expectOnlyUserData(
  data: any[],
  userId: string,
  userIdField: string = 'user_id',
  message?: string
): void {
  const errorMsg = message || `Expected all results to belong to user ${userId}`;

  expect(Array.isArray(data), 'Data should be an array').toBe(true);

  for (const record of data) {
    expect(
      record[userIdField],
      `${errorMsg} - but found record with ${userIdField}: ${record[userIdField]}`
    ).toBe(userId);
  }
}

/**
 * 🚫 Assert that a specific field is NOT present in the result
 * 
 * Use this to verify that RLS policies hide sensitive fields.
 * 
 * @param data - Query result data (single record or array)
 * @param fieldName - Field name that should be hidden
 * @param message - Optional custom error message
 */
export function expectFieldHidden(
  data: any,
  fieldName: string,
  message?: string
): void {
  const errorMsg = message || `Expected field '${fieldName}' to be hidden`;

  const records = Array.isArray(data) ? data : [data];

  for (const record of records) {
    expect(
      record,
      `${errorMsg} - but record is null or undefined`
    ).toBeTruthy();
    
    expect(
      record.hasOwnProperty(fieldName),
      `${errorMsg} - but field exists with value: ${record[fieldName]}`
    ).toBe(false);
  }
}

/**
 * 🔐 Assert that a specific field IS present in the result
 * 
 * Use this to verify that authorized users can see sensitive fields.
 * 
 * @param data - Query result data (single record or array)
 * @param fieldName - Field name that should be visible
 * @param message - Optional custom error message
 */
export function expectFieldVisible(
  data: any,
  fieldName: string,
  message?: string
): void {
  const errorMsg = message || `Expected field '${fieldName}' to be visible`;

  const records = Array.isArray(data) ? data : [data];

  for (const record of records) {
    expect(
      record,
      `${errorMsg} - but record is null or undefined`
    ).toBeTruthy();
    
    expect(
      record.hasOwnProperty(fieldName),
      `${errorMsg} - but field is missing`
    ).toBe(true);
  }
}

/**
 * 📝 Create a descriptive test name for RLS tests
 * 
 * Helper to generate consistent test names.
 * 
 * @param userRole - Role of the user (e.g., 'User A', 'Anonymous', 'Owner')
 * @param action - Action being tested (e.g., 'read', 'update', 'delete')
 * @param resource - Resource being accessed (e.g., 'profile', 'messages')
 * @param expectedResult - Expected result (e.g., 'should succeed', 'should be blocked')
 * 
 * Example:
 * ```typescript
 * test(rlsTestName('User A', 'read', 'User B profile', 'should be blocked'), async () => {
 *   // ...
 * });
 * // Output: "User A read User B profile should be blocked"
 * ```
 */
export function rlsTestName(
  userRole: string,
  action: string,
  resource: string,
  expectedResult: string
): string {
  return `${userRole} ${action} ${resource} ${expectedResult}`;
}

/**
 * ⏱️ Wait for a condition to be true (with timeout)
 * 
 * Useful for testing eventual consistency or async RLS policy application.
 * 
 * @param condition - Async function that returns true when condition is met
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 * @param interval - Check interval in milliseconds (default: 100)
 * @returns True if condition was met, false if timeout
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return false;
}

/**
 * 🧹 Assert that cleanup was successful
 * 
 * Helper to verify that test data was properly cleaned up.
 * 
 * @param data - Query result after cleanup
 * @param error - Query error
 * @param resourceType - Type of resource being cleaned (for error messages)
 */
export function expectCleanupSuccessful(
  data: any,
  error: PostgrestError | null,
  resourceType: string = 'test data'
): void {
  expect(error, `Cleanup query for ${resourceType} should not error`).toBeNull();
  
  if (Array.isArray(data)) {
    expect(
      data,
      `Expected ${resourceType} to be cleaned up, but found ${data.length} records`
    ).toHaveLength(0);
  } else {
    expect(
      data,
      `Expected ${resourceType} to be cleaned up, but found data`
    ).toBeNull();
  }
}

