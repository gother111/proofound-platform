// Profile page - Individual profile builder
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, getCurrentProfile } from "@/lib/supabase/server";
import { ProfileBuilder } from "@/components/profile/profile-builder";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Profile | Proofound",
  description: "Build your credibility-based profile",
};

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Profile not found. Please try again.
          </p>
        </div>
      </div>
    );
  }

  // Check if profile is incomplete (less than 60% complete)
  const isIncomplete = (profile.profile_completion_percentage || 0) < 60;

  // Get expertise
  const { data: expertise } = await supabase
    .from("expertise_atlas")
    .select("*")
    .eq("profile_id", user.id)
    .order("rank_order", { ascending: true });

  // Get proofs
  const { data: proofs } = await supabase
    .from("proofs")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Profile
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isIncomplete 
              ? "Complete your profile to start receiving matches"
              : "Build your credibility through verified proofs"}
          </p>
        </div>
        {!isIncomplete && (
          <Link href="/profile/edit">
            <Button variant="outline">Edit Profile</Button>
          </Link>
        )}
      </div>

      {/* Completion status */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Profile Completion
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {profile.profile_completion_percentage || 0}% complete
            </p>
          </div>
          <div className="text-right">
            {profile.profile_ready_for_match ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Ready for Matches
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                Complete to Match
              </span>
            )}
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-2 rounded-full transition-all ${
              (profile.profile_completion_percentage || 0) >= 60
                ? "bg-green-600"
                : "bg-yellow-600"
            }`}
            style={{ width: `${profile.profile_completion_percentage || 0}%` }}
          />
        </div>
      </div>

      {/* Profile builder for incomplete profiles */}
      {isIncomplete ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8">
          <ProfileBuilder initialData={profile} profileId={user.id} />
        </div>
      ) : (
        <>
          {/* Profile display */}
          {/* Mission & Vision */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Mission · Vision · Values
            </h3>
            {profile.mission || profile.vision ? (
              <div className="space-y-4">
                {profile.mission && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Mission
                    </h4>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      {profile.mission}
                    </p>
                  </div>
                )}
                {profile.vision && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Vision
                    </h4>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      {profile.vision}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add your mission and vision to show what drives you
              </p>
            )}
          </div>

          {/* Expertise Atlas */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Expertise Atlas
              </h3>
              <Link href="/profile/expertise">
                <Button variant="outline" size="sm">Add Skills</Button>
              </Link>
            </div>
            {!expertise || expertise.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No expertise added yet. Add your skills to improve match quality.
              </p>
            ) : (
              <div className="space-y-3">
                {expertise.map((skill: any) => (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {skill.skill_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {skill.proficiency_level} • {skill.years_of_experience} years
                      </p>
                    </div>
                    {skill.is_verified && (
                      <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-semibold text-green-800 dark:text-green-300">
                        Verified
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Proofs & Verifications */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Proofs & Verifications
              </h3>
              <Link href="/profile/proofs">
                <Button variant="outline" size="sm">Add Proof</Button>
              </Link>
            </div>
            {!proofs || proofs.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No proofs added yet. Add verified proofs to build credibility.
              </p>
            ) : (
              <div className="space-y-3">
                {proofs.slice(0, 5).map((proof: any) => (
                  <div
                    key={proof.id}
                    className="flex items-start justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {proof.claim_text}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {proof.claim_type}
                      </p>
                    </div>
                    <span className={`ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      proof.verification_status === "verified"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        : proof.verification_status === "pending"
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                    }`}>
                      {proof.verification_status}
                    </span>
                  </div>
                ))}
                {proofs.length > 5 && (
                  <Link href="/profile/proofs" className="block text-center">
                    <Button variant="outline" size="sm" className="w-full">
                      View All {proofs.length} Proofs
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
