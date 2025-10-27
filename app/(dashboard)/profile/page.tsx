import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, getCurrentProfile } from "@/lib/supabase/server";
import { ProfilesView } from "@/components/ProfilesView";

export const metadata: Metadata = {
  title: "Profile | Proofound",
  description: "Your Proofound profile",
};

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const profile = await getCurrentProfile();

  // Require authentication
  if (!profile) {
    redirect("/login");
  }

  // Fetch proofs
  const { data: proofs } = await supabase
    .from('proofs')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false });

  // Fetch expertise atlas
  const { data: expertiseAtlas } = await supabase
    .from('expertise_atlas')
    .select('*')
    .eq('profile_id', profile.id)
    .order('rank_order', { ascending: true });

  return (
    <ProfilesView 
      profile={profile}
      proofs={proofs || []}
      expertiseAtlas={expertiseAtlas || []}
    />
  );
}
