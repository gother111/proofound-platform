import { describe, expect, test } from 'vitest';
import {
  buildAllowlist,
  classifyAuthUser,
  classifyOrphanProfile,
  summarizeIndicatorCounts,
} from '../scripts/lib/account-sweep-classifier.mjs';

describe('account sweep classifier', () => {
  test('marks known seeded emails as delete candidates', () => {
    const allowlist = buildAllowlist();
    const result = classifyAuthUser(
      {
        id: '00000000-0000-4000-8000-000000000001',
        email: 'sofia.martinez@proofound-demo.com',
        displayName: 'Sofia Martinez',
        handle: 'sofia-martinez',
      },
      allowlist
    );

    expect(result.decision).toBe('delete');
    expect(result.deleteReasons).toContain('known_seed_email');
  });

  test('marks test.proofound.com domain as delete candidate', () => {
    const allowlist = buildAllowlist();
    const result = classifyAuthUser(
      {
        id: '00000000-0000-4000-8000-000000000002',
        email: 'strict-individual-123@test.proofound.com',
        displayName: 'Strict Individual',
        handle: 'strict-individual-123',
      },
      allowlist
    );

    expect(result.decision).toBe('delete');
    expect(result.indicators).toContain('email_domain_test_pattern');
    expect(result.deleteReasons).toContain('email_local_test_pattern');
  });

  test('keeps a real account with human name and no test indicators', () => {
    const allowlist = buildAllowlist();
    const result = classifyAuthUser(
      {
        id: '00000000-0000-4000-8000-000000000003',
        email: 'person@example.org',
        displayName: 'Jane Doe',
        handle: 'jane-doe',
      },
      allowlist
    );

    expect(result.decision).toBe('keep');
    expect(result.keepReason).toBe('strict_human_name_without_test_indicators');
  });

  test('deletes non-human display names under strict keep policy', () => {
    const allowlist = buildAllowlist();
    const result = classifyAuthUser(
      {
        id: '00000000-0000-4000-8000-000000000004',
        email: 'superadmin@proofound.io',
        displayName: 'superadmin@proofound.io',
        handle: '',
      },
      allowlist
    );

    expect(result.decision).toBe('delete');
    expect(result.deleteReasons).toContain('strict_non_human_display_name');
  });

  test('allowlist can keep test-indicated auth users', () => {
    const allowlist = buildAllowlist({
      emails: ['strict-individual-keep@test.proofound.com'],
    });

    const result = classifyAuthUser(
      {
        id: '00000000-0000-4000-8000-000000000005',
        email: 'strict-individual-keep@test.proofound.com',
        displayName: 'Strict Individual',
        handle: 'strict-individual-keep',
      },
      allowlist
    );

    expect(result.decision).toBe('keep');
    expect(result.keepReason).toBe('allowlisted');
  });

  test('orphan profile is delete candidate by default', () => {
    const allowlist = buildAllowlist();
    const result = classifyOrphanProfile(
      {
        id: '00000000-0000-4000-8000-000000000006',
        displayName: 'Strict A11y User',
        handle: 'strict-a11y-mm123',
      },
      allowlist
    );

    expect(result.decision).toBe('delete');
    expect(result.deleteReasons).toContain('orphan_profile_missing_auth_user');
    expect(result.indicators).toContain('profile_display_name_test_pattern');
  });

  test('allowlist can keep orphan profiles', () => {
    const allowlist = buildAllowlist({
      profileIds: ['00000000-0000-4000-8000-000000000007'],
    });
    const result = classifyOrphanProfile(
      {
        id: '00000000-0000-4000-8000-000000000007',
        displayName: 'Strict Org Member',
        handle: 'strict-org-member-1',
      },
      allowlist
    );

    expect(result.decision).toBe('keep');
    expect(result.keepReason).toBe('allowlisted');
  });

  test('summarizes indicator counts across candidates', () => {
    const counts = summarizeIndicatorCounts([
      { indicators: ['email_domain_test_pattern', 'email_local_test_pattern'] },
      { indicators: ['email_domain_test_pattern'] },
      { indicators: ['profile_display_name_test_pattern'] },
    ]);

    expect(counts.email_domain_test_pattern).toBe(2);
    expect(counts.email_local_test_pattern).toBe(1);
    expect(counts.profile_display_name_test_pattern).toBe(1);
  });
});
