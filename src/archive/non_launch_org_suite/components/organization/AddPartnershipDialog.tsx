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

interface Partnership {
  id?: string;
  partnerName: string;
  partnerType: 'company' | 'ngo' | 'government' | 'academic' | 'network' | 'other';
  partnershipScope: string;
  impactCreated: string;
  startDate: string;
  endDate: string | null;
  status: 'active' | 'completed' | 'suspended';
  isVerified: boolean;
}

interface AddPartnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Partnership>) => Promise<void>;
  existingPartnership?: Partnership | null;
}

export function AddPartnershipDialog({
  open,
  onOpenChange,
  onSave,
  existingPartnership,
}: AddPartnershipDialogProps) {
  const [formData, setFormData] = useState<Partial<Partnership>>({
    partnerName: '',
    partnerType: 'company',
    partnershipScope: '',
    impactCreated: '',
    startDate: '',
    endDate: null,
    status: 'active',
    isVerified: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingPartnership) {
      setFormData(existingPartnership);
    } else {
      setFormData({
        partnerName: '',
        partnerType: 'company',
        partnershipScope: '',
        impactCreated: '',
        startDate: '',
        endDate: null,
        status: 'active',
        isVerified: false,
      });
    }
  }, [existingPartnership, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-['Crimson_Pro']">
            {existingPartnership ? 'Edit Partnership' : 'Add Partnership'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="partnerName">Partner Name *</Label>
            <Input
              id="partnerName"
              value={formData.partnerName}
              onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="partnerType">Partner Type</Label>
            <Select
              value={formData.partnerType}
              onValueChange={(value: any) => setFormData({ ...formData, partnerType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="ngo">NGO</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="academic">Academic Institution</SelectItem>
                <SelectItem value="network">Network/Association</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="partnershipScope">Partnership Scope *</Label>
            <Textarea
              id="partnershipScope"
              placeholder="Describe the scope and nature of the partnership"
              value={formData.partnershipScope}
              onChange={(e) => setFormData({ ...formData, partnershipScope: e.target.value })}
              rows={2}
              required
            />
          </div>

          <div>
            <Label htmlFor="impactCreated">Impact Created *</Label>
            <Textarea
              id="impactCreated"
              placeholder="What impact has this partnership created?"
              value={formData.impactCreated}
              onChange={(e) => setFormData({ ...formData, impactCreated: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value || null })}
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
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
            <Label htmlFor="isVerified" className="text-sm font-normal cursor-pointer">
              Mark as verified
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
              {saving ? 'Saving...' : existingPartnership ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
