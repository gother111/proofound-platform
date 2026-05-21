/**
 * Individual Field Visibility Controls
 *
 * Allows individuals to control visibility of Public Page fields
 * Supports: public, network_only, match_only, private
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, Handshake, Lock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

export type IndividualVisibilityLevel = 'public' | 'network_only' | 'match_only' | 'private';

export interface IndividualFieldVisibility {
  displayName: IndividualVisibilityLevel;
  avatar: IndividualVisibilityLevel;
  headline: IndividualVisibilityLevel;
  location: IndividualVisibilityLevel;
  experiences: IndividualVisibilityLevel;
  education: IndividualVisibilityLevel;
  volunteering: IndividualVisibilityLevel;
  skills: IndividualVisibilityLevel;
  impactStories: IndividualVisibilityLevel;
}

interface IndividualFieldVisibilityControlsProps {
  userId: string;
  initialVisibility: Partial<IndividualFieldVisibility>;
  onSave: (visibility: IndividualFieldVisibility) => Promise<void>;
}

const VISIBILITY_OPTIONS = [
  {
    value: 'public' as IndividualVisibilityLevel,
    label: 'Public',
    description: 'Visible on your Public Page',
    icon: Eye,
    color: 'text-green-600',
  },
  {
    value: 'network_only' as IndividualVisibilityLevel,
    label: 'Connections',
    description: 'Visible to your connections',
    icon: Users,
    color: 'text-blue-600',
  },
  {
    value: 'match_only' as IndividualVisibilityLevel,
    label: 'After match',
    description: 'Visible after a mutual match',
    icon: Handshake,
    color: 'text-amber-600',
  },
  {
    value: 'private' as IndividualVisibilityLevel,
    label: 'Private',
    description: 'Only visible to you',
    icon: Lock,
    color: 'text-red-600',
  },
];

const FIELDS = [
  {
    key: 'displayName',
    label: 'Display name',
    recommended: 'public',
    description: 'Your name as it appears to others',
  },
  {
    key: 'avatar',
    label: 'Profile photo',
    recommended: 'public',
    description: 'Your Public Page picture',
  },
  {
    key: 'headline',
    label: 'Headline',
    recommended: 'public',
    description: 'Short proof-context headline',
  },
  {
    key: 'location',
    label: 'Location',
    recommended: 'network_only',
    description: 'City/country information',
  },
  {
    key: 'skills',
    label: 'Skills',
    recommended: 'public',
    description: 'Your expertise and capabilities',
  },
  {
    key: 'experiences',
    label: 'Work experience',
    recommended: 'private',
    description: 'Employment history',
  },
  {
    key: 'education',
    label: 'Education',
    recommended: 'private',
    description: 'Academic background',
  },
  {
    key: 'volunteering',
    label: 'Volunteering',
    recommended: 'private',
    description: 'Volunteer work and community service',
  },
  {
    key: 'impactStories',
    label: 'Impact stories',
    recommended: 'match_only',
    description: 'Detailed case studies and achievements',
  },
];

export function IndividualFieldVisibilityControls({
  userId,
  initialVisibility,
  onSave,
}: IndividualFieldVisibilityControlsProps) {
  const [visibility, setVisibility] = useState<IndividualFieldVisibility>({
    displayName: initialVisibility.displayName || 'public',
    avatar: initialVisibility.avatar || 'public',
    headline: initialVisibility.headline || 'public',
    location: initialVisibility.location || 'network_only',
    experiences: initialVisibility.experiences || 'private',
    education: initialVisibility.education || 'private',
    volunteering: initialVisibility.volunteering || 'private',
    skills: initialVisibility.skills || 'public',
    impactStories: initialVisibility.impactStories || 'match_only',
  });

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = (
    field: keyof IndividualFieldVisibility,
    value: IndividualVisibilityLevel
  ) => {
    setVisibility((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(visibility);
      setHasChanges(false);
      toast.success('Privacy settings saved', {
        description: 'Your field visibility preferences have been updated',
      });
    } catch (error) {
      dispatchClientErrorDiagnostic('privacy.field_visibility.save_failed', error);
      toast.error('Failed to save settings', {
        description: 'Please try again',
      });
    } finally {
      setSaving(false);
    }
  };

  const getVisibilityIcon = (level: IndividualVisibilityLevel) => {
    const option = VISIBILITY_OPTIONS.find((opt) => opt.value === level);
    if (!option) return <Eye className="h-4 w-4 text-muted-foreground" />;
    const Icon = option.icon;
    return <Icon className={`h-4 w-4 ${option.color}`} />;
  };

  const getVisibilityLabel = (level: string) =>
    VISIBILITY_OPTIONS.find((option) => option.value === level)?.label ?? 'Not set';

  return (
    <Card className="border-proofound-stone">
      <CardHeader>
        <CardTitle className="text-xl">Public Page visibility</CardTitle>
        <CardDescription>
          Control which Public Page details are visible and which stay private for future views.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visibility Level Legend */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-japandi-bg rounded-lg">
          {VISIBILITY_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <div key={option.value} className="flex items-start gap-2">
                <Icon className={`h-4 w-4 ${option.color} mt-0.5 flex-shrink-0`} />
                <div>
                  <div className="text-xs font-medium text-foreground">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Field Controls */}
        <div className="space-y-4">
          {FIELDS.map((field) => {
            const currentVisibility = visibility[field.key as keyof IndividualFieldVisibility];
            return (
              <div
                key={field.key}
                className="flex flex-col gap-3 rounded-lg border border-proofound-stone p-3 transition-colors hover:bg-japandi-bg sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Label
                      htmlFor={field.key}
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      {field.label}
                    </Label>
                    {getVisibilityIcon(currentVisibility)}
                    {field.recommended === currentVisibility && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-proofound-forest/5 text-proofound-forest"
                      >
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                </div>

                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <Select
                    value={currentVisibility}
                    onValueChange={(value) =>
                      handleFieldChange(
                        field.key as keyof IndividualFieldVisibility,
                        value as IndividualVisibilityLevel
                      )
                    }
                  >
                    <SelectTrigger id={field.key} className="w-full sm:w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIBILITY_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-3.5 w-3.5 ${option.color}`} />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs">
                          <strong>Recommended:</strong> {getVisibilityLabel(field.recommended)}
                          <br />
                          {
                            VISIBILITY_OPTIONS.find((opt) => opt.value === field.recommended)
                              ?.description
                          }
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="flex flex-col gap-3 border-t border-proofound-stone pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
          </p>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90 sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save privacy settings'}
          </Button>
        </div>

        {/* Privacy Note */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Privacy first</p>
              <p className="text-xs">
                Your privacy settings are applied everywhere your profile appears. Organizations and
                other viewers only see sections based on your visibility choices. You can change
                these settings anytime.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
