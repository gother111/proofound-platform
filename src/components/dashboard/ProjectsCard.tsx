'use client';

/**
 * ProjectsCard Widget
 *
 * Displays user's projects with status and recency info
 * Part of the customizable dashboard (PRD F2)
 *
 * Features:
 * - Shows current active/ongoing projects
 * - Project type badges
 * - Organization and role info
 * - Quick stats summary
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FolderKanban,
  Plus,
  Briefcase,
  Heart,
  GraduationCap,
  Lightbulb,
  Gamepad2,
  Loader2,
  AlertCircle,
  CheckCircle,
  PauseCircle,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Type definitions
interface Project {
  id: string;
  title: string;
  description?: string | null;
  projectType: 'work' | 'volunteer' | 'education' | 'side_project' | 'hobby';
  status: 'ongoing' | 'concluded' | 'paused' | 'archived';
  startDate: string;
  endDate?: string | null;
  organizationName?: string | null;
  roleTitle?: string | null;
  impactSummary?: string | null;
  verified: boolean;
  tags?: string[] | null;
}

interface ProjectsStats {
  total: number;
  ongoing: number;
  concluded: number;
  paused: number;
}

// Project type config
const projectTypeConfig = {
  work: { label: 'Work', icon: Briefcase, color: '#1C4D3A', bg: '#D8EDE4' },
  volunteer: { label: 'Volunteer', icon: Heart, color: '#DC2626', bg: '#FEE2E2' },
  education: { label: 'Education', icon: GraduationCap, color: '#9333EA', bg: '#F3E8FF' },
  side_project: { label: 'Side Project', icon: Lightbulb, color: '#F59E0B', bg: '#FEF3C7' },
  hobby: { label: 'Hobby', icon: Gamepad2, color: '#3B82F6', bg: '#DBEAFE' },
};

// Status config
const statusConfig = {
  ongoing: { label: 'Ongoing', icon: ExternalLink, color: '#1C4D3A', bg: '#D8EDE4' },
  concluded: { label: 'Concluded', icon: CheckCircle, color: '#166534', bg: '#DCFCE7' },
  paused: { label: 'Paused', icon: PauseCircle, color: '#F59E0B', bg: '#FEF3C7' },
  archived: { label: 'Archived', icon: FolderKanban, color: '#6B6760', bg: '#E8E6DD' },
};

// Format date range
function formatDateRange(startDate: string, endDate?: string | null): string {
  const start = new Date(startDate);
  const startStr = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  if (!endDate) {
    return `${startStr} - Present`;
  }

  const end = new Date(endDate);
  const endStr = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return `${startStr} - ${endStr}`;
}

export function ProjectsCard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch projects from API
  useEffect(() => {
    async function fetchProjects() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/projects?limit=5');

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        // Filter out archived and show active projects first
        const activeProjects = data.projects.filter((p: Project) => p.status !== 'archived');
        setProjects(activeProjects.slice(0, 3));
        setStats(data.stats);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Projects
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
            Projects
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

  // Empty state
  if (projects.length === 0) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Projects
          </h5>
        </div>

        <div className="text-center py-6">
          <FolderKanban className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
          <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
            Add your projects to showcase your experience and build stronger matches.
          </p>
          <Link href="/app/i/projects/new">
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
              <Plus className="w-3 h-3 mr-1" />
              Add Project
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Projects list view
  return (
    <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Projects
          </h5>
          {stats && stats.ongoing > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: '#D8EDE4', color: '#1C4D3A' }}
            >
              {stats.ongoing} active
            </span>
          )}
        </div>
        <Link
          href="/app/i/projects"
          className="text-xs hover:underline"
          style={{ color: '#1C4D3A' }}
        >
          View all
        </Link>
      </div>

      {/* Projects list */}
      <div className="space-y-3">
        {projects.map((project) => {
          const typeConfig = projectTypeConfig[project.projectType];
          const TypeIcon = typeConfig.icon;

          return (
            <div key={project.id} className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <TypeIcon
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: typeConfig.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: '#2D3330' }}>
                      {project.title}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#6B6760' }}>
                      {project.organizationName ||
                        project.roleTitle ||
                        formatDateRange(project.startDate, project.endDate)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 flex-shrink-0"
                  style={{ backgroundColor: typeConfig.bg, color: typeConfig.color }}
                >
                  {typeConfig.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick stats footer */}
      {stats && (
        <div
          className="mt-4 pt-3 border-t flex items-center justify-between"
          style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
        >
          <div className="flex items-center gap-3 text-xs" style={{ color: '#6B6760' }}>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" style={{ color: '#166534' }} />
              {stats.concluded} completed
            </span>
            {stats.paused > 0 && (
              <span className="flex items-center gap-1">
                <PauseCircle className="w-3 h-3" style={{ color: '#F59E0B' }} />
                {stats.paused} paused
              </span>
            )}
          </div>
          <Link href="/app/i/projects/new">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              style={{ color: '#1C4D3A' }}
            >
              <Plus className="w-3 h-3 mr-1" />
              New
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
