import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { VerificationsClient } from './VerificationsClient';

export const dynamic = 'force-dynamic';

export default async function VerificationsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get user's email
  const { data: authUser } = await supabase.auth.getUser();
  const userEmail = authUser.user?.email?.toLowerCase() || '';

  const verificationSelect = `
    id,
    skill_id,
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

  if (incomingResult.error) {
    console.error('Failed to load incoming verification requests:', incomingResult.error);
  }
  if (sentResult.error) {
    console.error('Failed to load sent verification requests:', sentResult.error);
  }

  return (
    <VerificationsClient
      incomingRequests={(incomingResult.data || []) as any}
      sentRequests={(sentResult.data || []) as any}
      userEmail={userEmail}
    />
  );
}
