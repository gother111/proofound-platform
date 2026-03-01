/**
 * Individual Field Visibility Controls
 *
 * Allows individuals to control visibility of profile fields
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

export type IndividualVisibilityLevel = 'public' | 'network_only' | 'match_only' | 'private';

export interface IndividualFieldVisibility {
  displayName: IndividualVisibilityLevel;
  avatar: IndividualVisibilityLevel;
  headline: IndividualVisibilityLevel;
  location: IndividualVisibilityLevel;
  mission: IndividualVisibilityLevel;
  vision: IndividualVisibilityLevel;
  values: IndividualVisibilityLevel;
  causes: IndividualVisibilityLevel;
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
    description: 'Visible to everyone',
    icon: Eye,
    color: 'text-green-600',
  },
  {
    value: 'network_only' as IndividualVisibilityLevel,
    label: 'Network Only',
    description: 'Visible to your connections',
    icon: Users,
    color: 'text-blue-600',
  },
  {
    value: 'match_only' as IndividualVisibilityLevel,
    label: 'Match Only',
    description: 'Visible after mutual match',
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
    label: 'Display Name',
    recommended: 'public',
    description: 'Your name as it appears to others',
  },
  {
    key: 'avatar',
    label: 'Profile Photo',
    recommended: 'public',
    description: 'Your profile picture',
  },
  {
    key: 'headline',
    label: 'Headline',
    recommended: 'public',
    description: 'Professional headline or tagline',
  },
  {
    key: 'location',
    label: 'Location',
    recommended: 'network_only',
    description: 'City/country information',
  },
  {
    key: 'mission',
    label: 'Mission Statement',
    recommended: 'public',
    description: 'Your personal mission',
  },
  {
    key: 'vision',
    label: 'Vision Statement',
    recommended: 'public',
    description: 'Your future vision',
  },
  {
    key: 'values',
    label: 'Core Values',
    recommended: 'public',
    description: 'What you stand for',
  },
  {
    key: 'causes',
    label: 'Causes',
    recommended: 'public',
    description: 'Causes you support',
  },
  {
    key: 'skills',
    label: 'Skills',
    recommended: 'public',
    description: 'Your expertise and capabilities',
  },
  {
    key: 'experiences',
    label: 'Work Experience',
    recommended: 'network_only',
    description: 'Employment history',
  },
  {
    key: 'education',
    label: 'Education',
    recommended: 'public',
    description: 'Academic background',
  },
  {
    key: 'volunteering',
    label: 'Volunteering',
    recommended: 'public',
    description: 'Volunteer work and community service',
  },
  {
    key: 'impactStories',
    label: 'Impact Stories',
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
    mission: initialVisibility.mission || 'public',
    vision: initialVisibility.vision || 'public',
    values: initialVisibility.values || 'public',
    causes: initialVisibility.causes || 'public',
    experiences: initialVisibility.experiences || 'network_only',
    education: initialVisibility.education || 'public',
    volunteering: initialVisibility.volunteering || 'public',
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
      console.error('Failed to save visibility settings:', error);
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

  return (
    <Card className="border-proofound-stone">
      <CardHeader>
        <CardTitle className="text-xl">Field Visibility</CardTitle>
        <CardDescription>
          Control who can see each part of your profile. Changes apply to all future views.
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
                className="flex items-center justify-between gap-4 p-3 rounded-lg border border-proofound-stone hover:bg-japandi-bg transition-colors"
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

                <div className="flex items-center gap-2">
                  <Select
                    value={currentVisibility}
                    onValueChange={(value) =>
                      handleFieldChange(
                        field.key as keyof IndividualFieldVisibility,
                        value as IndividualVisibilityLevel
                      )
                    }
                  >
                    <SelectTrigger id={field.key} className="w-[140px]">
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
                          <strong>Recommended:</strong> {field.recommended}
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
        <div className="flex items-center justify-between pt-4 border-t border-proofound-stone">
          <p className="text-xs text-muted-foreground">
            {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
          </p>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
          >
            {saving ? 'Saving...' : 'Save Privacy Settings'}
          </Button>
        </div>

        {/* Privacy Note */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Privacy First</p>
              <p className="text-xs">
                Your privacy settings are enforced at the API level. Organizations and other users
                will only see fields based on your visibility rules. You can change these settings
                anytime.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
