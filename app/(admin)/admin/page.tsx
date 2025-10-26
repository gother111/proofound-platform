// Admin dashboard with North Star metrics
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Dashboard | Proofound",
  description: "Analytics and metrics dashboard",
};

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // TODO: Add admin role check
  // For now, any authenticated user can access

  // Fetch North Star metrics from views
  const { data: profileStats } = await supabase
    .from("admin_profile_readiness_stats")
    .select("*")
    .single();

  const { data: matchStats } = await supabase
    .from("admin_match_stats")
    .select("*")
    .single();

  const { data: orgStats } = await supabase
    .from("admin_org_verification_stats")
    .select("*")
    .single();

  const { data: safetyStats } = await supabase
    .from("admin_safety_stats")
    .select("*")
    .single();

  // Fetch time to first match data
  const { data: timeToMatch } = await supabase
    .from("admin_time_to_first_match")
    .select("hours_to_first_match")
    .not("hours_to_first_match", "is", null)
    .order("hours_to_first_match", { ascending: true });

  const medianTimeToMatch = timeToMatch && timeToMatch.length > 0
    ? timeToMatch[Math.floor(timeToMatch.length / 2)]?.hours_to_first_match
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            North Star metrics and platform analytics
          </p>
        </div>

        {/* North Star Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🎯 North Star Metrics
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Time to First Match */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Time to First Match
              </h3>
              <p className="mt-2 text-4xl font-bold text-blue-600 dark:text-blue-400">
                {medianTimeToMatch ? `${Math.round(medianTimeToMatch)}h` : "N/A"}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Median hours (Primary North Star)
              </p>
            </div>

            {/* Assignments with 3+ Matches */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Qualified Assignments
              </h3>
              <p className="mt-2 text-4xl font-bold text-green-600 dark:text-green-400">
                {matchStats?.assignments_with_3plus_qualified || 0}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                With ≥3 qualified matches (7d)
              </p>
            </div>

            {/* Match Acceptance Rate */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Match Acceptance Rate
              </h3>
              <p className="mt-2 text-4xl font-bold text-purple-600 dark:text-purple-400">
                {matchStats?.acceptance_rate_pct ? `${Math.round(matchStats.acceptance_rate_pct)}%` : "0%"}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Accepted / Total responses
              </p>
            </div>
          </div>
        </div>

        {/* Profile Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            👤 Profile Metrics
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Ready Profiles
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {profileStats?.ready_profiles || 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                24h Readiness Rate
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {profileStats?.readiness_rate_24h_pct ? `${Math.round(profileStats.readiness_rate_24h_pct)}%` : "0%"}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Incomplete Profiles
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {profileStats?.incomplete_profiles || 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                New (24h)
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {profileStats?.profiles_created_24h || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Match Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🔗 Match Metrics
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Total Matches
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {matchStats?.total_matches || 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Accepted
              </h3>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                {matchStats?.accepted_matches || 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Declined
              </h3>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                {matchStats?.declined_matches || 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Avg Score
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {matchStats?.avg_match_score ? `${Math.round(matchStats.avg_match_score)}%` : "0%"}
              </p>
            </div>
          </div>
        </div>

        {/* Organization Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🏢 Organization Metrics
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Verified Orgs
              </h3>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                {orgStats?.verified_orgs || 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Pending Verification
              </h3>
              <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {orgStats?.unverified_orgs || 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Verification Rate
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {orgStats?.verification_rate_pct ? `${Math.round(orgStats.verification_rate_pct)}%` : "0%"}
              </p>
            </div>
          </div>
        </div>

        {/* Safety Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🛡️ Safety & Moderation
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Total Reports
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {safetyStats?.total_reports || 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Pending
              </h3>
              <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {safetyStats?.pending_reports || 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                SLA Breached
              </h3>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                {safetyStats?.sla_breached || 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Avg Resolution
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {safetyStats?.avg_resolution_hours ? `${Math.round(safetyStats.avg_resolution_hours)}h` : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

