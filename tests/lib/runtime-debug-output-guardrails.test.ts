import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();

function readSource(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

describe('runtime debug output guardrails', () => {
  it('keeps active user-flow components free of success-path console debugging', () => {
    const sources = [
      readSource('src/components/decisions/DecisionDialog.tsx'),
      readSource('src/components/profile/ShareProfileDialog.tsx'),
      readSource('src/components/matching/ConsentToShareDialog.tsx'),
    ].join('\n');

    expect(sources).not.toContain('decision.submitted');
    expect(sources).not.toContain('profile.snippet.generated');
    expect(sources).not.toContain('Consent given for match');
  });

  it('keeps active taxonomy API request flow out of routine console logging', () => {
    const source = readSource('src/app/api/expertise/taxonomy/route.ts');

    expect(source).not.toContain('[Taxonomy API] Request params:');
    expect(source).not.toContain('[Taxonomy API] Skills request completed');
  });

  it('keeps assignment clarity on the authorized deterministic fallback path', () => {
    const source = readSource('src/app/api/ai/assignments/clarify/route.ts');

    expect(source).not.toContain('mock-assignment-clarity');
    expect(source).not.toContain('isMockSupabaseEnabled');
  });

  it('keeps verification composer on the owned Proof Pack composer path', () => {
    const source = readSource('src/app/api/ai/verifications/compose/route.ts');

    expect(source).not.toContain('MOCK_COMPOSER_PROOF_PACK_ID');
    expect(source).not.toContain('isMockSupabaseEnabled');
    expect(source).not.toContain('I narrowed a launch workflow into one privacy-safe proof path');
  });

  it('keeps skill verification requests on the canonical ownership path', () => {
    const source = readSource('src/app/api/verification/requests/skill/route.ts');

    expect(source).not.toContain('MOCK_COMPOSER_SKILL_ID');
    expect(source).not.toContain('isMockSupabaseEnabled');
    expect(source).not.toContain('44444444-4444-4444-8444-444444444444');
  });

  it('keeps assignment detail mutations on explicit organization access paths', () => {
    const source = readSource('src/app/api/assignments/[id]/route.ts');

    expect(source).not.toContain('MOCK_ASSIGNMENT_IDS');
    expect(source).not.toContain('buildMockAssignment');
    expect(source).not.toContain('isMockSupabaseEnabled');
  });

  it('keeps assignment creation on explicit organization membership paths', () => {
    const source = readSource('src/app/api/assignments/route.ts');

    expect(source).not.toContain("'Mock assignment'");
    expect(source).not.toContain('validatedData.orgId ||');
  });

  it('keeps non-visual verification composer options tied to canonical Proof Packs', () => {
    const source = readSource('src/lib/verification/request-feed.ts');

    expect(source).not.toContain('canonicalAggregates.length === 0');
    expect(source).not.toContain('isMockSupabaseEnabled() && canonicalAggregates');
  });

  it('keeps skill proof creation on the canonical Proof Pack write path', () => {
    const source = readSource('src/app/api/expertise/user-skills/[id]/proofs/route.ts');

    expect(source).not.toContain('mock-proof-');
    expect(source).not.toContain('mock-artifact-');
    expect(source).not.toContain('mock-pack-');
    expect(source).not.toContain('isMockSupabaseEnabled');
  });

  it('keeps public demo portfolio projections behind the explicit visual fixture gate', () => {
    const source = readSource('src/lib/portfolio/public-projection.ts');

    expect(source).not.toContain('isMockSupabaseEnabled() && handle ===');
    expect(source).not.toContain('isMockSupabaseEnabled() && slug ===');
    expect(source).toContain("process.env.PROOFOUND_VISUAL_FIXTURES === 'true'");
    expect(source).toContain('visualFixturesRuntimeAllowed()');
  });

  it('keeps fixed assignment mock organization access behind the explicit visual fixture gate', () => {
    const source = readSource('src/lib/assignments/access.ts');

    expect(source).not.toContain('isMockSupabaseEnabled() &&\n    userId === MOCK_USER_ID');
    expect(source).toContain('visualAssignmentAccessFixturesEnabled()');
    expect(source).toContain("process.env.PROOFOUND_VISUAL_FIXTURES === 'true'");
    expect(source).toContain('visualFixturesRuntimeAllowed()');
  });

  it('keeps individual dashboard metrics on canonical evidence paths in mock mode', () => {
    const source = readSource('src/lib/dashboard/metrics.ts');

    expect(source).not.toContain('isMockSupabaseEnabled');
    expect(source).not.toContain('proofStoriesCount: 0');
    expect(source).toContain('listCanonicalProofPackAggregatesForOwner');
  });

  it('keeps client feedback fixture submission behind the explicit visual fixture gate', () => {
    const source = readSource('src/lib/feedback/visual-fixtures.ts');

    expect(source).not.toContain(
      'export function clientFeedbackVisualFixturesEnabled() {\n  return process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE ==='
    );
    expect(source).toContain('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES');
    expect(source).toContain("process.env.PROOFOUND_VISUAL_FIXTURES === 'true'");
    expect(source).toContain('visualFixturesRuntimeAllowed()');
    expect(source).not.toContain("process.env.VERCEL_ENV !== 'production'");
  });

  it('keeps client verification link fixtures behind the explicit visual fixture gate', () => {
    const fixtureSource = readSource('src/lib/verification/visual-link-fixtures.ts');
    const pageSources = [
      readSource('src/app/verify-work-email/VerifyWorkEmailContent.tsx'),
      readSource('src/app/(auth)/verify-email/VerifyEmailContent.tsx'),
      readSource('src/app/(auth)/reset-password/confirm/ConfirmResetPasswordForm.tsx'),
      readSource('src/app/verify/[token]/page.tsx'),
      readSource('src/app/verify/custom/[token]/page.tsx'),
    ].join('\n');

    expect(fixtureSource).toContain('clientVerificationLinkVisualFixturesEnabled');
    expect(fixtureSource).toContain('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES');
    expect(fixtureSource).toContain("process.env.PROOFOUND_VISUAL_FIXTURES === 'true'");
    expect(fixtureSource).toContain('visualFixturesRuntimeAllowed()');
    expect(fixtureSource).not.toContain("process.env.VERCEL_ENV !== 'production'");
    expect(pageSources).not.toContain('function clientVisualVerificationEnabled()');
    expect(pageSources).not.toContain(
      "return process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true';"
    );
  });

  it('keeps visual fixture runtime gates preview and staging sensitive', () => {
    const sources = [
      'src/lib/org-invites/visual-fixtures.ts',
      'src/lib/interviews/visual-fixtures.ts',
      'src/lib/portfolio/public-projection.ts',
      'src/app/api/org/[id]/matches/[matchId]/review/route.ts',
      'src/lib/messaging/visual-fixtures.ts',
      'src/lib/assignments/access.ts',
      'src/app/api/match/explain/[matchId]/route.ts',
      'src/lib/candidate-invites/visual-fixtures.ts',
      'src/app/api/core/matching/assignment/handler.ts',
      'src/lib/matching/visual-fixtures.ts',
      'src/app/api/assignments/route.ts',
      'src/lib/verification/request-feed.ts',
      'src/lib/verification/visual-link-fixtures.ts',
      'src/lib/supabase/mock-server-client.ts',
      'src/lib/feedback/visual-fixtures.ts',
    ]
      .map((relativePath) => readSource(relativePath))
      .join('\n');

    expect(sources).toContain('visualFixturesRuntimeAllowed()');
    expect(sources).not.toContain("process.env.VERCEL_ENV !== 'production'");
  });

  it('keeps identity reveal success paths from logging conversation identifiers', () => {
    const source = readSource('src/lib/messaging/identity-reveal.ts');

    expect(source).not.toContain('Identity revealed for conversation');
  });

  it('keeps Supabase client selection quiet outside explicit logger surfaces', () => {
    const sources = [
      readSource('src/lib/supabase/admin.ts'),
      readSource('src/lib/supabase/client.ts'),
      readSource('src/lib/supabase/mock-server-client.ts'),
    ].join('\n');

    expect(sources).not.toContain('Using Mock Admin Client');
    expect(sources).not.toContain('createClient called');
    expect(sources).not.toContain('Returning mock Supabase client');
    expect(sources).not.toContain('Mock Supabase:');
  });

  it('keeps privacy detection as a runtime utility rather than a console test harness', () => {
    const source = readSource('src/lib/privacy/pii-detection.ts');

    expect(source).not.toContain('testPIIDetection');
    expect(source).not.toContain('=== PII Detection Tests ===');
    expect(source).not.toContain('Test ${index + 1}: PASSED');
  });
});
