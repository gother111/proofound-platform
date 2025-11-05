'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Loader2, AlertCircle, CheckCircle, Clock, XCircle, Pause } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { AddProjectDialog } from './AddProjectDialog';

interface Project {
  id: string;
  title: string;
  description: string;
  impactCreated: string;
  businessValue: string;
  outcomes: string;
  startDate: string;
  endDate: string | null;
  status: 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled';
  isVerified: boolean;
  createdAt: string;
}

interface ProjectsManagerProps {
  orgId: string;
}

const STATUS_CONFIG = {
  planning: { icon: Clock, label: 'Planning', color: 'text-blue-600 bg-blue-100' },
  active: { icon: CheckCircle, label: 'Active', color: 'text-green-600 bg-green-100' },
  completed: { icon: CheckCircle, label: 'Completed', color: 'text-gray-600 bg-gray-100' },
  on_hold: { icon: Pause, label: 'On Hold', color: 'text-amber-600 bg-amber-100' },
  cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-red-600 bg-red-100' },
};

export function ProjectsManager({ orgId }: ProjectsManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/organizations/${orgId}/projects`);

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [orgId]);

  const handleSave = async (projectData: Partial<Project>) => {
    try {
      const isUpdate = !!projectData.id;
      const url = isUpdate
        ? `/api/organizations/${orgId}/projects/${projectData.id}`
        : `/api/organizations/${orgId}/projects`;

      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${isUpdate ? 'update' : 'create'} project`);
      }

      const savedProject = await response.json();

      if (isUpdate) {
        setProjects(projects.map((p) => (p.id === savedProject.id ? savedProject : p)));
        toast.success('Project updated successfully');
      } else {
        setProjects([...projects, savedProject]);
        toast.success('Project created successfully');
      }

      setEditingProject(null);
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
      throw err;
    }
  };

  const handleDelete = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${orgId}/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete project');
      }

      setProjects(projects.filter((p) => p.id !== project.id));
      toast.success('Project deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
      console.error('Error deleting project:', err);
    }
  };

  const handleAdd = () => {
    setEditingProject(null);
    setDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-['Crimson_Pro'] font-semibold text-proofound-forest dark:text-primary">
            Projects
          </h2>
          <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
            Showcase your organization's key projects and their impact
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-proofound-forest hover:bg-proofound-forest/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start by adding your first project to showcase your work
            </p>
            <Button onClick={handleAdd} className="bg-proofound-forest hover:bg-proofound-forest/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => {
            const StatusIcon = STATUS_CONFIG[project.status].icon;
            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        {project.isVerified && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_CONFIG[project.status].color
                        }`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {STATUS_CONFIG[project.status].label}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                    {project.description}
                  </p>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-proofound-charcoal/60">Impact Created</p>
                      <p className="text-sm">{project.impactCreated}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-proofound-charcoal/60">Business Value</p>
                      <p className="text-sm">{project.businessValue}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-proofound-charcoal/60">Outcomes</p>
                      <p className="text-sm">{project.outcomes}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {new Date(project.startDate).toLocaleDateString()} -{' '}
                      {project.endDate
                        ? new Date(project.endDate).toLocaleDateString()
                        : 'Ongoing'}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(project)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(project)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <AddProjectDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingProject(null);
          }
        }}
        onSave={handleSave}
        existingProject={editingProject}
      />
    </div>
  );
}
