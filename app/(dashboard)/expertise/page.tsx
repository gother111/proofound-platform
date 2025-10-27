import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, getCurrentProfile } from "@/lib/supabase/server";
import { ExpertiseAtlas } from "@/components/ExpertiseAtlas";

export const metadata: Metadata = {
  title: "Expertise Atlas | Proofound",
  description: "Map your capabilities with proof",
};

export default async function ExpertiseAtlasPage() {
  const supabase = await createServerSupabaseClient();
  const profile = await getCurrentProfile();

  // Require authentication
  if (!profile) {
    redirect("/login");
  }

  // Fetch expertise atlas data
  const { data: expertiseData, error: expertiseError } = await supabase
    .from('expertise_atlas')
    .select('*')
    .eq('profile_id', profile.id)
    .order('rank_order', { ascending: true });

  if (expertiseError) {
    console.error("Error fetching expertise:", expertiseError);
  }

  // Fetch proofs for linking
  const { data: proofs, error: proofsError } = await supabase
    .from('proofs')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false });

  if (proofsError) {
    console.error("Error fetching proofs:", proofsError);
  }

  return (
    <ExpertiseAtlas
      profile={profile}
      expertiseData={expertiseData || []}
      proofs={proofs || []}
    />
  );
}

