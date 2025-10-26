// Assignment creation wizard
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, getCurrentProfile } from "@/lib/supabase/server";
import { AssignmentWizard } from "@/components/assignments/assignment-wizard";

export const metadata: Metadata = {
  title: "Create Assignment | Proofound",
  description: "Post a new assignment opportunity",
};

export default async function NewAssignmentPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  // Get user's organizations
  const { data: organizations } = await supabase
    .from("organizations")
    .select("*")
    .or(`created_by.eq.${user.id},admin_ids.cs.{${user.id}}`)
    .is("deleted_at", null);

  if (!organizations || organizations.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          No Organization Found
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          You need to create an organization before posting assignments.
        </p>
        <a
          href="/organization/new"
          className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Create Organization
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Assignment
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Post an opportunity and receive high-quality matches
        </p>
      </div>

      <AssignmentWizard 
        organizations={organizations as any[]} 
        userId={user.id} 
      />
    </div>
  );
}

