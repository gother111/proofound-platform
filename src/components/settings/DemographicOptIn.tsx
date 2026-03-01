/**
 * Demographic Opt-In Component
 *
 * Allows users to voluntarily provide demographic information
 * for fairness analytics. All data is anonymized and optional.
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Lock, Eye, Info, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DemographicData {
  optedIn: boolean;
  gender?: string;
  ethnicity?: string;
  ageRange?: string;
  disability?: string;
  veteranStatus?: string;
}

interface DemographicOptInProps {
  userId: string;
  initialData?: Partial<DemographicData>;
  onSave: (data: DemographicData) => Promise<void>;
}

const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Prefer not to say',
  'Prefer to self-describe',
];

const ETHNICITY_OPTIONS = [
  'Asian',
  'Black or African American',
  'Hispanic or Latino',
  'Native American or Alaska Native',
  'Native Hawaiian or Pacific Islander',
  'White',
  'Two or more races',
  'Prefer not to say',
];

const AGE_RANGE_OPTIONS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'Prefer not to say'];

const DISABILITY_OPTIONS = ['Yes', 'No', 'Prefer not to say'];

const VETERAN_OPTIONS = ['Yes', 'No', 'Prefer not to say'];

export function DemographicOptIn({ userId, initialData = {}, onSave }: DemographicOptInProps) {
  const [optedIn, setOptedIn] = useState(initialData.optedIn || false);
  const [gender, setGender] = useState(initialData.gender || '');
  const [ethnicity, setEthnicity] = useState(initialData.ethnicity || '');
  const [ageRange, setAgeRange] = useState(initialData.ageRange || '');
  const [disability, setDisability] = useState(initialData.disability || '');
  const [veteranStatus, setVeteranStatus] = useState(initialData.veteranStatus || '');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleOptInChange = (checked: boolean) => {
    setOptedIn(checked);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: DemographicData = {
        optedIn,
        ...(optedIn && {
          gender,
          ethnicity,
          ageRange,
          disability,
          veteranStatus,
        }),
      };

      await onSave(data);
      setHasChanges(false);
      toast.success('Demographic information saved', {
        description: 'Thank you for contributing to fair hiring practices',
      });
    } catch (error) {
      console.error('Failed to save demographic data:', error);
      toast.error('Failed to save', {
        description: 'Please try again',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="bento" className="border-proofound-stone">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Scale className="h-5 w-5" style={{ color: '#1C4D3A' }} />
              Fairness Analytics Opt-In
            </CardTitle>
            <CardDescription className="mt-2">
              Help us promote fair hiring by providing optional demographic information. All data is
              anonymized and used only for fairness metrics.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Privacy Guarantees */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100">100% Voluntary</p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Completely optional, withdraw anytime
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Anonymized</p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Never linked to your identity
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                Hidden from Orgs
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Organizations never see this data
              </p>
            </div>
          </div>
        </div>

        {/* Opt-In Checkbox */}
        <div className="flex items-start gap-3 p-4 rounded-lg border border-proofound-stone">
          <Checkbox id="opt-in" checked={optedIn} onCheckedChange={handleOptInChange} />
          <div className="flex-1">
            <Label htmlFor="opt-in" className="text-sm font-medium cursor-pointer text-foreground">
              Yes, I want to contribute to fairness analytics
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              By opting in, you help organizations identify and reduce bias in their hiring
              processes. Your data is aggregated with others and cannot be traced back to you.
            </p>
          </div>
        </div>

        {/* Demographic Fields (only shown if opted in) */}
        {optedIn && (
          <div className="space-y-4 p-4 bg-japandi-bg rounded-lg">
            <p className="text-sm font-medium text-foreground">
              Demographic Information (Optional)
            </p>
            <p className="text-xs text-muted-foreground">
              All fields are optional. You can skip any question.
            </p>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-sm text-foreground">
                Gender
              </Label>
              <Select
                value={gender}
                onValueChange={(val) => {
                  setGender(val);
                  setHasChanges(true);
                }}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select or skip" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ethnicity */}
            <div className="space-y-2">
              <Label htmlFor="ethnicity" className="text-sm text-foreground">
                Ethnicity/Race
              </Label>
              <Select
                value={ethnicity}
                onValueChange={(val) => {
                  setEthnicity(val);
                  setHasChanges(true);
                }}
              >
                <SelectTrigger id="ethnicity">
                  <SelectValue placeholder="Select or skip" />
                </SelectTrigger>
                <SelectContent>
                  {ETHNICITY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Age Range */}
            <div className="space-y-2">
              <Label htmlFor="ageRange" className="text-sm text-foreground">
                Age Range
              </Label>
              <Select
                value={ageRange}
                onValueChange={(val) => {
                  setAgeRange(val);
                  setHasChanges(true);
                }}
              >
                <SelectTrigger id="ageRange">
                  <SelectValue placeholder="Select or skip" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Disability Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="disability" className="text-sm text-foreground">
                  Disability Status
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Do you identify as a person with a disability as defined by the ADA?
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={disability}
                onValueChange={(val) => {
                  setDisability(val);
                  setHasChanges(true);
                }}
              >
                <SelectTrigger id="disability">
                  <SelectValue placeholder="Select or skip" />
                </SelectTrigger>
                <SelectContent>
                  {DISABILITY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Veteran Status */}
            <div className="space-y-2">
              <Label htmlFor="veteranStatus" className="text-sm text-foreground">
                Veteran Status
              </Label>
              <Select
                value={veteranStatus}
                onValueChange={(val) => {
                  setVeteranStatus(val);
                  setHasChanges(true);
                }}
              >
                <SelectTrigger id="veteranStatus">
                  <SelectValue placeholder="Select or skip" />
                </SelectTrigger>
                <SelectContent>
                  {VETERAN_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

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
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>

        {/* Legal Notice */}
        <div className="text-xs text-muted-foreground pt-3 border-t border-proofound-stone">
          <p>
            <strong>Legal Notice:</strong> This information is collected for statistical analysis
            only and is never used for hiring decisions. Organizations cannot see your individual
            responses. Data is stored securely and may be deleted upon request. Compliant with GDPR,
            CCPA, and EEO regulations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
