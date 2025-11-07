/**
 * Matching Profile Editor Component
 *
 * Allows users to customize their matching preferences:
 * - Adjust weight/importance of different scoring factors
 * - Set hard constraints (must-have requirements)
 * - Save profiles for different contexts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Save, RotateCcw, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { log } from '@/lib/log';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Default weights from matching scorers
const DEFAULT_WEIGHTS = {
  skills: 0.3,
  experience: 0.15,
  values: 0.25,
  causes: 0.15,
  location: 0.05,
  compensation: 0.05,
  availability: 0.03,
  language: 0.02,
};

interface MatchingProfile {
  id?: string;
  name: string;
  weights: Record<string, number>;
  constraints: {
    requireEmailVerified: boolean;
    requirePhoneVerified: boolean;
    requireProfileComplete: boolean;
    requireMinSkillMatch: boolean;
    minSkillMatchThreshold: number;
    requireLocationMatch: boolean;
    requireAvailabilityMatch: boolean;
  };
}

interface MatchingProfileEditorProps {
  profileId?: string; // If editing existing profile
  onSave?: (profile: MatchingProfile) => void;
  onCancel?: () => void;
}

export function MatchingProfileEditor({ profileId, onSave, onCancel }: MatchingProfileEditorProps) {
  const [profile, setProfile] = useState<MatchingProfile>({
    name: 'Default Profile',
    weights: { ...DEFAULT_WEIGHTS },
    constraints: {
      requireEmailVerified: true,
      requirePhoneVerified: false,
      requireProfileComplete: false,
      requireMinSkillMatch: false,
      minSkillMatchThreshold: 0.3,
      requireLocationMatch: false,
      requireAvailabilityMatch: false,
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!profileId);
  const { toast } = useToast();

  // Load existing profile if profileId provided
  useEffect(() => {
    if (profileId) {
      loadProfile(profileId);
    }
  }, [profileId]);

  const loadProfile = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/matching/profile/${id}`);

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      setProfile(data.profile);
    } catch (error) {
      log.error('matching.profile.load.failed', {
        profileId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast({
        title: 'Failed to load profile',
        description: 'Could not load matching preferences',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightChange = (factor: string, value: number[]) => {
    const newValue = value[0] / 100; // Convert from 0-100 to 0-1
    const newWeights = { ...profile.weights, [factor]: newValue };

    // Normalize weights to sum to 1.0
    const total = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
    const normalized = Object.fromEntries(
      Object.entries(newWeights).map(([k, v]) => [k, v / total])
    );

    setProfile({ ...profile, weights: normalized });
  };

  const handleConstraintChange = (
    constraint: keyof MatchingProfile['constraints'],
    value: boolean | number
  ) => {
    setProfile({
      ...profile,
      constraints: {
        ...profile.constraints,
        [constraint]: value,
      },
    });
  };

  const handleReset = () => {
    setProfile({
      ...profile,
      weights: { ...DEFAULT_WEIGHTS },
    });
    toast({
      title: 'Weights reset',
      description: 'Matching weights have been reset to default values',
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await fetch('/api/matching/profile', {
        method: profileId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: profileId,
          ...profile,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save profile');
      }

      const data = await response.json();

      toast({
        title: 'Profile saved',
        description: 'Your matching preferences have been saved',
      });

      log.info('matching.profile.saved', {
        profileId: data.profile.id,
        name: profile.name,
      });

      if (onSave) {
        onSave(data.profile);
      }
    } catch (error) {
      log.error('matching.profile.save.failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast({
        title: 'Failed to save profile',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const weightFactors = [
    {
      key: 'skills',
      label: 'Skills Match',
      description: 'How important is it that candidates have matching technical and domain skills?',
    },
    {
      key: 'values',
      label: 'Values Alignment',
      description: 'How important is it that candidates share your core values?',
    },
    {
      key: 'experience',
      label: 'Experience Level',
      description: "How important is the candidate's years of experience and seniority?",
    },
    {
      key: 'causes',
      label: 'Cause Alignment',
      description: 'How important is it that candidates care about similar causes?',
    },
    {
      key: 'location',
      label: 'Location Match',
      description: 'How important is geographic proximity or timezone overlap?',
    },
    {
      key: 'compensation',
      label: 'Compensation Fit',
      description: 'How important is alignment on compensation expectations?',
    },
    {
      key: 'availability',
      label: 'Availability',
      description: 'How important is matching start date and commitment level?',
    },
    {
      key: 'language',
      label: 'Language Match',
      description: 'How important is shared language proficiency?',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Name */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Name</CardTitle>
          <CardDescription>Give this matching profile a descriptive name</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="e.g., Senior Engineering Roles"
          />
        </CardContent>
      </Card>

      {/* Matching Weights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Matching Weights</CardTitle>
              <CardDescription>
                Adjust the importance of different factors in your match scores
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {weightFactors.map((factor) => {
            const weight = profile.weights[factor.key] || 0;
            const percentage = Math.round(weight * 100);

            return (
              <div key={factor.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>{factor.label}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{factor.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-sm font-mono font-semibold text-gray-600 dark:text-gray-400">
                    {percentage}%
                  </span>
                </div>
                <Slider
                  value={[percentage]}
                  onValueChange={(value) => handleWeightChange(factor.key, value)}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            );
          })}

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              Note: Weights are automatically normalized to total 100%. Adjusting one weight will
              proportionally affect others.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hard Constraints */}
      <Card>
        <CardHeader>
          <CardTitle>Hard Constraints</CardTitle>
          <CardDescription>Set must-have requirements that filter out candidates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Verification Constraints */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Verification Requirements</h4>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require-email">Email Verified</Label>
                <p className="text-xs text-gray-500">
                  Only show candidates with verified email addresses
                </p>
              </div>
              <Switch
                id="require-email"
                checked={profile.constraints.requireEmailVerified}
                onCheckedChange={(checked) =>
                  handleConstraintChange('requireEmailVerified', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require-phone">Phone Verified</Label>
                <p className="text-xs text-gray-500">
                  Only show candidates with verified phone numbers
                </p>
              </div>
              <Switch
                id="require-phone"
                checked={profile.constraints.requirePhoneVerified}
                onCheckedChange={(checked) =>
                  handleConstraintChange('requirePhoneVerified', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require-complete">Profile Complete</Label>
                <p className="text-xs text-gray-500">
                  Only show candidates with 100% complete profiles
                </p>
              </div>
              <Switch
                id="require-complete"
                checked={profile.constraints.requireProfileComplete}
                onCheckedChange={(checked) =>
                  handleConstraintChange('requireProfileComplete', checked)
                }
              />
            </div>
          </div>

          <Separator />

          {/* Match Quality Constraints */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Match Quality</h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="require-skill-match">Minimum Skill Match</Label>
                  <p className="text-xs text-gray-500">
                    Require a minimum percentage of skill overlap
                  </p>
                </div>
                <Switch
                  id="require-skill-match"
                  checked={profile.constraints.requireMinSkillMatch}
                  onCheckedChange={(checked) =>
                    handleConstraintChange('requireMinSkillMatch', checked)
                  }
                />
              </div>

              {profile.constraints.requireMinSkillMatch && (
                <div className="pl-4 space-y-2">
                  <Label>
                    Minimum Threshold:{' '}
                    {Math.round(profile.constraints.minSkillMatchThreshold * 100)}%
                  </Label>
                  <Slider
                    value={[profile.constraints.minSkillMatchThreshold * 100]}
                    onValueChange={(value) =>
                      handleConstraintChange('minSkillMatchThreshold', value[0] / 100)
                    }
                    min={10}
                    max={90}
                    step={5}
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Context Constraints */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Context Requirements</h4>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require-location">Location Match</Label>
                <p className="text-xs text-gray-500">
                  Only show candidates in specified locations/timezones
                </p>
              </div>
              <Switch
                id="require-location"
                checked={profile.constraints.requireLocationMatch}
                onCheckedChange={(checked) =>
                  handleConstraintChange('requireLocationMatch', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require-availability">Availability Match</Label>
                <p className="text-xs text-gray-500">
                  Only show candidates available within required timeframe
                </p>
              </div>
              <Switch
                id="require-availability"
                checked={profile.constraints.requireAvailabilityMatch}
                onCheckedChange={(checked) =>
                  handleConstraintChange('requireAvailabilityMatch', checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
}
