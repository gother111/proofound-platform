'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit2, Trash2, Calendar, CheckCircle2, Target } from 'lucide-react';

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

interface ProjectCardProps {
  project: OrganizationProject;
  canEdit: boolean;
  onEdit: (project: OrganizationProject) => void;
  onDelete: (id: string) => void;
}

const STATUS_COLORS = {
  planning: 'bg-blue-100 text-blue-700 border-blue-300',
  active: 'bg-green-100 text-green-700 border-green-300',
  completed: 'bg-purple-100 text-purple-700 border-purple-300',
  on_hold: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-300',
};

const STATUS_LABELS = {
  planning: 'Planning',
  active: 'Active',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

export function ProjectCard({ project, canEdit, onEdit, onDelete }: ProjectCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="border-proofound-stone dark:border-border hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-3">
              <CardTitle className="text-lg">{project.title}</CardTitle>
              {project.isVerified && (
                <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={STATUS_COLORS[project.status]}
              >
                {STATUS_LABELS[project.status]}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(project.startDate)}
                {project.endDate && ` - ${formatDate(project.endDate)}`}
              </Badge>
            </div>
          </div>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(project.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-sm">{project.description}</p>
        </div>

        {project.outcomes && (
          <div className="p-3 rounded-lg bg-muted/30 border border-muted-foreground/10">
            <p className="text-xs font-medium text-muted-foreground mb-1">Outcomes</p>
            <p className="text-sm">{project.outcomes}</p>
          </div>
        )}

        {project.impactCreated && (
          <div className="p-3 rounded-lg bg-proofound-forest/5 border border-proofound-forest/20">
            <p className="text-xs font-medium text-proofound-forest mb-1 flex items-center gap-1">
              <Target className="h-3 w-3" />
              Impact Created
            </p>
            <p className="text-sm">{project.impactCreated}</p>
          </div>
        )}

        {project.businessValue && (
          <div className="p-3 rounded-lg bg-muted/30 border border-muted-foreground/10">
            <p className="text-xs font-medium text-muted-foreground mb-1">Business Value</p>
            <p className="text-sm">{project.businessValue}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
