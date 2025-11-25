'use client';

/**
 * ImpactSnapshotCard Widget
 *
 * Displays user's impact metrics and growth indicators
 * Part of the customizable dashboard (PRD F2)
 *
 * Features:
 * - Impact score (composite metric)
 * - Verified skills, impact stories, projects counts
 * - Match quality metrics
 * - Actionable suggestions
 */

import {
  TrendingUp,
  Award,
  BookOpen,
  FolderKanban,
  Target,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Type definitions
interface ImpactSnapshot {
  impactScore: number;
  impactStories: {
    total: number;
    verified: number;
  };
  skills: {
    total: number;
    verified: number;
    pending: number;
  };
  projects: {
    total: number;
    verified: number;
    ongoing: number;
    concluded: number;
  };
  matches: {
    total: number;
    averageScore: number;
    highQuality: number;
  };
  pendingVerifications: number;
  recentActivity: number;
  suggestions: string[];
}

// Get score color based on impact score
function getScoreColor(score: number): { text: string; bg: string; fill: string } {
  if (score >= 70) return { text: '#166534', bg: '#DCFCE7', fill: '#22C55E' };
  if (score >= 40) return { text: '#F59E0B', bg: '#FEF3C7', fill: '#F59E0B' };
  return { text: '#DC2626', bg: '#FEE2E2', fill: '#EF4444' };
}

export function ImpactSnapshotCard() {
  const [snapshot, setSnapshot] = useState<ImpactSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch impact snapshot from API
  useEffect(() => {
    async function fetchSnapshot() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/impact/snapshot');

        if (!response.ok) {
          throw new Error('Failed to fetch impact snapshot');
        }

        const data: ImpactSnapshot = await response.json();
        setSnapshot(data);
      } catch (err) {
        console.error('Error fetching impact snapshot:', err);
        setError(err instanceof Error ? err.message : 'Failed to load impact data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSnapshot();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Impact
          </h5>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1C4D3A' }} />
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Impact
          </h5>
        </div>
        <div className="text-center py-4">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#DC2626' }} />
          <p className="text-xs" style={{ color: '#6B6760' }}>
            {error}
          </p>
        </div>
      </Card>
    );
  }

  // Empty state - no data yet
  if (
    !snapshot ||
    (snapshot.skills.total === 0 &&
      snapshot.impactStories.total === 0 &&
      snapshot.projects.total === 0)
  ) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Impact
          </h5>
        </div>
        <div className="text-center py-6">
          <TrendingUp className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
          <p className="text-xs mb-2" style={{ color: '#6B6760' }}>
            Build your impact profile to showcase your achievements.
          </p>
          <Link
            href="/app/i/expertise"
            className="text-xs hover:underline"
            style={{ color: '#1C4D3A' }}
          >
            Get started →
          </Link>
        </div>
      </Card>
    );
  }

  const scoreColors = getScoreColor(snapshot.impactScore);

  // Impact snapshot view
  return (
    <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
          Impact
        </h5>
        <Link
          href="/app/i/expertise"
          className="text-xs hover:underline"
          style={{ color: '#1C4D3A' }}
        >
          Details
        </Link>
      </div>

      {/* Impact Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: scoreColors.fill }} />
            <span className="text-sm font-medium" style={{ color: '#2D3330' }}>
              Impact Score
            </span>
          </div>
          <span className="text-lg font-bold" style={{ color: scoreColors.text }}>
            {snapshot.impactScore}
          </span>
        </div>
        <Progress
          value={snapshot.impactScore}
          className="h-2"
          style={{ backgroundColor: '#E8E6DD' }}
        />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Verified Skills */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Award className="w-3.5 h-3.5" style={{ color: '#1C4D3A' }} />
          </div>
          <p className="text-lg font-semibold" style={{ color: '#2D3330' }}>
            {snapshot.skills.verified}
          </p>
          <p className="text-[10px]" style={{ color: '#6B6760' }}>
            Verified Skills
          </p>
        </div>

        {/* Impact Stories */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <BookOpen className="w-3.5 h-3.5" style={{ color: '#9333EA' }} />
          </div>
          <p className="text-lg font-semibold" style={{ color: '#2D3330' }}>
            {snapshot.impactStories.total}
          </p>
          <p className="text-[10px]" style={{ color: '#6B6760' }}>
            Impact Stories
          </p>
        </div>

        {/* Projects */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <FolderKanban className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />
          </div>
          <p className="text-lg font-semibold" style={{ color: '#2D3330' }}>
            {snapshot.projects.total}
          </p>
          <p className="text-[10px]" style={{ color: '#6B6760' }}>
            Projects
          </p>
        </div>
      </div>

      {/* Match Quality */}
      {snapshot.matches.total > 0 && (
        <div className="mb-4 p-2 rounded" style={{ backgroundColor: 'rgba(232, 230, 221, 0.4)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" style={{ color: '#1C4D3A' }} />
              <span className="text-xs" style={{ color: '#2D3330' }}>
                Match Quality
              </span>
            </div>
            <span className="text-xs font-medium" style={{ color: '#1C4D3A' }}>
              {snapshot.matches.highQuality} high-quality
            </span>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {snapshot.suggestions.length > 0 && (
        <div
          className="pt-3 border-t space-y-1.5"
          style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Lightbulb className="w-3 h-3" style={{ color: '#F59E0B' }} />
            <span
              className="text-[10px] font-medium uppercase tracking-wide"
              style={{ color: '#6B6760' }}
            >
              Tips
            </span>
          </div>
          {snapshot.suggestions.slice(0, 2).map((suggestion, idx) => (
            <p key={idx} className="text-xs" style={{ color: '#6B6760' }}>
              • {suggestion}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}
