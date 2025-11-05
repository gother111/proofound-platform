/**
 * Constraints Section
 * Implements PRD Gap 5: Location, compensation, hours, availability
 */

'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

export function ConstraintsSection({ profile, onChange }: any) {
  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Work Mode */}
      <div className="space-y-3">
        <Label>Location Preference</Label>
        <RadioGroup
          value={profile.workMode}
          onValueChange={(value) => handleChange('workMode', value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="remote" id="remote" />
            <Label htmlFor="remote" className="font-normal">
              Remote Only
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="hybrid" id="hybrid" />
            <Label htmlFor="hybrid" className="font-normal">
              Hybrid (Remote + On-site)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="onsite" id="onsite" />
            <Label htmlFor="onsite" className="font-normal">
              On-site Only
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Compensation Range */}
      <div className="space-y-3">
        <Label>Desired Compensation Range</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              type="number"
              value={profile.minSalary || ''}
              onChange={(e) => handleChange('minSalary', Number(e.target.value))}
              placeholder="Minimum"
            />
          </div>
          <div>
            <Input
              type="number"
              value={profile.maxSalary || ''}
              onChange={(e) => handleChange('maxSalary', Number(e.target.value))}
              placeholder="Maximum"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            value={profile.currency}
            onValueChange={(value) => handleChange('currency', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="CAD">CAD</SelectItem>
              <SelectItem value="AUD">AUD</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground self-center">per year</div>
        </div>
        <p className="text-sm text-muted-foreground">
          Note: Only salary overlap will be shown to organizations, not exact amounts
        </p>
      </div>

      {/* Weekly Hours */}
      <div className="space-y-3">
        <Label>Weekly Hours</Label>
        <Slider
          min={0}
          max={60}
          step={5}
          value={[profile.hoursMin || 0, profile.hoursMax || 40]}
          onValueChange={([min, max]) => {
            onChange({ hoursMin: min, hoursMax: max });
          }}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{profile.hoursMin || 0} hours</span>
          <span>{profile.hoursMax || 40} hours</span>
        </div>
      </div>

      {/* Availability Window */}
      <div className="space-y-3">
        <Label>Availability Window</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="earliest" className="text-xs text-muted-foreground">
              Earliest Start
            </Label>
            <Input
              id="earliest"
              type="date"
              value={profile.availabilityEarliest || ''}
              onChange={(e) => handleChange('availabilityEarliest', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="latest" className="text-xs text-muted-foreground">
              Latest Start
            </Label>
            <Input
              id="latest"
              type="date"
              value={profile.availabilityLatest || ''}
              onChange={(e) => handleChange('availabilityLatest', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
