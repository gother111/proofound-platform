/**
 * Project Form Component
 * 
 * Create or edit projects (work, volunteer, education, side projects)
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface ProjectFormData {
  title: string;
  type: 'work' | 'volunteer' | 'education' | 'side';
  status: 'ongoing' | 'concluded' | 'paused' | 'archived';
  startDate: string;
  endDate?: string;
  description?: string;
  organization?: string;
  role?: string;
  isOngoing: boolean;
}

interface ProjectFormProps {
  onSuccess: (project: any) => void;
  onCancel: () => void;
  initialData?: Partial<ProjectFormData>;
  projectId?: string;
}

export function ProjectForm({ onSuccess, onCancel, initialData, projectId }: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOngoing, setIsOngoing] = useState(initialData?.isOngoing ?? false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    defaultValues: {
      title: initialData?.title || '',
      type: initialData?.type || 'work',
      status: initialData?.status || 'ongoing',
      startDate: initialData?.startDate || '',
      endDate: initialData?.endDate || '',
      description: initialData?.description || '',
      organization: initialData?.organization || '',
      role: initialData?.role || '',
      isOngoing: initialData?.isOngoing ?? false,
    },
  });

  const projectType = watch('type');
  const projectStatus = watch('status');

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      const endpoint = projectId ? `/api/projects/${projectId}` : '/api/projects';
      const method = projectId ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          endDate: isOngoing ? null : data.endDate,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result.project);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save project');
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Project Title <span className="text-red-600">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Redesigned mobile app"
          {...register('title', { required: 'Title is required' })}
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Type and Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">
            Type <span className="text-red-600">*</span>
          </Label>
          <Select
            value={projectType}
            onValueChange={(value) => setValue('type', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="volunteer">Volunteer</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="side">Side Project</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">
            Status <span className="text-red-600">*</span>
          </Label>
          <Select
            value={projectStatus}
            onValueChange={(value) => setValue('status', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="concluded">Concluded</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Organization and Role */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="organization">Organization (Optional)</Label>
          <Input
            id="organization"
            placeholder="e.g., Acme Corp"
            {...register('organization')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Your Role (Optional)</Label>
          <Input
            id="role"
            placeholder="e.g., Lead Designer"
            {...register('role')}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">
            Start Date <span className="text-red-600">*</span>
          </Label>
          <Input
            id="startDate"
            type="month"
            {...register('startDate', { required: 'Start date is required' })}
          />
          {errors.startDate && (
            <p className="text-sm text-red-600">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="month"
            disabled={isOngoing}
            {...register('endDate')}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="isOngoing"
              checked={isOngoing}
              onCheckedChange={(checked) => {
                setIsOngoing(checked as boolean);
                if (checked) {
                  setValue('endDate', '');
                }
              }}
            />
            <Label htmlFor="isOngoing" className="text-sm font-normal cursor-pointer">
              This is an ongoing project
            </Label>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Describe the project, your role, and what you accomplished..."
          className="min-h-[120px]"
          maxLength={1000}
          {...register('description')}
        />
        <p className="text-xs text-[#6B6760] text-right">
          {watch('description')?.length || 0}/1000
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#4A5943] hover:bg-[#3A4733]"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {projectId ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}

