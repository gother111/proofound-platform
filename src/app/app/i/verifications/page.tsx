import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { VerificationsClient } from './VerificationsClient';
import { normalizeEmail } from '@/lib/verification/integrity';

export const dynamic = 'force-dynamic';

type SkillVerificationRecord = {
  id: string;
  skill_id: string;
  custom_request_id?: string | null;
  requester_profile_id: string;
  verifier_email: string;
  verifier_source: 'peer' | 'manager' | 'external';
  message?: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  responded_at?: string | null;
  response_message?: string | null;
  expires_at?: string | null;
  skills?: {
    id: string;
    competency_level: number;
    name_i18n?: unknown;
    skills_taxonomy?: {
      name_i18n?: unknown;
      skills_l3?: {
        name_i18n?: unknown;
        skills_subcategories?: {
          name_i18n?: unknown;
          skills_categories?: {
            name_i18n?: unknown;
          };
        };
      };
    };
  };
  profiles?: {
    id: string;
    display_name?: string | null;
    handle?: string | null;
    avatar_url?: string | null;
  };
};

type ImpactVerificationRecord = {
  id: string;
  impact_story_id: string;
  requester_profile_id: string;
  verifier_email: string;
  verifier_name?: string | null;
  verifier_relationship?: string | null;
  message?: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'failed';
  created_at: string;
  responded_at?: string | null;
  response_message?: string | null;
  expires_at?: string | null;
  impact_stories?: {
    id?: string;
    title?: string | null;
  } | null;
  profiles?: {
    id: string;
    display_name?: string | null;
    handle?: string | null;
    avatar_url?: string | null;
  } | null;
};

type UnifiedVerificationRecord = {
  request_type: 'skill' | 'impact_story';
  id: string;
  skill_id?: string;
  custom_request_id?: string | null;
  impact_story_id?: string;
  impact_story_title?: string | null;
  requester_profile_id: string;
  verifier_email: string;
  verifier_source?: 'peer' | 'manager' | 'external';
  verifier_name?: string | null;
  verifier_relationship?: string | null;
  message?: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'failed';
  created_at: string;
  responded_at?: string | null;
  response_message?: string | null;
  expires_at?: string | null;
  skills?: SkillVerificationRecord['skills'];
  profiles?: SkillVerificationRecord['profiles'];
};

function mapSkillRequestToUnified(request: SkillVerificationRecord): UnifiedVerificationRecord {
  return {
    request_type: 'skill',
    id: request.id,
    skill_id: request.skill_id,
    custom_request_id: request.custom_request_id || null,
    requester_profile_id: request.requester_profile_id,
    verifier_email: request.verifier_email,
    verifier_source: request.verifier_source,
    message: request.message || null,
    status: request.status,
    created_at: request.created_at,
    responded_at: request.responded_at || null,
    response_message: request.response_message || null,
    expires_at: request.expires_at || null,
    skills: request.skills,
    profiles: request.profiles,
  };
}

function mapImpactRequestToUnified(request: ImpactVerificationRecord): UnifiedVerificationRecord {
  return {
    request_type: 'impact_story',
    id: request.id,
    impact_story_id: request.impact_story_id,
    impact_story_title: request.impact_stories?.title || null,
    requester_profile_id: request.requester_profile_id,
    verifier_email: request.verifier_email,
    verifier_name: request.verifier_name || null,
    verifier_relationship: request.verifier_relationship || null,
    message: request.message || null,
    status: request.status,
    created_at: request.created_at,
    responded_at: request.responded_at || null,
    response_message: request.response_message || null,
    expires_at: request.expires_at || null,
    profiles: request.profiles || undefined,
  };
}

function toSkillVerificationRecords(rows: unknown): SkillVerificationRecord[] {
  return Array.isArray(rows) ? (rows as unknown as SkillVerificationRecord[]) : [];
}

function toImpactVerificationRecords(rows: unknown): ImpactVerificationRecord[] {
  return Array.isArray(rows) ? (rows as unknown as ImpactVerificationRecord[]) : [];
}

export default async function VerificationsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get user's email
  const { data: authUser } = await supabase.auth.getUser();
  const userEmail = normalizeEmail(authUser.user?.email || null) || '';

  const verificationSelect = `
    id,
    skill_id,
    custom_request_id,
    requester_profile_id,
    verifier_email,
    verifier_source,
    message,
    status,
    created_at,
    responded_at,
    response_message,
    expires_at,
    skills:skill_id (
      id,
      competency_level,
      name_i18n,
      skills_taxonomy (
        id,
        name_i18n,
        skills_l3 (
          id,
          name_i18n,
          skills_subcategories (
            id,
            name_i18n,
            skills_categories (
              id,
              name_i18n
            )
          )
        )
      )
    ),
    profiles:requester_profile_id (
      id,
      display_name,
      handle,
      avatar_url
    )
  `;

  const [incomingResult, sentResult] = await Promise.all([
    userEmail
      ? supabase
          .from('skill_verification_requests')
          .select(verificationSelect)
          .eq('verifier_email', userEmail)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null } as const),
    supabase
      .from('skill_verification_requests')
      .select(verificationSelect)
      .eq('requester_profile_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  const sentImpactResult = await supabase
    .from('impact_story_verification_requests')
    .select(
      `
        id,
        impact_story_id,
        requester_profile_id,
        verifier_email,
        verifier_name,
        verifier_relationship,
        message,
        status,
        created_at,
        responded_at,
        response_message,
        expires_at,
        impact_stories:impact_story_id (
          id,
          title
        )
      `
    )
    .eq('requester_profile_id', user.id)
    .order('created_at', { ascending: false });

  let incomingImpactResult: { data: unknown[] | null; error: unknown | null } = {
    data: [],
    error: null,
  };
  if (userEmail) {
    try {
      const adminClient = createAdminClient();
      const adminResult = await adminClient
        .from('impact_story_verification_requests')
        .select(
          `
            id,
            impact_story_id,
            requester_profile_id,
            verifier_email,
            verifier_name,
            verifier_relationship,
            message,
            status,
            created_at,
            responded_at,
            response_message,
            expires_at,
            impact_stories:impact_story_id (
              id,
              title
            ),
            profiles:requester_profile_id (
              id,
              display_name,
              handle,
              avatar_url
            )
          `
        )
        .eq('verifier_email', userEmail)
        .order('created_at', { ascending: false });

      incomingImpactResult = {
        data: adminResult.data as unknown[] | null,
        error: adminResult.error as unknown,
      };
    } catch (error) {
      incomingImpactResult = { data: null, error };
    }
  }

  if (incomingResult.error) {
    console.error('Failed to load incoming verification requests:', incomingResult.error);
  }
  if (sentResult.error) {
    console.error('Failed to load sent verification requests:', sentResult.error);
  }
  if (sentImpactResult.error) {
    console.error('Failed to load sent impact verification requests:', sentImpactResult.error);
  }
  if (incomingImpactResult.error) {
    console.error(
      'Failed to load incoming impact verification requests:',
      incomingImpactResult.error
    );
  }

  const incomingSkillRequests = toSkillVerificationRecords(incomingResult.data);
  const incomingImpactRequests = toImpactVerificationRecords(incomingImpactResult.data);
  const sentSkillRequests = toSkillVerificationRecords(sentResult.data);
  const sentImpactRequests = toImpactVerificationRecords(sentImpactResult.data);

  const incomingRequests: UnifiedVerificationRecord[] = [
    ...incomingSkillRequests.map(mapSkillRequestToUnified),
    ...incomingImpactRequests.map(mapImpactRequestToUnified),
  ].sort((left, right) => {
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });

  const sentRequests: UnifiedVerificationRecord[] = [
    ...sentSkillRequests.map(mapSkillRequestToUnified),
    ...sentImpactRequests.map(mapImpactRequestToUnified),
  ].sort((left, right) => {
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });

  return (
    <VerificationsClient
      incomingRequests={incomingRequests}
      sentRequests={sentRequests}
      userEmail={userEmail}
    />
  );
}
