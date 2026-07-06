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

interface Department {
  id: string;
  entityType: 'executive_team' | 'department' | 'team' | 'working_group';
  name: string;
  description?: string;
  teamSize?: number;
  focusArea?: string;
  parentId?: string;
}

interface AddDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
  allDepartments: Department[];
  onSave: (department: Omit<Department, 'id'> & { id?: string }) => Promise<void>;
}

const ENTITY_TYPE_LABELS = {
  executive_team: 'Executive Team',
  department: 'Department',
  team: 'Team',
  working_group: 'Working Group',
};

export function AddDepartmentDialog({
  open,
  onOpenChange,
  department,
  allDepartments,
  onSave,
}: AddDepartmentDialogProps) {
  const [formData, setFormData] = useState<Partial<Department>>({
    entityType: 'department',
    name: '',
    description: '',
    teamSize: undefined,
    focusArea: '',
    parentId: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (department) {
        setFormData(department);
      } else {
        setFormData({
          entityType: 'department',
          name: '',
          description: '',
          teamSize: undefined,
          focusArea: '',
          parentId: undefined,
        });
      }
      setError(null);
    }
  }, [open, department]);

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.entityType) {
      setError('Type is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave({
        ...formData,
        id: department?.id,
      } as any);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out the current department and its descendants from parent options
  const availableParents = allDepartments.filter((d) => d.id !== department?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{department ? 'Edit Structure Entity' : 'Add Structure Entity'}</DialogTitle>
          <DialogDescription>
            Add departments, teams, or working groups to your organizational structure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Entity Type */}
          <div className="space-y-2">
            <Label htmlFor="entityType">Type *</Label>
            <Select
              value={formData.entityType}
              onValueChange={(value: any) => setFormData({ ...formData, entityType: value })}
            >
              <SelectTrigger id="entityType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Product Development, Marketing Team"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of responsibilities and scope"
              rows={3}
            />
          </div>

          {/* Focus Area */}
          <div className="space-y-2">
            <Label htmlFor="focusArea">Focus Area</Label>
            <Input
              id="focusArea"
              value={formData.focusArea || ''}
              onChange={(e) => setFormData({ ...formData, focusArea: e.target.value })}
              placeholder="e.g., Backend Services, Climate Solutions"
            />
          </div>

          {/* Team Size */}
          <div className="space-y-2">
            <Label htmlFor="teamSize">Team Size</Label>
            <Input
              id="teamSize"
              type="number"
              min="0"
              value={formData.teamSize || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  teamSize: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              placeholder="Number of people"
            />
          </div>

          {/* Parent Department */}
          <div className="space-y-2">
            <Label htmlFor="parentId">Reports To (Optional)</Label>
            <Select
              value={formData.parentId || 'none'}
              onValueChange={(value) =>
                setFormData({ ...formData, parentId: value === 'none' ? undefined : value })
              }
            >
              <SelectTrigger id="parentId">
                <SelectValue placeholder="No parent (top-level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent (top-level)</SelectItem>
                {availableParents.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name} ({ENTITY_TYPE_LABELS[dept.entityType]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select a parent to create a hierarchical structure
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
            {isLoading ? 'Saving...' : department ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
