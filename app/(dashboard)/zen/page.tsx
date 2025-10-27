import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import { ZenHub } from "@/components/ZenHub";

export const metadata: Metadata = {
  title: "Zen Hub | Proofound",
  description: "Evidence-based practices for mental wellbeing",
};

export default async function ZenHubPage() {
  const profile = await getCurrentProfile();

  // Require authentication
  if (!profile) {
    redirect("/login");
  }

  // Privacy-first: No wellbeing data is stored in Supabase
  // Only user preferences (if any) would be stored, not practice sessions or mental health data
  
  return <ZenHub profile={profile} />;
}

