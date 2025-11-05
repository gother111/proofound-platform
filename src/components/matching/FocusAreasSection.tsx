/**
 * Focus Areas Section
 * Implements PRD Gap 5: Desired roles, industries, org types
 */

'use client';

import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { X } from 'lucide-react';

export function FocusAreasSection({ profile, onChange }: any) {
  const [roleInput, setRoleInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');

  const handleAddRole = () => {
    if (roleInput.trim()) {
      onChange({ desiredRoles: [...profile.desiredRoles, roleInput.trim()] });
      setRoleInput('');
    }
  };

  const handleRemoveRole = (role: string) => {
    onChange({ desiredRoles: profile.desiredRoles.filter((r: string) => r !== role) });
  };

  const handleAddIndustry = () => {
    if (industryInput.trim()) {
      onChange({ desiredIndustries: [...profile.desiredIndustries, industryInput.trim()] });
      setIndustryInput('');
    }
  };

  const handleRemoveIndustry = (industry: string) => {
    onChange({
      desiredIndustries: profile.desiredIndustries.filter((i: string) => i !== industry),
    });
  };

  const orgTypeOptions = ['Company', 'NGO', 'Government', 'Network', 'Startup'];

  const toggleOrgType = (type: string) => {
    const current = profile.orgTypes || [];
    const updated = current.includes(type)
      ? current.filter((t: string) => t !== type)
      : [...current, type];
    onChange({ orgTypes: updated });
  };

  return (
    <div className="space-y-6">
      {/* Desired Roles */}
      <div className="space-y-2">
        <Label htmlFor="roles">Roles You're Interested In</Label>
        <div className="flex gap-2">
          <Input
            id="roles"
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
            placeholder="e.g., Software Engineer, Product Manager"
          />
          <button
            type="button"
            onClick={handleAddRole}
            className="px-4 py-2 bg-proofound-forest text-white rounded-md hover:bg-proofound-forest/90"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {profile.desiredRoles.map((role: string, i: number) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {role}
              <button onClick={() => handleRemoveRole(role)} className="ml-1">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Preferred Industries */}
      <div className="space-y-2">
        <Label htmlFor="industries">Preferred Industries</Label>
        <div className="flex gap-2">
          <Input
            id="industries"
            value={industryInput}
            onChange={(e) => setIndustryInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIndustry())}
            placeholder="e.g., Healthcare, Education, Technology"
          />
          <button
            type="button"
            onClick={handleAddIndustry}
            className="px-4 py-2 bg-proofound-forest text-white rounded-md hover:bg-proofound-forest/90"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {profile.desiredIndustries.map((industry: string, i: number) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {industry}
              <button onClick={() => handleRemoveIndustry(industry)} className="ml-1">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Organization Types */}
      <div className="space-y-2">
        <Label>Organization Types</Label>
        <div className="space-y-2">
          {orgTypeOptions.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`org-${type}`}
                checked={profile.orgTypes?.includes(type)}
                onCheckedChange={() => toggleOrgType(type)}
              />
              <label
                htmlFor={`org-${type}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
