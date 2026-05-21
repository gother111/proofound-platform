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
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('interviews.list.failed');
    expect(sources).toContain('interviews.schedule.list_failed');
    expect(sources).toContain('interviews.edit.failed');
    expect(sources).toContain('interviews.cancel.failed');
    expect(sources).toContain('interviews.complete.feedback_invites_failed');
    expect(sources).toContain('interviews.complete.failed');
    expect(sources).not.toContain('Failed to fetch interviews:');
    expect(sources).not.toContain('Interview edit error:');
    expect(sources).not.toContain('Interview cancellation error:');
    expect(sources).not.toContain('Interview completion feedback invites failed');
    expect(sources).not.toContain('Interview completion failed');
  });

  it('keeps feedback API failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/feedback/[interviewId]/route.ts'),
      readSource('src/app/api/feedback/submit/route.ts'),
      readSource('src/app/api/feedback/token/[token]/route.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('feedback.load.failed');
    expect(sources).toContain('feedback.submit.save_failed');
    expect(sources).toContain('feedback.submit.answers_failed');
    expect(sources).toContain('feedback.submit.failed');
    expect(sources).toContain('feedback.token.lookup_failed');
    expect(sources).not.toContain('Feedback load failed');
    expect(sources).not.toContain('Feedback save error');
    expect(sources).not.toContain('Feedback answers error');
    expect(sources).not.toContain('Feedback submit failed');
    expect(sources).not.toContain('Feedback token lookup failed');
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

  it('keeps admin audit and internal-ops queue failures on structured server logging', () => {
    const sources = [
      readSource('src/app/api/admin/audit/route.ts'),
      readSource('src/app/api/admin/internal-ops/queues/route.ts'),
      readSource('src/app/api/admin/internal-ops/queues/[id]/route.ts'),
    ].join('\n');

    expect(sources).toContain("import { log } from '@/lib/log'");
    expect(sources).toContain('admin.audit.list_failed');
    expect(sources).toContain('admin.internal_ops_queues.list_failed');
    expect(sources).toContain('admin.internal_ops_queue_item.get_failed');
    expect(sources).toContain('admin.internal_ops_queue_item.update_failed');
    expect(sources).not.toContain('Error fetching audit logs');
    expect(sources).not.toContain('Error fetching operations queues');
    expect(sources).not.toContain('Error fetching operations queue item');
    expect(sources).not.toContain('Error updating operations queue item');
  });

  it('keeps admin organization trust-tier failures on structured server logging', () => {
    const source = readSource('src/app/api/admin/organizations/[orgId]/verify/route.ts');

    expect(source).toContain("import { log } from '@/lib/log'");
    expect(source).toContain('admin.organization_verify.update_failed');
    expect(source).not.toContain('Failed to update organization verification:');
  });
});
