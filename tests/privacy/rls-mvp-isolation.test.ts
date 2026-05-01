import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  createAuthenticatedClient,
  createServiceRoleClient,
  createTestUser,
  deleteTestUser,
  type TestUser,
} from './helpers/supabase-test-client';
import { createTestProfile } from './helpers/test-data-factory';
import { expectAuthorized, expectEmpty, expectUnauthorized } from './helpers/rls-test-utils';

type OrgFixture = {
  id: string;
  assignmentId: string;
  matchId: string;
  reviewStateId: string;
  conversationId: string;
  introId: string;
  interviewId: string;
  decisionId: string;
  engagementVerificationId: string;
  orgUploadId: string;
  auditLogId: number;
};

let candidateA: TestUser;
let candidateB: TestUser;
let orgAOwner: TestUser;
let orgAReviewer: TestUser;
let orgBOwner: TestUser;
let orgBReviewer: TestUser;
let orgA: OrgFixture;
let orgB: OrgFixture;
let candidateAProofPackId: string;
let candidateBProofPackId: string;
let candidateAProofItemId: string;
let candidateBProofItemId: string;
let candidateAUploadId: string;
let candidateBUploadId: string;
let candidateAExportId: string;
let candidateBExportId: string;
let candidateAExperienceId: string;
let candidateBExperienceId: string;

const createdUsers: TestUser[] = [];
const cleanupIds: Record<string, Array<string | number>> = {
  engagement_verifications: [],
  decisions: [],
  interviews: [],
  intro_workflows: [],
  conversations: [],
  reveal_events: [],
  match_review_states: [],
  matches: [],
  assignments: [],
  uploaded_file_events: [],
  uploaded_files: [],
  proof_pack_items: [],
  proof_packs: [],
  proof_artifacts: [],
  data_portability_exports: [],
  experiences: [],
  education: [],
  volunteering: [],
  audit_logs: [],
  organization_members: [],
  organizations: [],
};

function remember(table: keyof typeof cleanupIds, id: string | number) {
  cleanupIds[table].push(id);
  return id;
}

async function createProfiledUser(label: string, ts: number): Promise<TestUser> {
  const user = await createTestUser(`${label}+${ts}@test.com`, 'password123', {
    display_name: label,
  });
  createdUsers.push(user);
  await createTestProfile(user.id, {
    displayName: label,
    handle: `${label.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${ts}`,
    persona: 'individual',
  });
  return user;
}

async function createPrivateContext(user: TestUser, label: string) {
  const service = createServiceRoleClient();

  const { error: individualError } = await service.from('individual_profiles').upsert({
    user_id: user.id,
    headline: `${label} private headline`,
    bio: `${label} private biography`,
    visibility: 'private',
    field_visibility: {
      employerNames: 'private',
      schoolNames: 'private',
      exactLocation: 'private',
    },
  });
  expect(individualError).toBeNull();

  const { data: experience, error: experienceError } = await service
    .from('experiences')
    .insert({
      user_id: user.id,
      title: `${label} private experience`,
      organization_name: `${label} Sensitive Employer`,
      org_description: 'Private context fixture',
      duration: '2024-2025',
      outcomes: 'Private outcome',
      projects: 'Private project',
      colleagues: 'Private collaborators',
      achievements: 'Private achievement',
    })
    .select('id')
    .single();
  expectAuthorized(experience, experienceError, 'setup should create private experience');
  return remember('experiences', experience!.id as string);
}

async function createOrgFixture(params: {
  ts: number;
  label: string;
  candidate: TestUser;
  owner: TestUser;
  reviewer: TestUser;
}): Promise<OrgFixture> {
  const service = createServiceRoleClient();
  const slug = `rls-${params.label.toLowerCase()}-${params.ts}`;

  const { data: org, error: orgError } = await service
    .from('organizations')
    .insert({
      slug,
      display_name: `RLS ${params.label} Org`,
      legal_name: `RLS ${params.label} Org LLC`,
      type: 'company',
      created_by: params.owner.id,
    })
    .select('id')
    .single();
  expectAuthorized(org, orgError, 'setup should create organization');
  remember('organizations', org!.id);

  const { data: memberships, error: membershipError } = await service
    .from('organization_members')
    .insert([
      {
        org_id: org!.id,
        user_id: params.owner.id,
        role: 'org_owner',
        state: 'active',
      },
      {
        org_id: org!.id,
        user_id: params.reviewer.id,
        role: 'org_reviewer',
        state: 'active',
      },
    ])
    .select('id');
  expect(membershipError).toBeNull();
  for (const membership of memberships ?? []) {
    remember('organization_members', membership.id);
  }

  const { data: assignment, error: assignmentError } = await service
    .from('assignments')
    .insert({
      org_id: org!.id,
      role: `RLS ${params.label} Assignment`,
      description: 'Assignment privacy fixture',
      status: 'active',
      values_required: [],
      cause_tags: [],
      must_have_skills: [],
      nice_to_have_skills: [],
    })
    .select('id')
    .single();
  expectAuthorized(assignment, assignmentError, 'setup should create assignment');
  remember('assignments', assignment!.id);

  const { data: match, error: matchError } = await service
    .from('matches')
    .insert({
      assignment_id: assignment!.id,
      profile_id: params.candidate.id,
      score: 0.87,
      vector: {},
      weights: {},
      subscores_json: {},
      score_snapshot_json: {},
      is_test_match: true,
    })
    .select('id')
    .single();
  expectAuthorized(match, matchError, 'setup should create match');
  remember('matches', match!.id);

  const { data: reviewState, error: reviewStateError } = await service
    .from('match_review_states')
    .upsert({
      match_id: match!.id,
      assignment_id: assignment!.id,
      profile_id: params.candidate.id,
      org_id: org!.id,
      review_stage: 'blind_review',
      reveal_scope: 'blind',
    })
    .select('match_id')
    .single();
  expectAuthorized(reviewState, reviewStateError, 'setup should create match review state');
  remember('match_review_states', reviewState!.match_id);

  const { data: conversation, error: conversationError } = await service
    .from('conversations')
    .insert({
      match_id: match!.id,
      assignment_id: assignment!.id,
      participant_one_id: params.candidate.id,
      participant_two_id: params.reviewer.id,
      stage: 'masked',
      masked_handle_one: `Candidate ${params.label}`,
      masked_handle_two: 'Organization representative',
      participant_two_wants_reveal: true,
      participant_two_reveal_requested_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  expectAuthorized(conversation, conversationError, 'setup should create conversation');
  remember('conversations', conversation!.id);

  const { data: intro, error: introError } = await service
    .from('intro_workflows')
    .insert({
      assignment_id: assignment!.id,
      candidate_profile_id: params.candidate.id,
      org_id: org!.id,
      state: 'conversation_open',
      match_id: match!.id,
      conversation_id: conversation!.id,
      metadata: { test: 'rls-mvp-isolation' },
    })
    .select('id')
    .single();
  expectAuthorized(intro, introError, 'setup should create intro workflow');
  remember('intro_workflows', intro!.id);

  const { data: revealEvent, error: revealEventError } = await service
    .from('reveal_events')
    .insert({
      match_id: match!.id,
      assignment_id: assignment!.id,
      profile_id: params.candidate.id,
      org_id: org!.id,
      actor_id: params.reviewer.id,
      actor_role: 'org_reviewer',
      actor_type: 'organization',
      trigger_type: 'user',
      requested_scope: 'full_identity',
      granted_scope: 'blind',
      reason_code: 'org_reveal_request_pending',
      source_surface: 'privacy_test',
      context_json: { privateCandidateSignal: `${params.label} should stay hidden` },
      outcome: 'denied',
    })
    .select('id')
    .single();
  expectAuthorized(revealEvent, revealEventError, 'setup should create reveal event');
  remember('reveal_events', revealEvent!.id);

  const { data: interview, error: interviewError } = await service
    .from('interviews')
    .insert({
      match_id: match!.id,
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      platform: 'zoom',
      meeting_id: `rls-${params.label}-${params.ts}`,
      status: 'scheduled',
      host_user_id: params.reviewer.id,
      participant_user_ids: [params.candidate.id, params.reviewer.id],
    })
    .select('id')
    .single();
  expectAuthorized(interview, interviewError, 'setup should create interview');
  remember('interviews', interview!.id);

  const { data: decision, error: decisionError } = await service
    .from('decisions')
    .insert({
      interview_id: interview!.id,
      latest_interview_id: interview!.id,
      decision: 'hold',
      feedback: 'Pending privacy fixture',
      hours_since_interview: 0,
      within_sla: false,
      intro_id: intro!.id,
      assignment_id: assignment!.id,
      candidate_profile_id: params.candidate.id,
      org_id: org!.id,
      state: 'pending',
      internal_note: `${params.label} private decision note`,
    })
    .select('id')
    .single();
  expectAuthorized(decision, decisionError, 'setup should create decision');
  remember('decisions', decision!.id);

  const { data: engagementVerification, error: engagementError } = await service
    .from('engagement_verifications')
    .insert({
      decision_id: decision!.id,
      intro_id: intro!.id,
      assignment_id: assignment!.id,
      candidate_profile_id: params.candidate.id,
      org_id: org!.id,
      engagement_type: 'contract_consulting',
      state: 'pending_both_confirmations',
      evidence_note: `${params.label} private engagement evidence`,
    })
    .select('id')
    .single();
  expectAuthorized(
    engagementVerification,
    engagementError,
    'setup should create engagement verification'
  );
  remember('engagement_verifications', engagementVerification!.id);

  const { data: orgUpload, error: orgUploadError } = await service
    .from('uploaded_files')
    .insert({
      owner_type: 'organization',
      owner_id: org!.id,
      source_surface: 'privacy_test',
      upload_kind: 'document',
      original_filename: `${params.label}-org-sensitive.pdf`,
      original_filename_sensitive: true,
      sanitized_filename: 'shared-document.pdf',
      declared_mime: 'application/pdf',
      detected_mime: 'application/pdf',
      size_bytes: 64,
      sha256: `sha256-${params.label}-${params.ts}`,
      quarantine_bucket: 'user-uploads-quarantine',
      quarantine_path: `${org!.id}/${params.label}/org-sensitive.pdf`,
      lifecycle_state: 'quarantined',
      safety_status: 'pending',
      safe_for_public: false,
    })
    .select('id')
    .single();
  expectAuthorized(orgUpload, orgUploadError, 'setup should create org upload metadata');
  remember('uploaded_files', orgUpload!.id);

  const { data: auditLog, error: auditError } = await service
    .from('audit_logs')
    .insert({
      actor_id: params.owner.id,
      org_id: org!.id,
      action: `rls.${params.label}.private_audit_event`,
      target_type: 'assignment',
      target_id: assignment!.id,
      meta: { privateOrgSignal: `${params.label} audit detail` },
    })
    .select('id')
    .single();
  expectAuthorized(auditLog, auditError, 'setup should create audit log');
  remember('audit_logs', auditLog!.id);

  return {
    id: org!.id,
    assignmentId: assignment!.id,
    matchId: match!.id,
    reviewStateId: reviewState!.match_id,
    conversationId: conversation!.id,
    introId: intro!.id,
    interviewId: interview!.id,
    decisionId: decision!.id,
    engagementVerificationId: engagementVerification!.id,
    orgUploadId: orgUpload!.id,
    auditLogId: auditLog!.id,
  };
}

async function createCandidateProofFixture(user: TestUser, label: string, ts: number) {
  const service = createServiceRoleClient();

  const { data: artifact, error: artifactError } = await service
    .from('proof_artifacts')
    .insert({
      owner_type: 'individual_profile',
      owner_id: user.id,
      subject_type: 'individual_profile',
      subject_id: user.id,
      artifact_kind: 'document',
      lifecycle_state: 'draft',
      title: `${label} private artifact`,
      storage_path: `${user.id}/${label}/private.pdf`,
      visibility: 'owner_only',
      reveal_gate: 'none',
      metadata: { privateSignal: `${label} artifact metadata` },
    })
    .select('id')
    .single();
  expectAuthorized(artifact, artifactError, 'setup should create proof artifact');
  remember('proof_artifacts', artifact!.id);

  const { data: pack, error: packError } = await service
    .from('proof_packs')
    .insert({
      owner_type: 'individual_profile',
      owner_id: user.id,
      pack_kind: 'profile_export',
      primary_subject_type: 'individual_profile',
      primary_subject_id: user.id,
      lifecycle_state: 'ready',
      title: `${label} private proof pack`,
      visibility: 'owner_only',
      reveal_gate: 'none',
      created_by: user.id,
      context_json: { privateContext: `${label} pack context` },
    })
    .select('id')
    .single();
  expectAuthorized(pack, packError, 'setup should create proof pack');
  remember('proof_packs', pack!.id);

  const { data: item, error: itemError } = await service
    .from('proof_pack_items')
    .insert({
      pack_id: pack!.id,
      artifact_id: artifact!.id,
      position: 1,
      item_class: 'file_upload',
      subtype_metadata: { privateSignal: `${label} proof item` },
    })
    .select('id')
    .single();
  expectAuthorized(item, itemError, 'setup should create proof pack item');
  remember('proof_pack_items', item!.id);

  const { data: upload, error: uploadError } = await service
    .from('uploaded_files')
    .insert({
      owner_type: 'individual_profile',
      owner_id: user.id,
      source_surface: 'privacy_test',
      upload_kind: 'proof',
      original_filename: `${label}-candidate-sensitive.pdf`,
      original_filename_sensitive: true,
      sanitized_filename: 'candidate-document.pdf',
      declared_mime: 'application/pdf',
      detected_mime: 'application/pdf',
      size_bytes: 128,
      sha256: `sha256-${label}-${ts}`,
      quarantine_bucket: 'user-uploads-quarantine',
      quarantine_path: `${user.id}/${label}/candidate-sensitive.pdf`,
      proof_pack_id: pack!.id,
      lifecycle_state: 'quarantined',
      safety_status: 'pending',
      safe_for_public: false,
    })
    .select('id')
    .single();
  expectAuthorized(upload, uploadError, 'setup should create upload metadata');
  remember('uploaded_files', upload!.id);

  const { data: uploadEvent, error: uploadEventError } = await service
    .from('uploaded_file_events')
    .insert({
      uploaded_file_id: upload!.id,
      event_type: 'received',
      metadata: { privateSignal: `${label} upload event` },
    })
    .select('id')
    .single();
  expectAuthorized(uploadEvent, uploadEventError, 'setup should create upload event');
  remember('uploaded_file_events', uploadEvent!.id);

  const { data: exportRecord, error: exportError } = await service
    .from('data_portability_exports')
    .insert({
      profile_id: user.id,
      requested_by: user.id,
      lifecycle_state: 'requested',
      export_format: 'json',
      payload_version: 'privacy-test',
      metadata: { privateSignal: `${label} export metadata` },
    })
    .select('id')
    .single();
  expectAuthorized(exportRecord, exportError, 'setup should create export record');
  remember('data_portability_exports', exportRecord!.id);

  return {
    proofPackId: pack!.id,
    proofItemId: item!.id,
    uploadId: upload!.id,
    exportId: exportRecord!.id,
  };
}

describe('MVP RLS and storage-metadata isolation', () => {
  beforeAll(async () => {
    const ts = Date.now();
    candidateA = await createProfiledUser('candidate-a-rls', ts);
    candidateB = await createProfiledUser('candidate-b-rls', ts);
    orgAOwner = await createProfiledUser('org-a-owner-rls', ts);
    orgAReviewer = await createProfiledUser('org-a-reviewer-rls', ts);
    orgBOwner = await createProfiledUser('org-b-owner-rls', ts);
    orgBReviewer = await createProfiledUser('org-b-reviewer-rls', ts);

    candidateAExperienceId = await createPrivateContext(candidateA, 'candidate-a');
    candidateBExperienceId = await createPrivateContext(candidateB, 'candidate-b');

    const candidateAProof = await createCandidateProofFixture(candidateA, 'candidate-a', ts);
    candidateAProofPackId = candidateAProof.proofPackId;
    candidateAProofItemId = candidateAProof.proofItemId;
    candidateAUploadId = candidateAProof.uploadId;
    candidateAExportId = candidateAProof.exportId;

    const candidateBProof = await createCandidateProofFixture(candidateB, 'candidate-b', ts);
    candidateBProofPackId = candidateBProof.proofPackId;
    candidateBProofItemId = candidateBProof.proofItemId;
    candidateBUploadId = candidateBProof.uploadId;
    candidateBExportId = candidateBProof.exportId;

    orgA = await createOrgFixture({
      ts,
      label: 'A',
      candidate: candidateA,
      owner: orgAOwner,
      reviewer: orgAReviewer,
    });
    orgB = await createOrgFixture({
      ts,
      label: 'B',
      candidate: candidateB,
      owner: orgBOwner,
      reviewer: orgBReviewer,
    });
  }, 60000);

  afterAll(async () => {
    const service = createServiceRoleClient();
    const deleteByIds = async (table: keyof typeof cleanupIds, column = 'id') => {
      const ids = cleanupIds[table];
      if (ids.length === 0) return;
      await service
        .from(table)
        .delete()
        .in(column, ids as any[]);
    };

    await deleteByIds('engagement_verifications');
    await deleteByIds('decisions');
    await deleteByIds('interviews');
    await deleteByIds('intro_workflows');
    await deleteByIds('conversations');
    await deleteByIds('reveal_events');
    await deleteByIds('match_review_states', 'match_id');
    await deleteByIds('matches');
    await deleteByIds('assignments');
    await deleteByIds('uploaded_file_events');
    await deleteByIds('uploaded_files');
    await deleteByIds('proof_pack_items');
    await deleteByIds('proof_packs');
    await deleteByIds('proof_artifacts');
    await deleteByIds('data_portability_exports');
    await deleteByIds('experiences');
    await deleteByIds('education');
    await deleteByIds('volunteering');
    await deleteByIds('audit_logs');
    await deleteByIds('organization_members');
    await deleteByIds('organizations');

    for (const user of createdUsers) {
      await service.from('individual_profiles').delete().eq('user_id', user.id);
      await service.from('profiles').delete().eq('id', user.id);
      await deleteTestUser(user.id);
    }
  }, 60000);

  test('Candidate A cannot read Candidate B private context, Proof Packs, proof items, uploads, or exports', async () => {
    const aliceClient = await createAuthenticatedClient(candidateA.email, candidateA.password);

    const ownPack = await aliceClient
      .from('proof_packs')
      .select('id, title')
      .eq('id', candidateAProofPackId)
      .single();
    expectAuthorized(ownPack.data, ownPack.error, 'candidate should read own proof pack');

    const otherPrivateProfile = await aliceClient
      .from('individual_profiles')
      .select('*')
      .eq('user_id', candidateB.id)
      .single();
    expectUnauthorized(
      otherPrivateProfile.data,
      otherPrivateProfile.error,
      'candidate should not read another private profile'
    );

    const otherExperience = await aliceClient
      .from('experiences')
      .select('*')
      .eq('id', candidateBExperienceId);
    expectEmpty(
      otherExperience.data,
      otherExperience.error,
      'candidate should not read another private experience'
    );

    const otherPack = await aliceClient
      .from('proof_packs')
      .select('*')
      .eq('id', candidateBProofPackId);
    expectUnauthorized(
      otherPack.data,
      otherPack.error,
      'candidate should not read another proof pack'
    );

    const otherItem = await aliceClient
      .from('proof_pack_items')
      .select('*')
      .eq('id', candidateBProofItemId);
    expectUnauthorized(
      otherItem.data,
      otherItem.error,
      'candidate should not read another proof item'
    );

    const otherUpload = await aliceClient
      .from('uploaded_files')
      .select('*')
      .eq('id', candidateBUploadId);
    expectUnauthorized(
      otherUpload.data,
      otherUpload.error,
      'candidate should not read another upload metadata row'
    );

    const otherExport = await aliceClient
      .from('data_portability_exports')
      .select('*')
      .eq('id', candidateBExportId);
    expectUnauthorized(
      otherExport.data,
      otherExport.error,
      'candidate should not read another export row'
    );
  });

  test('Org A cannot read Org B assignments, reviews, uploads, memberships, audit logs, or workflow records', async () => {
    const orgAClient = await createAuthenticatedClient(orgAOwner.email, orgAOwner.password);

    const ownAssignment = await orgAClient
      .from('assignments')
      .select('id, org_id')
      .eq('id', orgA.assignmentId)
      .single();
    expectAuthorized(
      ownAssignment.data,
      ownAssignment.error,
      'org owner should read own assignment'
    );

    const otherAssignment = await orgAClient
      .from('assignments')
      .select('*')
      .eq('id', orgB.assignmentId);
    expectUnauthorized(
      otherAssignment.data,
      otherAssignment.error,
      'org owner should not read another org assignment'
    );

    const otherReview = await orgAClient
      .from('match_review_states')
      .select('*')
      .eq('match_id', orgB.reviewStateId);
    expectUnauthorized(
      otherReview.data,
      otherReview.error,
      'org owner should not read another org review state'
    );

    const otherUpload = await orgAClient
      .from('uploaded_files')
      .select('*')
      .eq('id', orgB.orgUploadId);
    expectUnauthorized(
      otherUpload.data,
      otherUpload.error,
      'org owner should not read another org upload metadata'
    );

    const otherMembers = await orgAClient
      .from('organization_members')
      .select('*')
      .eq('org_id', orgB.id);
    expectUnauthorized(
      otherMembers.data,
      otherMembers.error,
      'org owner should not read another org memberships'
    );

    const otherAudit = await orgAClient.from('audit_logs').select('*').eq('id', orgB.auditLogId);
    expectUnauthorized(
      otherAudit.data,
      otherAudit.error,
      'org owner should not read another org audit log'
    );

    const otherInterview = await orgAClient
      .from('interviews')
      .select('*')
      .eq('id', orgB.interviewId);
    expectUnauthorized(
      otherInterview.data,
      otherInterview.error,
      'org owner should not read another org interview'
    );

    const otherDecision = await orgAClient.from('decisions').select('*').eq('id', orgB.decisionId);
    expectUnauthorized(
      otherDecision.data,
      otherDecision.error,
      'org owner should not read another org decision'
    );

    const otherEngagement = await orgAClient
      .from('engagement_verifications')
      .select('*')
      .eq('id', orgB.engagementVerificationId);
    expectUnauthorized(
      otherEngagement.data,
      otherEngagement.error,
      'org owner should not read another org engagement verification'
    );
  });

  test('Reviewers get only database-allowed corridor data, not private candidate or raw review/reveal rows', async () => {
    const reviewerClient = await createAuthenticatedClient(
      orgAReviewer.email,
      orgAReviewer.password
    );

    const assignment = await reviewerClient
      .from('assignments')
      .select('id, org_id, role')
      .eq('id', orgA.assignmentId)
      .single();
    expectAuthorized(assignment.data, assignment.error, 'reviewer should read own org assignment');

    const match = await reviewerClient
      .from('matches')
      .select('id, assignment_id')
      .eq('id', orgA.matchId)
      .single();
    expectAuthorized(match.data, match.error, 'reviewer should read own org match row');

    const privateProfile = await reviewerClient
      .from('individual_profiles')
      .select('*')
      .eq('user_id', candidateA.id);
    expectUnauthorized(
      privateProfile.data,
      privateProfile.error,
      'reviewer should not read candidate private profile rows directly'
    );

    const candidateUpload = await reviewerClient
      .from('uploaded_files')
      .select('*')
      .eq('id', candidateAUploadId);
    expectUnauthorized(
      candidateUpload.data,
      candidateUpload.error,
      'reviewer should not read candidate private upload metadata directly'
    );

    const reviewState = await reviewerClient
      .from('match_review_states')
      .select('*')
      .eq('match_id', orgA.reviewStateId);
    expectUnauthorized(
      reviewState.data,
      reviewState.error,
      'reviewer should not read raw review state rows directly'
    );

    const revealEvent = await reviewerClient
      .from('reveal_events')
      .select('*')
      .eq('match_id', orgA.matchId);
    expectUnauthorized(
      revealEvent.data,
      revealEvent.error,
      'reviewer should not read raw reveal event rows directly'
    );
  });

  test('Reveal requests, conversations, interviews, decisions, and engagement verifications stay scoped to participants', async () => {
    const candidateAClient = await createAuthenticatedClient(candidateA.email, candidateA.password);
    const candidateBClient = await createAuthenticatedClient(candidateB.email, candidateB.password);

    const ownConversation = await candidateAClient
      .from('conversations')
      .select('id, participant_two_wants_reveal, participant_two_reveal_requested_at')
      .eq('id', orgA.conversationId)
      .single();
    expectAuthorized(
      ownConversation.data,
      ownConversation.error,
      'candidate should read own reveal request state'
    );
    expect(ownConversation.data?.participant_two_wants_reveal).toBe(true);

    const otherConversation = await candidateBClient
      .from('conversations')
      .select('*')
      .eq('id', orgA.conversationId);
    expectUnauthorized(
      otherConversation.data,
      otherConversation.error,
      'other candidate should not read reveal request state'
    );

    const ownInterview = await candidateAClient
      .from('interviews')
      .select('id')
      .eq('id', orgA.interviewId)
      .single();
    expectAuthorized(ownInterview.data, ownInterview.error, 'candidate should read own interview');

    const otherInterview = await candidateBClient
      .from('interviews')
      .select('*')
      .eq('id', orgA.interviewId);
    expectUnauthorized(
      otherInterview.data,
      otherInterview.error,
      'other candidate should not read interview'
    );

    const ownDecision = await candidateAClient
      .from('decisions')
      .select('id, state')
      .eq('id', orgA.decisionId)
      .single();
    expectAuthorized(ownDecision.data, ownDecision.error, 'candidate should read own decision');

    const otherDecision = await candidateBClient
      .from('decisions')
      .select('*')
      .eq('id', orgA.decisionId);
    expectUnauthorized(
      otherDecision.data,
      otherDecision.error,
      'other candidate should not read decision'
    );

    const ownEngagement = await candidateAClient
      .from('engagement_verifications')
      .select('id, state')
      .eq('id', orgA.engagementVerificationId)
      .single();
    expectAuthorized(
      ownEngagement.data,
      ownEngagement.error,
      'candidate should read own engagement verification'
    );

    const otherEngagement = await candidateBClient
      .from('engagement_verifications')
      .select('*')
      .eq('id', orgA.engagementVerificationId);
    expectUnauthorized(
      otherEngagement.data,
      otherEngagement.error,
      'other candidate should not read engagement verification'
    );
  });
});
