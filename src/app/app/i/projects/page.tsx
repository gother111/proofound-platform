/**
 * Projects Page - Individual
 * 
 * Manage work, volunteer, education, and side projects
 * Link skills to projects for Expertise Atlas
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, Briefcase, Heart, GraduationCap, Code, Filter, LayoutGrid, List as ListIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectForm } from '@/components/profile/forms/ProjectForm';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  title: string;
  type: 'work' | 'volunteer' | 'education' | 'side';
  status: 'ongoing' | 'concluded' | 'paused' | 'archived';
  startDate: Date;
  endDate?: Date;
  description?: string;
  organization?: string;
  skillsCount?: number;
  outcomes?: string[];
}

const PROJECT_TYPE_ICONS = {
  work: Briefcase,
  volunteer: Heart,
  education: GraduationCap,
  side: Code,
};

const PROJECT_TYPE_LABELS = {
  work: 'Work',
  volunteer: 'Volunteer',
  education: 'Education',
  side: 'Side Project',
};

const STATUS_COLORS = {
  ongoing: 'bg-green-100 text-green-800 border-green-200',
  concluded: 'bg-gray-100 text-gray-800 border-gray-200',
  paused: 'bg-blue-100 text-blue-800 border-blue-200',
  archived: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectCreated = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
    setIsCreateDialogOpen(false);
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    if (filterType !== 'all' && project.type !== filterType) return false;
    if (filterStatus !== 'all' && project.status !== filterStatus) return false;
    return true;
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3330]">Projects</h1>
          <p className="text-sm text-[#6B6760]">
            Track your work and link skills to build your Expertise Atlas
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#4A5943] hover:bg-[#3A4733]">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <ProjectForm onSuccess={handleProjectCreated} onCancel={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="volunteer">Volunteer</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="side">Side Project</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="concluded">Concluded</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 border rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('grid')}
            className={cn(viewMode === 'grid' && 'bg-[#EEF1EA]')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className={cn(viewMode === 'list' && 'bg-[#EEF1EA]')}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Project Cards */}
      {sortedProjects.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <Briefcase className="h-16 w-16 mx-auto text-[#6B6760] opacity-50" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-[#2D3330]">
              No projects yet
            </p>
            <p className="text-sm text-[#6B6760] max-w-md mx-auto">
              Add your first project to start building your Expertise Atlas. Link skills to your work and track your impact.
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#4A5943] hover:bg-[#3A4733]">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Project
          </Button>
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        )}>
          {sortedProjects.map((project) => {
            const Icon = PROJECT_TYPE_ICONS[project.type];
            return (
              <Card
                key={project.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => window.location.href = `/app/i/projects/${project.id}`}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-[#EEF1EA] rounded-lg">
                        <Icon className="h-5 w-5 text-[#4A5943]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#2D3330] truncate">
                          {project.title}
                        </h3>
                        {project.organization && (
                          <p className="text-sm text-[#6B6760] truncate">
                            {project.organization}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[project.status])}>
                      {project.status}
                    </Badge>
                  </div>

                  {/* Date Range */}
                  <div className="text-sm text-[#6B6760]">
                    {format(new Date(project.startDate), 'MMM yyyy')} -{' '}
                    {project.endDate ? format(new Date(project.endDate), 'MMM yyyy') : 'Present'}
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-sm text-[#6B6760] line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Skills and Outcomes */}
                  <div className="flex items-center gap-3 text-xs text-[#6B6760]">
                    {project.skillsCount !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-[#4A5943]">{project.skillsCount}</span>
                        <span>skills</span>
                      </div>
                    )}
                    {project.outcomes && project.outcomes.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-[#4A5943]">{project.outcomes.length}</span>
                        <span>outcomes</span>
                      </div>
                    )}
                  </div>

                  {/* Type Badge */}
                  <Badge variant="outline" className="text-xs border-[#7A9278] text-[#4A5943]">
                    {PROJECT_TYPE_LABELS[project.type]}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
