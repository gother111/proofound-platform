# RLS Privacy Test Suite

> Doc Class: `reference-spec`
> Last Verified: `2026-05-19`
> Reference note: this file documents the privacy test suite shape. It is not standalone launch readiness proof and must be read with the current locked MVP authority stack, `verification.md`, `docs/production-readiness-checklist.md`, and fresh test output.

## 📋 Overview

This directory contains comprehensive tests for verifying that **Row-Level Security (RLS) policies** correctly protect user data in the Proofound application.

The tests are based on requirements from **CROSS_DOCUMENT_PRIVACY_AUDIT.md Section 7.1** and cover:

### 🎯 Core Privacy Scenarios (5)

1. **Profile Privacy** - User A cannot read User B's profile
2. **Verifier Email Protection** - Verifier emails hidden from public queries
3. **Message Privacy** - Users can only read their own conversations
4. **Analytics Isolation** - Users only see their own analytics events
5. **Compensation Privacy** - Compensation data only visible to matched users

### 🔧 Extended Privacy Scenarios (5)

6. **Skills & Experience Privacy** - Users can only edit their own skills
7. **Assignment Privacy** - Draft assignments not visible to others
8. **Organization Member Data** - Only org members see internal data
9. **Blocked Users** - Blocked users cannot see each other's data
10. **Conversation Stage Transitions** - Stage 1 masked, Stage 2 revealed

## 📁 File Structure

```
tests/privacy/
├── README.md                              # This file
├── ENV_SETUP.md                          # Environment setup instructions
├── setup.ts                               # Test environment setup
├── rls-policies.test.ts                  # Core 5 privacy scenarios
├── rls-policies-extended.test.ts         # Extended privacy tests
└── helpers/
    ├── supabase-test-client.ts           # Client factory & auth helpers
    ├── test-data-factory.ts              # Test data creation utilities
    └── rls-test-utils.ts                 # Assertion helpers
```

## 🚀 Quick Start

### 1. Prerequisites

- ✅ Node.js 24.15.0 installed (see `.nvmrc`)
- ✅ Separate test Supabase project (NOT your production database!)
- ✅ All dependencies installed from the lockfile (`npm ci`)

### 2. Environment Setup

Create a `.env.test` file or update your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

📖 **See [ENV_SETUP.md](./ENV_SETUP.md) for detailed setup instructions.**

### 3. Run the Tests

```bash
# Run core 5 privacy tests only
npm run test:privacy

# Run all privacy tests discovered under tests/privacy
npm run test:privacy:all

# Run in watch mode (during development)
npm run test:privacy:watch

# Run with coverage
npm run test:privacy:coverage

# Run only extended tests
npm run test:privacy:extended
```

## 📊 Test Results Interpretation

### ✅ Successful Test Output

```
✓ tests/privacy/rls-policies.test.ts (25)
  ✓ 1. Profile Privacy (4)
    ✓ User can read their own profile
    ✓ User A cannot read User B's private profile data
    ✓ Unauthenticated users cannot read profiles directly
    ✓ Users can read public profiles list (but with RLS filtering)
  ✓ 2. Verifier Email Protection (4)
    ✓ Requester can see their own verification request with verifier email
    ✓ User B cannot see User A's verifier emails
    ✓ Public/anonymous users cannot query verifier emails
    ✓ Verifier can access via token (without authentication)
  ...
```

### ❌ Failed Test Output

If a test fails, it typically means an RLS policy is missing or misconfigured:

```
✗ User A cannot read User B's private profile data
  Expected query to be unauthorized - but query succeeded with data: {...}
```

**Action Required:** Check the repo-owned migration/policy source for that table and rerun the migration audit before changing behavior.

## 🧪 Test Architecture

### Three Types of Supabase Clients

The tests use three different client types to simulate different access levels:

```typescript
// 1. Service Role Client - Bypasses RLS (for setup/teardown)
const adminClient = createServiceRoleClient();

// 2. Authenticated Client - Logged in as specific user
const aliceClient = await createAuthenticatedClient('alice@test.com', 'password');

// 3. Anonymous Client - No authentication
const anonClient = createAnonClient();
```

### Test Data Lifecycle

```
beforeAll
  ↓
  Create 3 test users (Alice, Bob, Carol)
  ↓
  Create profiles for each user
  ↓
  [Tests run with this data]
  ↓
  afterAll
  ↓
  Cleanup all test data
  ↓
  Delete test users
```

### Assertion Helpers

The tests use custom assertion helpers for clarity:

```typescript
// Positive test - access should be allowed
expectAuthorized(data, error, 'User should see their own profile');

// Negative test - access should be blocked
expectUnauthorized(data, error, 'User A should not see User B's data');

// Empty result - query succeeded but returned nothing
expectEmpty(data, error, 'Should return empty array');

// Result count - verify exact number of results
expectResultCount(data, 3, error, 'Should return 3 results');

// User-specific data - verify all results belong to user
expectOnlyUserData(data, userId, 'user_id', 'All data should belong to this user');
```

## 🔧 Writing New Privacy Tests

### Template for Adding a New Test

```typescript
test('✅ Positive case: User can access their own data', async () => {
  const userClient = await createAuthenticatedClient(user.email, user.password);

  const { data, error } = await userClient
    .from('table_name')
    .select('*')
    .eq('user_id', user.id);

  expectAuthorized(data, error, 'User should access their own data');
  expect(data).toBeDefined();
});

test('❌ Negative case: User cannot access other user's data', async () => {
  const userAClient = await createAuthenticatedClient(userA.email, userA.password);

  const { data, error } = await userAClient
    .from('table_name')
    .select('*')
    .eq('user_id', userB.id);

  expectUnauthorized(data, error, 'User A should not access User B's data');
});
```

### Best Practices

1. **Always test both positive and negative cases**
   - ✅ Authorized access works
   - ❌ Unauthorized access is blocked

2. **Use descriptive test names**
   - Good: `'User A cannot read User B's private messages'`
   - Bad: `'test messages'`

3. **Clean up test data**
   - Use `afterAll` hooks to clean up
   - Prefix test data with `test_` for easy identification

4. **Test with multiple users**
   - Alice, Bob, Carol pattern helps test cross-user scenarios
   - Ensures isolation between different users

5. **Use assertion helpers**
   - Makes tests more readable
   - Provides better error messages

## 🐛 Troubleshooting

### Test Fails: "Missing Supabase credentials"

**Cause:** Environment variables not set correctly.

**Solution:**

1. Check that `.env.test` or `.env.local` exists
2. Verify variable names are correct (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
3. Restart your terminal/IDE

### Test Fails: "Failed to create test user"

**Cause:** Service role key is incorrect or missing.

**Solution:**

1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
2. Check the key is correct in Supabase Dashboard → Settings → API
3. Ensure email auth is enabled in your test project

### Test Fails: "Relation does not exist"

**Cause:** Test database is missing tables.

**Solution:**

1. Use the repo-owned migration path on the explicitly configured test target:
   ```bash
   npm run db:drift-check
   npm run db:audit:migrations
   npm run db:migrate
   ```
2. For production-candidate or production evidence, also take a backup checkpoint and run isolated restore verification before treating the target as launch evidence.

### Tests Are Slow

**Cause:** Network latency to Supabase.

**Solutions:**

1. Use a test project in the same region
2. Increase timeout in `vitest.supabase.config.ts`:
   ```typescript
   test: {
     testTimeout: 30000, // 30 seconds
   }
   ```

### Cleanup Issues / Orphaned Data

**Cause:** Test failed before cleanup could run.

**Solution:**

1. Use Supabase Dashboard → Table Editor to delete test records
2. Look for records with email containing `_rls_test@` or `_extended@`
3. Or query and delete:
   ```sql
   DELETE FROM profiles WHERE handle LIKE 'test_%';
   ```

### Test Passes Locally But Fails in CI

**Causes:**

1. Environment variables not set in CI
2. Different Supabase project in CI
3. Migrations not applied to CI test database

**Solutions:**

1. Set environment secrets in your CI platform (GitHub Actions, etc.)
2. Ensure test database schema matches local
3. Add migration step to CI workflow

## 📖 Related Documentation

- **[ENV_SETUP.md](./ENV_SETUP.md)** - Detailed environment setup guide
- **[CROSS_DOCUMENT_PRIVACY_AUDIT.md](../../CROSS_DOCUMENT_PRIVACY_AUDIT.md)** - Privacy requirements
- **[DATA_SECURITY_PRIVACY_ARCHITECTURE.md](../../DATA_SECURITY_PRIVACY_ARCHITECTURE.md)** - RLS policy specifications
- **[RUN_MIGRATIONS_GUIDE.md](../../RUN_MIGRATIONS_GUIDE.md)** - Repo-owned migration and policy application path

## 🤝 Contributing

### Adding New Privacy Tests

1. Identify the privacy requirement from audit documents
2. Create test cases (positive + negative)
3. Add to `rls-policies.test.ts` (core) or `rls-policies-extended.test.ts` (extended)
4. Run tests locally to verify
5. Update this README if adding new scenarios

### Reporting Issues

If you find a privacy vulnerability or test issue:

1. **DO NOT** post security issues publicly
2. Contact the security team directly
3. Include:
   - Test that demonstrates the issue
   - Expected vs actual behavior
   - Potential impact

## ✅ Success Criteria

Your RLS policies are correctly implemented if:

- ✅ All 25+ tests pass
- ✅ No false positives (authorized access works)
- ✅ No false negatives (unauthorized access blocked)
- ✅ Tests run in under 2 minutes
- ✅ No orphaned test data remains after tests

## Test Coverage Goals

The table below is a coverage target for the privacy suite, not a current launch-readiness certificate.
For current launch evidence, rerun the scripts above against the intended target and record dated output.

| Category             | Target expectation                         |
| -------------------- | ------------------------------------------ |
| Profile Privacy      | Unauthorized cross-user reads are blocked. |
| Verification Privacy | Verifier contact details stay protected.   |
| Message Privacy      | Conversation access follows participants.  |
| Analytics Privacy    | User analytics are isolated.               |
| Compensation Privacy | Compensation visibility is stage-gated.    |
| Skills Privacy       | Proof-skill changes are owner-scoped.      |
| Assignment Privacy   | Draft/private assignment data is gated.    |
| Organization Privacy | Internal org data requires org access.     |
| Blocked Users        | Block relationships are respected.         |
| Conversation Stages  | Masked/revealed states stay consistent.    |

## 📞 Need Help?

- 📖 Check [ENV_SETUP.md](./ENV_SETUP.md) for setup issues
- 🐛 Review this README's troubleshooting section
- 🔍 Check existing test files for patterns

---

**Last Updated:** 2025-10-30  
**Maintained By:** Engineering Team  
**Test Framework:** Vitest + Supabase  
**Test Count:** 50+ tests across 10 scenarios
