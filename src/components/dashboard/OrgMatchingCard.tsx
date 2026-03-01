'use client';

/**
 * OrgMatchingCard Widget
 *
 * Displays organization's candidate pipeline for active assignments
 * Part of the org dashboard (PRD O8)
 *
 * Features:
 * - Shows open assignments count
 * - Displays candidate pipeline stages (matches, shortlist, intros)
 * - Match quality indicators
 * - Quick links to view candidates
 */

import {
  Sparkles,
  Loader2,
  AlertCircle,
  Users,
  UserCheck,
  MessageCircle,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Star,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/fetch';

interface OrgMatchingCardProps {
  orgSlug: string;
  className?: string;
  initialData?: any;
  onVisibilityChange?: (visible: boolean) => void;
}

// Dashboard data types
interface OrgDashboard {
  pipeline: {
    openAssignments: number;
    totalAssignments: number;
    shortlists: number;
    intros: number;
    matches: {
      totalMatches: number;
      averageScore: number;
      highQuality: number;
      assignmentsWithMatches: number;
    };
  };
  assignments: {
    total: number;
    active: number;
    draft: number;
    paused: number;
    closed: number;
  };
  activity?: {
    newMatchesThisWeek: number;
    pendingActions: string | null;
  };
}

// Pipeline stage config
const pipelineStages = [
  { key: 'matches', label: 'Matches', icon: Users, color: '#3B82F6', bg: '#DBEAFE' },
  { key: 'shortlists', label: 'Shortlist', icon: UserCheck, color: '#1C4D3A', bg: '#D8EDE4' },
  { key: 'intros', label: 'Intros', icon: MessageCircle, color: '#9333EA', bg: '#F3E8FF' },
];

export function OrgMatchingCard({
  orgSlug,
  className,
  initialData,
  onVisibilityChange,
}: OrgMatchingCardProps) {
  const [dashboard, setDashboard] = useState<OrgDashboard | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch org dashboard data
  useEffect(() => {
    if (initialData) {
      setDashboard(initialData);
      setIsLoading(false);
      return;
    }

    async function fetchDashboard() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiFetch(`/api/org/${orgSlug}/dashboard`);

        if (!response.ok) {
          throw new Error('Failed to fetch pipeline data');
        }

        const data: OrgDashboard = await response.json();
        setDashboard(data);
      } catch (err) {
        console.error('Error fetching org dashboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load pipeline');
      } finally {
        setIsLoading(false);
      }
    }

    if (orgSlug) {
      fetchDashboard();
    }
  }, [orgSlug, initialData]);

  useEffect(() => {
    if (isLoading) return;
    const hasVisibleContent = error
      ? true
      : Boolean(dashboard && dashboard.pipeline.openAssignments > 0);
    onVisibilityChange?.(hasVisibleContent);
  }, [dashboard, error, isLoading, onVisibilityChange]);

  // Loading state
  if (isLoading) {
    return (
      <Card
        className={`p-4 border ${className || ''}`}
        style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Candidate Pipeline
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
      <Card
        className={`p-4 border ${className || ''}`}
        style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Candidate Pipeline
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

  // No active assignments state
  if (!dashboard || dashboard.pipeline.openAssignments === 0) {
    return (
      <Card
        className={`p-4 border ${className || ''}`}
        style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Candidate Pipeline
          </h5>
        </div>
        <div className="text-center py-6">
          <Sparkles className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
          <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
            Create an assignment to start matching with candidates.
          </p>
          <Link href={`/app/o/${orgSlug}/assignments/new`}>
            <Button
              size="sm"
              className="h-7 text-xs"
              style={{
                backgroundColor: isHovered ? '#2D5F4A' : '#1C4D3A',
                color: '#F7F6F1',
                transition: 'background-color 200ms',
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Briefcase className="w-3 h-3 mr-1" />
              Create assignment
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const { pipeline, assignments } = dashboard;
  const matchData = pipeline.matches;

  // Pipeline view
  return (
    <Card
      className={`p-4 border ${className || ''}`}
      style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Candidate Pipeline
          </h5>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ backgroundColor: '#D8EDE4', color: '#1C4D3A' }}
          >
            {pipeline.openAssignments} active
          </span>
        </div>
        <Link
          href={`/app/o/${orgSlug}/matching`}
          className="text-xs hover:underline"
          style={{ color: '#1C4D3A' }}
        >
          View all
        </Link>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Matches */}
        <div
          className="p-3 rounded-lg text-center"
          style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
        >
          <Users className="w-5 h-5 mx-auto mb-1" style={{ color: '#3B82F6' }} />
          <p className="text-lg font-bold" style={{ color: '#2D3330' }}>
            {matchData.totalMatches}
          </p>
          <p className="text-[10px]" style={{ color: '#6B6760' }}>
            Matches
          </p>
        </div>

        {/* Shortlist */}
        <div
          className="p-3 rounded-lg text-center"
          style={{ backgroundColor: 'rgba(28, 77, 58, 0.1)' }}
        >
          <UserCheck className="w-5 h-5 mx-auto mb-1" style={{ color: '#1C4D3A' }} />
          <p className="text-lg font-bold" style={{ color: '#2D3330' }}>
            {pipeline.shortlists}
          </p>
          <p className="text-[10px]" style={{ color: '#6B6760' }}>
            Shortlist
          </p>
          <div className="mt-2">
            <Link
              href={`/app/o/${orgSlug}/shortlist`}
              className="text-[11px] font-medium hover:underline"
              style={{ color: '#1C4D3A' }}
            >
              Open shortlist <ArrowRight className="w-3 h-3 inline-block ml-1 align-middle" />
            </Link>
          </div>
        </div>

        {/* Intros */}
        <div
          className="p-3 rounded-lg text-center"
          style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}
        >
          <MessageCircle className="w-5 h-5 mx-auto mb-1" style={{ color: '#9333EA' }} />
          <p className="text-lg font-bold" style={{ color: '#2D3330' }}>
            {pipeline.intros}
          </p>
          <p className="text-[10px]" style={{ color: '#6B6760' }}>
            Intros
          </p>
        </div>
      </div>

      {/* Match Quality */}
      {matchData.highQuality > 0 && (
        <div
          className="mb-4 p-2.5 rounded-lg flex items-center justify-between"
          style={{ backgroundColor: 'rgba(232, 230, 221, 0.4)' }}
        >
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4" style={{ color: '#F59E0B' }} />
            <span className="text-xs" style={{ color: '#2D3330' }}>
              High-quality matches
            </span>
          </div>
          <span className="text-sm font-semibold" style={{ color: '#1C4D3A' }}>
            {matchData.highQuality}
          </span>
        </div>
      )}

      {/* Average Score */}
      {matchData.averageScore > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: '#6B6760' }}>
              Average Match Score
            </span>
            <span className="text-xs font-medium" style={{ color: '#1C4D3A' }}>
              {Math.round(matchData.averageScore)}%
            </span>
          </div>
          <Progress
            value={matchData.averageScore}
            className="h-1.5"
            style={{ backgroundColor: '#E8E6DD' }}
          />
        </div>
      )}

      {/* Pending Actions */}
      {dashboard.activity?.pendingActions && (
        <div
          className="mb-4 p-2.5 rounded-lg border-l-2"
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderColor: '#F59E0B',
          }}
        >
          <p className="text-xs" style={{ color: '#6B6760' }}>
            {dashboard.activity.pendingActions}
          </p>
        </div>
      )}

      {/* Footer */}
      <div
        className="pt-3 border-t flex items-center justify-between"
        style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
      >
        <div className="flex items-center gap-1 text-xs" style={{ color: '#6B6760' }}>
          <Briefcase className="w-3 h-3" />
          <span>{assignments.total} total assignments</span>
        </div>
        <Link href={`/app/o/${orgSlug}/matching`}>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            style={{ color: '#1C4D3A' }}
          >
            Review
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
