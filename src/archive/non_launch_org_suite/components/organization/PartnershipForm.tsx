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

interface OrganizationPartnership {
  id?: string;
  partnerName: string;
  partnerType: 'company' | 'ngo' | 'government' | 'academic' | 'network' | 'other';
  partnershipScope: string;
  impactCreated: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'suspended';
}

interface PartnershipFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnership?: OrganizationPartnership | null;
  onSave: (partnership: OrganizationPartnership) => Promise<void>;
}

const PARTNER_TYPE_OPTIONS = [
  { value: 'company', label: 'Company' },
  { value: 'ngo', label: 'NGO / Nonprofit' },
  { value: 'government', label: 'Government' },
  { value: 'academic', label: 'Academic / Research' },
  { value: 'network', label: 'Network / Coalition' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'suspended', label: 'Suspended' },
];

export function PartnershipForm({ open, onOpenChange, partnership, onSave }: PartnershipFormProps) {
  const [formData, setFormData] = useState<OrganizationPartnership>({
    partnerName: '',
    partnerType: 'company',
    partnershipScope: '',
    impactCreated: '',
    startDate: '',
    endDate: '',
    status: 'active',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (partnership) {
        setFormData(partnership);
      } else {
        setFormData({
          partnerName: '',
          partnerType: 'company',
          partnershipScope: '',
          impactCreated: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          status: 'active',
        });
      }
      setError(null);
    }
  }, [open, partnership]);

  const handleSave = async () => {
    // Validate required fields
    if (!formData.partnerName.trim()) {
      setError('Partner name is required');
      return;
    }

    if (!formData.partnershipScope.trim()) {
      setError('Partnership scope is required');
      return;
    }

    if (!formData.impactCreated.trim()) {
      setError('Impact created is required');
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{partnership ? 'Edit Partnership' : 'Add Partnership'}</DialogTitle>
          <DialogDescription>
            Document a partnership with another organization and the impact created together
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Partner Name */}
          <div className="space-y-2">
            <Label htmlFor="partnerName">Partner Name *</Label>
            <Input
              id="partnerName"
              value={formData.partnerName}
              onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
              placeholder="e.g., Green Energy Initiative"
            />
          </div>

          {/* Partner Type */}
          <div className="space-y-2">
            <Label htmlFor="partnerType">Partner Type *</Label>
            <Select
              value={formData.partnerType}
              onValueChange={(value: any) => setFormData({ ...formData, partnerType: value })}
            >
              <SelectTrigger id="partnerType">
                <SelectValue placeholder="Select partner type" />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {/* Partnership Scope */}
          <div className="space-y-2">
            <Label htmlFor="partnershipScope">Partnership Scope *</Label>
            <Textarea
              id="partnershipScope"
              value={formData.partnershipScope}
              onChange={(e) => setFormData({ ...formData, partnershipScope: e.target.value })}
              placeholder="Describe the scope, goals, and areas of collaboration"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Explain what you're working on together and the partnership objectives
            </p>
          </div>

          {/* Impact Created */}
          <div className="space-y-2">
            <Label htmlFor="impactCreated">Impact Created *</Label>
            <Textarea
              id="impactCreated"
              value={formData.impactCreated}
              onChange={(e) => setFormData({ ...formData, impactCreated: e.target.value })}
              placeholder="What impact has this partnership created?"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Describe the measurable outcomes and positive changes from this collaboration
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
            {isLoading ? 'Saving...' : partnership ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
