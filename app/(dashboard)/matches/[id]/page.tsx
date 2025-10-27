// Match detail page with full explainability
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPercentage, getMatchScoreColor, getMatchScoreBadge } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Match Details | Proofound",
  description: "View match details and explainability",
};

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch match with assignment details
  const { data: match, error } = await supabase
    .from("matches")
    .select(`
      *,
      assignment:assignments(
        *,
        organization:organizations(*)
      )
    `)
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (error || !match) {
    notFound();
  }

  // Cast match to any to access nested properties
  const matchData = match as any;
  const assignment = matchData.assignment as any;
  const scoreColor = getMatchScoreColor(matchData.overall_score);
  const scoreBadge = getMatchScoreBadge(matchData.overall_score);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-4xl font-bold ${scoreColor}`}>
            {Math.round(matchData.overall_score)}%
          </span>
          <span className="text-lg text-gray-600 dark:text-gray-400">
            {scoreBadge}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {assignment?.title}
        </h1>
        {assignment?.organization && (
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {assignment.organization.name}
          </p>
        )}
      </div>

      {/* Match Actions */}
      {matchData.status === "suggested" || matchData.status === "viewed" ? (
        <div className="flex gap-4">
          <Button size="lg">Accept Match</Button>
          <Button variant="outline" size="lg">Decline</Button>
        </div>
      ) : matchData.status === "accepted" ? (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4">
          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
            ✓ Match accepted - You can now message the organization
          </p>
        </div>
      ) : null}

      {/* Score Breakdown */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Match Breakdown
        </h2>
        <div className="space-y-4">
          {[
            {
              label: "Mission & Values Alignment",
              score: matchData.mission_values_score,
              weight: matchData.mission_values_weight,
            },
            {
              label: "Core Expertise Match",
              score: matchData.core_expertise_score,
              weight: matchData.core_expertise_weight,
            },
            {
              label: "Tools & Technology",
              score: matchData.tools_score,
              weight: matchData.tools_weight,
            },
            {
              label: "Logistics (Location, Availability)",
              score: matchData.logistics_score,
              weight: matchData.logistics_weight,
            },
            {
              label: "Recency & Activity",
              score: matchData.recency_score,
              weight: matchData.recency_weight,
            },
          ].map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {item.weight}% weight
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {Math.round(item.score || 0)}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-2 rounded-full ${
                    (item.score || 0) >= 80
                      ? "bg-green-600"
                      : (item.score || 0) >= 60
                      ? "bg-yellow-600"
                      : "bg-red-600"
                  }`}
                  style={{ width: `${item.score || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      {matchData.strengths && Array.isArray(matchData.strengths) && matchData.strengths.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-6">
          <h2 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
            ✓ Your Strengths
          </h2>
          <ul className="space-y-2">
            {matchData.strengths.map((strength: any, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-green-800 dark:text-green-200">
                <svg className="h-5 w-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  <strong>{strength.area}:</strong> {strength.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {matchData.gaps && Array.isArray(matchData.gaps) && matchData.gaps.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-6">
          <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-4">
            ⚠️ Areas to Improve
          </h2>
          <ul className="space-y-2">
            {matchData.gaps.map((gap: any, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                <svg className="h-5 w-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  <strong>{gap.area}:</strong> {gap.description} ({gap.impact} impact)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvement Suggestions */}
      {matchData.improvement_suggestions && Array.isArray(matchData.improvement_suggestions) && matchData.improvement_suggestions.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-6">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            💡 How to Improve Your Score
          </h2>
          <ul className="space-y-3">
            {matchData.improvement_suggestions.map((suggestion: any, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
                <svg className="h-5 w-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
                <div>
                  <p className="font-medium">{suggestion.action}</p>
                  <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                    Potential score increase: +{suggestion.potential_increase_min}-{suggestion.potential_increase_max}%
                    {" • "}Priority: {suggestion.priority}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assignment Details */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Assignment Details
        </h2>
        {assignment?.description && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {assignment.description}
            </p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Type
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {assignment?.assignment_type}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Location
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {assignment?.is_remote ? "Remote" : assignment?.location || "Not specified"}
            </p>
          </div>
          {assignment?.time_commitment && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Time Commitment
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {assignment.time_commitment}
              </p>
            </div>
          )}
          {assignment?.duration_text && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Duration
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {assignment.duration_text}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

