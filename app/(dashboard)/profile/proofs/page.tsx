import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, getCurrentProfile } from "@/lib/supabase/server";
import { VerificationManagement } from "@/components/VerificationManagement";

export const metadata: Metadata = {
  title: "Proofs & Verifications | Proofound",
  description: "Manage your proofs and verification requests",
};

export default async function ProofsPage() {
  const supabase = await createServerSupabaseClient();
  const profile = await getCurrentProfile();

  // Require authentication
  if (!profile) {
    redirect("/login");
  }

  // Fetch proofs
  const { data: proofs, error: proofsError } = await supabase
    .from('proofs')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false });

  if (proofsError) {
    console.error("Error fetching proofs:", proofsError);
  }

  // Fetch verification requests
  const { data: verificationRequests, error: requestsError } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('requester_id', profile.id)
    .order('created_at', { ascending: false});

  if (requestsError) {
    console.error("Error fetching verification requests:", requestsError);
  }

  return (
    <VerificationManagement
      proofs={proofs || []}
      verificationRequests={verificationRequests || []}
    />
  );
}
