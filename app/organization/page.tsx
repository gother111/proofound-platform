import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, getCurrentProfile } from "@/lib/supabase/server";
import { OrganizationDashboard } from "@/components/OrganizationDashboard";

export const metadata: Metadata = {
  title: "Organization Dashboard | Proofound",
  description: "Manage your organization and team",
};

export default async function OrganizationPage() {
  const supabase = await createServerSupabaseClient();
  const profile = await getCurrentProfile();

  // Require authentication
  if (!profile) {
    redirect("/login");
  }

  // Only organizations can access this page
  if (profile.account_type !== 'organization') {
    redirect("/home");
  }

  // Fetch organization details
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.id)
    .single();

  if (orgError) {
    console.error("Error fetching organization:", orgError);
  }

  // Fetch assignments
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('*')
    .eq('organization_id', profile.id)
    .order('created_at', { ascending: false });

  if (assignmentsError) {
    console.error("Error fetching assignments:", assignmentsError);
  }

  // Fetch team members (profiles associated with this organization)
  // For now, we'll just show the organization profile itself
  // In a full implementation, you'd query a separate team_members table
  const { data: teamMembers, error: teamError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profile.id)
    .order('created_at', { ascending: false });

  if (teamError) {
    console.error("Error fetching team members:", teamError);
  }

  // Fetch matches for organization's assignments
  const assignmentIds = assignments?.map(a => a.id) || [];
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select(`
      *,
      profile:profiles!matches_profile_id_fkey(id, full_name, avatar_url, tagline),
      assignment:assignments(id, title)
    `)
    .in('assignment_id', assignmentIds.length > 0 ? assignmentIds : [''])
    .order('created_at', { ascending: false });

  if (matchesError) {
    console.error("Error fetching matches:", matchesError);
  }

  return (
    <OrganizationDashboard
      organization={organization || {}}
      assignments={assignments || []}
      teamMembers={teamMembers || []}
      matches={matches || []}
    />
  );
}
