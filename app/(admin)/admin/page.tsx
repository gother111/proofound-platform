import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, getCurrentProfile } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard | Proofound",
  description: "Platform administration and moderation",
};

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const profile = await getCurrentProfile();

  // Require authentication
  if (!profile) {
    redirect("/login");
  }

  // Check if user is admin (you'll need to add an is_admin field to profiles table)
  // For now, we'll check if they have admin role
  if (!profile.is_admin) {
    redirect("/home"); // Redirect non-admin users
  }

  // Fetch reports for moderation queue
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(
        id,
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false });

  if (reportsError) {
    console.error("Error fetching reports:", reportsError);
  }

  // Fetch statistics
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: totalReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true });

  const { count: pendingReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('moderation_status', 'pending');

  const { count: totalMatches } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true });

  const stats = {
    totalUsers: totalUsers || 0,
    totalReports: totalReports || 0,
    pendingReports: pendingReports || 0,
    totalMatches: totalMatches || 0,
  };

  return (
    <AdminDashboard 
      reports={reports || []}
      stats={stats}
    />
  );
}
