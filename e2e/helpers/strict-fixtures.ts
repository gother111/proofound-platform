import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { loadStrictEnv } from './load-strict-env';

loadStrictEnv();

export type StrictPersona = 'individual' | 'org_member' | 'unknown';

export interface StrictRuntimeUser {
  id: string;
  email: string;
  password: string;
  persona: StrictPersona;
  displayName: string;
  handle: string | null;
}

export interface StrictRuntimeOrganization {
  id: string;
  slug: string;
  displayName: string;
}

export interface StrictRuntimeAssignment {
  id: string;
  orgId: string;
  role: string;
  status: string;
  managed: boolean;
}

export interface StrictSkillRequirement {
  id: string;
  level: number;
}

export interface StrictRuntimeMatch {
  id: string;
  assignmentId: string;
  profileId: string;
}

export interface StrictRuntimeConversation {
  id: string;
  assignmentId: string;
  matchId: string;
}

export interface StrictFixtureState {
  userIds: Set<string>;
  orgIds: Set<string>;
  assignmentIds: Set<string>;
  matchIds: Set<string>;
  conversationIds: Set<string>;
  interviewIds: Set<string>;
  contractIds: Set<string>;
  projectIds: Set<string>;
}

const DEFAULT_PASSWORD = 'TestPassword123!';
const TRANSIENT_REQUEST_ERROR_PATTERNS = [
  'socket hang up',
  'econnreset',
  'econnrefused',
  'aborted',
  'timed out',
  'timeout',
];
const REQUEST_RETRY_ATTEMPTS = Number.parseInt(
  process.env.STRICT_REQUEST_RETRY_ATTEMPTS || '5',
  10
);
const REQUEST_RETRY_DELAY_MS = Number.parseInt(
  process.env.STRICT_REQUEST_RETRY_DELAY_MS || '1000',
  10
);

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function isTransientRequestError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return TRANSIENT_REQUEST_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function withTransientRequestRetry<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const maxAttempts =
    Number.isFinite(REQUEST_RETRY_ATTEMPTS) && REQUEST_RETRY_ATTEMPTS > 0
      ? REQUEST_RETRY_ATTEMPTS
      : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const shouldRetry = attempt < maxAttempts && isTransientRequestError(error);
      if (!shouldRetry) {
        throw error;
      }

      const reason = error instanceof Error ? error.message : String(error);
      console.warn(
        `[strict-fixtures] transient ${operationName} error on attempt ${attempt}/${maxAttempts}: ${reason}`
      );
      await wait(REQUEST_RETRY_DELAY_MS * attempt);
    }
  }

  throw new Error(`Unexpected retry exhaustion for ${operationName}`);
}

function uniqueSuffix(prefix: string): string {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

function normalizeHandle(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 40);
}

function generateUniqueHandle(prefix: string): string {
  const safePrefix = normalizeHandle(prefix).replace(/^-+|-+$/g, '') || 'strict-user';
  const timePart = Date.now().toString(36);
  const uniquePart = randomUUID().slice(0, 8);
  const maxPrefixLength = Math.max(1, 40 - timePart.length - uniquePart.length - 2);
  const prefixPart = safePrefix.slice(0, maxPrefixLength);
  return `${prefixPart}-${timePart}-${uniquePart}`;
}

export function createFixtureState(): StrictFixtureState {
  return {
    userIds: new Set<string>(),
    orgIds: new Set<string>(),
    assignmentIds: new Set<string>(),
    matchIds: new Set<string>(),
    conversationIds: new Set<string>(),
    interviewIds: new Set<string>(),
    contractIds: new Set<string>(),
    projectIds: new Set<string>(),
  };
}

export function adminClient(): SupabaseClient {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRole = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function createRuntimeUser(
  fixture: StrictFixtureState,
  options: {
    persona: StrictPersona;
    prefix: string;
    displayName?: string;
    handle?: string | null;
    emailConfirmed?: boolean;
    password?: string;
  }
): Promise<StrictRuntimeUser> {
  const supabase = adminClient();
  const email = `${uniqueSuffix(options.prefix)}@test.proofound.com`;
  const password = options.password ?? DEFAULT_PASSWORD;
  const displayName = options.displayName ?? `Strict ${options.prefix}`;
  const defaultHandle =
    options.handle === undefined ? generateUniqueHandle(options.prefix) : options.handle;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: options.emailConfirmed ?? true,
    user_metadata: {
      persona: options.persona,
    },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create strict runtime user: ${error?.message ?? 'unknown error'}`);
  }

  const userId = data.user.id;
  fixture.userIds.add(userId);

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      display_name: displayName,
      handle: defaultHandle,
      persona: options.persona,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    throw new Error(`Failed to seed profile for ${email}: ${profileError.message}`);
  }

  if (options.persona === 'individual') {
    const { error: individualProfileError } = await supabase.from('individual_profiles').upsert(
      {
        user_id: userId,
        headline: 'Strict test profile',
        verification_status: 'unverified',
      },
      { onConflict: 'user_id' }
    );

    if (individualProfileError) {
      throw new Error(
        `Failed to seed individual profile for ${email}: ${individualProfileError.message}`
      );
    }
  }

  return {
    id: userId,
    email,
    password,
    persona: options.persona,
    displayName,
    handle: defaultHandle ?? null,
  };
}

export function getManagedProviderUser(): StrictRuntimeUser | null {
  const id = process.env.E2E_PROVIDER_USER_ID?.trim();
  const email = process.env.E2E_PROVIDER_USER_EMAIL?.trim();
  const password = process.env.E2E_PROVIDER_USER_PASSWORD?.trim();

  if (!id || !email || !password) {
    return null;
  }

  return {
    id,
    email,
    password,
    persona: 'individual',
    displayName: 'Strict Managed Provider User',
    handle: null,
  };
}

export async function createRuntimeOrganization(
  fixture: StrictFixtureState,
  ownerUserId: string,
  options?: {
    prefix?: string;
    displayName?: string;
    readyForPublish?: boolean;
  }
): Promise<StrictRuntimeOrganization> {
  const supabase = adminClient();
  const prefix = options?.prefix ?? 'strict-org';
  const slug = normalizeHandle(uniqueSuffix(prefix));
  const displayName = options?.displayName ?? `Strict Org ${slug.slice(-6)}`;
  const readyForPublish = options?.readyForPublish ?? true;
  const trustedWebsite = `https://${slug}.proofound-e2e.test`;

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      slug,
      display_name: displayName,
      type: 'company',
      created_by: ownerUserId,
      mission: readyForPublish
        ? 'Run a narrow, proof-first hiring corridor with explicit reveal consent.'
        : null,
      tagline: readyForPublish
        ? 'We review candidates through proof quality, outcomes, and clear ownership.'
        : null,
      working_context: readyForPublish
        ? 'Small launch team with tight async review loops and explicit privacy boundaries.'
        : null,
      website: readyForPublish ? trustedWebsite : null,
      website_verified_at: readyForPublish ? new Date().toISOString() : null,
      trust_status: readyForPublish ? 'platform_reviewed' : 'unverified',
      org_trust_tier: readyForPublish ? 'reviewed' : 'unreviewed',
      org_readiness: readyForPublish ? 'org_ready' : 'draft',
      verified: readyForPublish,
    })
    .select('id, slug, display_name')
    .single();

  if (orgError || !org) {
    throw new Error(
      `Failed to create strict runtime organization: ${orgError?.message ?? 'unknown error'}`
    );
  }

  fixture.orgIds.add(org.id);

  const { error: memberError } = await supabase.from('organization_members').insert({
    org_id: org.id,
    user_id: ownerUserId,
    role: 'org_owner',
    state: 'active',
  });

  if (memberError) {
    throw new Error(`Failed to create organization membership: ${memberError.message}`);
  }

  return {
    id: org.id,
    slug: org.slug,
    displayName: org.display_name,
  };
}

export async function createRuntimeAssignment(
  fixture: StrictFixtureState,
  orgId: string,
  options?: {
    role?: string;
    status?: 'draft' | 'active' | 'paused' | 'closed';
    mustHaveSkills?: StrictSkillRequirement[];
  }
): Promise<StrictRuntimeAssignment> {
  const supabase = adminClient();
  const role = options?.role ?? `Strict Assignment ${uniqueSuffix('role').slice(-6)}`;
  const status = options?.status ?? 'active';

  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .insert({
      org_id: orgId,
      role,
      description: 'Strict contract assignment',
      status,
      values_required: [],
      cause_tags: [],
      must_have_skills: options?.mustHaveSkills ?? [],
      nice_to_have_skills: [],
      location_mode: 'remote',
      country: 'US',
      comp_min: 90000,
      comp_max: 130000,
      currency: 'USD',
    })
    .select('id, org_id, role, status')
    .single();

  if (!assignmentError && assignment) {
    fixture.assignmentIds.add(assignment.id);
    return {
      id: assignment.id,
      orgId: assignment.org_id,
      role: assignment.role,
      status: assignment.status,
      managed: true,
    };
  }

  const fallbackIsSchemaDrift =
    assignmentError?.message?.toLowerCase().includes('created_by') ||
    assignmentError?.message?.toLowerCase().includes('record "new" has no field');

  if (!fallbackIsSchemaDrift) {
    throw new Error(
      `Failed to create strict runtime assignment: ${assignmentError?.message ?? 'unknown error'}`
    );
  }

  const { data: fallbackAssignment, error: fallbackError } = await supabase
    .from('assignments')
    .select('id, org_id, role, status')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (fallbackError || !fallbackAssignment) {
    throw new Error(
      `Failed to create strict runtime assignment and no fallback assignment was available: ${assignmentError?.message ?? 'unknown error'}`
    );
  }

  console.warn(
    `[strict-fixtures] using fallback assignment ${fallbackAssignment.id} due schema-trigger drift: ${assignmentError?.message}`
  );

  return {
    id: fallbackAssignment.id,
    orgId: fallbackAssignment.org_id,
    role: fallbackAssignment.role,
    status: fallbackAssignment.status,
    managed: false,
  };
}

export async function createRuntimeMatch(
  fixture: StrictFixtureState,
  assignmentId: string,
  profileId: string
): Promise<StrictRuntimeMatch> {
  const supabase = adminClient();
  const { data: assignmentRecord, error: assignmentLookupError } = await supabase
    .from('assignments')
    .select('org_id')
    .eq('id', assignmentId)
    .single();

  if (assignmentLookupError || !assignmentRecord?.org_id) {
    throw new Error(
      `Failed to resolve strict runtime assignment org: ${assignmentLookupError?.message ?? 'unknown error'}`
    );
  }

  const matchPayload = {
    assignment_id: assignmentId,
    profile_id: profileId,
    score: '0.82',
    vector: {
      subscores: {
        skills: 0.9,
        values: 0.8,
        location: 1,
      },
      contributions: {
        skills: 0.4,
        values: 0.3,
        location: 0.3,
      },
      gaps: [],
      missing: [],
    },
    weights: {
      mission: 0.25,
      expertise: 0.35,
      tools: 0.1,
      logistics: 0.2,
      recency: 0.1,
    },
  };

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .upsert(matchPayload, { onConflict: 'assignment_id,profile_id' })
    .select('id, assignment_id, profile_id')
    .single();

  if (matchError || !match) {
    throw new Error(
      `Failed to create strict runtime match: ${matchError?.message ?? 'unknown error'}`
    );
  }

  let persistedMatch: {
    id: string;
    assignment_id: string;
    profile_id: string;
  } | null = match;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data: lookup, error: lookupError } = await supabase
      .from('matches')
      .select('id, assignment_id, profile_id')
      .eq('id', match.id)
      .maybeSingle();

    if (lookup?.id) {
      persistedMatch = lookup;
      break;
    }

    if (lookupError && !isTransientRequestError(lookupError)) {
      throw new Error(`Failed to verify strict runtime match persistence: ${lookupError.message}`);
    }

    await wait(250 * (attempt + 1));
  }

  if (!persistedMatch?.id) {
    throw new Error(`Strict runtime match ${match.id} was not visible after creation`);
  }

  fixture.matchIds.add(match.id);

  let reviewStateError: { message: string } | null = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = await supabase.from('match_review_states').upsert(
      {
        match_id: persistedMatch.id,
        assignment_id: persistedMatch.assignment_id,
        profile_id: persistedMatch.profile_id,
        org_id: assignmentRecord.org_id,
        review_stage: 'blind_review',
        reveal_scope: 'blind',
      },
      { onConflict: 'match_id' }
    );

    reviewStateError = result.error;
    if (!reviewStateError) {
      break;
    }

    const isMatchVisibilityRace = reviewStateError.message.includes(
      'match_review_states_match_id_fkey'
    );
    if (!isMatchVisibilityRace || attempt === 29) {
      break;
    }

    const { data: refreshedMatch, error: refreshedMatchError } = await supabase
      .from('matches')
      .select('id, assignment_id, profile_id')
      .eq('assignment_id', assignmentId)
      .eq('profile_id', profileId)
      .maybeSingle();

    if (refreshedMatchError && !isTransientRequestError(refreshedMatchError)) {
      throw new Error(
        `Failed to refresh strict runtime match before review-state retry: ${refreshedMatchError.message}`
      );
    }

    if (refreshedMatch?.id) {
      persistedMatch = refreshedMatch;
      fixture.matchIds.add(refreshedMatch.id);
    } else {
      const { data: recreatedMatch, error: recreatedMatchError } = await supabase
        .from('matches')
        .upsert(matchPayload, { onConflict: 'assignment_id,profile_id' })
        .select('id, assignment_id, profile_id')
        .single();

      if (recreatedMatchError || !recreatedMatch?.id) {
        throw new Error(
          `Failed to recreate strict runtime match before review-state retry: ${recreatedMatchError?.message ?? 'unknown error'}`
        );
      }

      persistedMatch = recreatedMatch;
      fixture.matchIds.add(recreatedMatch.id);
    }

    await wait(250 * (attempt + 1));
  }

  if (reviewStateError) {
    throw new Error(
      `Failed to seed strict runtime match review state: ${reviewStateError.message}`
    );
  }

  return {
    id: persistedMatch.id,
    assignmentId: persistedMatch.assignment_id,
    profileId: persistedMatch.profile_id,
  };
}

export async function seedPortfolioReadyCandidate(
  user: StrictRuntimeUser,
  options?: {
    skillRequirements?: StrictSkillRequirement[];
    verifierProfileId?: string;
  }
): Promise<{ skillRequirements: StrictSkillRequirement[] }> {
  const supabase = adminClient();
  const nowIso = new Date().toISOString();
  let skillRequirements = options?.skillRequirements;
  if (!skillRequirements) {
    const { data: taxonomyRows, error: taxonomyError } = await supabase
      .from('skills_taxonomy')
      .select('code')
      .eq('status', 'active')
      .order('code', { ascending: true })
      .limit(3);

    if (taxonomyError) {
      throw new Error(
        `Failed to load strict candidate skill taxonomy defaults: ${taxonomyError.message}`
      );
    }

    if (!taxonomyRows || taxonomyRows.length < 3) {
      throw new Error('Failed to load strict candidate skill taxonomy defaults: insufficient rows');
    }

    skillRequirements = taxonomyRows.map((row, index) => ({
      id: row.code,
      level: index < 2 ? 3 : 2,
    }));
  }

  const { data: experienceRow, error: experienceError } = await supabase
    .from('experiences')
    .insert({
      user_id: user.id,
      title: 'Strict matching context',
      organization_name: 'Strict Candidate Org',
      organization_type: 'company',
      org_description: 'A seeded context to verify the MVP shortlist corridor.',
      duration: '2024-2026',
      start_date: '2024-01-01',
      outcomes: 'Built proof-backed systems and operational launch artifacts.',
      projects: 'Owned proof-first onboarding and trust workflows.',
      measured_outcomes: [],
      project_entries: [],
      colleagues: 'Worked closely with cross-functional reviewers.',
      achievements: 'Shipped a verified proof portfolio used in strict tests.',
      verified: true,
    })
    .select('id')
    .single();

  if (experienceError || !experienceRow?.id) {
    throw new Error(
      `Failed to seed strict candidate experience context: ${experienceError?.message ?? 'unknown error'}`
    );
  }

  const { error: matchingProfileError } = await supabase.from('matching_profiles').upsert(
    {
      profile_id: user.id,
      timezone: 'Europe/Stockholm',
      desired_roles: ['Proof Systems Lead'],
      work_mode: 'remote',
      engagement_type: 'contract_consulting',
      country: 'SE',
      city: 'Stockholm',
      availability_earliest: '2026-04-01',
      availability_latest: '2026-06-01',
      comp_min: 90000,
      comp_max: 130000,
      currency: 'USD',
      values_tags: ['integrity'],
      cause_tags: ['education'],
    },
    { onConflict: 'profile_id' }
  );

  if (matchingProfileError) {
    throw new Error(
      `Failed to seed strict candidate matching profile: ${matchingProfileError.message}`
    );
  }

  const { data: skillRows, error: skillError } = await supabase
    .from('skills')
    .insert(
      skillRequirements.map((requirement, index) => ({
        profile_id: user.id,
        skill_id: requirement.id,
        skill_code: requirement.id,
        level: requirement.level,
        months_experience: 24 + index * 6,
        evidence_strength: '0.9',
        recency_multiplier: '1.0',
        impact_score: '0.8',
        last_used_at: nowIso,
        relevance: 'current',
      }))
    )
    .select('id, skill_id');

  if (skillError || !skillRows || skillRows.length !== skillRequirements.length) {
    throw new Error(
      `Failed to seed strict candidate skills: ${skillError?.message ?? 'unknown error'}`
    );
  }

  const { data: insertedArtifacts, error: artifactError } = await supabase
    .from('proof_artifacts')
    .insert(
      skillRows.map((skillRow, index) => ({
        owner_type: 'individual_profile',
        owner_id: user.id,
        subject_type: 'skill',
        subject_id: skillRow.id,
        artifact_kind: 'link',
        lifecycle_state: 'active',
        title: `Strict proof artifact ${index + 1}`,
        description: 'Seeded proof artifact for strict shortlist verification.',
        source_url: `https://example.com/strict-proof-${index + 1}`,
        activated_at: nowIso,
        issued_at: nowIso,
        visibility: 'public',
        reveal_gate: 'none',
        metadata: {
          imported_from: 'strict_fixture',
          proof_scope: 'mvp_verification_rerun',
          skill_key: skillRow.skill_id,
        },
        created_at: nowIso,
        updated_at: nowIso,
      }))
    )
    .select('id');

  if (
    artifactError ||
    !insertedArtifacts ||
    insertedArtifacts.length !== skillRequirements.length
  ) {
    throw new Error(
      `Failed to seed strict candidate proof artifacts: ${artifactError?.message ?? 'unknown error'}`
    );
  }

  const packId = randomUUID();
  const { error: proofPackError } = await supabase.from('proof_packs').insert({
    id: packId,
    owner_type: 'individual_profile',
    owner_id: user.id,
    pack_kind: 'verification_bundle',
    primary_subject_type: 'experience',
    primary_subject_id: experienceRow.id,
    lifecycle_state: 'published',
    title: 'Strict seeded Proof Pack',
    summary: 'Anchored proof pack used to verify shortlist and privacy gates.',
    context_json: {
      importedFrom: 'strict_fixture',
      contextType: 'experience',
      contextId: experienceRow.id,
    },
    evidence_summary: 'Three recent skill-linked proof artifacts.',
    outcomes_summary: 'Portfolio-ready candidate seed for strict org lifecycle verification.',
    visibility: 'public',
    reveal_gate: 'none',
    created_by: user.id,
    verification_status: options?.verifierProfileId ? 'verified' : 'unverified',
    freshness_state: 'fresh',
    freshness_evaluated_at: nowIso,
    last_verified_at: options?.verifierProfileId ? nowIso : null,
    last_refreshed_at: nowIso,
    portability_meta: {
      completenessState: 'context_anchored',
      importedFrom: 'strict_fixture',
    },
    metadata: {
      imported_from: 'strict_fixture',
      candidate_evidence: true,
      public_signal: true,
    },
    published_at: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  });

  if (proofPackError) {
    throw new Error(`Failed to seed strict candidate proof pack: ${proofPackError.message}`);
  }

  const { error: proofPackItemError } = await supabase.from('proof_pack_items').insert(
    insertedArtifacts.map((artifact, index) => ({
      pack_id: packId,
      artifact_id: artifact.id,
      position: index,
      included_fields: ['title', 'description', 'sourceUrl', 'issuedAt'],
      created_at: nowIso,
      updated_at: nowIso,
    }))
  );

  if (proofPackItemError) {
    throw new Error(
      `Failed to seed strict candidate proof pack items: ${proofPackItemError.message}`
    );
  }

  if (options?.verifierProfileId) {
    const { error: verificationError } = await supabase.from('verification_records').insert({
      owner_type: 'individual_profile',
      owner_id: user.id,
      subject_type: 'skill',
      subject_id: skillRows[0]?.id,
      proof_artifact_id: insertedArtifacts[0]?.id ?? null,
      verification_slot: 'skill.attestation',
      verification_kind: 'skill_attestation_manager',
      status: 'verified',
      verifier_principal_type: 'user_account',
      verifier_class: 'authenticated_manager',
      verifier_profile_id: options.verifierProfileId,
      integrity_status: 'clear',
      dispute_state: 'none',
      requested_at: nowIso,
      completed_at: nowIso,
      verified_at: nowIso,
      metadata: {
        imported_from: 'strict_fixture',
      },
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (verificationError) {
      throw new Error(
        `Failed to seed strict candidate verification record: ${verificationError.message}`
      );
    }
  }

  const { error: consentError } = await supabase.from('consent_obligations').upsert(
    {
      profile_id: user.id,
      consent_type: 'ml_matching',
      state: 'active',
      metadata: {
        imported_from: 'strict_fixture',
      },
    },
    { onConflict: 'profile_id,consent_type' }
  );

  if (consentError) {
    throw new Error(
      `Failed to seed strict candidate matching consent obligation: ${consentError.message}`
    );
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      public_portfolio_state: 'public_noindex',
      updated_at: nowIso,
    })
    .eq('id', user.id);

  if (profileError) {
    throw new Error(`Failed to update strict candidate profile shell: ${profileError.message}`);
  }

  const { error: publicationError } = await supabase.from('portfolio_publication_states').upsert(
    {
      subject_type: 'individual_profile',
      subject_id: user.id,
      requested_state: 'public_noindex',
      effective_state: 'public_noindex',
      publication_state: 'public_noindex',
      indexing_state: 'noindex',
      robots_state: 'noindex_nofollow',
      sitemap_state: 'excluded',
      reason_codes: [],
      metadata: {
        imported_from: 'strict_fixture',
      },
      last_computed_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: 'subject_type,subject_id' }
  );

  if (publicationError) {
    throw new Error(
      `Failed to seed strict candidate portfolio publication state: ${publicationError.message}`
    );
  }

  return { skillRequirements };
}

export async function createRuntimeConversation(
  fixture: StrictFixtureState,
  matchId: string,
  assignmentId: string,
  participantOneId: string,
  participantTwoId: string
): Promise<StrictRuntimeConversation> {
  const supabase = adminClient();

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .insert({
      match_id: matchId,
      assignment_id: assignmentId,
      participant_one_id: participantOneId,
      participant_two_id: participantTwoId,
      stage: 'masked',
      masked_handle_one: `Candidate #${randomUUID().slice(0, 6).toUpperCase()}`,
      masked_handle_two: `Organization #${randomUUID().slice(0, 6).toUpperCase()}`,
      last_message_at: new Date().toISOString(),
    })
    .select('id, assignment_id, match_id')
    .single();

  if (conversationError || !conversation) {
    throw new Error(
      `Failed to create strict runtime conversation: ${conversationError?.message ?? 'unknown error'}`
    );
  }

  fixture.conversationIds.add(conversation.id);

  return {
    id: conversation.id,
    assignmentId: conversation.assignment_id,
    matchId: conversation.match_id,
  };
}

export async function loginWithUi(page: Page, user: StrictRuntimeUser): Promise<void> {
  const emailField = page.getByTestId('login-email');
  const passwordField = page.getByTestId('login-password');
  const submitButton = page.getByTestId('login-submit');

  const attemptLogin = async () => {
    await page.goto('/login');
    await expect(emailField).toBeVisible({ timeout: 30000 });
    await expect(emailField).toBeEditable({ timeout: 30000 });
    await expect(passwordField).toBeVisible({ timeout: 30000 });
    await expect(passwordField).toBeEditable({ timeout: 30000 });
    await emailField.fill(user.email);
    await passwordField.fill(user.password);
    await submitButton.click();
  };

  try {
    await attemptLogin();
    await page.waitForURL(/\/(app|onboarding)(\/|$)/, { timeout: 45000 });
  } catch {
    // Retry from a clean login navigation when the form hydrates slowly or loses editability.
    await attemptLogin();
    await page.waitForURL(/\/(app|onboarding)(\/|$)/, { timeout: 30000 });
  }
}

export async function gotoWithReadyState(
  page: Page,
  path: string,
  assertReady: () => Promise<void>,
  options?: {
    attempts?: number;
    retryDelayMs?: number;
  }
): Promise<void> {
  const attempts =
    Number.isFinite(options?.attempts) && (options?.attempts ?? 0) > 0 ? options!.attempts! : 3;
  const retryDelayMs =
    Number.isFinite(options?.retryDelayMs) && (options?.retryDelayMs ?? 0) >= 0
      ? options!.retryDelayMs!
      : 1000;

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await page.goto(path);

    try {
      await assertReady();
      return;
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        throw error;
      }

      const appErrorVisible = await page
        .getByRole('heading', { name: 'Something went wrong' })
        .isVisible()
        .catch(() => false);

      console.warn(
        `[strict-fixtures] retrying ${path} after failed readiness check on attempt ${attempt}/${attempts}${appErrorVisible ? ' (app error boundary visible)' : ''}`
      );

      if (appErrorVisible) {
        const retryButton = page.getByRole('button', { name: 'Try again' });
        if (await retryButton.isVisible().catch(() => false)) {
          await retryButton.click().catch(() => null);
        }
      }

      await page.waitForTimeout(retryDelayMs * attempt);
    }
  }

  throw lastError ?? new Error(`Failed to load ${path}`);
}

export async function getCsrfToken(request: APIRequestContext): Promise<string> {
  const response = await request.get(`/api/csrf-token?ts=${Date.now()}`, {
    headers: {
      'cache-control': 'no-store',
      pragma: 'no-cache',
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to fetch CSRF token: HTTP ${response.status()}`);
  }

  const payload = (await response.json()) as { token?: string };
  if (!payload.token) {
    throw new Error('CSRF token response did not include token');
  }
  return payload.token;
}

export async function apiPostJson(
  request: APIRequestContext,
  url: string,
  data: unknown,
  options?: {
    timeoutMs?: number;
  }
) {
  const csrfToken = await getCsrfToken(request);
  return request.post(url, {
    data,
    headers: {
      'x-csrf-token': csrfToken,
    },
    // Avoid retrying mutating requests after client-side timeouts.
    timeout: options?.timeoutMs ?? 120_000,
  });
}

export async function apiPutJson(request: APIRequestContext, url: string, data: unknown) {
  return withTransientRequestRetry(`PUT ${url}`, async () => {
    const csrfToken = await getCsrfToken(request);
    return request.put(url, {
      data,
      headers: {
        'x-csrf-token': csrfToken,
      },
    });
  });
}

export async function apiDeleteJson(request: APIRequestContext, url: string, data?: unknown) {
  return withTransientRequestRetry(`DELETE ${url}`, async () => {
    const csrfToken = await getCsrfToken(request);
    return request.delete(url, {
      data,
      headers: {
        'x-csrf-token': csrfToken,
      },
    });
  });
}

export async function cleanupFixtureData(fixture: StrictFixtureState): Promise<void> {
  const supabase = adminClient();
  const managedProviderUserId = process.env.E2E_PROVIDER_USER_ID?.trim();

  const deleteByIds = async (table: string, idColumn: string, ids: string[]) => {
    if (ids.length === 0) {
      return;
    }
    const { error } = await supabase.from(table).delete().in(idColumn, ids);
    if (error) {
      console.warn(`[strict-fixtures] failed to clean ${table}: ${error.message}`);
    }
  };

  await deleteByIds('conversations', 'id', [...fixture.conversationIds]);
  await deleteByIds('interviews', 'id', [...fixture.interviewIds]);
  await deleteByIds('contracts', 'id', [...fixture.contractIds]);
  await deleteByIds('projects', 'id', [...fixture.projectIds]);
  await deleteByIds('matches', 'id', [...fixture.matchIds]);
  await deleteByIds('assignments', 'id', [...fixture.assignmentIds]);
  await deleteByIds('organizations', 'id', [...fixture.orgIds]);

  const fixtureUserIds = [...fixture.userIds].filter(
    (userId) => !managedProviderUserId || userId !== managedProviderUserId
  );
  if (fixtureUserIds.length > 0) {
    const { error: publicationError } = await supabase
      .from('portfolio_publication_states')
      .delete()
      .eq('subject_type', 'individual_profile')
      .in('subject_id', fixtureUserIds);
    if (publicationError) {
      console.warn(
        `[strict-fixtures] failed to clean portfolio_publication_states: ${publicationError.message}`
      );
    }

    const { error: verificationError } = await supabase
      .from('verification_records')
      .delete()
      .eq('owner_type', 'individual_profile')
      .in('owner_id', fixtureUserIds);
    if (verificationError) {
      console.warn(
        `[strict-fixtures] failed to clean verification_records: ${verificationError.message}`
      );
    }

    const { error: proofPackError } = await supabase
      .from('proof_packs')
      .delete()
      .eq('owner_type', 'individual_profile')
      .in('owner_id', fixtureUserIds);
    if (proofPackError) {
      console.warn(`[strict-fixtures] failed to clean proof_packs: ${proofPackError.message}`);
    }

    const { error: artifactError } = await supabase
      .from('proof_artifacts')
      .delete()
      .eq('owner_type', 'individual_profile')
      .in('owner_id', fixtureUserIds);
    if (artifactError) {
      console.warn(`[strict-fixtures] failed to clean proof_artifacts: ${artifactError.message}`);
    }

    const { error: consentError } = await supabase
      .from('consent_obligations')
      .delete()
      .in('profile_id', fixtureUserIds);
    if (consentError) {
      console.warn(
        `[strict-fixtures] failed to clean consent_obligations: ${consentError.message}`
      );
    }
  }

  for (const userId of fixture.userIds) {
    if (managedProviderUserId && userId === managedProviderUserId) {
      continue;
    }
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.warn(`[strict-fixtures] failed to delete auth user ${userId}: ${error.message}`);
    }
  }

  await deleteByIds('profiles', 'id', fixtureUserIds);
}
