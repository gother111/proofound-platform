/**
 * Enhanced Match Filters Component
 *
 * Allows users to filter matches by:
 * - Causes
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
import { SlidersHorizontal, X, Save, Search } from 'lucide-react';
import { toast } from 'sonner';

interface FilterOptions {
  causes: string[];
  skillDomains: string[];
  locationModes: string[];
  workModes: string[];
}

interface ActiveFilters {
  causes: string[];
  skillDomains: string[];
  locationMode?: string;
  workMode?: string;
}

interface EnhancedMatchFiltersProps {
  onFiltersChange: (filters: ActiveFilters) => void;
  activeFilters: ActiveFilters;
}

const COMMON_CAUSES = [
  'Climate Action',
  'Education',
  'Healthcare',
  'Poverty Alleviation',
  'Human Rights',
  'Gender Equality',
  'Clean Water',
  'Sustainable Energy',
  'Mental Health',
  'Food Security',
];

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

export function EnhancedMatchFilters({
  onFiltersChange,
  activeFilters,
}: EnhancedMatchFiltersProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ActiveFilters>(activeFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedFilters, setSavedFilters] = useState<Array<{ name: string; filters: ActiveFilters }>>([]);
  const [filterName, setFilterName] = useState('');

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

  const handleToggleCause = (cause: string) => {
    setLocalFilters((prev) => {
      const causes = prev.causes.includes(cause)
        ? prev.causes.filter((c) => c !== cause)
        : [...prev.causes, cause];
      return { ...prev, causes };
    });
  };

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
      localFilters.causes.length +
      localFilters.skillDomains.length +
      (localFilters.locationMode ? 1 : 0) +
      (localFilters.workMode ? 1 : 0);
    
    if (activeCount > 0) {
      toast.success(`${activeCount} ${activeCount === 1 ? 'filter' : 'filters'} applied`);
    }
  };

  const handleClearAll = () => {
    const emptyFilters: ActiveFilters = {
      causes: [],
      skillDomains: [],
      locationMode: undefined,
      workMode: undefined,
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

  const filteredCauses = COMMON_CAUSES.filter((cause) =>
    cause.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeFilterCount =
    activeFilters.causes.length +
    activeFilters.skillDomains.length +
    (activeFilters.locationMode ? 1 : 0) +
    (activeFilters.workMode ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="border-[#E8E6DD] relative">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 bg-[#1C4D3A] text-white px-1.5 py-0.5 text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-['Crimson_Pro']">Filter Matches</SheetTitle>
          <SheetDescription>
            Narrow down opportunities by causes, skills, location, and work mode
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div>
              <Label className="text-sm font-semibold text-[#2D3330] mb-2">
                Saved Filters
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {savedFilters.map((saved, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadSavedFilter(saved.filters)}
                    className="text-xs"
                  >
                    {saved.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Causes */}
          <div>
            <Label className="text-sm font-semibold text-[#2D3330] mb-2">Causes</Label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B6760]" />
              <Input
                placeholder="Search causes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredCauses.map((cause) => (
                <div key={cause} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cause-${cause}`}
                    checked={localFilters.causes.includes(cause)}
                    onCheckedChange={() => handleToggleCause(cause)}
                  />
                  <Label
                    htmlFor={`cause-${cause}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {cause}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Domains */}
          <div>
            <Label className="text-sm font-semibold text-[#2D3330] mb-2">Skill Domains</Label>
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
            <Label className="text-sm font-semibold text-[#2D3330] mb-2">Location</Label>
            <div className="flex flex-wrap gap-2">
              {LOCATION_MODES.map((mode) => (
                <Button
                  key={mode}
                  variant={localFilters.locationMode === mode.toLowerCase() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      locationMode: prev.locationMode === mode.toLowerCase() ? undefined : mode.toLowerCase(),
                    }))
                  }
                  className={
                    localFilters.locationMode === mode.toLowerCase()
                      ? 'bg-[#1C4D3A] text-white'
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
            <Label className="text-sm font-semibold text-[#2D3330] mb-2">Work Mode</Label>
            <div className="flex flex-wrap gap-2">
              {WORK_MODES.map((mode) => (
                <Button
                  key={mode}
                  variant={localFilters.workMode === mode.toLowerCase() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      workMode: prev.workMode === mode.toLowerCase() ? undefined : mode.toLowerCase(),
                    }))
                  }
                  className={
                    localFilters.workMode === mode.toLowerCase()
                      ? 'bg-[#1C4D3A] text-white'
                      : ''
                  }
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>

          {/* Save Filter */}
          <div>
            <Label className="text-sm font-semibold text-[#2D3330] mb-2">
              Save This Filter
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Filter name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveFilter();
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleSaveFilter}
                disabled={!filterName.trim()}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-4 border-t border-[#E8E6DD]">
          <Button variant="outline" onClick={handleClearAll} className="flex-1">
            Clear All
          </Button>
          <Button onClick={handleApplyFilters} className="flex-1 bg-[#1C4D3A] text-white">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

