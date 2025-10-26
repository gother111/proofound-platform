// Dashboard home page
import { Metadata } from "next";
import { getCurrentProfile } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard | Proofound",
  description: "Your Proofound dashboard",
};

export default async function DashboardHomePage() {
  const profile = await getCurrentProfile();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's what's happening with your matches today
        </p>
      </div>

      {/* Profile Completion Card */}
      {profile && profile.profile_completion_percentage !== null && profile.profile_completion_percentage < 100 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-6">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
            Complete your profile
          </h3>
          <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            Your profile is {profile.profile_completion_percentage}% complete.
            Complete it to start receiving matches!
          </p>
          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-yellow-200 dark:bg-yellow-800">
              <div
                className="h-2 rounded-full bg-yellow-600 dark:bg-yellow-400"
                style={{ width: `${profile.profile_completion_percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dashboard content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Matches
          </h3>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
            0
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            New matches this week
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Verifications
          </h3>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            0
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Verified proofs
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Messages
          </h3>
          <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
            0
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Unread messages
          </p>
        </div>
      </div>
    </div>
  );
}

