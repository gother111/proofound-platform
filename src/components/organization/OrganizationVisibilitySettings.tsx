'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VisibilityLevelBadge, getVisibilityDescription } from './VisibilityLevelBadge';
import { Eye, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';

interface VisibilitySettings {
  displayName: string;
  mission: string;
  vision: string;
  causes: string;
  workCulture: string;
  structure: string;
  projects: string;
  partnerships: string;
  goals: string;
  impact: string;
}

const DEFAULT_VISIBILITY_SETTINGS: VisibilitySettings = {
  displayName: 'public',
  mission: 'public',
  vision: 'public',
  causes: 'public',
  workCulture: 'post_match',
  structure: 'post_match',
  projects: 'post_match',
  partnerships: 'post_match',
  goals: 'post_match',
  impact: 'post_match',
};

const VALID_LEVELS = new Set(['public', 'post_match', 'post_conversation_start', 'internal_only']);

function normalizeVisibilitySettings(input: unknown): VisibilitySettings {
  if (!input || typeof input !== 'object') {
    return { ...DEFAULT_VISIBILITY_SETTINGS };
  }

  const source = input as Record<string, unknown>;
  const candidate: VisibilitySettings = {
    displayName: 'public',
    mission: 'public',
    vision: 'public',
    causes: 'public',
    workCulture: 'post_match',
    structure: 'post_match',
    projects: 'post_match',
    partnerships: 'post_match',
    goals: 'post_match',
    impact: 'post_match',
  };

  const fieldMap: Array<{ client: keyof VisibilitySettings; db: string }> = [
    { client: 'displayName', db: 'display_name' },
    { client: 'mission', db: 'mission' },
    { client: 'vision', db: 'vision' },
    { client: 'causes', db: 'causes' },
    { client: 'workCulture', db: 'work_culture' },
    { client: 'structure', db: 'structure' },
    { client: 'projects', db: 'projects' },
    { client: 'partnerships', db: 'partnerships' },
    { client: 'goals', db: 'goals' },
    { client: 'impact', db: 'impact' },
  ];

  for (const field of fieldMap) {
    const raw = source[field.client] ?? source[field.db];
    if (typeof raw === 'string' && VALID_LEVELS.has(raw)) {
      candidate[field.client] = raw;
    }
  }

  return candidate;
}

interface OrganizationVisibilitySettingsProps {
  orgId: string;
  canEdit?: boolean;
}

const FIELD_LABELS = {
  displayName: 'Organization Name',
  mission: 'Mission Statement',
  vision: 'Vision Statement',
  causes: 'Causes',
  workCulture: 'Work Culture',
  structure: 'Organizational Structure',
  projects: 'Projects',
  partnerships: 'Partnerships',
  goals: 'Goals',
  impact: 'Impact Dashboard',
};

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'post_match', label: 'Post-Match' },
  { value: 'post_conversation_start', label: 'Post-Conversation' },
  { value: 'internal_only', label: 'Internal Only' },
];

export function OrganizationVisibilitySettings({
  orgId,
  canEdit = true,
}: OrganizationVisibilitySettingsProps) {
  const [settings, setSettings] = useState<VisibilitySettings>({ ...DEFAULT_VISIBILITY_SETTINGS });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/organizations/${orgId}/visibility`);
      if (response.ok) {
        const data = await response.json();
        if (data.visibility) {
          setSettings(normalizeVisibilitySettings(data.visibility));
        }
      }
    } catch (error) {
      console.error('Error fetching visibility settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleFieldChange = (field: keyof VisibilitySettings, value: string) => {
    if (!VALID_LEVELS.has(value)) {
      return;
    }
    setSettings((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiFetch(`/api/organizations/${orgId}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizeVisibilitySettings(settings)),
      });

      if (!response.ok) {
        throw new Error('Failed to save visibility settings');
      }

      const data = await response.json().catch(() => ({}));
      if (data?.visibility) {
        setSettings(normalizeVisibilitySettings(data.visibility));
      }
      setHasChanges(false);
      toast.success('Visibility settings updated');
    } catch (error) {
      toast.error('Failed to save visibility settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardContent className="p-12">
          <div className="text-center">
            <p className="text-muted-foreground">Loading visibility settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-proofound-stone dark:border-border rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visibility Settings
            </CardTitle>
            <CardDescription className="mt-1">
              Control who can see each part of your organization profile
            </CardDescription>
          </div>
          {canEdit && hasChanges && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Banner */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-300">
            <p className="font-medium mb-1">Visibility Levels Explained</p>
            <ul className="text-blue-700 dark:text-blue-400 space-y-1 text-xs">
              <li>
                • <strong>Public:</strong> Visible to anyone browsing the platform
              </li>
              <li>
                • <strong>Post-Match:</strong> Visible after successful matching with candidates
              </li>
              <li>
                • <strong>Post-Conversation:</strong> Visible after conversation has started
              </li>
              <li>
                • <strong>Internal Only:</strong> Visible to organization members only
              </li>
            </ul>
          </div>
        </div>

        {/* Field Settings */}
        <div className="space-y-4">
          {Object.entries(FIELD_LABELS).map(([field, label]) => (
            <div
              key={field}
              className="flex items-center justify-between gap-4 p-4 rounded-lg border"
            >
              <div className="flex-1">
                <Label className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {getVisibilityDescription(settings[field as keyof VisibilitySettings])}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <VisibilityLevelBadge
                  level={settings[field as keyof VisibilitySettings] as any}
                  showLabel={false}
                />
                {canEdit ? (
                  <Select
                    value={settings[field as keyof VisibilitySettings]}
                    onValueChange={(value) =>
                      handleFieldChange(field as keyof VisibilitySettings, value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIBILITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="w-[180px] text-right">
                    <VisibilityLevelBadge
                      level={settings[field as keyof VisibilitySettings] as any}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
          <p>
            <strong>Note:</strong> These settings control the initial visibility. Individual
            candidates may still request access to specific information during the matching process.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
