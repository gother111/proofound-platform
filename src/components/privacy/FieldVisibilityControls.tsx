/**
 * Field-Level Visibility Controls Component
 *
 * Allows users to set fine-grained visibility for each profile field
 * Implements PRD requirement for field-level privacy + Redact Mode
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
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
import {
  Eye,
  EyeOff,
  Lock,
  Globe,
  Users,
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

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
  { value: 'public', label: 'Public', description: 'Visible on your Public Page', icon: Globe },
  {
    value: 'network',
    label: 'Trusted review context',
    description: 'Visible only in trusted review contexts',
    icon: Users,
  },
  {
    value: 'private',
    label: 'Assignment review',
    description: 'Visible only when assignment-review access and reveal rules allow it',
    icon: Lock,
  },
  { value: 'hidden', label: 'Hidden', description: 'Completely hidden', icon: EyeOff },
];

interface FieldVisibilityControlsProps {
  userId: string;
}

const PRIVACY_FIELD_CONTROLS_LOAD_FAILED_TITLE = 'Privacy field controls could not load';
const PRIVACY_FIELD_CONTROLS_LOAD_FAILED_MESSAGE =
  'Your saved privacy choices could not be loaded. Retry before changing field visibility.';
const PRIVACY_FIELD_CONTROLS_SAVE_FAILED_TITLE = 'Privacy settings were not saved';
const PRIVACY_FIELD_CONTROLS_SAVE_FAILED_MESSAGE =
  'Your visibility choices were not saved. They are still selected here; retry before leaving this page.';

function getResponseStatus(response: Response) {
  return typeof response.status === 'number' ? response.status : 'unknown';
}

function hasReturnedError(payload: unknown) {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string' &&
      payload.error.trim().length > 0
  );
}

export function FieldVisibilityControls({ userId }: FieldVisibilityControlsProps) {
  const [fieldVisibility, setFieldVisibility] = useState<Record<string, VisibilityLevel>>({});
  const [redactMode, setRedactMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<'public' | 'network' | 'matched'>('public');

  const fetchPrivacySettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const response = await apiFetch('/api/user/privacy-settings');
      const data = (await response.json().catch(() => null)) as {
        fieldVisibility?: Record<string, VisibilityLevel>;
        redactMode?: boolean;
      } | null;

      if (!response.ok) {
        dispatchClientDiagnostic('privacy.field_controls.load_returned_error', {
          status: getResponseStatus(response),
          hasReturnedError: hasReturnedError(data),
        });
        throw new Error('privacy_field_controls_load_request_failed');
      }

      setFieldVisibility(data?.fieldVisibility || {});
      setRedactMode(data?.redactMode || false);
    } catch (error) {
      dispatchClientErrorDiagnostic('privacy.field_controls.load_failed', error);
      setLoadError(PRIVACY_FIELD_CONTROLS_LOAD_FAILED_MESSAGE);
      toast.error(PRIVACY_FIELD_CONTROLS_LOAD_FAILED_TITLE, {
        description: PRIVACY_FIELD_CONTROLS_LOAD_FAILED_MESSAGE,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPrivacySettings();
  }, [fetchPrivacySettings, userId]);

  const handleFieldVisibilityChange = (fieldName: string, visibility: VisibilityLevel) => {
    setSaveError(null);
    setFieldVisibility((prev) => ({
      ...prev,
      [fieldName]: visibility,
    }));
  };

  const handleRedactModeToggle = async (enabled: boolean) => {
    setSaveError(null);
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
    setSaveError(null);
    try {
      const response = await apiFetch('/api/user/privacy-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldVisibility,
          redactMode,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        dispatchClientDiagnostic('privacy.field_controls.save_returned_error', {
          status: getResponseStatus(response),
          hasReturnedError: hasReturnedError(payload),
        });
        throw new Error('privacy_field_controls_save_request_failed');
      }

      setSaveError(null);
      toast.success('Privacy settings saved successfully');
    } catch (error) {
      dispatchClientErrorDiagnostic('privacy.field_controls.save_failed', error);
      setSaveError(PRIVACY_FIELD_CONTROLS_SAVE_FAILED_MESSAGE);
      toast.error(PRIVACY_FIELD_CONTROLS_SAVE_FAILED_TITLE, {
        description: PRIVACY_FIELD_CONTROLS_SAVE_FAILED_MESSAGE,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setSaveError(null);
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

  if (loadError) {
    return (
      <Card
        role="alert"
        aria-live="assertive"
        className="border-[#FCD34D] bg-[#FFFBEB] p-6 dark:border-yellow-800 dark:bg-yellow-950/20"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-[#D97706]" aria-hidden="true" />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-[#92400E] dark:text-yellow-100">
                {PRIVACY_FIELD_CONTROLS_LOAD_FAILED_TITLE}
              </h3>
              <p className="mt-1 text-sm text-[#92400E] dark:text-yellow-200">{loadError}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void fetchPrivacySettings();
              }}
              className="border-[#D97706] text-[#92400E] hover:bg-[#FEF3C7] dark:border-yellow-700 dark:text-yellow-100 dark:hover:bg-yellow-950/40"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Retry privacy controls
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Redact Mode Toggle */}
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground flex flex-wrap items-center gap-2">
                <EyeOff className="w-5 h-5" />
                Redact Mode
                <Badge variant="secondary" className="ml-2 bg-[#D97706] text-white">
                  Quick Hide
                </Badge>
              </CardTitle>
              <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground mt-2">
                Instantly hide all sensitive information (location, email, org affiliation) with one
                toggle. Useful when you need to share your Public Page without exposing private
                context.
              </CardDescription>
            </div>
            <Switch
              checked={redactMode}
              onCheckedChange={handleRedactModeToggle}
              className="shrink-0 data-[state=checked]:bg-[#D97706]"
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
            Control Public Page fields and assignment-review visibility
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
                          className={`flex flex-col gap-3 p-3 rounded-lg border sm:flex-row sm:items-center sm:justify-between ${
                            isRedacted
                              ? 'bg-[#FEF3C7] dark:bg-yellow-950/20 border-[#FCD34D]'
                              : 'bg-white dark:bg-background border-proofound-stone dark:border-border'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <Label className="text-sm font-medium flex flex-wrap items-center gap-2">
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
                            <SelectTrigger className="w-full sm:w-[160px]">
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
              <div className="grid grid-cols-1 gap-2 sm:flex">
                {(['public', 'network', 'matched'] as const).map((audience) => {
                  const audienceLabel =
                    audience === 'public'
                      ? 'Public Page'
                      : audience === 'network'
                        ? 'Trusted review'
                        : 'Assignment review';
                  return (
                    <Button
                      key={audience}
                      variant={activePreview === audience ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActivePreview(audience)}
                      className={
                        activePreview === audience
                          ? 'w-full bg-proofound-forest text-white sm:w-auto'
                          : 'w-full sm:w-auto'
                      }
                    >
                      {audience === 'public' && <Globe className="w-4 h-4 mr-2" />}
                      {audience === 'network' && <Users className="w-4 h-4 mr-2" />}
                      {audience === 'matched' && <Lock className="w-4 h-4 mr-2" />}
                      {audienceLabel}
                    </Button>
                  );
                })}
              </div>

              <div className="border border-proofound-stone dark:border-border rounded-lg p-4 bg-japandi-bg dark:bg-background/50">
                <h4 className="text-sm font-semibold text-foreground dark:text-foreground mb-3">
                  Visible in{' '}
                  {activePreview === 'public'
                    ? 'Public Page'
                    : activePreview === 'network'
                      ? 'trusted review'
                      : 'assignment review'}
                  :
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
      {saveError ? (
        <Card
          role="alert"
          aria-live="assertive"
          className="border-[#FCD34D] bg-[#FFFBEB] p-4 dark:border-yellow-800 dark:bg-yellow-950/20"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#D97706]" />
              <div className="space-y-1">
                <h3 className="font-semibold text-[#92400E] dark:text-yellow-100">
                  {PRIVACY_FIELD_CONTROLS_SAVE_FAILED_TITLE}
                </h3>
                <p className="text-sm text-[#92400E] dark:text-yellow-200">{saveError}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void handleSave();
              }}
              disabled={isSaving}
              className="shrink-0 border-[#D97706] text-[#92400E] hover:bg-[#FEF3C7] dark:border-yellow-700 dark:text-yellow-100 dark:hover:bg-yellow-950/40"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Retry save
            </Button>
          </div>
        </Card>
      ) : null}

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
