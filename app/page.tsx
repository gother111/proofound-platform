import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProofoundLanding } from "@/components/ProofoundLanding";

export default async function Home() {
  // Check if user is already logged in
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, redirect to dashboard
  if (user) {
    redirect("/home");
  }

  // Render Figma landing page for non-authenticated users
  // Navigation is handled internally by the component using Next.js router
  return <ProofoundLanding />;
}
