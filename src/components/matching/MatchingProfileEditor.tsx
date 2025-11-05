/**
 * Matching Profile Editor
 * Implements PRD Gap 5: UI for editing matching preferences
 *
 * Multi-section form with tabs:
 * 1. Focus Areas & Roles
 * 2. Values Weighting
 * 3. Practical Constraints
 * 4. Visibility Settings
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FocusAreasSection } from './FocusAreasSection';
import { ValuesWeightingSection } from './ValuesWeightingSection';
import { ConstraintsSection } from './ConstraintsSection';
import { VisibilitySection } from './VisibilitySection';

interface MatchingProfile {
  desiredRoles: string[];
  desiredIndustries: string[];
  orgTypes: string[];
  weights: {
    mission: number;
    expertise: number;
    tools: number;
    logistics: number;
    recency: number;
  };
  workMode: 'remote' | 'hybrid' | 'onsite';
  preferredLocations: string[];
  minSalary: number;
  maxSalary: number;
  currency: string;
  hoursMin: number;
  hoursMax: number;
  availabilityEarliest: string;
  availabilityLatest: string;
}

export function MatchingProfileEditor({ profileId }: { profileId: string }) {
  const [profile, setProfile] = useState<MatchingProfile | null>(null);
  const [activeTab, setActiveTab] = useState('focus');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch existing matching profile
  useEffect(() => {
    fetchMatchingProfile(profileId).then((data) => {
      setProfile(data || getDefaultProfile());
    });
  }, [profileId]);

  const handleUpdate = (updates: Partial<MatchingProfile>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!profile) return;

    // Validate weights sum to 100
    const totalWeight = Object.values(profile.weights).reduce((sum, w) => sum + w, 0);
    if (totalWeight !== 100) {
      toast.error('Weights must sum to 100%');
      return;
    }

    setIsSaving(true);
    try {
      await saveMatchingProfile(profileId, profile);
      toast.success('Matching preferences saved!');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="focus">Focus & Roles</TabsTrigger>
            <TabsTrigger value="weights">Values Weighting</TabsTrigger>
            <TabsTrigger value="constraints">Constraints</TabsTrigger>
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="focus">
              <FocusAreasSection profile={profile} onChange={handleUpdate} />
            </TabsContent>

            <TabsContent value="weights">
              <ValuesWeightingSection profile={profile} onChange={handleUpdate} />
            </TabsContent>

            <TabsContent value="constraints">
              <ConstraintsSection profile={profile} onChange={handleUpdate} />
            </TabsContent>

            <TabsContent value="visibility">
              <VisibilitySection profile={profile} onChange={handleUpdate} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
          {hasChanges && (
            <span className="text-sm text-muted-foreground self-center">
              You have unsaved changes
            </span>
          )}
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/**
 * Default matching profile
 */
function getDefaultProfile(): MatchingProfile {
  return {
    desiredRoles: [],
    desiredIndustries: [],
    orgTypes: [],
    weights: {
      mission: 30,
      expertise: 40,
      tools: 10,
      logistics: 10,
      recency: 10,
    },
    workMode: 'remote',
    preferredLocations: [],
    minSalary: 0,
    maxSalary: 0,
    currency: 'USD',
    hoursMin: 0,
    hoursMax: 40,
    availabilityEarliest: '',
    availabilityLatest: '',
  };
}

/**
 * Fetch matching profile from API
 */
async function fetchMatchingProfile(profileId: string): Promise<MatchingProfile | null> {
  try {
    const response = await fetch(`/api/matching-profile?profileId=${profileId}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Failed to fetch matching profile:', error);
    return null;
  }
}

/**
 * Save matching profile to API
 */
async function saveMatchingProfile(profileId: string, profile: MatchingProfile): Promise<void> {
  const response = await fetch('/api/matching-profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId, ...profile }),
  });

  if (!response.ok) {
    throw new Error('Failed to save matching profile');
  }
}
