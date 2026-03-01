'use client';

import { useEffect, useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const COUNTRY_DEBOUNCE_MS = 250;
const CITY_DEBOUNCE_MS = 250;

interface CountrySuggestion {
  name: string;
  code: string;
  label: string;
}

interface CitySuggestion {
  city: string;
  country: string;
  countryCode: string;
  admin1: string | null;
  label: string;
}

interface CityCountryAutocompleteFieldsProps {
  country: string;
  city: string;
  onCountryChange: (name: string, code?: string) => void;
  onCityChange: (city: string) => void;
  cityLabel?: string;
  countryLabel?: string;
  cityOptional?: boolean;
  disabled?: boolean;
}

export function CityCountryAutocompleteFields({
  country,
  city,
  onCountryChange,
  onCityChange,
  cityLabel = 'City',
  countryLabel = 'Country',
  cityOptional = false,
  disabled = false,
}: CityCountryAutocompleteFieldsProps) {
  const countryListId = useId();
  const cityListId = useId();

  const [countryQuery, setCountryQuery] = useState(country || '');
  const [cityQuery, setCityQuery] = useState(city || '');
  const [countryCode, setCountryCode] = useState<string | undefined>(undefined);
  const [countryOptions, setCountryOptions] = useState<CountrySuggestion[]>([]);
  const [cityOptions, setCityOptions] = useState<CitySuggestion[]>([]);

  useEffect(() => {
    setCountryQuery(country || '');
    if (!country) {
      setCountryCode(undefined);
    }
  }, [country]);

  useEffect(() => {
    setCityQuery(city || '');
  }, [city]);

  useEffect(() => {
    const query = countryQuery.trim();
    if (!query) {
      setCountryOptions([]);
      return;
    }

    let controller: AbortController | null = null;
    const timeout = setTimeout(() => {
      controller = new AbortController();

      void fetch(
        `/api/location/autocomplete?type=country&q=${encodeURIComponent(query)}&limit=10`,
        { signal: controller.signal }
      )
        .then(async (response) => {
          if (!response.ok) {
            return { items: [] as CountrySuggestion[] };
          }
          return (await response.json()) as { items?: CountrySuggestion[] };
        })
        .then((payload) => {
          setCountryOptions(Array.isArray(payload.items) ? payload.items : []);
        })
        .catch(() => {
          setCountryOptions([]);
        });
    }, COUNTRY_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller?.abort();
    };
  }, [countryQuery]);

  useEffect(() => {
    const query = cityQuery.trim();
    if (query.length < 2) {
      setCityOptions([]);
      return;
    }

    let controller: AbortController | null = null;
    const timeout = setTimeout(() => {
      controller = new AbortController();
      const params = new URLSearchParams({
        type: 'city',
        q: query,
        limit: '10',
      });

      if (countryCode) {
        params.set('countryCode', countryCode);
      }

      void fetch(`/api/location/autocomplete?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) {
            return { items: [] as CitySuggestion[] };
          }
          return (await response.json()) as { items?: CitySuggestion[] };
        })
        .then((payload) => {
          setCityOptions(Array.isArray(payload.items) ? payload.items : []);
        })
        .catch(() => {
          setCityOptions([]);
        });
    }, CITY_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller?.abort();
    };
  }, [cityQuery, countryCode]);

  const handleCountryInput = (value: string) => {
    setCountryQuery(value);

    const normalized = value.trim().toLowerCase();
    const matched = countryOptions.find((option) => option.name.toLowerCase() === normalized);
    const nextCode = matched?.code;
    setCountryCode(nextCode);
    onCountryChange(value, nextCode);
  };

  const handleCityInput = (value: string) => {
    setCityQuery(value);
    onCityChange(value);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor={`${countryListId}-input`}>{countryLabel}</Label>
        <Input
          id={`${countryListId}-input`}
          list={countryListId}
          placeholder="Start typing country..."
          value={countryQuery}
          disabled={disabled}
          onChange={(event) => handleCountryInput(event.target.value)}
        />
        <datalist id={countryListId}>
          {countryOptions.map((option) => (
            <option
              key={`${option.code}-${option.name}`}
              value={option.name}
              label={option.label}
            />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${cityListId}-input`}>
          {cityLabel}
          {cityOptional ? ' (Optional)' : ''}
        </Label>
        <Input
          id={`${cityListId}-input`}
          list={cityListId}
          placeholder="Start typing city..."
          value={cityQuery}
          disabled={disabled}
          onChange={(event) => handleCityInput(event.target.value)}
        />
        <datalist id={cityListId}>
          {cityOptions.map((option) => (
            <option
              key={`${option.city}-${option.countryCode}-${option.admin1 || 'na'}`}
              value={option.city}
              label={option.label}
            />
          ))}
        </datalist>
      </div>
    </div>
  );
}
