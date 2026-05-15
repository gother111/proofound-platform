/**
 * Field-Level Visibility Controls Component
 *
 * Allows users to set fine-grained visibility for each profile field
 * Implements PRD requirement for field-level privacy + Redact Mode
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Lock, Globe, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';

type VisibilityLevel = 'public' | 'network' | 'private' | 'hidden';

interface FieldConfig {
  name: string;
  label: string;
  description: string;
  category: 'basic' | 'contact' | 'professional' | 'sensitive';
  defaultVisibility: VisibilityLevel;
  sensitive?: boolean;
}

const PROFILE_FIELDS: FieldConfig[] = [
  // Basic Info
  {
    name: 'displayName',
    label: 'Display Name',
    description: 'Your public name',
    category: 'basic',
    defaultVisibility: 'public',
  },
  {
    name: 'headline',
    label: 'Headline',
    description: 'Professional tagline',
    category: 'basic',
    defaultVisibility: 'public',
  },
  {
    name: 'bio',
    label: 'Bio',
    description: 'About yourself',
    category: 'basic',
    defaultVisibility: 'public',
  },
  {
    name: 'avatarUrl',
    label: 'Profile Photo',
    description: 'Your profile picture',
    category: 'basic',
    defaultVisibility: 'public',
  },
  {
    name: 'location',
    label: 'Location',
    description: 'City/region',
    category: 'basic',
    defaultVisibility: 'network',
    sensitive: true,
  },

  // Contact Info
  {
    name: 'workEmail',
    label: 'Work Email',
    description: 'Professional email address',
    category: 'contact',
    defaultVisibility: 'private',
    sensitive: true,
  },
  {
    name: 'linkedinProfileUrl',
    label: 'LinkedIn URL',
    description: 'Your LinkedIn profile',
    category: 'contact',
    defaultVisibility: 'network',
  },

  // Professional
  {
    name: 'skills',
    label: 'Skills',
    description: 'Your skill set',
    category: 'professional',
    defaultVisibility: 'public',
  },
  // Sensitive
  {
    name: 'workEmailOrgId',
    label: 'Organization Affiliation',
    description: 'Your current employer',
    category: 'sensitive',
    defaultVisibility: 'private',
    sensitive: true,
  },
  {
    name: 'verificationStatus',
    label: 'Verification Status',
    description: 'Identity verification state',
    category: 'sensitive',
    defaultVisibility: 'network',
    sensitive: true,
  },
];

const VISIBILITY_OPTIONS: Array<{
  value: VisibilityLevel;
  label: string;
  description: string;
  icon: any;
}> = [
  { value: 'public', label: 'Public', description: 'Visible to everyone', icon: Globe },
  { value: 'network', label: 'Network', description: 'Visible to connections only', icon: Users },
  { value: 'private', label: 'Private', description: 'Visible to matched orgs', icon: Lock },
  { value: 'hidden', label: 'Hidden', description: 'Completely hidden', icon: EyeOff },
];

interface FieldVisibilityControlsProps {
  userId: string;
}

export function FieldVisibilityControls({ userId }: FieldVisibilityControlsProps) {
  const [fieldVisibility, setFieldVisibility] = useState<Record<string, VisibilityLevel>>({});
  const [redactMode, setRedactMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activePreview, setActivePreview] = useState<'public' | 'network' | 'matched'>('public');

  useEffect(() => {
    fetchPrivacySettings();
  }, [userId]);

  const fetchPrivacySettings = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/user/privacy-settings');
      if (response.ok) {
        const data = await response.json();
        setFieldVisibility(data.fieldVisibility || {});
        setRedactMode(data.redactMode || false);
      }
    } catch (error) {
      console.error('Failed to fetch privacy settings:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldVisibilityChange = (fieldName: string, visibility: VisibilityLevel) => {
    setFieldVisibility((prev) => ({
      ...prev,
      [fieldName]: visibility,
    }));
  };

  const handleRedactModeToggle = async (enabled: boolean) => {
    setRedactMode(enabled);
    if (enabled) {
      // Apply redact mode: set all sensitive fields to hidden
      const redactedSettings: Record<string, VisibilityLevel> = { ...fieldVisibility };
      PROFILE_FIELDS.filter((f) => f.sensitive).forEach((field) => {
        redactedSettings[field.name] = 'hidden';
      });
      setFieldVisibility(redactedSettings);
      toast.success('Redact Mode enabled - sensitive fields hidden');
    } else {
      toast.info('Redact Mode disabled - review your field settings');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiFetch('/api/user/privacy-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldVisibility,
          redactMode,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Privacy settings saved successfully');
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      toast.error('Failed to save privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    const defaults: Record<string, VisibilityLevel> = {};
    PROFILE_FIELDS.forEach((field) => {
      defaults[field.name] = field.defaultVisibility;
    });
    setFieldVisibility(defaults);
    setRedactMode(false);
    toast.info('Reset to default privacy settings');
  };

  const getFieldVisibility = (fieldName: string): VisibilityLevel => {
    if (redactMode && PROFILE_FIELDS.find((f) => f.name === fieldName)?.sensitive) {
      return 'hidden';
    }
    return (
      fieldVisibility[fieldName] ||
      PROFILE_FIELDS.find((f) => f.name === fieldName)?.defaultVisibility ||
      'network'
    );
  };

  const getVisibilityIcon = (level: VisibilityLevel) => {
    const option = VISIBILITY_OPTIONS.find((o) => o.value === level);
    return option ? <option.icon className="w-4 h-4" /> : <Eye className="w-4 h-4" />;
  };

  const groupedFields = PROFILE_FIELDS.reduce(
    (acc, field) => {
      if (!acc[field.category]) acc[field.category] = [];
      acc[field.category].push(field);
      return acc;
    },
    {} as Record<string, FieldConfig[]>
  );

  const isFieldVisible = (
    fieldName: string,
    audience: 'public' | 'network' | 'matched'
  ): boolean => {
    const visibility = getFieldVisibility(fieldName);
    if (visibility === 'hidden') return false;
    if (visibility === 'public') return true;
    if (visibility === 'network') return audience === 'network' || audience === 'matched';
    if (visibility === 'private') return audience === 'matched';
    return false;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Loading privacy settings...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Redact Mode Toggle */}
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground flex items-center gap-2">
                <EyeOff className="w-5 h-5" />
                Redact Mode
                <Badge variant="secondary" className="ml-2 bg-[#D97706] text-white">
                  Quick Hide
                </Badge>
              </CardTitle>
              <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground mt-2">
                Instantly hide all sensitive information (location, email, org affiliation) with one
                toggle. Perfect for when you need to share your profile publicly.
              </CardDescription>
            </div>
            <Switch
              checked={redactMode}
              onCheckedChange={handleRedactModeToggle}
              className="data-[state=checked]:bg-[#D97706]"
            />
          </div>
        </CardHeader>
        {redactMode && (
          <CardContent>
            <div className="flex items-start gap-2 p-3 bg-[#FEF3C7] dark:bg-yellow-950/30 rounded-lg border border-[#FCD34D]">
              <AlertTriangle className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#92400E] dark:text-yellow-200">
                <strong>Redact Mode Active:</strong> Sensitive fields are now hidden. You can still
                customize individual field visibility below.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Field-Level Controls with Audience Preview */}
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
            Field-Level Privacy Controls
          </CardTitle>
          <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Control who can see each part of your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="preview">Audience Preview</TabsTrigger>
            </TabsList>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 mt-6">
              {Object.entries(groupedFields).map(([category, fields]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-foreground dark:text-foreground mb-3 capitalize">
                    {category} Information
                  </h3>
                  <div className="space-y-3">
                    {fields.map((field) => {
                      const visibility = getFieldVisibility(field.name);
                      const isRedacted = redactMode && field.sensitive;

                      return (
                        <div
                          key={field.name}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isRedacted
                              ? 'bg-[#FEF3C7] dark:bg-yellow-950/20 border-[#FCD34D]'
                              : 'bg-white dark:bg-background border-proofound-stone dark:border-border'
                          }`}
                        >
                          <div className="flex-1">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              {field.label}
                              {field.sensitive && (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-[#D97706] text-[#D97706]"
                                >
                                  Sensitive
                                </Badge>
                              )}
                            </Label>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                              {field.description}
                            </p>
                          </div>
                          <Select
                            value={visibility}
                            onValueChange={(value: VisibilityLevel) =>
                              handleFieldVisibilityChange(field.name, value)
                            }
                            disabled={isRedacted}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  {getVisibilityIcon(visibility)}
                                  <span className="capitalize">{visibility}</span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {VISIBILITY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-start gap-2">
                                    <option.icon className="w-4 h-4 mt-0.5" />
                                    <div>
                                      <div className="font-medium">{option.label}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {option.description}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Audience Preview Tab */}
            <TabsContent value="preview" className="space-y-4 mt-6">
              <div className="flex gap-2">
                {(['public', 'network', 'matched'] as const).map((audience) => (
                  <Button
                    key={audience}
                    variant={activePreview === audience ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActivePreview(audience)}
                    className={activePreview === audience ? 'bg-proofound-forest text-white' : ''}
                  >
                    {audience === 'public' && <Globe className="w-4 h-4 mr-2" />}
                    {audience === 'network' && <Users className="w-4 h-4 mr-2" />}
                    {audience === 'matched' && <Lock className="w-4 h-4 mr-2" />}
                    {audience.charAt(0).toUpperCase() + audience.slice(1)}
                  </Button>
                ))}
              </div>

              <div className="border border-proofound-stone dark:border-border rounded-lg p-4 bg-japandi-bg dark:bg-background/50">
                <h4 className="text-sm font-semibold text-foreground dark:text-foreground mb-3">
                  Visible to {activePreview} audience:
                </h4>
                <div className="space-y-2">
                  {PROFILE_FIELDS.map((field) => {
                    const visible = isFieldVisible(field.name, activePreview);
                    return (
                      <div
                        key={field.name}
                        className={`flex items-center gap-2 text-sm ${
                          visible
                            ? 'text-foreground dark:text-foreground'
                            : 'text-muted-foreground dark:text-muted-foreground line-through'
                        }`}
                      >
                        {visible ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        )}
                        {field.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={handleResetToDefaults}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="bg-proofound-forest text-white">
          {isSaving ? 'Saving...' : 'Save Privacy Settings'}
        </Button>
      </div>
    </div>
  );
}
