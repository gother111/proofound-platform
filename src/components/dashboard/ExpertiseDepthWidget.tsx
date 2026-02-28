/**
 * Expertise Depth Widget Component
 *
 * Displays real-time expertise statistics for the dashboard tile.
 * Fetches data from /api/expertise/stats endpoint.
 */

'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

interface ExpertiseStats {
  totalL4Skills: number;
  skillsWithProofs: number;
  skillsWithVerifications: number;
  progressPercentage: number;
  activationThreshold: number;
}

export function ExpertiseDepthWidget() {
  const [stats, setStats] = useState<ExpertiseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/expertise/stats');

      if (!response.ok) {
        throw new Error('Failed to fetch expertise stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching expertise stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-sm text-[#6B6760]">
        <p>Your skill proficiency levels</p>
        <div className="mt-4 flex items-center justify-center">
          <Loader2 className="h-4 w-4 text-[#1C4D3A] animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-[#6B6760]">
        <p>Your skill proficiency levels</p>
        <div className="mt-4">
          <p className="text-xs text-red-600">Failed to load stats</p>
          <button onClick={fetchStats} className="text-xs text-[#1C4D3A] hover:underline mt-1">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-sm text-[#6B6760]">
        <p>Your skill proficiency levels</p>
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }

  const radialData = [{ name: 'Progress', value: stats.totalL4Skills, fill: '#1C4D3A' }];

  return (
    <div className="text-sm text-[#6B6760]">
      <p>Your skill proficiency levels</p>
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-6">
          <div className="h-[100px] w-[100px] flex-shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                barSize={8}
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, stats.activationThreshold > 0 ? stats.activationThreshold : 1]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar background={{ fill: '#F5F4F0' }} dataKey="value" cornerRadius={4} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-[#2D3330] leading-none">
                {stats.totalL4Skills}
              </span>
              <span className="text-[10px] text-[#6B6760] mt-1">
                / {stats.activationThreshold} target
              </span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-[#2D3330]">Skills Progress</span>
            </div>
            {stats.totalL4Skills < stats.activationThreshold ? (
              <p className="text-xs text-[#6B6760]">
                {stats.activationThreshold - stats.totalL4Skills} more to reach activation threshold
              </p>
            ) : (
              <p className="text-xs text-[#1C4D3A] font-medium flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Threshold reached
              </p>
            )}
          </div>
        </div>

        {(stats.skillsWithProofs > 0 || stats.skillsWithVerifications > 0) && (
          <div className="pt-3 border-t border-[#E8E6DD] space-y-2">
            {stats.skillsWithProofs > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6B6760]">With Proofs</span>
                <span className="font-semibold text-[#2D3330] bg-[#F7F6F1] px-2 py-0.5 rounded-full">
                  {stats.skillsWithProofs}
                </span>
              </div>
            )}
            {stats.skillsWithVerifications > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6B6760]">Verified</span>
                <span className="font-semibold text-[#2D3330] bg-[#F7F6F1] px-2 py-0.5 rounded-full">
                  {stats.skillsWithVerifications}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
