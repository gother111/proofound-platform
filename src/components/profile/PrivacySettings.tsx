/**
 * Privacy Settings Component for Profile
 *
 * Manages field-level visibility and redact mode for individual profiles
 *
 * PRD References:
 * - Part 5: F4 - Field-Level Visibility Controls
 * - Part 8: Privacy by default
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FieldVisibilityControl, type VisibilityLevel } from '../privacy/FieldVisibilityControl';
import { RedactModeToggle } from '../privacy/RedactModeToggle';
import { VisibilityPreview } from '../privacy/VisibilityPreview';
import { toast } from 'sonner';
import { Shield, Eye } from 'lucide-react';
import { CLIENT_FF_DEFAULTS } from '@/lib/featureFlags';

interface FieldVisibilitySettings {
  mission: VisibilityLevel;
  vision: VisibilityLevel;
  values: VisibilityLevel;
  causes: VisibilityLevel;
  avatar: VisibilityLevel;
  tagline: VisibilityLevel;
  location: VisibilityLevel;
  skills: VisibilityLevel;
  experiences: VisibilityLevel;
  education: VisibilityLevel;
  impactStories: VisibilityLevel;
}

interface PrivacySettingsProps {
  userId: string;
  currentProfile: {
    mission?: string | null;
    vision?: string | null;
    values?: any[];
    causes?: any[];
    avatar?: string | null;
    tagline?: string | null;
    location?: string | null;
    skills?: any[];
    experiences?: any[];
    education?: any[];
    impactStories?: any[];
  };
}

const FIELD_VISIBILITY_KEYS: Array<keyof FieldVisibilitySettings> = [
  'mission',
  'vision',
  'values',
  'causes',
  'avatar',
  'tagline',
  'location',
  'skills',
  'experiences',
  'education',
  'impactStories',
];

export function PrivacySettings({ userId: _userId, currentProfile }: PrivacySettingsProps) {
  const [fieldVisibility, setFieldVisibility] = useState<FieldVisibilitySettings>({
    mission: 'public',
    vision: 'public',
    values: 'public',
    causes: 'public',
    avatar: 'public',
    tagline: 'public',
    location: 'network_only',
    skills: 'public',
    experiences: 'private',
    education: 'private',
    impactStories: 'match_only',
  });

  const [redactMode, setRedactMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [privacySummaryEnabled, setPrivacySummaryEnabled] = useState(
    CLIENT_FF_DEFAULTS.privacySummary
  );
  const [previewMode, setPreviewMode] = useState<'public' | 'network_only' | 'match_only'>(
    'public'
  );

  useEffect(() => {
    const loadFlags = async () => {
      try {
        const response = await fetch('/api/feature-flags');
        if (!response.ok) return;
        const payload = await response.json();
        setPrivacySummaryEnabled(payload?.flags?.privacySummary !== false);
      } catch (error) {
        console.error('Failed to load privacy summary feature flag', error);
      }
    };

    void loadFlags();
  }, []);

  const loadPrivacySettings = useCallback(async () => {
    try {
      const response = await fetch('/api/profile/privacy-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.fieldVisibility) {
          const normalize = (value: string): VisibilityLevel => {
            if (value === 'public') return 'public';
            if (value === 'network_only' || value === 'network') return 'network_only';
            if (value === 'match_only' || value === 'matched') return 'match_only';
            return 'private';
          };
          const normalized: Partial<FieldVisibilitySettings> = {};
          Object.entries(data.fieldVisibility as Record<string, string>).forEach(([key, value]) => {
            if (FIELD_VISIBILITY_KEYS.includes(key as keyof FieldVisibilitySettings)) {
              normalized[key as keyof FieldVisibilitySettings] = normalize(value);
            }
          });
          setFieldVisibility((prev) => ({ ...prev, ...normalized }));
        }
        if (typeof data.redactMode === 'boolean') {
          setRedactMode(data.redactMode);
        }
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  }, []);

  // Load current settings
  useEffect(() => {
    void loadPrivacySettings();
  }, [loadPrivacySettings]);

  const handleFieldVisibilityChange = (
    field: keyof FieldVisibilitySettings,
    value: VisibilityLevel
  ) => {
    setFieldVisibility((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/privacy-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldVisibility,
          redactMode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Privacy settings saved successfully');
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      toast.error('Failed to save privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Prepare fields for preview
  const previewFields = [
    {
      name: 'mission',
      label: 'Mission',
      value: currentProfile.mission ?? null,
      visibility: fieldVisibility.mission,
    },
    {
      name: 'vision',
      label: 'Vision',
      value: currentProfile.vision ?? null,
      visibility: fieldVisibility.vision,
    },
    {
      name: 'values',
      label: 'Values',
      value: currentProfile.values?.length ? `${currentProfile.values.length} values` : null,
      visibility: fieldVisibility.values,
    },
    {
      name: 'causes',
      label: 'Causes',
      value: currentProfile.causes?.length ? `${currentProfile.causes.length} causes` : null,
      visibility: fieldVisibility.causes,
    },
    {
      name: 'avatar',
      label: 'Avatar',
      value: currentProfile.avatar ? 'Set' : null,
      visibility: fieldVisibility.avatar,
    },
    {
      name: 'tagline',
      label: 'Tagline',
      value: currentProfile.tagline ?? null,
      visibility: fieldVisibility.tagline,
    },
    {
      name: 'location',
      label: 'Location',
      value: currentProfile.location ?? null,
      visibility: fieldVisibility.location,
    },
    {
      name: 'skills',
      label: 'Skills',
      value: currentProfile.skills?.length ? `${currentProfile.skills.length} skills` : null,
      visibility: fieldVisibility.skills,
    },
    {
      name: 'experiences',
      label: 'Experiences',
      value: currentProfile.experiences?.length
        ? `${currentProfile.experiences.length} entries`
        : null,
      visibility: fieldVisibility.experiences,
    },
    {
      name: 'education',
      label: 'Education',
      value: currentProfile.education?.length ? `${currentProfile.education.length} entries` : null,
      visibility: fieldVisibility.education,
    },
    {
      name: 'impactStories',
      label: 'Impact Stories',
      value: currentProfile.impactStories?.length
        ? `${currentProfile.impactStories.length} stories`
        : null,
      visibility: fieldVisibility.impactStories,
    },
  ];

  const visibilitySummary = {
    public: previewFields
      .filter((field) => field.visibility === 'public')
      .map((field) => field.label),
    network_only: previewFields
      .filter((field) => field.visibility === 'network_only')
      .map((field) => field.label),
    match_only: previewFields
      .filter((field) => field.visibility === 'match_only')
      .map((field) => field.label),
    private: previewFields
      .filter((field) => field.visibility === 'private')
      .map((field) => field.label),
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-proofound-forest" />
              <CardTitle>Privacy Settings</CardTitle>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="visibility" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="visibility">Field Visibility</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Field Visibility Tab */}
            <TabsContent value="visibility" className="space-y-4 mt-6">
              <div className="space-y-4">
                <FieldVisibilityControl
                  fieldName="mission"
                  fieldLabel="Mission"
                  value={fieldVisibility.mission}
                  onChange={(value) => handleFieldVisibilityChange('mission', value)}
                  description="Your professional purpose and what you're looking to achieve"
                />
                <FieldVisibilityControl
                  fieldName="vision"
                  fieldLabel="Vision"
                  value={fieldVisibility.vision}
                  onChange={(value) => handleFieldVisibilityChange('vision', value)}
                  description="Your long-term career aspirations and goals"
                />
                <FieldVisibilityControl
                  fieldName="values"
                  fieldLabel="Values"
                  value={fieldVisibility.values}
                  onChange={(value) => handleFieldVisibilityChange('values', value)}
                  description="Core values that guide your work"
                />
                <FieldVisibilityControl
                  fieldName="causes"
                  fieldLabel="Causes"
                  value={fieldVisibility.causes}
                  onChange={(value) => handleFieldVisibilityChange('causes', value)}
                  description="Social and environmental causes you care about"
                />
                <div className="border-t border-proofound-stone my-4" />
                <FieldVisibilityControl
                  fieldName="location"
                  fieldLabel="Location"
                  value={fieldVisibility.location}
                  onChange={(value) => handleFieldVisibilityChange('location', value)}
                  description="Your current location"
                />
                <FieldVisibilityControl
                  fieldName="skills"
                  fieldLabel="Skills"
                  value={fieldVisibility.skills}
                  onChange={(value) => handleFieldVisibilityChange('skills', value)}
                  description="Your professional skills and expertise"
                />
                <FieldVisibilityControl
                  fieldName="experiences"
                  fieldLabel="Work Experience"
                  value={fieldVisibility.experiences}
                  onChange={(value) => handleFieldVisibilityChange('experiences', value)}
                  description="Your work history and professional experience"
                />
                <FieldVisibilityControl
                  fieldName="education"
                  fieldLabel="Education"
                  value={fieldVisibility.education}
                  onChange={(value) => handleFieldVisibilityChange('education', value)}
                  description="Your educational background"
                />
                <FieldVisibilityControl
                  fieldName="impactStories"
                  fieldLabel="Impact Stories"
                  value={fieldVisibility.impactStories}
                  onChange={(value) => handleFieldVisibilityChange('impactStories', value)}
                  description="Stories of impact and achievements"
                />
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4 mt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  See how your profile appears to organizations
                </p>
                <Tabs
                  value={previewMode}
                  onValueChange={(v) =>
                    setPreviewMode(v as 'public' | 'network_only' | 'match_only')
                  }
                >
                  <TabsList>
                    <TabsTrigger value="public">Public</TabsTrigger>
                    <TabsTrigger value="network_only">Connections</TabsTrigger>
                    <TabsTrigger value="match_only">After match</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <VisibilityPreview fields={previewFields} viewMode={previewMode} />
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4 mt-6">
              <Card>
                <CardContent className="pt-6">
                  <RedactModeToggle enabled={redactMode} onChange={setRedactMode} />
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-900">
                      <strong>What is Redact Mode?</strong>
                    </p>
                    <p className="text-sm text-amber-800 mt-1">
                      When enabled, sensitive information is hidden from your view. This is useful
                      when screen sharing or presenting, ensuring your personal data stays private.
                      Organizations never see redacted information.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {privacySummaryEnabled ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-proofound-forest" />
              <CardTitle>What others can see</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-proofound-stone p-3">
                <p className="font-medium text-foreground">Public</p>
                <p className="text-muted-foreground">
                  {visibilitySummary.public.join(', ') || 'Nothing yet'}
                </p>
              </div>
              <div className="rounded-md border border-proofound-stone p-3">
                <p className="font-medium text-foreground">Connections</p>
                <p className="text-muted-foreground">
                  {visibilitySummary.network_only.join(', ') || 'Nothing yet'}
                </p>
              </div>
              <div className="rounded-md border border-proofound-stone p-3">
                <p className="font-medium text-foreground">After match</p>
                <p className="text-muted-foreground">
                  {visibilitySummary.match_only.join(', ') || 'Nothing yet'}
                </p>
              </div>
              <div className="rounded-md border border-proofound-stone p-3">
                <p className="font-medium text-foreground">Private</p>
                <p className="text-muted-foreground">
                  {visibilitySummary.private.join(', ') || 'Nothing yet'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewMode('public')}>
                Preview as public
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPreviewMode('match_only')}>
                Preview after match
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
