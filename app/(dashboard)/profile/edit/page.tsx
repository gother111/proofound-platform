import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/profile/ProfileEditor";

export const metadata: Metadata = {
  title: "Edit Profile | Proofound",
  description: "Edit your Proofound profile",
};

export default async function ProfileEditPage() {
  const profile = await getCurrentProfile();

  // Require authentication
  if (!profile) {
    redirect("/login");
  }

  return <ProfileEditor profile={profile} />;
}
