// Dashboard layout with navigation
import { redirect } from "next/navigation";
import { createServerSupabaseClient, getCurrentProfile } from "@/lib/supabase/server";
import { Navigation } from "@/components/layout/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation 
        userName={profile?.full_name || user.email || undefined} 
        accountType={profile?.account_type || undefined}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

