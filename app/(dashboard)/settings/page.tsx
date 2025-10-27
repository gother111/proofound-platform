import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import { Settings } from "@/components/Settings";

export const metadata: Metadata = {
  title: "Settings | Proofound",
  description: "Manage your account settings and preferences",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  // Require authentication
  if (!profile) {
    redirect("/login");
  }

  return <Settings profile={profile} />;
}
