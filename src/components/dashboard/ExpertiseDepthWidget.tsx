/**
 * Expertise Depth Widget Component
 * 
 * Displays real-time expertise statistics for the dashboard tile.
 * Fetches data from /api/expertise/stats endpoint.
 */

'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

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
          <button
            onClick={fetchStats}
            className="text-xs text-[#1C4D3A] hover:underline mt-1"
          >
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

  const progressWidth = Math.min(stats.progressPercentage, 100);

  return (
    <div className="text-sm text-[#6B6760]">
      <p>Your skill proficiency levels</p>
      <div className="mt-4 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs">L4 Skills</span>
            <span className="text-xs font-semibold text-[#2D3330]">
              {stats.totalL4Skills}
            </span>
          </div>
          <div className="h-2 bg-[#F5F4F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1C4D3A] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          {stats.totalL4Skills < stats.activationThreshold && (
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activationThreshold - stats.totalL4Skills} more to reach activation threshold
            </p>
          )}
        </div>
        
        {(stats.skillsWithProofs > 0 || stats.skillsWithVerifications > 0) && (
          <div className="pt-2 border-t border-[#E8E6DD] space-y-1.5">
            {stats.skillsWithProofs > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">With Proofs</span>
                <span className="font-medium text-[#2D3330]">
                  {stats.skillsWithProofs}
                </span>
              </div>
            )}
            {stats.skillsWithVerifications > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Verified</span>
                <span className="font-medium text-[#2D3330]">
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

