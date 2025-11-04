'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Lock, MessageCircle, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export type VisibilityLevel = 'public' | 'post_match' | 'post_conversation_start' | 'internal_only';

export interface FieldVisibility {
  mission: VisibilityLevel;
  vision: VisibilityLevel;
  values: VisibilityLevel;
  causes: VisibilityLevel;
  workCulture: VisibilityLevel;
  structure: VisibilityLevel;
  impactEntries: VisibilityLevel;
  projects: VisibilityLevel;
  website: VisibilityLevel;
}

interface FieldVisibilityControlsProps {
  orgId: string;
  initialVisibility: Partial<FieldVisibility>;
  onSave: (visibility: FieldVisibility) => Promise<void>;
}

const VISIBILITY_OPTIONS = [
  {
    value: 'public' as VisibilityLevel,
    label: 'Public',
    description: 'Visible to everyone, including during browse/search',
    icon: Eye,
  },
  {
    value: 'post_match' as VisibilityLevel,
    label: 'Post-Match',
    description: 'Visible after matching is confirmed',
    icon: Handshake,
  },
  {
    value: 'post_conversation_start' as VisibilityLevel,
    label: 'Post-Conversation',
    description: 'Visible after conversation starts',
    icon: MessageCircle,
  },
  {
    value: 'internal_only' as VisibilityLevel,
    label: 'Internal Only',
    description: 'Only visible to organization members',
    icon: Lock,
  },
];

const FIELDS = [
  { key: 'mission', label: 'Mission Statement', recommended: 'public' },
  { key: 'vision', label: 'Vision Statement', recommended: 'public' },
  { key: 'values', label: 'Core Values', recommended: 'public' },
  { key: 'causes', label: 'Causes', recommended: 'public' },
  { key: 'workCulture', label: 'Work Culture', recommended: 'post_match' },
  { key: 'structure', label: 'Organization Structure', recommended: 'post_conversation_start' },
  { key: 'impactEntries', label: 'Impact Entries', recommended: 'public' },
  { key: 'projects', label: 'Projects', recommended: 'post_match' },
  { key: 'website', label: 'Website', recommended: 'public' },
];

export function FieldVisibilityControls({
  orgId,
  initialVisibility,
  onSave,
}: FieldVisibilityControlsProps) {
  const [visibility, setVisibility] = useState<FieldVisibility>({
    mission: initialVisibility.mission || 'public',
    vision: initialVisibility.vision || 'public',
    values: initialVisibility.values || 'public',
    causes: initialVisibility.causes || 'public',
    workCulture: initialVisibility.workCulture || 'post_match',
    structure: initialVisibility.structure || 'post_conversation_start',
    impactEntries: initialVisibility.impactEntries || 'public',
    projects: initialVisibility.projects || 'post_match',
    website: initialVisibility.website || 'public',
  });

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = (field: keyof FieldVisibility, value: VisibilityLevel) => {
    setVisibility((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(visibility);
      setHasChanges(false);
      toast.success('Visibility settings saved successfully');
    } catch (error) {
      toast.error('Failed to save visibility settings');
      console.error('Error saving visibility:', error);
    } finally {
      setSaving(false);
    }
  };

  const getVisibilityOption = (level: VisibilityLevel) => {
    return VISIBILITY_OPTIONS.find((opt) => opt.value === level);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-['Crimson_Pro'] font-semibold text-proofound-forest dark:text-primary">
            Field Visibility Controls
          </h2>
          <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
            Control who can see each part of your organization profile
          </p>
        </div>
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-proofound-forest hover:bg-proofound-forest/90"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* Visibility Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visibility Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VISIBILITY_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.value} className="flex items-start gap-3">
                  <Icon className="w-5 h-5 mt-0.5 text-proofound-forest" />
                  <div>
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Field Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {FIELDS.map((field) => {
              const currentLevel = visibility[field.key as keyof FieldVisibility];
              const option = getVisibilityOption(currentLevel);
              const Icon = option?.icon || Eye;
              const isRecommended = currentLevel === field.recommended;

              return (
                <div
                  key={field.key}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-sm font-medium">{field.label}</Label>
                      {isRecommended && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="w-3 h-3" />
                      <span>{option?.description}</span>
                    </div>
                  </div>

                  <Select
                    value={currentLevel}
                    onValueChange={(value: VisibilityLevel) =>
                      handleFieldChange(field.key as keyof FieldVisibility, value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIBILITY_OPTIONS.map((opt) => {
                        const OptIcon = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <OptIcon className="w-4 h-4" />
                              <span>{opt.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            💡 <strong>Tip:</strong> Public fields help candidates discover your organization during
            search and matching. Consider keeping mission, vision, values, and causes public to
            maximize PAC Score accuracy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

