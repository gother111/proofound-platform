import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import { ProofSubmission } from "@/components/ProofSubmission";

export const metadata: Metadata = {
  title: "Submit Proof | Proofound",
  description: "Submit a new proof for verification",
};

export default async function NewProofPage() {
  const profile = await getCurrentProfile();

  // Require authentication
  if (!profile) {
    redirect("/login");
  }

  return <ProofSubmission profileId={profile.id} />;
}
