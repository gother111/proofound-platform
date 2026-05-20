/**
 * Enhanced Match Filters Component
 *
 * Allows users to filter matches by:
 * - Skill domains (L1)
 * - Location mode
 * - Work mode
 * - Save filter presets
 *
 * Implements PRD requirement for better match discovery
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SlidersHorizontal, X, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ActiveFilters {
  skillDomains: string[];
  locationMode?: string;
  workMode?: string;
  minComp?: number;
  maxComp?: number;
}

interface EnhancedMatchFiltersProps {
  onFiltersChange: (filters: ActiveFilters) => void;
  activeFilters: ActiveFilters;
}

const SKILL_DOMAINS = [
  'Technology & Engineering',
  'Business & Operations',
  'Design & Creative',
  'Data & Analytics',
  'Marketing & Communications',
  'Social Impact & Policy',
];

const LOCATION_MODES = ['Remote', 'Onsite', 'Hybrid'];
const WORK_MODES = ['Full-time', 'Part-time', 'Contract', 'Volunteer'];

const COMP_BANDS = [
  { label: 'Any', min: undefined, max: undefined },
  { label: '$0 - $50k', min: 0, max: 50000 },
  { label: '$50k - $100k', min: 50000, max: 100000 },
  { label: '$100k - $150k', min: 100000, max: 150000 },
  { label: '$150k+', min: 150000, max: undefined },
];

export function EnhancedMatchFilters({
  onFiltersChange,
  activeFilters,
}: EnhancedMatchFiltersProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ActiveFilters>(activeFilters);
  const [savedFilters, setSavedFilters] = useState<Array<{ name: string; filters: ActiveFilters }>>(
    []
  );
  const [filterName, setFilterName] = useState('');
  const [compBandIndex, setCompBandIndex] = useState<number>(() => {
    const match = COMP_BANDS.findIndex(
      (band) => band.min === activeFilters.minComp && band.max === activeFilters.maxComp
    );
    return match >= 0 ? match : 0;
  });

  useEffect(() => {
    // Load saved filters from localStorage
    const saved = localStorage.getItem('savedMatchFilters');
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse saved filters:', error);
      }
    }
  }, []);

  const handleToggleSkillDomain = (domain: string) => {
    setLocalFilters((prev) => {
      const skillDomains = prev.skillDomains.includes(domain)
        ? prev.skillDomains.filter((d) => d !== domain)
        : [...prev.skillDomains, domain];
      return { ...prev, skillDomains };
    });
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setOpen(false);

    const activeCount =
      localFilters.skillDomains.length +
      (localFilters.locationMode ? 1 : 0) +
      (localFilters.workMode ? 1 : 0);

    if (activeCount > 0) {
      toast.success(`${activeCount} ${activeCount === 1 ? 'filter' : 'filters'} applied`);
    }
  };

  const handleClearAll = () => {
    const emptyFilters: ActiveFilters = {
      skillDomains: [],
      locationMode: undefined,
      workMode: undefined,
      minComp: undefined,
      maxComp: undefined,
    };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    toast.info('All filters cleared');
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast.error('Please enter a name for this filter');
      return;
    }

    const newSaved = [...savedFilters, { name: filterName, filters: localFilters }];
    setSavedFilters(newSaved);
    localStorage.setItem('savedMatchFilters', JSON.stringify(newSaved));
    setFilterName('');
    toast.success(`Filter "${filterName}" saved`);
  };

  const handleLoadSavedFilter = (filters: ActiveFilters) => {
    setLocalFilters(filters);
    onFiltersChange(filters);
    setOpen(false);
    toast.success('Filter loaded');
  };

  const handleCompBandSelect = (index: number) => {
    setCompBandIndex(index);
    const band = COMP_BANDS[index];
    setLocalFilters((prev) => ({
      ...prev,
      minComp: band.min,
      maxComp: band.max,
    }));
  };

  const activeFilterCount =
    activeFilters.skillDomains.length +
    (activeFilters.locationMode ? 1 : 0) +
    (activeFilters.workMode ? 1 : 0) +
    (activeFilters.minComp || activeFilters.maxComp ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          aria-label={activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : 'Filters'}
          className="border-proofound-stone relative bg-white text-proofound-forest hover:bg-japandi-bg"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 bg-proofound-forest text-white px-1.5 py-0.5 text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="flex h-dvh w-full flex-col overflow-hidden bg-white p-0 text-foreground sm:max-w-lg">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-xl font-['Crimson_Pro'] text-foreground">
            Filter Assignment Reviews
          </SheetTitle>
          <SheetDescription className="text-[#4A4A4A]">
            Narrow review context by skills, location, work mode, and compensation
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 pb-32 sm:pb-6">
          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div>
              <Label className="text-sm font-semibold text-foreground mb-2">Saved Filters</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {savedFilters.map((saved, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadSavedFilter(saved.filters)}
                    className="text-xs text-proofound-forest border-proofound-forest/40"
                  >
                    {saved.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Skill Domains */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-2">Skill Domains</Label>
            <div className="space-y-2">
              {SKILL_DOMAINS.map((domain) => (
                <div key={domain} className="flex items-center space-x-2">
                  <Checkbox
                    id={`domain-${domain}`}
                    checked={localFilters.skillDomains.includes(domain)}
                    onCheckedChange={() => handleToggleSkillDomain(domain)}
                  />
                  <Label
                    htmlFor={`domain-${domain}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {domain}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Location Mode */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-2">Location</Label>
            <div className="flex flex-wrap gap-2">
              {LOCATION_MODES.map((mode) => (
                <Button
                  key={mode}
                  variant={localFilters.locationMode === mode.toLowerCase() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      locationMode:
                        prev.locationMode === mode.toLowerCase() ? undefined : mode.toLowerCase(),
                    }))
                  }
                  className={
                    localFilters.locationMode === mode.toLowerCase()
                      ? 'bg-proofound-forest text-white'
                      : ''
                  }
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>

          {/* Work Mode */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-2">Work Mode</Label>
            <div className="flex flex-wrap gap-2">
              {WORK_MODES.map((mode) => (
                <Button
                  key={mode}
                  variant={localFilters.workMode === mode.toLowerCase() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      workMode:
                        prev.workMode === mode.toLowerCase() ? undefined : mode.toLowerCase(),
                    }))
                  }
                  className={
                    localFilters.workMode === mode.toLowerCase()
                      ? 'bg-proofound-forest text-white'
                      : ''
                  }
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>

          {/* Compensation */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-2">Compensation</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMP_BANDS.map((band, index) => {
                const selected = compBandIndex === index;
                return (
                  <Button
                    key={band.label}
                    variant={selected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCompBandSelect(index)}
                    className={
                      selected
                        ? 'bg-proofound-forest text-white'
                        : 'border-proofound-forest/40 text-proofound-forest'
                    }
                  >
                    {band.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Save Filter */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-2">Save This Filter</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Filter name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveFilter();
                }}
                className="text-foreground"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleSaveFilter}
                disabled={!filterName.trim()}
                className="border-proofound-forest/40 text-proofound-forest"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 flex gap-2 border-t border-proofound-stone bg-white px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_20px_rgba(29,51,48,0.06)]">
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="flex-1 border-proofound-forest/40 text-proofound-forest"
          >
            Clear All
          </Button>
          <Button onClick={handleApplyFilters} className="flex-1 bg-proofound-forest text-white">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
