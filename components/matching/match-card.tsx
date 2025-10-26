"use client";

// Match card component with explainability
import Link from "next/link";
import { formatPercentage, getMatchScoreColor, getMatchScoreBadge } from "@/lib/utils";
import type { Match, Assignment } from "@/types";

interface MatchCardProps {
  match: Match & {
    assignment?: Assignment | null;
  };
}

export function MatchCard({ match }: MatchCardProps) {
  const { assignment } = match;
  
  if (!assignment) return null;

  const scoreColor = getMatchScoreColor(match.overall_score);
  const scoreBadge = getMatchScoreBadge(match.overall_score);

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Assignment Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
              {assignment.assignment_type}
            </span>
            {assignment.is_remote && (
              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:text-green-300">
                Remote
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
            {assignment.title}
          </h3>
          
          {assignment.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
              {assignment.description}
            </p>
          )}

          {/* Location & Time */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
            {assignment.location && (
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {assignment.location}
              </span>
            )}
            {assignment.time_commitment && (
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {assignment.time_commitment}
              </span>
            )}
          </div>
        </div>

        {/* Match Score */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className={`text-3xl font-bold ${scoreColor}`}>
            {Math.round(match.overall_score)}%
          </div>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {scoreBadge}
          </span>
          {match.status === "suggested" && (
            <span className="mt-1 inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-300">
              New
            </span>
          )}
        </div>
      </div>

      {/* Score Breakdown */}
      {match.mission_values_score !== null && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Match Breakdown:</span>
            <span className="text-gray-500 dark:text-gray-400">Click for details →</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: "Mission", score: match.mission_values_score, weight: match.mission_values_weight },
              { label: "Expertise", score: match.core_expertise_score, weight: match.core_expertise_weight },
              { label: "Tools", score: match.tools_score, weight: match.tools_weight },
              { label: "Logistics", score: match.logistics_score, weight: match.logistics_weight },
              { label: "Recency", score: match.recency_score, weight: match.recency_weight },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {Math.round(item.score || 0)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {item.label}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  ({item.weight}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths Preview */}
      {match.strengths && Array.isArray(match.strengths) && match.strengths.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-2">
            <svg className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
              <span className="font-semibold">Top strength:</span> {(match.strengths[0] as any)?.description || "View details"}
            </p>
          </div>
        </div>
      )}
    </Link>
  );
}

