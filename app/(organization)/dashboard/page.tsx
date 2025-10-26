// Organization dashboard
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Organization Dashboard | Proofound",
  description: "Manage your organization and assignments",
};

export default async function OrganizationDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's organizations
  const { data: organizations } = await supabase
    .from("organizations")
    .select("*")
    .or(`created_by.eq.${user?.id},admin_ids.cs.{${user?.id}}`)
    .is("deleted_at", null);

  // Get assignments for these organizations
  const orgIds = organizations?.map((org: any) => org.id) || [];
  const { data: assignments } = orgIds.length > 0
    ? await supabase
        .from("assignments")
        .select("*")
        .in("organization_id", orgIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Type the data for TypeScript
  const typedOrganizations = organizations as any[] | null;
  const typedAssignments = assignments as any[] | null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Organization Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your organizations and assignments
            </p>
          </div>
          {typedOrganizations && typedOrganizations.length > 0 && (
            <Link href="/organization/assignments/new">
              <Button>Create Assignment</Button>
            </Link>
          )}
        </div>

        {/* Organizations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Organizations
            </h2>
            <Link href="/organization/new">
              <Button variant="outline">Add Organization</Button>
            </Link>
          </div>

          {!typedOrganizations || typedOrganizations.length === 0 ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                No organizations yet
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Create an organization to start posting assignments
              </p>
              <Link href="/organization/new" className="mt-4 inline-block">
                <Button>Create Organization</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {typedOrganizations.map((org: any) => (
                <div
                  key={org.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {org.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {org.description}
                      </p>
                    </div>
                    {org.is_verified && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-semibold text-green-800 dark:text-green-300">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{org.org_type}</span>
                    {org.is_remote_friendly && <span>• Remote-friendly</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignments */}
        {typedOrganizations && typedOrganizations.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Assignments
            </h2>

            {!typedAssignments || typedAssignments.length === 0 ? (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No assignments yet
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Create your first assignment to start receiving matches
                </p>
                <Link href="/organization/assignments/new" className="mt-4 inline-block">
                  <Button>Create Assignment</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {typedAssignments.map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
                            {assignment.assignment_type}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            assignment.status === 'published'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : assignment.status === 'draft'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                            {assignment.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {assignment.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {assignment.description}
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          {assignment.location && <span>📍 {assignment.location}</span>}
                          {assignment.is_remote && <span>🌐 Remote</span>}
                          {assignment.total_matches_generated !== null && (
                            <span>🔗 {assignment.total_matches_generated} matches</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

