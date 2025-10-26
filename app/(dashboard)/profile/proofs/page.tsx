// Proofs management page
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Proofs & Verifications | Proofound",
  description: "Manage your verified proofs",
};

export default async function ProofsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get all proofs for this user
  const { data: proofs } = await supabase
    .from("proofs")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Proofs & Verifications
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Build credibility with verified evidence of your achievements
          </p>
        </div>
        <Link href="/profile/proofs/new">
          <Button>Add Proof</Button>
        </Link>
      </div>

      {/* Info card */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
          💎 What are Proofs?
        </h3>
        <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
          Proofs are verified evidence of your claims. They can be work samples, recommendations,
          certifications, or achievements validated by referees. Verified proofs boost your match scores
          and credibility.
        </p>
      </div>

      {/* Proofs list */}
      {!proofs || proofs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No proofs yet
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start building your credibility by adding your first proof
          </p>
          <Link href="/profile/proofs/new" className="mt-4 inline-block">
            <Button>Add Your First Proof</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {proofs.map((proof: any) => (
            <div
              key={proof.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        proof.verification_status === "verified"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : proof.verification_status === "pending"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {proof.verification_status}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {proof.claim_type}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {proof.claim_text}
                  </h3>
                  {proof.verifier_organization && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Verified by: {proof.verifier_organization}
                    </p>
                  )}
                  {proof.confidence_score && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Confidence: {Math.round(proof.confidence_score * 100)}%
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

