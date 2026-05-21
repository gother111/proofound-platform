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

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('expertise.taxonomy.telemetry_emit_failed');
    expect(source).toContain('expertise.taxonomy.unhandled_error');
    expect(source).not.toContain('[Taxonomy API] Request params:');
    expect(source).not.toContain('[Taxonomy API] Skills request completed');
    expect(source).not.toContain('[Taxonomy API] Error stack:');
    expect(source).not.toContain("console.error('Error fetching L4 skills:");
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

  it('keeps skill verification request and response failures on structured logging', () => {
    const sources = [
      readSource('src/app/api/verification/requests/skill/route.ts'),
      readSource('src/app/api/verification/requests/skill/[requestId]/respond/route.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('verification.skill_request.create_failed');
    expect(sources).toContain('verification.skill_request.email_send_failed');
    expect(sources).toContain('verification.skill_request.email_state_persist_failed');
    expect(sources).toContain('verification.skill_request.analytics_emit_failed');
    expect(sources).toContain('verification.skill_request.post_failed');
    expect(sources).toContain('verification.skill_request.get_failed');
    expect(sources).toContain('verification.skill_response.update_failed');
    expect(sources).toContain('verification.skill_response.notification_failed');
    expect(sources).toContain('verification.skill_response.post_failed');
    expect(sources).not.toContain('Error creating canonical verification request:');
    expect(sources).not.toContain('Failed to send verification email:');
    expect(sources).not.toContain('Failed to persist canonical verification email delivery state:');
    expect(sources).not.toContain('Failed to emit attestation_requested event:');
    expect(sources).not.toContain('Verification request POST error:');
    expect(sources).not.toContain('Verification GET error:');
    expect(sources).not.toContain('Error updating canonical verification request:');
    expect(sources).not.toContain('Failed to send verification completed notification:');
    expect(sources).not.toContain('Verification respond error:');
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

  it('keeps active cron and onboarding success paths on structured logging', () => {
    const sources = [
      readSource('src/app/api/cron/performance-check/route.ts'),
      readSource('src/actions/onboarding.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('cron.performance-check.start');
    expect(sources).toContain('organization.onboarding.insert_select_blocked_by_rls');
    expect(sources).not.toContain('[Cron] Starting performance check');
    expect(sources).not.toContain('Performance check complete:');
    expect(sources).not.toContain('Sent alert notifications for');
    expect(sources).not.toContain('Organization inserted but RLS blocked SELECT');
    expect(sources).not.toContain('Membership inserted but RLS blocked SELECT');
  });

  it('keeps active consent and performance success paths on structured logging', () => {
    const sources = [
      readSource('src/actions/auth.ts'),
      readSource('src/lib/analytics.ts'),
      readSource('src/lib/performance/api-monitor.ts'),
      readSource('src/lib/performance/alerting.ts'),
    ].join('\n');

    expect(sources).toContain('auth.signup.consent_records_stored');
    expect(sources).toContain('analytics.legacy.event_tracked');
    expect(sources).toContain('performance.metrics.aggregated');
    expect(sources).toContain('performance.api_monitor.track_failed');
    expect(sources).toContain('performance.api_monitor.sla_violation_alert_created');
    expect(sources).toContain('performance.alerting.sla_checked');
    expect(sources).toContain('performance.alerting.notification_send_failed');
    expect(sources).not.toContain('GDPR consent records stored successfully for user');
    expect(sources).not.toContain('📊 [Analytics]');
    expect(sources).not.toContain('[Analytics] Failed to track event');
    expect(sources).not.toContain('[Performance] Aggregated');
    expect(sources).not.toContain('Performance tracking error:');
    expect(sources).not.toContain('SLA check error:');
    expect(sources).not.toContain('[Performance Alert]');
    expect(sources).not.toContain('[Performance Alerting] Checked');
    expect(sources).not.toContain('[Performance Alerting] Error sending notifications:');
  });

  it('keeps API latency monitoring failures on structured logging', () => {
    const source = readSource('src/lib/monitoring/api-latency.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('monitoring.api_latency.log_failed');
    expect(source).not.toContain('Failed to log API latency:');
  });

  it('keeps active compatibility API failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/feature-flags/route.ts'),
      readSource('src/app/api/proof-artifacts/text-extraction/status/route.ts'),
      readSource('src/app/api/profile/route.ts'),
      readSource('src/app/api/organizations/route.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('feature_flags.fetch_failed');
    expect(sources).toContain('proof_artifact_ocr.status.failed');
    expect(sources).toContain('profile.payload.fetch_failed');
    expect(sources).toContain('organizations.list.fetch_failed');
    expect(sources).toContain('organizations.list.unhandled_error');
    expect(sources).not.toContain("console.error('feature_flags.fetch_failed'");
    expect(sources).not.toContain("console.error('proof_artifact_ocr.status.failed'");
    expect(sources).not.toContain('Failed to fetch profile payload:');
    expect(sources).not.toContain('Error fetching organizations:');
    expect(sources).not.toContain('Error in organizations API:');
  });

  it('keeps client performance instrumentation local and console-free', () => {
    const sources = [
      readSource('src/lib/analytics/web-vitals.ts'),
      readSource('src/lib/performance/client-tracker.ts'),
    ].join('\n');

    expect(sources).toContain('proofound:web-vital');
    expect(sources).toContain('proofound:performance-metric');
    expect(sources).toContain('proofound:performance-diagnostic');
    expect(sources).not.toContain('Web vital captured locally');
    expect(sources).not.toContain('[Web Vitals]');
    expect(sources).not.toContain('Failed to initialize web vitals:');
    expect(sources).not.toContain('Performance metric recording error:');
    expect(sources).not.toContain('TTI tracking error:');
    expect(sources).not.toContain('Performance measurement error:');
  });
});
