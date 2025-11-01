/**
 * Project Detail Page
 * 
 * View and edit project details
 * TODO: Add tabs for Skills, Outcomes, Artifacts, Verification
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjectForm } from '@/components/profile/forms/ProjectForm';
import { format } from 'date-fns';

interface Project {
  id: string;
  title: string;
  type: 'work' | 'volunteer' | 'education' | 'side';
  status: 'ongoing' | 'concluded' | 'paused' | 'archived';
  startDate: string;
  endDate?: string;
  description?: string;
  organization?: string;
  role?: string;
}

const STATUS_COLORS = {
  ongoing: 'bg-green-100 text-green-800 border-green-200',
  concluded: 'bg-gray-100 text-gray-800 border-gray-200',
  paused: 'bg-blue-100 text-blue-800 border-blue-200',
  archived: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadProject();
  }, [params.id]);

  const loadProject = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      } else {
        router.push('/app/i/projects');
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to archive this project?')) return;

    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/app/i/projects');
      } else {
        alert('Failed to delete project');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    }
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProject(updatedProject);
    setIsEditDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <p>Project not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push('/app/i/projects')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Archive
          </Button>
        </div>
      </div>

      {/* Project Details */}
      <Card className="p-8">
        <div className="space-y-6">
          {/* Title and Status */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#2D3330]">{project.title}</h1>
              {project.organization && (
                <p className="text-lg text-[#6B6760] mt-1">{project.organization}</p>
              )}
              {project.role && (
                <p className="text-sm text-[#6B6760] mt-1">{project.role}</p>
              )}
            </div>
            <Badge variant="outline" className={STATUS_COLORS[project.status]}>
              {project.status}
            </Badge>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 text-[#6B6760]">
            <span>
              {format(new Date(project.startDate), 'MMMM yyyy')} -{' '}
              {project.endDate ? format(new Date(project.endDate), 'MMMM yyyy') : 'Present'}
            </span>
          </div>

          {/* Description */}
          {project.description && (
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-[#2D3330] mb-2">Description</h3>
              <p className="text-[#6B6760] whitespace-pre-wrap">{project.description}</p>
            </div>
          )}

          {/* TODO: Add tabs for Skills, Outcomes, Artifacts, Verification */}
          <div className="pt-6 border-t">
            <p className="text-sm text-[#6B6760]">
              Skills, outcomes, and artifacts features coming soon. For now, you can edit the basic project details.
            </p>
          </div>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <ProjectForm
            initialData={{
              title: project.title,
              type: project.type,
              status: project.status,
              startDate: project.startDate,
              endDate: project.endDate,
              description: project.description,
              organization: project.organization,
              role: project.role,
              isOngoing: !project.endDate,
            }}
            projectId={project.id}
            onSuccess={handleProjectUpdated}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

