import { createServerClient } from '@/lib/supabase/server';

export type OrgProfileRecord = {
  id: string;
  slug: string;
  display_name: string;
  logo_url: string | null;
  tagline: string | null;
  size: string | null;
  industry: string | null;
  founded_date: string | null;
  legal_form: string | null;
  locations: unknown;
  mission: string | null;
  vision: string | null;
  core_values: unknown;
  causes: string[] | null;
  verifications: unknown;
  impact_pipeline: unknown;
  commitments?: unknown;
  website_url: string | null;
  social_urls: unknown;
};

export type OrgMembershipRecord = {
  status: string;
  role: string;
};

export async function getOrgBySlug(slug: string): Promise<OrgProfileRecord | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('organizations')
    .select(
      `
        id,
        slug,
        display_name,
        logo_url,
        tagline,
        size,
        industry,
        founded_date,
        legal_form,
        locations,
        mission,
        vision,
        core_values,
        causes,
        verifications,
        impact_pipeline,
        commitments,
        website_url,
        social_urls
      `
    )
    .eq('slug', slug)
    .maybeSingle<OrgProfileRecord>();

  if (error) {
    console.error('[getOrgBySlug] failed', { slug, error });
    return null;
  }

  if (!data) {
    return null;
  }

  return data;
}

export async function getViewerOrgMembership(
  orgId: string,
  userId: string
): Promise<OrgMembershipRecord | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('organization_members')
    .select('status, role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle<OrgMembershipRecord>();

  if (error) {
    console.error('[getViewerOrgMembership] failed', { orgId, userId, error });
    return null;
  }

  return data ?? null;
}

export function viewerCanEditOrg(role: string | null | undefined) {
  return role === 'owner' || role === 'admin';
}

export async function getOrgDashboardStats(orgId: string) {
  const supabase = await createServerClient();

  const [assignmentsRes, membersRes] = await Promise.all([
    supabase.from('assignments').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase
      .from('organization_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active'),
  ]);

  if (assignmentsRes.error) {
    console.error('[getOrgDashboardStats] assignments-error', assignmentsRes.error);
  }

  if (membersRes.error) {
    console.error('[getOrgDashboardStats] members-error', membersRes.error);
  }

  const projectsCount = 0;

  return {
    projectsCount,
    assignmentsCount: assignmentsRes.count ?? 0,
    membersCount: membersRes.count ?? 0,
  };
}
