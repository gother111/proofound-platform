'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Project {
  id?: string;
  title: string;
  description: string;
  impactCreated: string;
  businessValue: string;
  outcomes: string;
  startDate: string;
  endDate: string | null;
  status: 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled';
  isVerified: boolean;
}

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (project: Partial<Project>) => Promise<void>;
  existingProject?: Project | null;
}

export function AddProjectDialog({
  open,
  onOpenChange,
  onSave,
  existingProject,
}: AddProjectDialogProps) {
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    description: '',
    impactCreated: '',
    businessValue: '',
    outcomes: '',
    startDate: '',
    endDate: null,
    status: 'active',
    isVerified: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingProject) {
      setFormData(existingProject);
    } else {
      setFormData({
        title: '',
        description: '',
        impactCreated: '',
        businessValue: '',
        outcomes: '',
        startDate: '',
        endDate: null,
        status: 'active',
        isVerified: false,
      });
    }
  }, [existingProject, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave(formData);
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-['Crimson_Pro']">
            {existingProject ? 'Edit Project' : 'Add New Project'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="impactCreated">Impact Created *</Label>
            <Textarea
              id="impactCreated"
              placeholder="What positive change did this project create?"
              value={formData.impactCreated}
              onChange={(e) => setFormData({ ...formData, impactCreated: e.target.value })}
              rows={2}
              required
            />
          </div>

          <div>
            <Label htmlFor="businessValue">Business Value *</Label>
            <Textarea
              id="businessValue"
              placeholder="What business value did this project deliver?"
              value={formData.businessValue}
              onChange={(e) => setFormData({ ...formData, businessValue: e.target.value })}
              rows={2}
              required
            />
          </div>

          <div>
            <Label htmlFor="outcomes">Outcomes *</Label>
            <Textarea
              id="outcomes"
              placeholder="Measurable outcomes and results"
              value={formData.outcomes}
              onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate || ''}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value || null })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isVerified"
              checked={formData.isVerified}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isVerified: checked as boolean })
              }
            />
            <Label
              htmlFor="isVerified"
              className="text-sm font-normal cursor-pointer"
            >
              Mark as verified (indicates project has been independently verified)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-proofound-forest hover:bg-proofound-forest/90"
            >
              {saving ? 'Saving...' : existingProject ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
