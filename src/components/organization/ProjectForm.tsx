'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';

interface OrganizationProject {
  id?: string;
  title: string;
  description: string;
  impactCreated: string;
  businessValue: string;
  outcomes: string;
  startDate: string;
  endDate?: string;
  status: 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled';
}

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: OrganizationProject | null;
  onSave: (project: OrganizationProject) => Promise<void>;
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function ProjectForm({ open, onOpenChange, project, onSave }: ProjectFormProps) {
  const [formData, setFormData] = useState<OrganizationProject>({
    title: '',
    description: '',
    impactCreated: '',
    businessValue: '',
    outcomes: '',
    startDate: '',
    endDate: '',
    status: 'active',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (project) {
        setFormData(project);
      } else {
        setFormData({
          title: '',
          description: '',
          impactCreated: '',
          businessValue: '',
          outcomes: '',
          startDate: new Date().toISOString().split('T')[0], // Today's date
          endDate: '',
          status: 'active',
        });
      }
      setError(null);
    }
  }, [open, project]);

  const handleSave = async () => {
    // Validate required fields
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.impactCreated.trim()) {
      setError('Impact created is required');
      return;
    }

    if (!formData.businessValue.trim()) {
      setError('Business value is required');
      return;
    }

    if (!formData.outcomes.trim()) {
      setError('Outcomes are required');
      return;
    }

    if (!formData.startDate) {
      setError('Start date is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-transparent border-none shadow-none p-0 sm:max-w-2xl [&>button]:right-6 [&>button]:top-6 [&>button]:text-muted-foreground [&>button]:z-50 [&>button]:bg-background/50 [&>button]:backdrop-blur-sm [&>button]:rounded-full [&>button]:p-1.5 [&>button]:hover:bg-background">
        <motion.div
          layoutId={project?.id ? `project-card-${project.id}` : undefined}
          className="bg-background rounded-xl shadow-lg border p-6 m-1 w-full"
        >
          <DialogHeader>
            <DialogTitle>{project ? 'Edit Project' : 'Add Project'}</DialogTitle>
            <DialogDescription>
              Document an organization-wide project with its outcomes and business value
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Customer Portal Redesign"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the project, its goals, and scope"
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Impact Created */}
            <div className="space-y-2">
              <Label htmlFor="impactCreated">Impact Created *</Label>
              <Textarea
                id="impactCreated"
                value={formData.impactCreated}
                onChange={(e) => setFormData({ ...formData, impactCreated: e.target.value })}
                placeholder="What positive change did this project create?"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Describe the measurable impact and changes brought by this project
              </p>
            </div>

            {/* Business Value */}
            <div className="space-y-2">
              <Label htmlFor="businessValue">Business Value *</Label>
              <Textarea
                id="businessValue"
                value={formData.businessValue}
                onChange={(e) => setFormData({ ...formData, businessValue: e.target.value })}
                placeholder="What business value was delivered?"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Explain the organizational or business value created
              </p>
            </div>

            {/* Outcomes */}
            <div className="space-y-2">
              <Label htmlFor="outcomes">Outcomes *</Label>
              <Textarea
                id="outcomes"
                value={formData.outcomes}
                onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
                placeholder="What were the measurable outcomes?"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                List specific, measurable results and achievements
              </p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : project ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
