/**
 * Focus Areas Section
 * Implements PRD Gap 5: Desired roles, industries, org types
 */

'use client';

import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { TypeaheadChips } from '@/components/matching/TypeaheadChips';
import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { INDUSTRY_OPTIONS, mapIndustryListToCanonical } from '@/lib/industry/options';

type FocusProfile = {
  desiredRoles: string[];
  desiredIndustries?: string[];
  preferredIndustryKeys?: string[];
  preferredIndustryLabels?: string[];
  avoidIndustryKeys?: string[];
  avoidIndustryLabels?: string[];
  orgTypes?: string[];
};

export function FocusAreasSection({
  profile,
  onChange,
}: {
  profile: FocusProfile;
  onChange: (partial: Partial<FocusProfile>) => void;
}) {
  const [roleInput, setRoleInput] = useState('');

  const preferredIndustryKeys = useMemo(() => {
    if (Array.isArray(profile.preferredIndustryKeys)) {
      return profile.preferredIndustryKeys;
    }
    return mapIndustryListToCanonical(profile.desiredIndustries).keys;
  }, [profile.preferredIndustryKeys, profile.desiredIndustries]);

  const preferredIndustryLabels = useMemo(
    () =>
      INDUSTRY_OPTIONS.filter((option) => preferredIndustryKeys.includes(option.key)).map(
        (option) => option.label
      ),
    [preferredIndustryKeys]
  );

  const avoidIndustryKeys = useMemo(() => {
    if (Array.isArray(profile.avoidIndustryKeys)) {
      return profile.avoidIndustryKeys;
    }
    return mapIndustryListToCanonical(profile.avoidIndustryLabels).keys;
  }, [profile.avoidIndustryKeys, profile.avoidIndustryLabels]);
  const avoidIndustryLabels = useMemo(
    () =>
      INDUSTRY_OPTIONS.filter((option) => avoidIndustryKeys.includes(option.key)).map(
        (option) => option.label
      ),
    [avoidIndustryKeys]
  );

  const handleAddRole = () => {
    if (roleInput.trim()) {
      onChange({ desiredRoles: [...profile.desiredRoles, roleInput.trim()] });
      setRoleInput('');
    }
  };

  const handleRemoveRole = (role: string) => {
    onChange({ desiredRoles: profile.desiredRoles.filter((r: string) => r !== role) });
  };

  const setPreferredIndustries = (keys: string[]) => {
    const labels = INDUSTRY_OPTIONS.filter((option) => keys.includes(option.key)).map(
      (option) => option.label
    );
    onChange({
      preferredIndustryKeys: keys,
      preferredIndustryLabels: labels,
      desiredIndustries: labels,
    });
  };

  const setAvoidIndustries = (keys: string[]) => {
    const labels = INDUSTRY_OPTIONS.filter((option) => keys.includes(option.key)).map(
      (option) => option.label
    );
    onChange({
      avoidIndustryKeys: keys,
      avoidIndustryLabels: labels,
    });
  };

  const orgTypeOptions = [
    { value: 'company', label: 'Company' },
    { value: 'ngo', label: 'NGO' },
    { value: 'government', label: 'Government' },
    { value: 'network', label: 'Network' },
    { value: 'startup', label: 'Startup' },
  ];

  const toggleOrgType = (type: string) => {
    const current = profile.orgTypes || [];
    const updated = current.includes(type)
      ? current.filter((t: string) => t !== type)
      : [...current, type];
    onChange({ orgTypes: updated });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="roles">Roles You're Interested In</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="roles"
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
            placeholder="e.g., Software Engineer, Product Manager"
            className="min-w-0"
          />
          <button
            type="button"
            onClick={handleAddRole}
            className="min-h-11 rounded-md bg-proofound-forest px-4 py-2 text-white hover:bg-proofound-forest/90 sm:min-w-20"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {profile.desiredRoles.map((role: string, i: number) => (
            <Badge key={i} variant="secondary" className="gap-1.5 px-2 py-1.5">
              {role}
              <button
                type="button"
                onClick={() => handleRemoveRole(role)}
                className="-my-2 -mr-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/70 hover:text-proofound-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-1"
                aria-label={`Remove ${role}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Preferred industries</Label>
        <TypeaheadChips
          options={INDUSTRY_OPTIONS}
          value={preferredIndustryKeys}
          onChange={setPreferredIndustries}
          placeholder="Select preferred industries"
          maxSelections={19}
        />
        <p className="text-xs text-muted-foreground">
          Selected:{' '}
          {preferredIndustryLabels.length > 0 ? preferredIndustryLabels.join(', ') : 'None'}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Avoid industries</Label>
        <TypeaheadChips
          options={INDUSTRY_OPTIONS}
          value={avoidIndustryKeys}
          onChange={setAvoidIndustries}
          placeholder="Select industries to avoid"
          maxSelections={19}
        />
        <p className="text-xs text-muted-foreground">
          Selected: {avoidIndustryLabels.length > 0 ? avoidIndustryLabels.join(', ') : 'None'}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Organization Types</Label>
        <div className="space-y-2">
          {orgTypeOptions.map((type) => (
            <div
              key={type.value}
              className="flex min-h-10 items-center gap-3 rounded-md border border-proofound-stone/70 bg-white/70 px-3 transition-colors hover:border-proofound-forest/35 hover:bg-proofound-parchment/30"
            >
              <Checkbox
                id={`org-${type.value}`}
                checked={profile.orgTypes?.includes(type.value)}
                onCheckedChange={() => toggleOrgType(type.value)}
                className="h-5 w-5"
                aria-label={type.label}
              />
              <label
                htmlFor={`org-${type.value}`}
                className="flex min-h-10 flex-1 cursor-pointer items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {type.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
