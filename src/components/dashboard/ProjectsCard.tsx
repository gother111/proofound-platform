'use client';

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
  Building2,
  Clock3,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/fetch';

interface IndividualProject {
  id: string;
  title: string;
  description?: string | null;
  projectType: 'work' | 'volunteer' | 'education' | 'side_project' | 'hobby';
  status: 'ongoing' | 'concluded' | 'paused' | 'archived';
  startDate: string;
  endDate?: string | null;
  organizationName?: string | null;
  roleTitle?: string | null;
}

interface OrganizationProject {
  id: string;
  title: string;
  description?: string | null;
  status: 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled';
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string | null;
}

interface IndividualProjectsStats {
  total: number;
  ongoing: number;
  concluded: number;
  paused: number;
}

interface OrganizationProjectsStats {
  total: number;
  active: number;
  planning: number;
  completed: number;
  onHold: number;
  cancelled: number;
}

interface ProjectsCardProps {
  persona?: 'individual' | 'organization';
  orgId?: string;
  orgSlug?: string;
  onVisibilityChange?: (visible: boolean) => void;
}

const projectTypeConfig = {
  work: { label: 'Work', icon: Briefcase, color: '#1C4D3A', bg: '#D8EDE4' },
  volunteer: { label: 'Volunteer', icon: Heart, color: '#DC2626', bg: '#FEE2E2' },
  education: { label: 'Education', icon: GraduationCap, color: '#9333EA', bg: '#F3E8FF' },
  side_project: { label: 'Side Project', icon: Lightbulb, color: '#F59E0B', bg: '#FEF3C7' },
  hobby: { label: 'Hobby', icon: Gamepad2, color: '#3B82F6', bg: '#DBEAFE' },
};

const organizationStatusConfig = {
  active: { label: 'Active', icon: Briefcase, color: '#1C4D3A', bg: '#D8EDE4' },
  planning: { label: 'Planning', icon: Clock3, color: '#1E40AF', bg: '#DBEAFE' },
  completed: { label: 'Completed', icon: CheckCircle, color: '#166534', bg: '#DCFCE7' },
  on_hold: { label: 'On Hold', icon: PauseCircle, color: '#F59E0B', bg: '#FEF3C7' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, color: '#6B6760', bg: '#E8E6DD' },
};

function formatDateRange(startDate?: string | null, endDate?: string | null): string {
  if (!startDate) return 'No timeline set';

  const start = new Date(startDate);
  const startStr = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  if (!endDate) {
    return `${startStr} - Present`;
  }

  const end = new Date(endDate);
  const endStr = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return `${startStr} - ${endStr}`;
}

function normalizeOrganizationProject(raw: Record<string, any>): OrganizationProject {
  const statusRaw = String(raw.status || '').toLowerCase();
  const normalizedStatus: OrganizationProject['status'] =
    statusRaw === 'planning' ||
    statusRaw === 'active' ||
    statusRaw === 'completed' ||
    statusRaw === 'on_hold' ||
    statusRaw === 'cancelled'
      ? statusRaw
      : 'active';

  return {
    id: String(raw.id),
    title: String(raw.title || 'Untitled project'),
    description: raw.description ?? null,
    status: normalizedStatus,
    startDate: raw.start_date ?? raw.startDate ?? null,
    endDate: raw.end_date ?? raw.endDate ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? null,
  };
}

function getOrgProjectsPath(orgSlug?: string): string {
  return orgSlug ? `/app/o/${orgSlug}/projects` : '/app/o';
}

function computeOrganizationStats(projects: OrganizationProject[]): OrganizationProjectsStats {
  return {
    total: projects.length,
    active: projects.filter((project) => project.status === 'active').length,
    planning: projects.filter((project) => project.status === 'planning').length,
    completed: projects.filter((project) => project.status === 'completed').length,
    onHold: projects.filter((project) => project.status === 'on_hold').length,
    cancelled: projects.filter((project) => project.status === 'cancelled').length,
  };
}

export function ProjectsCard({
  persona = 'individual',
  orgId,
  orgSlug,
  onVisibilityChange,
}: ProjectsCardProps) {
  const [individualProjects, setIndividualProjects] = useState<IndividualProject[]>([]);
  const [organizationProjects, setOrganizationProjects] = useState<OrganizationProject[]>([]);
  const [individualStats, setIndividualStats] = useState<IndividualProjectsStats | null>(null);
  const [organizationStats, setOrganizationStats] = useState<OrganizationProjectsStats | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setIsLoading(true);
        setError(null);

        if (persona === 'organization') {
          if (!orgId) {
            throw new Error('Organization context is missing');
          }

          const response = await apiFetch(`/api/organizations/${orgId}/projects`);
          if (!response.ok) {
            throw new Error('Failed to fetch organization projects');
          }

          const data = await response.json();
          const normalized = ((data.projects as Record<string, any>[] | undefined) || []).map(
            normalizeOrganizationProject
          );

          setOrganizationProjects(
            normalized.filter((project) => project.status !== 'cancelled').slice(0, 3)
          );
          setOrganizationStats(computeOrganizationStats(normalized));
          setIndividualProjects([]);
          setIndividualStats(null);
          return;
        }

        const response = await apiFetch('/api/projects?limit=5');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        const activeProjects = ((data.projects as IndividualProject[] | undefined) || []).filter(
          (project) => project.status !== 'archived'
        );

        setIndividualProjects(activeProjects.slice(0, 3));
        setIndividualStats(data.stats || null);
        setOrganizationProjects([]);
        setOrganizationStats(null);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [orgId, persona]);

  useEffect(() => {
    if (isLoading) return;

    const projectCount =
      persona === 'organization' ? organizationProjects.length : individualProjects.length;
    const hasVisibleContent = error ? true : projectCount > 0;
    onVisibilityChange?.(hasVisibleContent);
  }, [
    error,
    individualProjects.length,
    isLoading,
    onVisibilityChange,
    organizationProjects.length,
    persona,
  ]);

  if (isLoading) {
    return (
      <Card variant="bento" className="p-4">
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

  if (error) {
    return (
      <Card variant="bento" className="p-4">
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

  if (persona === 'organization') {
    const organizationPath = getOrgProjectsPath(orgSlug);
    const stats =
      organizationStats ||
      computeOrganizationStats(
        organizationProjects.map((project) => ({
          ...project,
          status: project.status,
        }))
      );

    if (organizationProjects.length === 0) {
      return (
        <Card variant="bento" className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
              Projects
            </h5>
          </div>

          <div className="text-center py-6">
            <Building2 className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
            <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
              Add organization projects to showcase current work and outcomes.
            </p>
            <Link href={organizationPath}>
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

    return (
      <Card variant="bento" className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
              Projects
            </h5>
            {stats.active > 0 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: '#D8EDE4', color: '#1C4D3A' }}
              >
                {stats.active} active
              </span>
            )}
          </div>
          <Link
            href={organizationPath}
            className="text-xs hover:underline"
            style={{ color: '#1C4D3A' }}
          >
            View all
          </Link>
        </div>

        <div className="space-y-3">
          {organizationProjects.map((project) => {
            const config = organizationStatusConfig[project.status];
            const StatusIcon = config.icon;

            return (
              <div key={project.id} className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <StatusIcon
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: config.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: '#2D3330' }}>
                        {project.title}
                      </p>
                      <p className="text-xs truncate" style={{ color: '#6B6760' }}>
                        {project.description?.trim() ||
                          formatDateRange(project.startDate, project.endDate)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 flex-shrink-0"
                    style={{ backgroundColor: config.bg, color: config.color }}
                  >
                    {config.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="mt-4 pt-3 border-t flex items-center justify-between"
          style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
        >
          <div className="flex items-center gap-3 text-xs" style={{ color: '#6B6760' }}>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" style={{ color: '#166534' }} />
              {stats.completed} completed
            </span>
            {stats.onHold > 0 && (
              <span className="flex items-center gap-1">
                <PauseCircle className="w-3 h-3" style={{ color: '#F59E0B' }} />
                {stats.onHold} on hold
              </span>
            )}
          </div>
          <Link href={organizationPath}>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              style={{ color: '#1C4D3A' }}
            >
              Manage
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (individualProjects.length === 0) {
    return (
      <Card variant="bento" className="p-4">
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

  return (
    <Card variant="bento" className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Projects
          </h5>
          {individualStats && individualStats.ongoing > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: '#D8EDE4', color: '#1C4D3A' }}
            >
              {individualStats.ongoing} active
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

      <div className="space-y-3">
        {individualProjects.map((project) => {
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

      {individualStats && (
        <div
          className="mt-4 pt-3 border-t flex items-center justify-between"
          style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
        >
          <div className="flex items-center gap-3 text-xs" style={{ color: '#6B6760' }}>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" style={{ color: '#166534' }} />
              {individualStats.concluded} completed
            </span>
            {individualStats.paused > 0 && (
              <span className="flex items-center gap-1">
                <PauseCircle className="w-3 h-3" style={{ color: '#F59E0B' }} />
                {individualStats.paused} paused
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
