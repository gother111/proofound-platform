import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, getCurrentProfile } from "@/lib/supabase/server";
import { MatchingSpace } from "@/components/MatchingSpace";

export const metadata: Metadata = {
  title: "Matching | Proofound",
  description: "Find your perfect opportunities and candidates",
};

export default async function MatchesPage() {
  const supabase = await createServerSupabaseClient();
  const profile = await getCurrentProfile();

  // Require authentication
  if (!profile) {
    redirect("/login");
  }

  // Cast profile to include organization_id field
  const profileWithOrg = profile as typeof profile & { organization_id?: string };

  // Fetch matches for the current user
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select(`
      *,
      profile:profiles!matches_profile_id_fkey(
        id,
        full_name,
        tagline,
        bio,
        location,
        avatar_url,
        profile_completion_percentage,
        matching_preferences
      ),
      assignment:assignments(
        id,
        title,
        description,
        required_expertise,
        location_type,
        compensation_type,
        duration,
        status,
        organization:organizations(
          id,
          name
        )
      )
    `)
    .or(`profile_id.eq.${profile.id},assignment_id.in.(select id from assignments where organization_id.eq.${profileWithOrg.organization_id || 'null'})`)
    .order('overall_score', { ascending: false });

  if (matchesError) {
    console.error("Error fetching matches:", matchesError);
  }

  // Fetch assignments for organizations
  let assignments: any[] = [];
  if (profile.account_type === 'organization' && profileWithOrg.organization_id) {
    const { data: orgAssignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .eq('organization_id', profileWithOrg.organization_id)
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError);
    }
    assignments = orgAssignments || [];
  }

  return (
    <MatchingSpace 
      profile={profile}
      matches={matches || []}
      assignments={assignments}
    />
  );
}
