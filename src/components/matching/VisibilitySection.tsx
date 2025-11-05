/**
 * Visibility Section
 * Implements PRD Gap 5: Control what orgs can see
 */

'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export function VisibilitySection({ profile, onChange }: any) {
  const visibilitySettings = profile.visibility || {
    showExactSalary: false,
    showExactLocation: true,
    allowNameRedaction: false,
    showFullSkillLevels: true,
  };

  const handleToggle = (field: string, value: boolean) => {
    onChange({
      visibility: {
        ...visibilitySettings,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Control what information organizations can see about you. Your privacy is important.
        </AlertDescription>
      </Alert>

      {/* Salary Visibility */}
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <Label htmlFor="showExactSalary">Show Exact Salary Range</Label>
          <p className="text-sm text-muted-foreground">
            If disabled, organizations will only see if there's salary overlap, not your exact range
          </p>
        </div>
        <Switch
          id="showExactSalary"
          checked={visibilitySettings.showExactSalary}
          onCheckedChange={(checked) => handleToggle('showExactSalary', checked)}
        />
      </div>

      {/* Location Visibility */}
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <Label htmlFor="showExactLocation">Show Exact Location</Label>
          <p className="text-sm text-muted-foreground">
            If disabled, only your region will be shown (e.g., "Europe" instead of "Berlin")
          </p>
        </div>
        <Switch
          id="showExactLocation"
          checked={visibilitySettings.showExactLocation}
          onCheckedChange={(checked) => handleToggle('showExactLocation', checked)}
        />
      </div>

      {/* Name/Photo Redaction */}
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <Label htmlFor="allowNameRedaction">Enable Redacted Mode</Label>
          <p className="text-sm text-muted-foreground">
            Hide your name and photo until you accept a match. Organizations see your skills and
            experience only.
          </p>
        </div>
        <Switch
          id="allowNameRedaction"
          checked={visibilitySettings.allowNameRedaction}
          onCheckedChange={(checked) => handleToggle('allowNameRedaction', checked)}
        />
      </div>

      {/* Skills Visibility Level */}
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <Label htmlFor="showFullSkillLevels">Show Detailed Skill Levels</Label>
          <p className="text-sm text-muted-foreground">
            If disabled, organizations see which skills you have but not your proficiency levels
          </p>
        </div>
        <Switch
          id="showFullSkillLevels"
          checked={visibilitySettings.showFullSkillLevels}
          onCheckedChange={(checked) => handleToggle('showFullSkillLevels', checked)}
        />
      </div>
    </div>
  );
}
