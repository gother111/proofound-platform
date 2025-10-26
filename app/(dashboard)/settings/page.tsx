// Settings page
import { Metadata } from "next";
import { getCurrentProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Settings | Proofound",
  description: "Manage your account settings",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account preferences and privacy settings
        </p>
      </div>

      {/* Account Type Toggle */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Account Type
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Current type: <span className="font-semibold">{profile.account_type}</span>
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Switch between Individual and Organization accounts
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Toggle coming soon
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Privacy & Visibility
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Control what information is visible to others
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Profile visibility</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Public</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Contact information</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Matches only</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Salary range</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Masked</span>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Detailed privacy controls coming soon
        </p>
      </div>

      {/* Notifications */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notifications
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose what notifications you want to receive
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">New match suggestions</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Email + In-app</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Messages</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Email + In-app</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Verification requests</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Email</span>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Notification preferences coming soon
        </p>
      </div>

      {/* Data Export */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data & Privacy
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Export your data
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Download a copy of your profile, matches, and messages
            </p>
            <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Request export (coming soon)
            </button>
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">
              Delete account
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Permanently delete your account and all associated data
            </p>
            <button className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400">
              Delete account (coming soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

