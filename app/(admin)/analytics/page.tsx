import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, getCurrentProfile } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Analytics | Proofound",
  description: "View platform analytics and metrics",
};

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient();
  const profile = await getCurrentProfile();

  // Require authentication and admin role
  if (!profile) {
    redirect("/login");
  }

  // Check if user is admin (you may want to add an is_admin field to profiles)
  // For now, we'll use a simple check
  const isAdmin = profile.email?.endsWith('@proofound.com') || profile.account_type === 'admin';
  
  if (!isAdmin) {
    redirect("/home");
  }

  // Fetch analytics events (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: events, error } = await supabase
    .from('analytics_events')
    .select('*')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Error fetching analytics:", error);
  }

  return (
    <AnalyticsDashboard
      events={events || []}
      dateRange={{
        from: thirtyDaysAgo,
        to: new Date(),
      }}
    />
  );
}

