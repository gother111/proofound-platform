// New proof creation page
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProofRequestForm } from "@/components/verification/proof-request-form";

export const metadata: Metadata = {
  title: "Add Proof | Proofound",
  description: "Request verification for a new proof",
};

export default async function NewProofPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Add New Proof
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Request verification for an achievement or credential
        </p>
      </div>

      <ProofRequestForm userId={user.id} />
    </div>
  );
}

