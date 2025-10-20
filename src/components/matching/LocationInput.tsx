'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface LocationPreference {
  workMode: 'remote' | 'onsite' | 'hybrid' | '';
  country?: string;
  city?: string;
  radiusKm?: number;
}

interface LocationInputProps {
  value: LocationPreference;
  onChange: (value: LocationPreference) => void;
}

/**
 * Location mode selector with country/city inputs.
 */
export function LocationInput({ value, onChange }: LocationInputProps) {
  const needsLocation = value.workMode === 'onsite' || value.workMode === 'hybrid';

  return (
    <div className="space-y-3">
      {/* Work mode */}
      <div>
        <Label htmlFor="work-mode">Work Mode</Label>
        <Select
          value={value.workMode}
          onValueChange={(mode) =>
            onChange({ ...value, workMode: mode as LocationPreference['workMode'] })
          }
        >
          <SelectTrigger id="work-mode">
            <SelectValue placeholder="Select work mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="onsite">On-site</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Country and City (only for onsite/hybrid) */}
      {needsLocation && (
        <>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              type="text"
              value={value.country || ''}
              onChange={(e) => onChange({ ...value, country: e.target.value })}
              placeholder="e.g., United States, Sweden, etc."
            />
          </div>

          <div>
            <Label htmlFor="city">City (Optional)</Label>
            <Input
              id="city"
              type="text"
              value={value.city || ''}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              placeholder="e.g., Stockholm, San Francisco, etc."
            />
          </div>

          {value.workMode === 'onsite' && (
            <div>
              <Label htmlFor="radius">Radius (km)</Label>
              <Input
                id="radius"
                type="number"
                min="0"
                step="10"
                value={value.radiusKm || ''}
                onChange={(e) =>
                  onChange({ ...value, radiusKm: parseInt(e.target.value, 10) || undefined })
                }
                placeholder="e.g., 50"
              />
              <p className="text-xs mt-1" style={{ color: '#6B6760' }}>
                How far are you willing to travel for on-site work?
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
