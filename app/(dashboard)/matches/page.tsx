// Matches page - View match suggestions with explainability
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MatchCard } from "@/components/matching/match-card";
import { GenerateMatchesButton } from "@/components/matching/generate-matches-button";

export const metadata: Metadata = {
  title: "Matches | Proofound",
  description: "Your match suggestions",
};

export default async function MatchesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch matches for the current user
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      *,
      assignment:assignments(*)
    `)
    .eq("profile_id", user?.id)
    .order("overall_score", { ascending: false });

  // Get profile readiness
  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_ready_for_match, profile_completion_percentage")
    .eq("id", user?.id)
    .single();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Matches
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Opportunities matched to your skills and mission
          </p>
        </div>
        {profile?.profile_ready_for_match && (
          <GenerateMatchesButton />
        )}
      </div>

      {!profile?.profile_ready_for_match && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-6">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
            Complete your profile to start matching
          </h3>
          <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            Your profile is {profile?.profile_completion_percentage || 0}% complete. 
            You need at least 80% completion and one verified proof to receive matches.
          </p>
        </div>
      )}

      {!matches || matches.length === 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <svg
              className="h-6 w-6 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No matches yet
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {profile?.profile_ready_for_match
              ? "Click 'Find Matches' above to discover opportunities"
              : "Complete your profile to start receiving match suggestions"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

