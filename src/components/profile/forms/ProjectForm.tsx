/**
 * Project Form Component
 *
 * Historical project editor retained for compatibility.
 * Project records are archived outside the locked MVP corridor.
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Archive } from 'lucide-react';

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

  const onSubmit = async () => {
    onSuccess({
      archived: true,
      message: 'Project records are archived for launch. Use Proof Packs for current evidence.',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Alert>
        <Archive className="h-4 w-4" />
        <AlertDescription>
          Project records are archived for launch. Add current evidence through Proof Packs instead.
        </AlertDescription>
      </Alert>

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
        {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
      </div>

      {/* Type and Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">
            Type <span className="text-red-600">*</span>
          </Label>
          <Select value={projectType} onValueChange={(value) => setValue('type', value as any)}>
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
          <Select value={projectStatus} onValueChange={(value) => setValue('status', value as any)}>
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
          <Input id="organization" placeholder="e.g., Acme Corp" {...register('organization')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Your Role (Optional)</Label>
          <Input id="role" placeholder="e.g., Lead Designer" {...register('role')} />
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
          {errors.startDate && <p className="text-sm text-red-600">{errors.startDate.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" type="month" disabled={isOngoing} {...register('endDate')} />
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
        <p className="text-xs text-muted-foreground text-right">
          {watch('description')?.length || 0}/1000
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled className="bg-proofound-forest hover:bg-proofound-forest/90">
          {projectId ? 'Project Editing Archived' : 'Project Creation Archived'}
        </Button>
      </div>
    </form>
  );
}
