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

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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
    options.handle === undefined ? normalizeHandle(uniqueSuffix(options.prefix)) : options.handle;

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
  }
): Promise<StrictRuntimeOrganization> {
  const supabase = adminClient();
  const prefix = options?.prefix ?? 'strict-org';
  const slug = normalizeHandle(uniqueSuffix(prefix));
  const displayName = options?.displayName ?? `Strict Org ${slug.slice(-6)}`;

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      slug,
      display_name: displayName,
      type: 'company',
      created_by: ownerUserId,
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
    role: 'owner',
    status: 'active',
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
      must_have_skills: [],
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
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .upsert(
      {
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
      },
      { onConflict: 'assignment_id,profile_id' }
    )
    .select('id, assignment_id, profile_id')
    .single();

  if (matchError || !match) {
    throw new Error(
      `Failed to create strict runtime match: ${matchError?.message ?? 'unknown error'}`
    );
  }

  fixture.matchIds.add(match.id);

  return {
    id: match.id,
    assignmentId: match.assignment_id,
    profileId: match.profile_id,
  };
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
  await page.goto('/login');
  await expect(page.getByTestId('login-email')).toBeVisible();
  await page.getByTestId('login-email').fill(user.email);
  await page.getByTestId('login-password').fill(user.password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(/\/(app|onboarding)(\/|$)/, { timeout: 45000 });
}

export async function getCsrfToken(request: APIRequestContext): Promise<string> {
  const response = await request.get('/api/csrf-token');
  if (!response.ok()) {
    throw new Error(`Failed to fetch CSRF token: HTTP ${response.status()}`);
  }

  const payload = (await response.json()) as { token?: string };
  if (!payload.token) {
    throw new Error('CSRF token response did not include token');
  }
  return payload.token;
}

export async function apiPostJson(request: APIRequestContext, url: string, data: unknown) {
  const csrfToken = await getCsrfToken(request);
  return request.post(url, {
    data,
    headers: {
      'x-csrf-token': csrfToken,
    },
  });
}

export async function apiPutJson(request: APIRequestContext, url: string, data: unknown) {
  const csrfToken = await getCsrfToken(request);
  return request.put(url, {
    data,
    headers: {
      'x-csrf-token': csrfToken,
    },
  });
}

export async function apiDeleteJson(request: APIRequestContext, url: string, data?: unknown) {
  const csrfToken = await getCsrfToken(request);
  return request.delete(url, {
    data,
    headers: {
      'x-csrf-token': csrfToken,
    },
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

  for (const userId of fixture.userIds) {
    if (managedProviderUserId && userId === managedProviderUserId) {
      continue;
    }
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.warn(`[strict-fixtures] failed to delete auth user ${userId}: ${error.message}`);
    }
  }
}
