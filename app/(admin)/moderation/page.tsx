// Moderation queue for admin
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ModerationQueue } from "@/components/admin/moderation-queue";

export const metadata: Metadata = {
  title: "Moderation Queue | Proofound Admin",
  description: "Review and moderate reported content",
};

export default async function ModerationPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // TODO: Add admin role check here

  // Get pending reports
  const { data: reports } = await supabase
    .from("reports")
    .select(`
      *,
      reporter:reporter_id(full_name),
      moderator:assigned_moderator_id(full_name)
    `)
    .in("moderation_status", ["pending", "under_review"])
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Moderation Queue
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Review and action reported content
          </p>
        </div>

        <ModerationQueue reports={reports as any[]} moderatorId={user.id} />
      </div>
    </div>
  );
}

