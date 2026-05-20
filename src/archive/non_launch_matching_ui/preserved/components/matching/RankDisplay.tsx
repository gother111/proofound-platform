/**
 * Rank Display Component
 *
 * Shows candidate's rank within the match pool
 * Implements PRD requirement for match transparency
 */

'use client';

import React from 'react';
import { Trophy, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RankDisplayProps {
  rank: number;
  totalCandidates: number;
  score: number;
  topPercentile?: number; // e.g., 5 for top 5%
  variant?: 'compact' | 'detailed';
}

export function RankDisplay({
  rank,
  totalCandidates,
  score,
  topPercentile,
  variant = 'compact',
}: RankDisplayProps) {
  // Determine rank tier for styling
  const getRankTier = () => {
    const percentage = (rank / totalCandidates) * 100;
    if (percentage <= 5) return 'gold';
    if (percentage <= 15) return 'silver';
    if (percentage <= 30) return 'bronze';
    return 'default';
  };

  const tier = getRankTier();

  const tierStyles = {
    gold: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
      icon: 'text-amber-500',
    },
    silver: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-300 dark:border-gray-700',
      text: 'text-gray-700 dark:text-gray-300',
      icon: 'text-gray-500',
    },
    bronze: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-300',
      icon: 'text-orange-500',
    },
    default: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
      icon: 'text-blue-500',
    },
  };

  const style = tierStyles[tier];

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${style.bg} ${style.border}`}
            >
              <Trophy className={`h-4 w-4 ${style.icon}`} />
              <span className={`text-sm font-semibold ${style.text}`}>
                #{rank} of {totalCandidates}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <p>
                <strong>Your Rank:</strong> #{rank}
              </p>
              <p>
                <strong>Total Candidates:</strong> {totalCandidates}
              </p>
              <p>
                <strong>Match Score:</strong> {(score * 100).toFixed(1)}%
              </p>
              {topPercentile && (
                <p>
                  <strong>Percentile:</strong> Top {topPercentile}%
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed variant
  return (
    <Card className={`${style.bg} ${style.border}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${style.bg}`}>
            <Trophy className={`h-6 w-6 ${style.icon}`} />
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <h4 className={`text-sm font-semibold ${style.text}`}>Your Ranking</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Position in match pool</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${style.text}`}>#{rank}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">of {totalCandidates}</span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Score: {(score * 100).toFixed(1)}%
                </span>
              </div>

              {topPercentile && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Top {topPercentile}%</span>
                </div>
              )}
            </div>

            {tier === 'gold' && (
              <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  🎉 You're a top candidate for this role!
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
