'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CURRENCY_OPTIONS } from '@/lib/taxonomy/data';

export type CompensationPeriod = 'annual' | 'monthly' | 'hourly';

export interface CompensationRange {
  min: number;
  max: number;
  currency: string;
  period: CompensationPeriod;
}

interface CompensationInputProps {
  value: CompensationRange;
  onChange: (value: CompensationRange) => void;
  label?: string;
}

/**
 * Compensation range input with currency selector.
 */
export function CompensationInput({
  value,
  onChange,
  label = 'Compensation Range',
}: CompensationInputProps) {
  const amountStep = value.period === 'hourly' ? '1' : '1000';
  const periodDescription =
    value.period === 'annual'
      ? 'Annual compensation range.'
      : value.period === 'monthly'
        ? 'Monthly compensation range.'
        : 'Hourly compensation range.';

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      <div className="grid grid-cols-2 gap-3">
        {/* Min */}
        <div>
          <Label htmlFor="comp-min" className="text-xs" style={{ color: '#6B6760' }}>
            Minimum
          </Label>
          <Input
            id="comp-min"
            type="number"
            min="0"
            step={amountStep}
            value={value.min || ''}
            onChange={(e) => onChange({ ...value, min: parseInt(e.target.value, 10) || 0 })}
            placeholder="0"
          />
        </div>

        {/* Max */}
        <div>
          <Label htmlFor="comp-max" className="text-xs" style={{ color: '#6B6760' }}>
            Maximum
          </Label>
          <Input
            id="comp-max"
            type="number"
            min="0"
            step={amountStep}
            value={value.max || ''}
            onChange={(e) => onChange({ ...value, max: parseInt(e.target.value, 10) || 0 })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Currency */}
        <div>
          <Label htmlFor="currency" className="text-xs" style={{ color: '#6B6760' }}>
            Currency
          </Label>
          <Select
            value={value.currency}
            onValueChange={(currency) => onChange({ ...value, currency })}
          >
            <SelectTrigger id="currency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((curr) => (
                <SelectItem key={curr.key} value={curr.key}>
                  {curr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Period */}
        <div>
          <Label htmlFor="comp-period" className="text-xs" style={{ color: '#6B6760' }}>
            Period
          </Label>
          <Select
            value={value.period}
            onValueChange={(period: CompensationPeriod) => onChange({ ...value, period })}
          >
            <SelectTrigger id="comp-period">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="annual">Annual</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs" style={{ color: '#6B6760' }}>
        {periodDescription}
      </p>
    </div>
  );
}
