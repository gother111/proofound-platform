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
import { Plus, X } from 'lucide-react';

interface ImpactMetric {
  name: string;
  value: string;
  unit: string;
}

interface ImpactEntry {
  id?: string;
  title: string;
  description: string;
  metrics: ImpactMetric[];
  beneficiaries?: string;
  timeframe: string;
  artifacts?: string[]; // URLs to supporting documents/images
  createdAt?: string;
}

interface ImpactEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: ImpactEntry | null;
  onSave: (entry: ImpactEntry) => Promise<void>;
}

export function ImpactEntryForm({ open, onOpenChange, entry, onSave }: ImpactEntryFormProps) {
  const [formData, setFormData] = useState<ImpactEntry>({
    title: '',
    description: '',
    metrics: [],
    beneficiaries: '',
    timeframe: '',
    artifacts: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Metric form state
  const [newMetric, setNewMetric] = useState<ImpactMetric>({ name: '', value: '', unit: '' });

  useEffect(() => {
    if (open) {
      if (entry) {
        setFormData(entry);
      } else {
        setFormData({
          title: '',
          description: '',
          metrics: [],
          beneficiaries: '',
          timeframe: '',
          artifacts: [],
        });
      }
      setNewMetric({ name: '', value: '', unit: '' });
      setError(null);
    }
  }, [open, entry]);

  const handleAddMetric = () => {
    if (!newMetric.name || !newMetric.value) {
      setError('Metric name and value are required');
      return;
    }

    setFormData({
      ...formData,
      metrics: [...formData.metrics, newMetric],
    });
    setNewMetric({ name: '', value: '', unit: '' });
    setError(null);
  };

  const handleRemoveMetric = (index: number) => {
    setFormData({
      ...formData,
      metrics: formData.metrics.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.timeframe.trim()) {
      setError('Timeframe is required');
      return;
    }

    if (formData.metrics.length === 0) {
      setError('At least one metric is required');
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
          <DialogTitle>{entry ? 'Edit Impact Entry' : 'Add Impact Entry'}</DialogTitle>
          <DialogDescription>
            Document measurable impact your organization has created
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
              placeholder="e.g., Clean Water Initiative in Rural Kenya"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the impact initiative, context, and what was achieved"
              rows={4}
            />
          </div>

          {/* Timeframe */}
          <div className="space-y-2">
            <Label htmlFor="timeframe">Timeframe *</Label>
            <Input
              id="timeframe"
              value={formData.timeframe}
              onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
              placeholder="e.g., Q2 2024, Jan-Mar 2024, 2023"
            />
          </div>

          {/* Beneficiaries */}
          <div className="space-y-2">
            <Label htmlFor="beneficiaries">Beneficiaries (Optional)</Label>
            <Input
              id="beneficiaries"
              value={formData.beneficiaries || ''}
              onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
              placeholder="e.g., 5,000 rural families, 20 community schools"
            />
          </div>

          {/* Metrics */}
          <div className="space-y-3">
            <Label>Impact Metrics *</Label>
            {formData.metrics.length > 0 && (
              <div className="space-y-2">
                {formData.metrics.map((metric, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg group"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="font-medium">{metric.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{metric.value}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{metric.unit}</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMetric(index)}
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Metric Form */}
            <div className="space-y-2 p-4 border-2 border-dashed rounded-lg">
              <p className="text-sm font-medium">Add Metric</p>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <Input
                    placeholder="Metric name"
                    value={newMetric.name}
                    onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    placeholder="Value"
                    value={newMetric.value}
                    onChange={(e) => setNewMetric({ ...newMetric, value: e.target.value })}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    placeholder="Unit"
                    value={newMetric.unit}
                    onChange={(e) => setNewMetric({ ...newMetric, unit: e.target.value })}
                  />
                </div>
                <div className="col-span-1">
                  <Button type="button" size="icon" onClick={handleAddMetric} className="w-full">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Example: "People served" / "1,200" / "individuals"
              </p>
            </div>
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
            {isLoading ? 'Saving...' : entry ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
