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

  it('keeps client feature-flag status hooks on client diagnostics without console output', () => {
    const sources = [
      readSource('src/hooks/useProofArtifactOcrBetaStatus.ts'),
      readSource('src/hooks/useStartFromCvBetaStatus.ts'),
      readSource('src/hooks/useAssistiveAiFlag.ts'),
    ].join('\n');

    expect(sources).toContain(
      "import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics'"
    );
    expect(sources).toContain('feature_flags.proof_artifact_ocr_status.load_failed');
    expect(sources).toContain('feature_flags.start_from_cv_status.load_failed');
    expect(sources).toContain('feature_flags.assistive_ai.load_failed');
    expect(sources).not.toContain('Failed to load proof artifact OCR beta status');
    expect(sources).not.toContain('Failed to load Start from CV beta status');
    expect(sources).not.toContain('Failed to load assistive AI feature flag');
  });

  it('keeps client recovery and dashboard telemetry on client diagnostics without console output', () => {
    const sources = [
      readSource('src/hooks/useDashboardLoadTime.ts'),
      readSource('src/components/ErrorBoundary.tsx'),
      readSource('src/app/error.tsx'),
    ].join('\n');

    expect(sources).toContain('dispatchClientErrorDiagnostic');
    expect(sources).toContain('dashboard.load_time.measured');
    expect(sources).toContain('dashboard.load_time.report_failed');
    expect(sources).toContain('error_boundary.sentry_report_failed');
    expect(sources).toContain('error_boundary.caught');
    expect(sources).toContain('app.error_boundary.caught');
    expect(sources).not.toContain('[Dashboard Load Time]');
    expect(sources).not.toContain('Failed to report dashboard load time:');
    expect(sources).not.toContain('Failed to report ErrorBoundary exception:');
    expect(sources).not.toContain('Error caught by ErrorBoundary:');
    expect(sources).not.toContain('Application error:');
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

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('messaging.identity_reveal.email_context_unresolved');
    expect(source).toContain('messaging.identity_reveal.organization_route_unresolved');
    expect(source).toContain('messaging.identity_reveal.email_send_failed');
    expect(source).toContain('messaging.identity_reveal.trigger_failed');
    expect(source).toContain('messaging.identity_reveal.status_check_failed');
    expect(source).not.toContain('Identity revealed for conversation');
    expect(source).not.toContain('Failed to resolve role-safe identity reveal email context');
    expect(source).not.toContain('Failed to resolve organization route for identity reveal email');
    expect(source).not.toContain('Failed to send identity revealed emails:');
    expect(source).not.toContain('Identity reveal error:');
    expect(source).not.toContain('Check identity reveal error:');
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

  it('keeps onboarding action failures on structured server logging', () => {
    const source = readSource('src/actions/onboarding.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('onboarding.persona.update_failed');
    expect(source).toContain('onboarding.individual.profile_update_failed');
    expect(source).toContain('onboarding.individual.profile_insert_failed');
    expect(source).toContain('onboarding.individual.matching_profile_failed');
    expect(source).toContain('onboarding.individual.context_insert_failed');
    expect(source).toContain('onboarding.individual.proof_artifact_insert_failed');
    expect(source).toContain('onboarding.individual.proof_pack_insert_failed');
    expect(source).toContain('onboarding.individual.proof_pack_item_insert_failed');
    expect(source).toContain('onboarding.individual.contradiction_reconcile_failed');
    expect(source).toContain('onboarding.individual.unexpected_failed');
    expect(source).toContain('onboarding.organization.insert_failed');
    expect(source).toContain('onboarding.organization.owner_insert_failed');
    expect(source).toContain('onboarding.organization.persona_update_failed');
    expect(source).toContain('onboarding.organization.visibility_defaults_failed');
    expect(source).toContain('onboarding.organization.unexpected_failed');
    expect(source).not.toContain('Failed to update persona:');
    expect(source).not.toContain('Failed to update profile during onboarding:');
    expect(source).not.toContain('Failed to create individual profile during onboarding:');
    expect(source).not.toContain('Failed to persist matching preferences during onboarding:');
    expect(source).not.toContain('Failed to create onboarding context:');
    expect(source).not.toContain('Failed to create onboarding proof artifact:');
    expect(source).not.toContain('Failed to create onboarding proof pack:');
    expect(source).not.toContain('Failed to attach onboarding proof to proof pack:');
    expect(source).not.toContain('Individual onboarding contradiction reconciliation failed:');
    expect(source).not.toContain('Individual onboarding error:');
    expect(source).not.toContain('Organization onboarding insert error:');
    expect(source).not.toContain('Failed to add organization owner:');
    expect(source).not.toContain('Failed to update persona after organization onboarding:');
    expect(source).not.toContain('Failed to apply day-1 organization visibility defaults:');
    expect(source).not.toContain('Organization onboarding error:');
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

  it('keeps auth action failures on structured server logging', () => {
    const source = readSource('src/actions/auth.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('auth.signup.validation_failed');
    expect(source).toContain('auth.signup.provider_failed');
    expect(source).toContain('auth.signup.profile_trigger_missing');
    expect(source).toContain('auth.signup.consent_records_insert_failed');
    expect(source).toContain('auth.signup.consent_storage_failed');
    expect(source).toContain('auth.signup.analytics_emit_failed');
    expect(source).toContain('auth.signup.failed');
    expect(source).toContain('auth.signin.failed');
    expect(source).toContain('auth.verification.resend_failed');
    expect(source).toContain('auth.verification.resend_exception');
    expect(source).toContain('auth.password_reset.masked_provider_error');
    expect(source).toContain('auth.fallback_link.generate_failed');
    expect(source).toContain('auth.fallback_link.missing_action_link');
    expect(source).toContain('auth.fallback_link.email_send_failed');
    expect(source).toContain('auth.fallback_link.flow_failed');
    expect(source).toContain('auth.oauth.failed');
    expect(source).not.toContain('SignUp Validation Failed:');
    expect(source).not.toContain('Supabase SignUp Error:');
    expect(source).not.toContain('Profile trigger did not fire, creating profile manually');
    expect(source).not.toContain('Failed to store consent records:');
    expect(source).not.toContain('CRITICAL: GDPR consent storage failed:');
    expect(source).not.toContain('Failed to track signup event:');
    expect(source).not.toContain('Sign-up failed:');
    expect(source).not.toContain('Sign-in failed:');
    expect(source).not.toContain('Failed to resend verification email:');
    expect(source).not.toContain('Password reset request throttled or masked:');
    expect(source).not.toContain('Fallback generateLink failed for');
    expect(source).not.toContain('Fallback generateLink missing action_link for');
    expect(source).not.toContain('Fallback auth email send failed for');
    expect(source).not.toContain('Fallback auth email flow failed for');
    expect(source).not.toContain('OAuth sign-in failed:');
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

  it('keeps client API CSRF initialization diagnostics local and console-free', () => {
    const source = readSource('src/lib/api/fetch.ts');

    expect(source).toContain('proofound:api-diagnostic');
    expect(source).toContain('csrf_token_request_failed');
    expect(source).toContain('csrf_token_missing');
    expect(source).not.toContain('Failed to fetch CSRF token');
    expect(source).not.toContain('Error fetching CSRF token');
  });

  it('keeps interview page load failures on client diagnostics without console output', () => {
    const sources = [
      readSource('src/lib/client-diagnostics.ts'),
      readSource('src/app/app/i/interviews/page.tsx'),
      readSource('src/app/app/o/[slug]/interviews/page.tsx'),
    ].join('\n');

    expect(sources).toContain('proofound:client-diagnostic');
    expect(sources).toContain('interviews.individual.load_failed');
    expect(sources).toContain('interviews.organization.load_failed');
    expect(sources).not.toContain('Failed to load interviews:');
  });

  it('keeps messages client failures on client diagnostics without console output', () => {
    const sources = [
      readSource('src/app/app/i/messages/MessagesClient.tsx'),
      readSource('src/app/app/o/[slug]/messages/OrgMessagesClient.tsx'),
    ].join('\n');

    expect(sources).toContain(
      "import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics'"
    );
    expect(sources).toContain('messages.individual.conversations_load_failed');
    expect(sources).toContain('messages.individual.thread_load_failed');
    expect(sources).toContain('messages.individual.send_failed');
    expect(sources).toContain('messages.organization.conversations_load_failed');
    expect(sources).toContain('messages.organization.thread_load_failed');
    expect(sources).toContain('messages.organization.send_failed');
    expect(sources).not.toContain('Failed to load conversations:');
    expect(sources).not.toContain('Failed to load messages:');
    expect(sources).not.toContain('Failed to send message:');
  });

  it('keeps realtime messaging failures on client diagnostics without console output', () => {
    const sources = [
      readSource('src/hooks/useRealtimeMessages.ts'),
      readSource('src/components/messaging/RealtimeMessageThread.tsx'),
    ].join('\n');

    expect(sources).toContain('dispatchClientDiagnostic');
    expect(sources).toContain('messages.realtime.presence_joined');
    expect(sources).toContain('messages.realtime.presence_left');
    expect(sources).toContain('messages.realtime.typing_indicator_failed');
    expect(sources).toContain('messages.realtime.mark_read_failed');
    expect(sources).toContain('messages.realtime.mark_read_unexpected_failed');
    expect(sources).toContain('messages.realtime.mark_all_read_failed');
    expect(sources).toContain('messages.realtime.mark_all_read_unexpected_failed');
    expect(sources).toContain('messages.thread.conversation_refresh_failed');
    expect(sources).toContain('messages.thread.send_failed');
    expect(sources).not.toContain('User joined:');
    expect(sources).not.toContain('User left:');
    expect(sources).not.toContain('Failed to send typing indicator:');
    expect(sources).not.toContain('Failed to mark message as read:');
    expect(sources).not.toContain('Error marking message as read:');
    expect(sources).not.toContain('Failed to mark all messages as read:');
    expect(sources).not.toContain('Error marking all messages as read:');
    expect(sources).not.toContain('Failed to refresh conversation state:');
    expect(sources).not.toContain('Failed to send message:');
  });

  it('keeps candidate invite client failures on client diagnostics without console output', () => {
    const source = readSource('src/app/candidate-invite/[token]/CandidateInviteClient.tsx');

    expect(source).toContain(
      "import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics'"
    );
    expect(source).toContain('candidate_invite.client.load_failed');
    expect(source).toContain('candidate_invite.client.claim_failed');
    expect(source).toContain('candidate_invite.client.proof_submit_failed');
    expect(source).not.toContain('Failed to load submission invite state:');
    expect(source).not.toContain('Failed to claim invite:');
    expect(source).not.toContain('Failed to submit assignment proof:');
  });

  it('keeps assignment builder client failures on client diagnostics without console output', () => {
    const source = readSource('src/app/app/o/[slug]/assignments/new/AssignmentBuilderClient.tsx');

    expect(source).toContain(
      "import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics'"
    );
    expect(source).toContain('assignment_builder.client.draft_load_failed');
    expect(source).toContain('assignment_builder.client.auto_save_failed');
    expect(source).toContain('assignment_builder.client.review_save_failed');
    expect(source).not.toContain('Failed to auto-save assignment builder draft:');
    expect(source).not.toContain('Failed to save assignment:');
  });

  it('keeps verification center client failures on client diagnostics without console output', () => {
    const source = readSource('src/app/app/i/verifications/VerificationsClient.tsx');

    expect(source).toContain(
      "import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics'"
    );
    expect(source).toContain('verifications.client.sent_request_delete_failed');
    expect(source).toContain('verifications.client.sent_request_resend_failed');
    expect(source).not.toContain('Failed to delete sent verification request:');
    expect(source).not.toContain('Failed to resend sent verification request:');
  });

  it('keeps verification dialog failures on client diagnostics without console output', () => {
    const sources = [
      readSource('src/app/app/i/verifications/components/BundleCancelDialog.tsx'),
      readSource('src/app/app/i/verifications/components/RespondDialog.tsx'),
    ].join('\n');

    expect(sources).toContain(
      "import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics'"
    );
    expect(sources).toContain('verifications.bundle_cancel.details_load_failed');
    expect(sources).toContain('verifications.bundle_cancel.selected_cancel_failed');
    expect(sources).toContain('verifications.respond.submit_failed');
    expect(sources).not.toContain('Failed to load bundle cancellation details:');
    expect(sources).not.toContain('Failed to cancel selected bundle artifacts:');
    expect(sources).not.toContain('Error responding to verification:');
  });

  it('keeps verification composer dialog failures on client diagnostics without console output', () => {
    const sources = [
      readSource('src/app/app/i/verifications/components/VerificationRequestComposerDialog.tsx'),
      readSource('src/app/app/i/verifications/components/CustomVerificationRequestDialog.tsx'),
    ].join('\n');

    expect(sources).toContain(
      "import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics'"
    );
    expect(sources).toContain('verifications.composer.draft_failed');
    expect(sources).toContain('verifications.composer.send_failed');
    expect(sources).toContain('verifications.custom_dialog.artifacts_load_failed');
    expect(sources).toContain('verifications.custom_dialog.send_failed');
    expect(sources).not.toContain('Failed to draft verification request:');
    expect(sources).not.toContain('Failed to send drafted verification request:');
    expect(sources).not.toContain('Failed to load custom verification artifacts:');
    expect(sources).not.toContain('Failed to send custom verification request:');
  });

  it('keeps candidate invite route failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/candidate-invites/[token]/route.ts'),
      readSource('src/app/api/candidate-invites/[token]/claim/route.ts'),
      readSource('src/app/api/candidate-invites/[token]/proof-card/route.ts'),
      readSource('src/app/api/candidate-invites/[token]/workspace/route.ts'),
      readSource('src/app/api/organizations/[orgId]/candidate-invites/route.ts'),
      readSource('src/app/api/organizations/[orgId]/candidate-invites/[inviteId]/route.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('candidate_invite.preview.fetch_failed');
    expect(sources).toContain('candidate_invite.claim.failed');
    expect(sources).toContain('candidate_invite.proof_card.submit_failed');
    expect(sources).toContain('candidate_invite.workspace.fetch_failed');
    expect(sources).toContain('org_candidate_invites.list_failed');
    expect(sources).toContain('org_candidate_invites.email_send_failed');
    expect(sources).toContain('org_candidate_invites.create_failed');
    expect(sources).toContain('org_candidate_invites.resend_email_failed');
    expect(sources).toContain('org_candidate_invites.update_failed');
    expect(sources).not.toContain('Failed to fetch submission invite:');
    expect(sources).not.toContain('Failed to claim submission invite:');
    expect(sources).not.toContain('Failed to submit proof card for invite:');
    expect(sources).not.toContain('Failed to fetch submission invite workspace:');
    expect(sources).not.toContain('Failed to list submission invites:');
    expect(sources).not.toContain('Submission invite email send failed:');
    expect(sources).not.toContain('Failed to create submission invites:');
    expect(sources).not.toContain('Failed to resend submission invite:');
    expect(sources).not.toContain('Failed to update submission invite:');
  });

  it('keeps work-email verification route failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/verification/work-email/send/route.ts'),
      readSource('src/app/api/verification/work-email/verify/route.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('verification.work_email_send.profile_update_failed');
    expect(sources).toContain('verification.work_email_send.email_send_failed');
    expect(sources).toContain('verification.work_email_send.workflow_sync_failed');
    expect(sources).toContain('verification.work_email_send.failed');
    expect(sources).toContain('verification.work_email_verify.profile_update_failed');
    expect(sources).toContain('verification.work_email_verify.contradiction_reconcile_failed');
    expect(sources).toContain('verification.work_email_verify.workflow_sync_failed');
    expect(sources).toContain('verification.work_email_verify.failed');
    expect(sources).not.toContain('Error updating profile with work email:');
    expect(sources).not.toContain('Error sending verification email:');
    expect(sources).not.toContain('Failed to sync canonical verification workflow:');
    expect(sources).not.toContain('Error in work email verification send:');
    expect(sources).not.toContain('Error updating profile after work email verification:');
    expect(sources).not.toContain('Work email contradiction reconciliation failed:');
    expect(sources).not.toContain('Failed to sync canonical work email verification:');
    expect(sources).not.toContain('Error in work email verification:');
  });

  it('keeps custom verification request routes on structured server logging', () => {
    const sources = [
      readSource('src/app/api/verification/requests/custom/route.ts'),
      readSource('src/app/api/verification/requests/custom/artifacts/route.ts'),
      readSource('src/app/api/verification/requests/bundles/[requestId]/route.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('verification.custom_request.selected_skills_taxonomy_join_failed');
    expect(sources).toContain('verification.custom_request.selected_skills_load_failed');
    expect(sources).toContain('verification.custom_request.email_state_persist_failed');
    expect(sources).toContain('verification.custom_request.email_send_failed');
    expect(sources).toContain('verification.custom_request.post_failed');
    expect(sources).toContain('verification.custom_artifacts.skills_taxonomy_join_failed');
    expect(sources).toContain('verification.custom_artifacts.get_failed');
    expect(sources).toContain('verification.custom_bundle.get_failed');
    expect(sources).toContain('verification.custom_bundle.patch_failed');
    expect(sources).not.toContain(
      'Falling back to manual taxonomy lookup for selected skills in custom verification request:'
    );
    expect(sources).not.toContain(
      'Falling back to manual taxonomy lookup for custom verification artifact skills:'
    );
    expect(sources).not.toContain(
      'Failed to load selected skills for custom verification request:'
    );
    expect(sources).not.toContain(
      'Failed to validate experiences for custom verification request:'
    );
    expect(sources).not.toContain('Failed to validate education for custom verification request:');
    expect(sources).not.toContain(
      'Failed to validate impact stories for custom verification request:'
    );
    expect(sources).not.toContain('Failed to validate projects for custom verification request:');
    expect(sources).not.toContain(
      'Failed to validate volunteering for custom verification request:'
    );
    expect(sources).not.toContain(
      'Failed to validate active canonical skill verification requests:'
    );
    expect(sources).not.toContain('Could not resolve verifier profile via admin client');
    expect(sources).not.toContain('Failed to persist bundle email delivery state:');
    expect(sources).not.toContain('Custom verification email failed to send:');
    expect(sources).not.toContain('Custom verification request POST error:');
    expect(sources).not.toContain('Custom verification artifacts GET error:');
    expect(sources).not.toContain('Custom verification request GET error:');
    expect(sources).not.toContain('Custom verification request PATCH error:');
  });

  it('keeps verification request feed and email hint failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/verification/requests/route.ts'),
      readSource('src/app/api/verification/requests/email-hint/route.ts'),
      readSource('src/lib/verification/request-feed.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('verification.requests.get_failed');
    expect(sources).toContain('verification.email_hint.get_failed');
    expect(sources).toContain('verification.request_feed.skill_details_load_failed');
    expect(sources).toContain('verification.request_feed.requester_profiles_load_failed');
    expect(sources).toContain('verification.request_feed.impact_stories_load_failed');
    expect(sources).not.toContain('Verification requests route error:');
    expect(sources).not.toContain('Email hint GET error:');
    expect(sources).not.toContain('Failed to load canonical verification skill details:');
    expect(sources).not.toContain(
      'Failed to load requester profiles for canonical verification requests:'
    );
    expect(sources).not.toContain(
      'Failed to load impact story titles for canonical verification requests:'
    );
  });

  it('keeps sent verification request actions on structured server logging', () => {
    const source = readSource('src/lib/verification/sent-request-actions.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('verification.sent_requests.requester_name_lookup_failed');
    expect(source).toContain('verification.sent_requests.skill_name_lookup_failed');
    expect(source).toContain('verification.sent_requests.skill_clone_failed');
    expect(source).toContain('verification.sent_requests.skill_cancel_failed');
    expect(source).toContain('verification.sent_requests.impact_clone_failed');
    expect(source).toContain('verification.sent_requests.impact_cancel_failed');
    expect(source).not.toContain('Failed to fetch requester display name for resend:');
    expect(source).not.toContain('Failed to fetch skill name for resend:');
    expect(source).not.toContain(
      'Failed to clone canonical skill verification request for resend:'
    );
    expect(source).not.toContain('Failed to cancel skill verification request:');
    expect(source).not.toContain(
      'Failed to clone canonical impact verification request for resend:'
    );
    expect(source).not.toContain('Failed to cancel impact verification request:');
  });

  it('keeps verification status route failures on structured server logging', () => {
    const source = readSource('src/app/api/verification/status/route.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('verification.status.profile_fetch_failed');
    expect(source).toContain('verification.status.get_failed');
    expect(source).not.toContain('Error fetching individual profile:');
    expect(source).not.toContain('Error in verification status API:');
  });

  it('keeps verification integrity helper failures on structured server logging', () => {
    const source = readSource('src/lib/verification/integrity.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('verification.integrity.admin_client_unavailable');
    expect(source).toContain('verification.integrity.audit_log_insert_failed');
    expect(source).not.toContain('verification integrity admin client unavailable:');
    expect(source).not.toContain('verification audit log insert failed:');
  });

  it('keeps verifier contradiction reconciliation failures on structured server logging', () => {
    const source = readSource('src/lib/verification/contradiction.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('verification.contradiction.admin_client_unavailable');
    expect(source).toContain('verification.contradiction.records_load_failed');
    expect(source).toContain('verification.contradiction.reconcile_failed');
    expect(source).not.toContain('resolveVerifierIdentity: admin client unavailable');
    expect(source).not.toContain(
      'Failed to load canonical verification records for contradiction scan:'
    );
    expect(source).not.toContain('reconcileVerifierContradictions failed:');
  });

  it('keeps public verify token failures on structured server logging', () => {
    const source = readSource('src/app/api/verify/[token]/route.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('verify_token.impact.lookup_failed');
    expect(source).toContain('verify_token.impact.story_context_failed');
    expect(source).toContain('verify_token.impact.requester_profile_failed');
    expect(source).toContain('verify_token.impact.lookup_fallback_failed');
    expect(source).toContain('verify_token.impact.update_failed');
    expect(source).toContain('verify_token.impact.story_verified_update_failed');
    expect(source).toContain('verify_token.impact.notification_email_failed');
    expect(source).toContain('verify_token.impact.submit_fallback_failed');
    expect(source).toContain('verify_token.skill.admin_client_unavailable');
    expect(source).toContain('verify_token.skill.lookup_failed');
    expect(source).toContain('verify_token.skill.submit_lookup_failed');
    expect(source).toContain('verify_token.skill.requester_profile_failed');
    expect(source).toContain('verify_token.skill.proofs_lookup_failed');
    expect(source).toContain('verify_token.skill.update_failed');
    expect(source).toContain('verify_token.skill.analytics_emit_failed');
    expect(source).toContain('verify_token.skill.notification_email_failed');
    expect(source).toContain('verify_token.get_failed');
    expect(source).toContain('verify_token.post_failed');
    expect(source).not.toContain('Impact verification lookup error:');
    expect(source).not.toContain('Impact story context lookup error:');
    expect(source).not.toContain('Impact requester profile lookup error:');
    expect(source).not.toContain('Impact verification lookup failed, continuing to skill lookup:');
    expect(source).not.toContain(
      'Skill verification admin client unavailable; falling back to request-scoped client'
    );
    expect(source).not.toContain('Skill verification lookup failed:');
    expect(source).not.toContain('Skill requester profile lookup error:');
    expect(source).not.toContain('Skill proof lookup error:');
    expect(source).not.toContain('Verify GET error:');
    expect(source).not.toContain('Failed to update canonical impact verification request:');
    expect(source).not.toContain('Failed to mark impact story verified:');
    expect(source).not.toContain('Failed to send impact verification notification email:');
    expect(source).not.toContain('Impact verification submit failed, continuing to skill flow:');
    expect(source).not.toContain('Skill verification submit lookup failed:');
    expect(source).not.toContain('Error updating canonical skill verification:');
    expect(source).not.toContain('Failed to emit attestation_provided event:');
    expect(source).not.toContain('Failed to send verification notification email:');
    expect(source).not.toContain('Verify POST error:');
  });

  it('keeps conversation API failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/conversations/route.ts'),
      readSource('src/app/api/conversations/[conversationId]/route.ts'),
      readSource('src/app/api/conversations/[conversationId]/messages/route.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('conversations.list.failed');
    expect(sources).toContain('conversation.create.failed');
    expect(sources).toContain('conversation.detail.get_failed');
    expect(sources).toContain('conversation.detail.update_failed');
    expect(sources).toContain('conversation.messages.get_failed');
    expect(sources).toContain('message.send_failed');
    expect(sources).not.toContain('Get conversations error:');
    expect(sources).not.toContain('Create conversation error:');
    expect(sources).not.toContain('Error fetching conversation:');
    expect(sources).not.toContain('Error updating conversation:');
    expect(sources).not.toContain('Error fetching messages:');
    expect(sources).not.toContain('Error sending message:');
  });

  it('keeps interview API failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/interviews/route.ts'),
      readSource('src/app/api/interviews/schedule/route.ts'),
      readSource('src/app/api/interviews/edit/route.ts'),
      readSource('src/app/api/interviews/cancel/route.ts'),
      readSource('src/app/api/interviews/complete/route.ts'),
      readSource('src/app/actions/interviews.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('interviews.list.failed');
    expect(sources).toContain('interviews.schedule.list_failed');
    expect(sources).toContain('interviews.edit.failed');
    expect(sources).toContain('interviews.cancel.failed');
    expect(sources).toContain('interviews.complete.feedback_invites_failed');
    expect(sources).toContain('interviews.complete.failed');
    expect(sources).toContain('interview.schedule.analytics_emit_failed');
    expect(sources).not.toContain('Failed to fetch interviews:');
    expect(sources).not.toContain('Interview edit error:');
    expect(sources).not.toContain('Interview cancellation error:');
    expect(sources).not.toContain('Interview completion feedback invites failed');
    expect(sources).not.toContain('Interview completion failed');
    expect(sources).not.toContain('Failed to emit interview_scheduled event:');
  });

  it('keeps feedback API failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/feedback/[interviewId]/route.ts'),
      readSource('src/app/api/feedback/submit/route.ts'),
      readSource('src/app/api/feedback/token/[token]/route.ts'),
      readSource('src/lib/feedback/service.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('feedback.load.failed');
    expect(sources).toContain('feedback.submit.save_failed');
    expect(sources).toContain('feedback.submit.answers_failed');
    expect(sources).toContain('feedback.submit.failed');
    expect(sources).toContain('feedback.token.lookup_failed');
    expect(sources).toContain('feedback.invite.email_send_failed');
    expect(sources).not.toContain('Feedback load failed');
    expect(sources).not.toContain('Feedback save error');
    expect(sources).not.toContain('Feedback answers error');
    expect(sources).not.toContain('Feedback submit failed');
    expect(sources).not.toContain('Feedback token lookup failed');
    expect(sources).not.toContain('Failed to send feedback email');
  });

  it('keeps user skills API failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/expertise/user-skills/route.ts'),
      readSource('src/app/api/expertise/user-skills/[id]/route.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('expertise.user_skills.list_failed');
    expect(sources).toContain('expertise.user_skills.get_failed');
    expect(sources).toContain('expertise.user_skills.create_failed');
    expect(sources).toContain('expertise.user_skills.readiness_sync_failed');
    expect(sources).toContain('expertise.user_skills.analytics_emit_failed');
    expect(sources).toContain('expertise.user_skills.post_failed');
    expect(sources).toContain('expertise.user_skill.update_failed');
    expect(sources).toContain('expertise.user_skill.update_analytics_failed');
    expect(sources).toContain('expertise.user_skill.patch_failed');
    expect(sources).toContain('expertise.user_skill.delete_failed');
    expect(sources).toContain('expertise.user_skill.delete_analytics_failed');
    expect(sources).toContain('expertise.user_skill.delete_route_failed');
    expect(sources).not.toContain('Error fetching user skills:');
    expect(sources).not.toContain('User skills API error:');
    expect(sources).not.toContain('Error creating skill:');
    expect(sources).not.toContain('Failed to check/emit profile activation:');
    expect(sources).not.toContain('Failed to emit skill_added event:');
    expect(sources).not.toContain('User skills POST error:');
    expect(sources).not.toContain('Error updating skill:');
    expect(sources).not.toContain('Failed to emit skill_updated event:');
    expect(sources).not.toContain('User skill PATCH error:');
    expect(sources).not.toContain('Error deleting skill:');
    expect(sources).not.toContain('Failed to emit skill_deleted event:');
    expect(sources).not.toContain('User skill DELETE error:');
  });

  it('keeps user skill proof API failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/expertise/user-skills/[id]/proofs/route.ts'),
      readSource('src/app/api/expertise/user-skills/[id]/proofs/[proofId]/route.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('expertise.user_skill_proofs.canonical_create_failed');
    expect(sources).toContain('expertise.user_skill_proofs.readiness_sync_failed');
    expect(sources).toContain('expertise.user_skill_proofs.post_failed');
    expect(sources).toContain('expertise.user_skill_proofs.get_failed');
    expect(sources).toContain('expertise.user_skill_proof.legacy_delete_failed');
    expect(sources).toContain('expertise.user_skill_proof.delete_failed');
    expect(sources).toContain('expertise.user_skill_proof.delete_route_failed');
    expect(sources).not.toContain('Error creating canonical proof:');
    expect(sources).not.toContain('Failed to sync readiness milestones after proof creation:');
    expect(sources).not.toContain('Proof POST error:');
    expect(sources).not.toContain('Proof GET error:');
    expect(sources).not.toContain('Failed to delete compatibility skill_proofs row:');
    expect(sources).not.toContain('Error deleting proof:');
    expect(sources).not.toContain('Proof DELETE error:');
  });

  it('keeps portfolio API failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/portfolio/export/route.ts'),
      readSource('src/app/api/portfolio/public/[handle]/export/route.ts'),
      readSource('src/app/api/portfolio/org/[slug]/export/route.ts'),
      readSource('src/app/api/portfolio/visibility/route.ts'),
      readSource('src/app/api/portfolio/public/[handle]/summary/route.ts'),
      readSource('src/app/api/portfolio/text-pack/route.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('portfolio.export.analytics_failed');
    expect(sources).toContain('portfolio.export.failed');
    expect(sources).toContain('portfolio.public_export.failed');
    expect(sources).toContain('portfolio.org_export.failed');
    expect(sources).toContain('portfolio.visibility.get_failed');
    expect(sources).toContain('portfolio.visibility.update_failed');
    expect(sources).toContain('portfolio.visibility.profile_state_update_failed');
    expect(sources).toContain('portfolio.visibility.post_failed');
    expect(sources).toContain('portfolio.public_summary.failed');
    expect(sources).toContain('portfolio.text_pack.failed');
    expect(sources).not.toContain('portfolio export analytics failed');
    expect(sources).not.toContain('portfolio export failed');
    expect(sources).not.toContain('public portfolio export failed');
    expect(sources).not.toContain('organization portfolio export failed');
    expect(sources).not.toContain('visibility get failed');
    expect(sources).not.toContain('visibility update failed');
    expect(sources).not.toContain('portfolio state update failed');
    expect(sources).not.toContain('visibility post failed');
    expect(sources).not.toContain('public text pack failed');
    expect(sources).not.toContain('text pack failed');
  });

  it('keeps public portfolio action failures on client diagnostics without console output', () => {
    const sources = [
      readSource('src/app/portfolio/[handle]/CopyTextButton.tsx'),
      readSource('src/app/portfolio/[handle]/DownloadPdfButton.tsx'),
      readSource('src/app/portfolio/org/[slug]/DownloadOrganizationPdfButton.tsx'),
    ].join('\n');

    expect(sources).toContain(
      "import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics'"
    );
    expect(sources).toContain('portfolio.public_text_pack.copy_failed');
    expect(sources).toContain('portfolio.public_pdf.download_failed');
    expect(sources).toContain('portfolio.organization_pdf.download_failed');
    expect(sources).not.toContain('portfolio pdf download failed');
    expect(sources).not.toContain('organization portfolio pdf download failed');
    expect(sources).not.toContain('console.error(e)');
  });

  it('keeps settings privacy and publication failures on client diagnostics without console output', () => {
    const sources = [
      readSource('src/components/settings/PrivacyOverview.tsx'),
      readSource('src/components/settings/PortfolioVisibilityCard.tsx'),
    ].join('\n');

    expect(sources).toContain(
      "import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics'"
    );
    expect(sources).toContain('settings.privacy_overview.visibility_summary_failed');
    expect(sources).toContain('settings.privacy_overview.export_failed');
    expect(sources).toContain('settings.portfolio_visibility.load_failed');
    expect(sources).toContain('settings.portfolio_visibility.save_failed');
    expect(sources).toContain('settings.portfolio_visibility.privacy_check_failed');
    expect(sources).not.toContain('Failed to load visibility summary');
    expect(sources).not.toContain('Failed to export data:');
    expect(sources).not.toContain('console.error(e)');
  });

  it('keeps organization visibility failures on structured server logging', () => {
    const source = readSource('src/app/api/organizations/[orgId]/visibility/route.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('organization.visibility.get_failed');
    expect(source).toContain('organization.visibility.get_route_failed');
    expect(source).toContain('organization.visibility.read_failed');
    expect(source).toContain('organization.visibility.update_failed');
    expect(source).toContain('organization.visibility.create_failed');
    expect(source).toContain('organization.visibility.publication_update_failed');
    expect(source).toContain('organization.visibility.put_route_failed');
    expect(source).not.toContain('Error fetching visibility settings:');
    expect(source).not.toContain('Error in visibility GET:');
    expect(source).not.toContain('Error updating visibility settings:');
    expect(source).not.toContain('Error creating visibility settings:');
    expect(source).not.toContain('Error updating org publication settings:');
    expect(source).not.toContain('Error in visibility PUT:');
  });

  it('keeps match hide and paused-match failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/match/hide/route.ts'),
      readSource('src/app/api/match/snoozed/route.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('match.hide.list_failed');
    expect(sources).toContain('match.hide.update_failed');
    expect(sources).toContain('match.hide.delete_failed');
    expect(sources).toContain('match.snoozed.list_failed');
    expect(sources).not.toContain('Failed to fetch hidden matches:');
    expect(sources).not.toContain('Failed to hide match:');
    expect(sources).not.toContain('Failed to unhide match:');
    expect(sources).not.toContain('Error fetching snoozed matches:');
  });

  it('keeps matching client failures on client diagnostics without console output', () => {
    const source = readSource('src/app/app/i/matching/MatchingClient.tsx');

    expect(source).toContain(
      "import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics'"
    );
    expect(source).toContain('matching.client.profile_load_failed');
    expect(source).toContain('matching.client.matches_load_failed');
    expect(source).toContain('matching.client.load_timeout');
    expect(source).toContain('matching.client.load_failed');
    expect(source).toContain('matching.client.restore_refresh_failed');
    expect(source).toContain('matching.client.hide_failed');
    expect(source).not.toContain('Failed to load matching profile:');
    expect(source).not.toContain('Failed to load matches:');
    expect(source).not.toContain('Matching data request timed out');
    expect(source).not.toContain('Error loading matching data:');
    expect(source).not.toContain('Failed to refresh matches after restore:');
    expect(source).not.toContain('Failed to hide match:');
  });

  it('keeps matching interaction failures on client diagnostics without console output', () => {
    const sources = [
      readSource('src/components/matching/MatchResultCard.tsx'),
      readSource('src/components/matching/SnoozedMatchesList.tsx'),
      readSource('src/components/matching/HiddenMatchesList.tsx'),
      readSource('src/components/matching/SnoozeDialog.tsx'),
      readSource('src/components/matching/ConsentToShareDialog.tsx'),
      readSource('src/components/matching/MatchingOrganizationView.tsx'),
    ].join('\n');

    expect(sources).toContain(
      "import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics'"
    );
    expect(sources).toContain('matching.result_card.explanation_fetch_failed');
    expect(sources).toContain('matching.result_card.visible_fields_fetch_failed');
    expect(sources).toContain('matching.result_card.gates_check_failed');
    expect(sources).toContain('matching.snoozed_matches.load_failed');
    expect(sources).toContain('matching.snoozed_matches.warm_after_unsnooze_failed');
    expect(sources).toContain('matching.snoozed_matches.unsnooze_failed');
    expect(sources).toContain('matching.hidden_matches.load_failed');
    expect(sources).toContain('matching.hidden_matches.warm_after_unhide_failed');
    expect(sources).toContain('matching.hidden_matches.unhide_failed');
    expect(sources).toContain('matching.snooze_dialog.snooze_failed');
    expect(sources).toContain('matching.consent_to_share.record_failed');
    expect(sources).toContain('matching.organization_view.explanation_fetch_failed');
    expect(sources).not.toContain('Failed to fetch match explanation:');
    expect(sources).not.toContain('Failed to fetch visible fields:');
    expect(sources).not.toContain('Failed to check verification gates:');
    expect(sources).not.toContain('Failed to fetch snoozed matches:');
    expect(sources).not.toContain('Warm matches fetch failed after unsnooze');
    expect(sources).not.toContain('Error unsnoozing match:');
    expect(sources).not.toContain('Failed to fetch hidden matches:');
    expect(sources).not.toContain('Warm matches fetch failed after unhide:');
    expect(sources).not.toContain('Failed to unhide match:');
    expect(sources).not.toContain('Failed to snooze match:');
    expect(sources).not.toContain('Failed to record consent:');
  });

  it('keeps privacy settings client failures on client diagnostics without console output', () => {
    const source = readSource('src/app/app/i/settings/privacy/PrivacySettingsClient.tsx');

    expect(source).toContain(
      "import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics'"
    );
    expect(source).toContain('privacy_settings.client.visibility_fetch_failed');
    expect(source).toContain('privacy_settings.client.visibility_save_failed');
    expect(source).not.toContain('Failed to fetch visibility settings:');
    expect(source).not.toContain('Failed to save visibility settings:');
  });

  it('keeps privacy settings child failures on client diagnostics without console output', () => {
    const sources = [
      readSource('src/components/privacy/DataBreakdown.tsx'),
      readSource('src/components/privacy/AuditLogTable.tsx'),
      readSource('src/components/privacy/DeleteAccountSection.tsx'),
      readSource('src/components/profile/IndividualFieldVisibilityControls.tsx'),
    ].join('\n');

    expect(sources).toContain(
      "import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics'"
    );
    expect(sources).toContain('privacy.data_breakdown.load_failed');
    expect(sources).toContain('privacy.data_breakdown.export_failed');
    expect(sources).toContain('privacy.audit_log.load_failed');
    expect(sources).toContain('privacy.delete_account.request_failed');
    expect(sources).toContain('privacy.field_visibility.save_failed');
    expect(sources).not.toContain('Failed to fetch data breakdown:');
    expect(sources).not.toContain('Export failed:');
    expect(sources).not.toContain('Failed to fetch account history:');
    expect(sources).not.toContain('Deletion request failed:');
    expect(sources).not.toContain('Failed to save visibility settings:');
  });

  it('keeps match explanation failures on structured server logging', () => {
    const source = readSource('src/app/api/match/explain/[matchId]/route.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('match.explain.get_failed');
    expect(source).not.toContain('Match explanation error:');
  });

  it('keeps profile matching analytics failures on structured server logging', () => {
    const source = readSource('src/app/api/core/matching/profile/handler.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('match.profile.first_match_event_failed');
    expect(source).not.toContain('Failed to emit first match shown event:');
  });

  it('keeps core matching adjacency fallback failures on structured server logging', () => {
    const source = readSource('src/lib/core/matching/adjacency.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('matching.adjacency.explicit_fetch_failed');
    expect(source).not.toContain('[Adjacency] Failed to fetch explicit adjacencies:');
  });

  it('keeps Start from CV status failures on structured server logging', () => {
    const source = readSource('src/app/api/ai/start-from-cv/status/route.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('start_from_cv.status.failed');
    expect(source).not.toContain("console.error('start_from_cv.status.failed'");
  });

  it('keeps launch-status live refresh failures on structured server logging', () => {
    const source = readSource('src/app/api/monitoring/launch-status/route.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('launch_status.live_refresh_failed');
    expect(source).not.toContain('Live launch-status refresh failed; returning persisted status');
  });

  it('keeps rate-limit provider failures on structured server logging', () => {
    const source = readSource('src/lib/rate-limit/index.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('rate_limit.provider_check_failed');
    expect(source).not.toContain('[RateLimit] Error checking rate limit for profile:');
  });

  it('keeps shared auth helper failures on structured server logging', () => {
    const source = readSource('src/lib/auth.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('auth.current_user.profile_load_failed');
    expect(source).toContain('auth.user_organizations.load_failed');
    expect(source).toContain('auth.active_organization.load_failed');
    expect(source).toContain('auth.organization_role.verify_failed');
    expect(source).not.toContain('Failed to load profile for current user:');
    expect(source).not.toContain('Failed to load organizations for user:');
    expect(source).not.toContain('Failed to load active organization:');
    expect(source).not.toContain('Failed to verify organization role:');
  });

  it('keeps organization detail and profile visibility failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/organizations/[orgId]/route.ts'),
      readSource('src/app/api/profile/visibility/route.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('organization.detail.get_failed');
    expect(sources).toContain('organization.detail.update_failed');
    expect(sources).toContain('profile.visibility.get_failed');
    expect(sources).toContain('profile.visibility.update_failed');
    expect(sources).not.toContain('Error fetching organization:');
    expect(sources).not.toContain('Error updating organization:');
    expect(sources).not.toContain('Error fetching visibility settings:');
    expect(sources).not.toContain('Error updating visibility settings:');
  });

  it('keeps current-user and consent-check failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/user/me/route.ts'),
      readSource('src/app/api/user/consent/check/route.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('user.me.get_failed');
    expect(sources).toContain('user.consent_check.get_failed');
    expect(sources).not.toContain('Failed to fetch current user:');
    expect(sources).not.toContain('Error checking policy consent:');
  });

  it('keeps privacy helper failures on structured server logging', () => {
    const sources = [
      readSource('src/lib/privacy/policy-versions.ts'),
      readSource('src/lib/privacy/visibility.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('privacy.policy_consent.check_failed');
    expect(sources).toContain('privacy.visibility.matched_relationship_check_failed');
    expect(sources).not.toContain('Failed to check policy consent:');
    expect(sources).not.toContain('Failed to check matched relationship:');
  });

  it('keeps admin audit and internal-ops queue failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/admin/audit/route.ts'),
      readSource('src/app/api/admin/internal-ops/queues/route.ts'),
      readSource('src/app/api/admin/internal-ops/queues/[id]/route.ts'),
      readSource('src/lib/internal-ops/queue.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('admin.audit.list_failed');
    expect(sources).toContain('admin.internal_ops_queues.list_failed');
    expect(sources).toContain('admin.internal_ops_queue_item.get_failed');
    expect(sources).toContain('admin.internal_ops_queue_item.update_failed');
    expect(sources).toContain('internal_ops_queue.${operation}.compatibility_fallback');
    expect(sources).not.toContain('Error fetching audit logs');
    expect(sources).not.toContain('Error fetching operations queues');
    expect(sources).not.toContain('Error fetching operations queue item');
    expect(sources).not.toContain('Error updating operations queue item');
    expect(sources).not.toContain(
      'console.warn(`internal_ops_queue.${operation}.compatibility_fallback`'
    );
  });

  it('keeps admin organization trust-tier failures on structured server logging', () => {
    const source = readSource('src/app/api/admin/organizations/[orgId]/verify/route.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('admin.organization_verify.update_failed');
    expect(source).not.toContain('Failed to update organization verification:');
  });

  it('keeps admin authorization helper failures on structured server logging', () => {
    const source = readSource('src/lib/auth/admin.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('admin.platform_status.check_failed');
    expect(source).toContain('admin.super_status.check_failed');
    expect(source).toContain('admin.org_status.check_failed');
    expect(source).toContain('admin.level.resolve_failed');
    expect(source).toContain('admin.user.resolve_failed');
    expect(source).toContain('admin.action_permission.check_failed');
    expect(source).toContain('admin.invitation.lookup_failed');
    expect(source).toContain('admin.role.auto_grant_failed');
    expect(source).not.toContain('Error checking platform admin status:');
    expect(source).not.toContain('Error checking super admin status:');
    expect(source).not.toContain('Error checking org admin status:');
    expect(source).not.toContain('Error getting admin level:');
    expect(source).not.toContain('Error getting admin user:');
    expect(source).not.toContain('Error checking admin action permission:');
    expect(source).not.toContain('Error checking admin invitation:');
    expect(source).not.toContain('Error auto-granting admin role:');
  });

  it('keeps organization server-action failures on structured server logging', () => {
    const source = readSource('src/actions/org.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('organization.action.update.deprecated');
    expect(source).toContain('organization.action.update_failed');
    expect(source).toContain('organization.action.reload_after_update_failed');
    expect(source).toContain('organization.invite.existing_check_failed');
    expect(source).toContain('organization.invite.create_failed');
    expect(source).toContain('organization.invite.organization_load_failed');
    expect(source).toContain('organization.invite.email_delivery_unconfirmed');
    expect(source).toContain('organization.invitation_accept.non_canonical_role');
    expect(source).toContain('organization.invitation_accept.membership_activate_failed');
    expect(source).toContain('organization.invitation_accept.member_insert_failed');
    expect(source).toContain('organization.invitation_accept.status_update_failed');
    expect(source).toContain('organization.member.remove_failed');
    expect(source).toContain('organization.ownership_transfer.memberships_load_failed');
    expect(source).toContain('organization.ownership_transfer.initiate_update_failed');
    expect(source).toContain('organization.ownership_transfer.target_load_failed');
    expect(source).toContain('organization.ownership_transfer.previous_owner_demote_failed');
    expect(source).toContain('organization.ownership_transfer.target_activate_failed');
    expect(source).not.toContain('Deprecated: updateOrganization server action is legacy.');
    expect(source).not.toContain('Failed to update organization:');
    expect(source).not.toContain('Failed to load organization after update:');
    expect(source).not.toContain('Unexpected organization update error:');
    expect(source).not.toContain('Failed to check existing invitation:');
    expect(source).not.toContain('Failed to create invitation:');
    expect(source).not.toContain('Failed to load organization for invite:');
    expect(source).not.toContain('Org invite email delivery could not be confirmed:');
    expect(source).not.toContain('Unexpected invite member error:');
    expect(source).not.toContain('Invitation contains non-canonical role:');
    expect(source).not.toContain('Failed to activate invited membership:');
    expect(source).not.toContain('Failed to add member:');
    expect(source).not.toContain('Failed to update invitation status:');
    expect(source).not.toContain('Unexpected invitation acceptance error:');
    expect(source).not.toContain('Failed to remove member:');
    expect(source).not.toContain('Unexpected remove member error:');
    expect(source).not.toContain('Failed to load memberships for ownership transfer:');
    expect(source).not.toContain('Failed to update target ownership transfer record:');
    expect(source).not.toContain('Failed to load target ownership transfer membership:');
    expect(source).not.toContain('Failed to demote previous owner:');
    expect(source).not.toContain('Failed to activate new owner membership:');
  });

  it('keeps assignment server-action failures on structured server logging', () => {
    const source = readSource('src/actions/assignment.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('assignment.action.create_failed');
    expect(source).toContain('assignment.action.create_unexpected_failed');
    expect(source).toContain('assignment.action.update_failed');
    expect(source).toContain('assignment.action.update_unexpected_failed');
    expect(source).toContain('business_value');
    expect(source).toContain('expected_impact');
    expect(source).toContain('must_have_skills');
    expect(source).not.toContain('Failed to create assignment:');
    expect(source).not.toContain('Unexpected error creating assignment:');
    expect(source).not.toContain('Failed to update assignment:');
    expect(source).not.toContain('Unexpected error updating assignment:');
  });

  it('keeps tour server-action failures on structured server logging', () => {
    const source = readSource('src/actions/tour.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('tour.complete.verify_failed');
    expect(source).toContain('tour.complete.failed');
    expect(source).toContain('tour.reset.failed');
    expect(source).toContain('tour.status.failed');
    expect(source).not.toContain('Tour completion update may have failed - profile not updated');
    expect(source).not.toContain('Failed to complete tour:');
    expect(source).not.toContain('Failed to reset tour:');
    expect(source).not.toContain('Failed to get tour status:');
  });

  it('keeps active auth entry route failures on structured server logging', () => {
    const sources = [
      readSource('src/app/login/page.tsx'),
      readSource('src/app/onboarding/page.tsx'),
      readSource('src/app/auth/callback/route.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('login.auth_check.failed');
    expect(sources).toContain('login.auth_client.failed');
    expect(sources).toContain('login.home_path.resolve_failed');
    expect(sources).toContain('onboarding.page.auth_user_load_failed');
    expect(sources).toContain('auth.callback.contradiction_reconcile_failed');
    expect(sources).toContain('auth.callback.exchange_failed');
    expect(sources).not.toContain('Auth check failed on login page:');
    expect(sources).not.toContain('Error checking authentication on login page:');
    expect(sources).not.toContain('Error resolving home path:');
    expect(sources).not.toContain('Failed to load authenticated user for onboarding:');
    expect(sources).not.toContain('Auth callback contradiction reconciliation failed:');
    expect(sources).not.toContain('Failed to exchange OAuth code for session:');
  });

  it('keeps organization helper drift warnings on structured server logging', () => {
    const sources = [
      readSource('src/lib/orgs.ts'),
      readSource('src/lib/organizations/team.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('organization.context.persona_upsert_failed');
    expect(sources).toContain('organization.team.non_canonical_member_role_skipped');
    expect(sources).toContain('organization.team.non_canonical_stats_role_skipped');
    expect(sources).not.toContain('[ensureOrgContextForUser] upsert persona failed');
    expect(sources).not.toContain('[organizations.team] skipping member with non-canonical role');
    expect(sources).not.toContain(
      '[organizations.team] skipping team stats row with non-canonical role'
    );
  });

  it('keeps shared cache utility failures on structured server logging without raw keys', () => {
    const source = readSource('src/lib/cache.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('cache.get_failed');
    expect(source).toContain('cache.set_failed');
    expect(source).toContain('cache.delete_failed');
    expect(source).toContain('cache.pattern_delete_failed');
    expect(source).toContain('cache.clear_all_requested');
    expect(source).toContain('keyFamily');
    expect(source).not.toContain('Cache get error for key');
    expect(source).not.toContain('Cache set error for key');
    expect(source).not.toContain('Cache delete error for key');
    expect(source).not.toContain('Cache pattern delete error for pattern');
    expect(source).not.toContain('Clearing all caches - this may impact performance');
  });

  it('keeps learning provider fallback diagnostics on structured server logging', () => {
    const source = readSource('src/lib/learning/coursera.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('learning.coursera.fallback_used');
    expect(source).not.toContain('Coursera API failed, using fallback data');
  });

  it('keeps profile data fallback failures on structured server logging', () => {
    const source = readSource('src/actions/profile.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('profile.activation_check_failed');
    expect(source).toContain('profile.data.ensure_profile_row_failed');
    expect(source).toContain('profile.data.shell_rows_failed');
    expect(source).toContain('profile.data.create_profile_row_failed');
    expect(source).toContain('profile.data.fetch_after_create_failed');
    expect(source).toContain('profile.data.related_rows_failed');
    expect(source).toContain('profile.data.impact_verification_summary_failed');
    expect(source).toContain('profile.data.canonical_proof_summary_failed');
    expect(source).toContain('profile.data.publication_state_failed');
    expect(source).toContain('profile.data.get_failed');
    expect(source).toContain('profile.impact_verification.requester_email_resolve_failed');
    expect(source).not.toContain('Profile activation check failed:');
    expect(source).not.toContain('Failed to ensure profiles row exists:');
    expect(source).not.toContain('Failed to fetch profile shell rows:');
    expect(source).not.toContain('Failed to create profile row:');
    expect(source).not.toContain('Failed to fetch profile after create:');
    expect(source).not.toContain('Failed to fetch profile related data:');
    expect(source).not.toContain('Failed to fetch impact verification summaries:');
    expect(source).not.toContain('Failed to fetch canonical proof pack summary:');
    expect(source).not.toContain('Failed to fetch portfolio publication state:');
    expect(source).not.toContain('Failed to get profile data:');
    expect(source).not.toContain('impact verification: unable to resolve requester auth email');
  });

  it('keeps root layout i18n fallback failures on structured server logging', () => {
    const source = readSource('src/app/layout.tsx');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('root_layout.i18n_messages_load_failed');
    expect(source).not.toContain('Failed to load i18n messages:');
  });

  it('keeps assignment review page server fetch failures on structured logging', () => {
    const source = readSource('src/app/app/o/[slug]/assignments/[id]/review/page.tsx');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('assignment.review_page.server_fetch_failed');
    expect(source).not.toContain('SSR fetch failed');
  });

  it('keeps individual home metrics fallback failures on structured server logging', () => {
    const source = readSource('src/app/app/i/home/page.tsx');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('individual.home.metrics_load_failed');
    expect(source).not.toContain('Failed to load proof home metrics:');
  });
});
