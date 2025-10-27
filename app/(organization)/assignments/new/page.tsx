import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, getCurrentProfile } from "@/lib/supabase/server";
import { AssignmentBuilder } from "@/components/AssignmentBuilder";

export const metadata: Metadata = {
  title: "Create Assignment | Proofound",
  description: "Post a new opportunity to find qualified candidates",
};

export default async function NewAssignmentPage() {
  const supabase = await createServerSupabaseClient();
  const profile = await getCurrentProfile();

  // Require authentication
  if (!profile) {
    redirect("/login");
  }

  // Only organizations can create assignments
  if (profile.account_type !== 'organization') {
    redirect("/home");
  }

  return <AssignmentBuilder organizationId={profile.id} />;
}
