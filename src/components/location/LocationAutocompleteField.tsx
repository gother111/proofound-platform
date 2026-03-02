'use client';

import { useEffect, useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SEARCH_DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

interface CitySuggestion {
  city?: string;
  country?: string;
  countryCode?: string;
  admin1?: string | null;
  label?: string;
}

interface LocationAutocompleteFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  error?: string | null;
}

function extractSearchQuery(value: string): string {
  return value.split(',')[0]?.trim() || '';
}

function normalizeSuggestions(payload: { items?: CitySuggestion[] }): string[] {
  if (!Array.isArray(payload.items)) return [];

  const labels = payload.items
    .map((item) => {
      if (item.label && item.label.trim().length > 0) {
        return item.label.trim();
      }

      const city = item.city?.trim();
      const country = item.country?.trim();

      if (city && country) return `${city}, ${country}`;
      return city || '';
    })
    .filter((label) => label.length > 0);

  return Array.from(new Set(labels)).slice(0, 10);
}

export function LocationAutocompleteField({
  value,
  onChange,
  label = 'Location',
  placeholder = 'Type a city',
  disabled = false,
  maxLength = 100,
  error = null,
}: LocationAutocompleteFieldProps) {
  const datalistId = useId();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const query = extractSearchQuery(value);

    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }

    let controller: AbortController | null = null;
    const timeout = setTimeout(() => {
      controller = new AbortController();

      void fetch(`/api/location/autocomplete?type=city&q=${encodeURIComponent(query)}&limit=10`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            return { items: [] as CitySuggestion[] };
          }
          return (await response.json()) as { items?: CitySuggestion[] };
        })
        .then((payload) => {
          setSuggestions(normalizeSuggestions(payload));
        })
        .catch(() => {
          setSuggestions([]);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller?.abort();
    };
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor={`${datalistId}-input`}>{label}</Label>
      <Input
        id={`${datalistId}-input`}
        list={datalistId}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={error ? 'border-red-500' : ''}
      />
      <datalist id={datalistId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
