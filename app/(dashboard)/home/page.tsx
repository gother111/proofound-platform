import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, getCurrentProfile } from "@/lib/supabase/server";
import { Dashboard } from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard | Proofound",
  description: "Your Proofound dashboard",
};

export default async function DashboardHomePage() {
  const supabase = await createServerSupabaseClient();
  const profile = await getCurrentProfile();

  // Require authentication
  if (!profile) {
    redirect("/login");
  }

  // Fetch matches for the user
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      assignment:assignments(
        id,
        title,
        description,
        organization:organizations(name)
      )
    `)
    .eq('profile_id', profile.id)
    .eq('status', 'suggested')
    .order('overall_score', { ascending: false })
    .limit(10) as { data: any[] | null };

  // Fetch assignments (if organization)
  let assignments: any[] = [];
  if (profile.account_type === 'organization') {
    const { data: orgAssignments } = await supabase
      .from('assignments')
      .select('*')
      .eq('organization_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    assignments = orgAssignments || [];
  }

  // Fetch recent notifications/updates
  // For now, we'll create mock notifications based on real data
  const notifications: any[] = [];

  // Check for recent verifications
  const { data: recentProofs } = await supabase
    .from('proofs')
    .select('id, claim_text, verification_status')
    .eq('profile_id', profile.id)
    .eq('verification_status', 'verified')
    .order('updated_at', { ascending: false })
    .limit(1) as { data: Array<{ id: string; claim_text: string | null; verification_status: string }> | null };

  if (recentProofs && recentProofs.length > 0 && recentProofs[0]) {
    const recentProof = recentProofs[0];
    notifications.push({
      id: `proof-${recentProof.id}`,
      text: `Verification approved — ${recentProof.claim_text?.substring(0, 50)}`,
      action: 'View',
      route: '/profile/proofs'
    });
  }

  // Check for new matches
  if (matches && matches.length > 0 && matches[0]) {
    const latestMatch = matches[0] as any;
    if (latestMatch.assignment) {
      notifications.push({
        id: `match-${latestMatch.id}`,
        text: `New match: ${latestMatch.assignment.title}`,
        action: 'Review',
        route: `/matches/${latestMatch.id}`
      });
    }
  }

  // For organizations, check for new assignment applications (matches)
  if (profile.account_type === 'organization' && assignments.length > 0) {
    const { data: assignmentMatches } = await supabase
      .from('matches')
      .select('id, assignment_id')
      .in('assignment_id', assignments.map(a => a.id))
      .eq('status', 'suggested')
      .limit(1) as { data: Array<{ id: string; assignment_id: string }> | null };

    if (assignmentMatches && assignmentMatches.length > 0 && assignmentMatches[0]) {
      const assignmentMatch = assignmentMatches[0];
      notifications.push({
        id: `assignment-match-${assignmentMatch.id}`,
        text: 'New applications for your assignments',
        action: 'Review',
        route: '/matches'
      });
    }
  }

  return (
    <Dashboard 
      profile={profile}
      matches={matches || []}
      assignments={assignments}
      notifications={notifications}
    />
  );
}
