'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/fetch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProjectCard } from './ProjectCard';
import { ProjectForm } from './ProjectForm';
import { Plus, FolderOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OrganizationProject {
  id: string;
  title: string;
  description: string;
  impactCreated: string;
  businessValue: string;
  outcomes: string;
  startDate: string;
  endDate?: string;
  status: 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsListProps {
  orgId: string;
  canEdit?: boolean;
}

export function ProjectsList({ orgId, canEdit = true }: ProjectsListProps) {
  const [projects, setProjects] = useState<OrganizationProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<OrganizationProject | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const fetchProjects = async () => {
    try {
      const response = await apiFetch(`/api/organizations/${orgId}/projects`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProject = async (
    project: Omit<OrganizationProject, 'id' | 'isVerified' | 'createdAt' | 'updatedAt'> & {
      id?: string;
    }
  ) => {
    try {
      const url = project.id
        ? `/api/organizations/${orgId}/projects/${project.id}`
        : `/api/organizations/${orgId}/projects`;

      const method = project.id ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        throw new Error('Failed to save project');
      }

      toast.success(project.id ? 'Project updated' : 'Project created');
      await fetchProjects();
      setShowProjectForm(false);
      setEditingProject(null);
    } catch (error) {
      toast.error('Failed to save project');
      throw error;
    }
  };

  const handleEdit = (project: OrganizationProject) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiFetch(`/api/organizations/${orgId}/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      toast.success('Project deleted');
      await fetchProjects();
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  // Filter projects by status
  const filteredProjects =
    statusFilter === 'all' ? projects : projects.filter((p) => p.status === statusFilter);

  const isEmpty = projects.length === 0;

  if (isLoading) {
    return (
      <Card className="border-black/5 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-12">
          <div className="text-center">
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-black/5 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Organization Projects
              </CardTitle>
              <CardDescription className="mt-1">
                Manage and showcase your organization&apos;s project portfolio
              </CardDescription>
            </div>
            {canEdit && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingProject(null);
                  setShowProjectForm(true);
                }}
                className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isEmpty && canEdit ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-proofound-forest/10 to-proofound-sage/10 flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-proofound-forest/60" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Start documenting your organization&apos;s projects to showcase work, outcomes, and
                business value delivered.
              </p>
              <Button
                onClick={() => setShowProjectForm(true)}
                className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Project
              </Button>
            </div>
          ) : isEmpty && !canEdit ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No projects available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="status-filter" className="text-sm font-medium">
                    Filter by status:
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredProjects.length} of {projects.length} projects
                </div>
              </div>

              {/* Projects Grid */}
              {filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No projects match the selected filter
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      canEdit={canEdit}
                      onEdit={handleEdit}
                      onDelete={(id) => setDeleteConfirm(id)}
                    />
                  ))}
                </div>
              )}

              {/* Info Banner */}
              {projects.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-300">
                    <p className="font-medium mb-1">Project visibility</p>
                    <p className="text-blue-700 dark:text-blue-400">
                      Projects help candidates understand your organization&apos;s work and can be
                      linked to specific assignments during matching.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Form Dialog */}
      <ProjectForm
        open={showProjectForm}
        onOpenChange={(open) => {
          setShowProjectForm(open);
          if (!open) setEditingProject(null);
        }}
        project={editingProject}
        onSave={handleSaveProject}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The project will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
