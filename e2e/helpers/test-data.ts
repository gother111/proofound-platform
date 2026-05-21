/**
 * Test Data Utilities for E2E Tests
 *
 * Helpers for seeding and cleaning up test data
 */

export interface TestProfile {
  id: string;
  email: string;
  fullName: string;
  handle: string;
  persona: 'individual' | 'org_member';
}

export interface TestOrganization {
  id: string;
  name: string;
  slug: string;
  website?: string;
}

export interface TestAssignment {
  id: string;
  orgId: string;
  title: string;
  description: string;
  status: string;
}

/**
 * Generate random ID for test data
 */
export function generateId(): string {
  return `test-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/**
 * Generate test email address
 */
export function generateTestEmail(prefix = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}+${timestamp}${random}@test.proofound.com`;
}

/**
 * Generate test handle
 */
export function generateTestHandle(prefix = 'testuser'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}${timestamp}${random}`;
}

/**
 * Create test user data
 */
export function createTestUser(overrides?: Partial<TestProfile>): TestProfile {
  const timestamp = Date.now();
  return {
    id: generateId(),
    email: generateTestEmail(),
    fullName: `Test User ${timestamp}`,
    handle: generateTestHandle(),
    persona: 'individual',
    ...overrides,
  };
}

/**
 * Create test organization data
 */
export function createTestOrganization(overrides?: Partial<TestOrganization>): TestOrganization {
  const timestamp = Date.now();
  return {
    id: generateId(),
    name: `Test Company ${timestamp}`,
    slug: `test-company-${timestamp}`,
    website: 'https://test.example.com',
    ...overrides,
  };
}

/**
 * Create test assignment data
 */
export function createTestAssignment(
  orgId: string,
  overrides?: Partial<TestAssignment>
): TestAssignment {
  const timestamp = Date.now();
  return {
    id: generateId(),
    orgId,
    title: `Test Position ${timestamp}`,
    description: 'This is a test assignment for E2E testing purposes.',
    status: 'active',
    ...overrides,
  };
}

/**
 * Seed test data into the database
 *
 * This function should be called at the start of test suites
 * that need pre-existing data
 *
 * Requires an explicit connected data adapter. This helper fails closed so
 * broad E2E suites cannot silently pass without seeding the data they claim.
 */
export async function seedTestData(data: {
  users?: TestProfile[];
  organizations?: TestOrganization[];
  assignments?: TestAssignment[];
}): Promise<void> {
  const requestedKinds = Object.entries(data)
    .filter(([, values]) => Array.isArray(values) && values.length > 0)
    .map(([kind]) => kind)
    .join(', ');

  throw new Error(
    `No E2E test-data adapter is configured for ${requestedKinds || 'the requested data'}. Use a strict seeded fixture or inject a connected adapter before calling seedTestData.`
  );
}

/**
 * Clean up test data from the database
 *
 * This function should be called after test suites complete
 * to remove test data
 */
export async function cleanupTestData(options: {
  userIds?: string[];
  organizationIds?: string[];
  assignmentIds?: string[];
  emailPatterns?: string[];
}): Promise<void> {
  const requestedKinds = Object.entries(options)
    .filter(([, values]) => Array.isArray(values) && values.length > 0)
    .map(([kind]) => kind)
    .join(', ');

  throw new Error(
    `No E2E test-data adapter is configured to clean up ${requestedKinds || 'the requested data'}. Use the strict fixture cleanup path or inject a connected adapter before calling cleanupTestData.`
  );
}

/**
 * Wait for async operation to complete
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Create multiple test users
 */
export function createTestUsers(
  count: number,
  persona: 'individual' | 'org_member' = 'individual'
): TestProfile[] {
  return Array.from({ length: count }, () => createTestUser({ persona }));
}

/**
 * Create full test environment
 *
 * Creates an organization with members and assignments
 */
export function createTestEnvironment() {
  const organization = createTestOrganization();
  const admin = createTestUser({
    persona: 'org_member',
    handle: `${organization.slug}-admin`,
  });
  const members = createTestUsers(3, 'org_member').map((member) => ({
    ...member,
    handle: `${organization.slug}-member-${member.id.slice(-4)}`,
  }));
  const assignments = [
    createTestAssignment(organization.id, { title: 'Senior Engineer' }),
    createTestAssignment(organization.id, { title: 'Product Manager' }),
    createTestAssignment(organization.id, { title: 'Designer' }),
  ];

  return {
    organization,
    admin,
    members,
    assignments,
  };
}

/**
 * Mock API responses for testing
 */
export const mockApiResponses = {
  /** Mock successful signup response */
  signupSuccess: {
    user: { id: generateId(), email: generateTestEmail() },
    session: { access_token: 'mock-token' },
  },

  /** Mock successful login response */
  loginSuccess: {
    user: { id: generateId(), email: generateTestEmail() },
    session: { access_token: 'mock-token' },
  },

  /** Mock error response */
  error: (message: string) => ({
    error: { message, status: 400 },
  }),

  /** Mock matches list */
  matches: (count: number) => ({
    items: Array.from({ length: count }, (_, i) => ({
      id: generateId(),
      title: `Test Assignment ${i + 1}`,
      proofSignals: ['Relevant proof pack', 'Review-ready evidence'],
      organization: createTestOrganization(),
    })),
  }),

  /** Mock conversations list */
  conversations: (count: number) => ({
    items: Array.from({ length: count }, (_, i) => ({
      id: generateId(),
      lastMessage: `Test message ${i + 1}`,
      lastMessageAt: new Date().toISOString(),
      unreadCount: Math.floor(Math.random() * 5),
    })),
  }),
};
