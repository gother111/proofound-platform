'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { X, Filter } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';

export interface FilterState {
  l1Domains: number[];
  status: 'all' | 'verified' | 'proofOnly' | 'claimOnly';
  recency: 'all' | 'active' | 'recent' | 'rusty';
}

interface DashboardFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const L1_OPTIONS = [
  { id: 1, name: 'Universal', fullName: 'Universal Capabilities' },
  { id: 2, name: 'Functional', fullName: 'Functional Competencies' },
  { id: 3, name: 'Tools & Tech', fullName: 'Tools & Technologies' },
  { id: 4, name: 'Languages', fullName: 'Languages & Culture' },
  { id: 5, name: 'Methods', fullName: 'Methods & Practices' },
  { id: 6, name: 'Domain', fullName: 'Domain Knowledge' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Skills' },
  { value: 'verified', label: 'Verified' },
  { value: 'proofOnly', label: 'Proof Only' },
  { value: 'claimOnly', label: 'Claim Only' },
];

const RECENCY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active (≤6mo)' },
  { value: 'recent', label: 'Recent (6-24mo)' },
  { value: 'rusty', label: 'Rusty (>24mo)' },
];

export function DashboardFilters({ filters, onFilterChange }: DashboardFiltersProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isOpen, setIsOpen] = useState(false);

  const toggleL1Domain = (domainId: number) => {
    const newDomains = filters.l1Domains.includes(domainId)
      ? filters.l1Domains.filter((id) => id !== domainId)
      : [...filters.l1Domains, domainId];

    onFilterChange({ ...filters, l1Domains: newDomains });
  };

  const setStatus = (status: FilterState['status']) => {
    onFilterChange({ ...filters, status });
  };

  const setRecency = (recency: FilterState['recency']) => {
    onFilterChange({ ...filters, recency });
  };

  const clearFilters = () => {
    onFilterChange({
      l1Domains: [],
      status: 'all',
      recency: 'all',
    });
  };

  const hasActiveFilters =
    filters.l1Domains.length > 0 || filters.status !== 'all' || filters.recency !== 'all';

  const FilterContent = () => (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Domains */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Domains</div>
        <div className="flex flex-wrap gap-1.5">
          {L1_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => toggleL1Domain(option.id)}
              className={`
                px-2.5 py-1 text-xs rounded-md border transition-colors
                ${
                  filters.l1Domains.includes(option.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-input text-foreground dark:text-[#E8DCC4]'
                }
              `}
              title={option.fullName}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Status</div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatus(option.value as FilterState['status'])}
              className={`
                px-2.5 py-1 text-xs rounded-md border transition-colors
                ${
                  filters.status === option.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-input text-foreground dark:text-[#E8DCC4]'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recency */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Recency</div>
        <div className="flex flex-wrap gap-1.5">
          {RECENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setRecency(option.value as FilterState['recency'])}
              className={`
                px-2.5 py-1 text-xs rounded-md border transition-colors
                ${
                  filters.recency === option.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-input text-foreground dark:text-[#E8DCC4]'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Filters</h3>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs">
              <X className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <FilterContent />
      </div>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between mb-4">
        <DrawerTrigger asChild>
          <Button variant="outline" className="w-full justify-between sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </div>
          </Button>
        </DrawerTrigger>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <DrawerContent>
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        <DrawerHeader className="text-left mt-2">
          <DrawerTitle>Overview Filters</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
          <FilterContent />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button>Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
