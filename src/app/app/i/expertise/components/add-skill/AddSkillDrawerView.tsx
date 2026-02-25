'use client';

import type { Dispatch, KeyboardEvent, SetStateAction } from 'react';
import { List, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { BrowseModePanel } from './BrowseModePanel';
import { SearchModePanel } from './SearchModePanel';
import type { L1Domain, L2Category, L3Subcategory, L4Skill } from './types';

export interface AddSkillDrawerViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  mode: 'search' | 'browse';
  setMode: Dispatch<SetStateAction<'search' | 'browse'>>;
  step: number;
  setStep: Dispatch<SetStateAction<number>>;

  loadedDomains: L1Domain[];
  domainsLoading: boolean;
  handleL1Select: (domain: L1Domain) => void;

  selectedL1: L1Domain | null;
  l2Categories: L2Category[];
  l2Loading: boolean;
  handleL2Select: (category: L2Category) => void;

  selectedL2: L2Category | null;
  l3Subcategories: L3Subcategory[];
  l3Loading: boolean;
  handleL3Select: (subcategory: L3Subcategory) => void;

  l4Skills: L4Skill[];
  l4Search: string;
  setL4Search: Dispatch<SetStateAction<string>>;
  l4Loading: boolean;
  showL4Dropdown: boolean;
  setShowL4Dropdown: Dispatch<SetStateAction<boolean>>;
  selectedL4: L4Skill | null;
  setSelectedL4: Dispatch<SetStateAction<L4Skill | null>>;
  setL4Name: Dispatch<SetStateAction<string>>;

  level: number;
  setLevel: Dispatch<SetStateAction<number>>;
  lastUsedDate: string;
  setLastUsedDate: Dispatch<SetStateAction<string>>;
  proofUrl: string;
  setProofUrl: Dispatch<SetStateAction<string>>;
  proofNotes: string;
  setProofNotes: Dispatch<SetStateAction<string>>;
  saving: boolean;
  handleSave: (saveAndAddAnother?: boolean) => void;

  searchQuery: string;
  taxonomyReady: boolean;
  handleSearchChange: (query: string) => void;
  searchResults: L4Skill[];
  searchLoading: boolean;
  searchError: string | null;
  bulkSelection: Set<string>;
  toggleBulkSelection: (code: string) => void;
  bulkAdding: boolean;
  handleBulkAdd: () => void;
  quickAddingCodes: Set<string>;
  handleQuickAdd: (skill: L4Skill) => void;
  handleSearchResultSelect: (skill: L4Skill) => void;

  handleBack: () => void;
}

export function AddSkillDrawerView({
  open,
  onOpenChange,
  mode,
  setMode,
  step,
  setStep,
  loadedDomains,
  domainsLoading,
  handleL1Select,
  selectedL1,
  l2Categories,
  l2Loading,
  handleL2Select,
  selectedL2,
  l3Subcategories,
  l3Loading,
  handleL3Select,
  l4Skills,
  l4Search,
  setL4Search,
  l4Loading,
  showL4Dropdown,
  setShowL4Dropdown,
  selectedL4,
  setSelectedL4,
  setL4Name,
  level,
  setLevel,
  lastUsedDate,
  setLastUsedDate,
  proofUrl,
  setProofUrl,
  proofNotes,
  setProofNotes,
  saving,
  handleSave,
  searchQuery,
  taxonomyReady,
  handleSearchChange,
  searchResults,
  searchLoading,
  searchError,
  bulkSelection,
  toggleBulkSelection,
  bulkAdding,
  handleBulkAdd,
  quickAddingCodes,
  handleQuickAdd,
  handleSearchResultSelect,
  handleBack,
}: AddSkillDrawerViewProps) {
  const handleKeyActivate = (event: KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-semibold text-[#2D3330]">
            Add Skill to Atlas
          </SheetTitle>
          <SheetDescription className="text-[#6B6760]">
            {mode === 'search'
              ? 'Search for a skill by name or browse the taxonomy'
              : 'Follow the 4 steps to add a new skill to your expertise atlas'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex gap-2">
          <Button
            variant={mode === 'search' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('search')}
            className="flex-1"
          >
            <Search className="h-4 w-4 mr-2" />
            Quick Search
          </Button>
          <Button
            variant={mode === 'browse' ? 'default' : 'outline'}
            size="sm"
            disabled={!taxonomyReady}
            onClick={() => {
              setMode('browse');
              setStep(1);
            }}
            className="flex-1"
          >
            <List className="h-4 w-4 mr-2" />
            Browse Categories
          </Button>
        </div>

        {mode === 'search' && (
          <SearchModePanel
            searchQuery={searchQuery}
            taxonomyReady={taxonomyReady}
            handleSearchChange={handleSearchChange}
            searchResults={searchResults}
            searchLoading={searchLoading}
            searchError={searchError}
            bulkSelection={bulkSelection}
            toggleBulkSelection={toggleBulkSelection}
            bulkAdding={bulkAdding}
            handleBulkAdd={handleBulkAdd}
            quickAddingCodes={quickAddingCodes}
            handleQuickAdd={handleQuickAdd}
            handleSearchResultSelect={handleSearchResultSelect}
            handleKeyActivate={handleKeyActivate}
          />
        )}

        {mode === 'browse' && (
          <BrowseModePanel
            step={step}
            loadedDomains={loadedDomains}
            domainsLoading={domainsLoading}
            handleL1Select={handleL1Select}
            selectedL1={selectedL1}
            l2Categories={l2Categories}
            l2Loading={l2Loading}
            handleL2Select={handleL2Select}
            selectedL2={selectedL2}
            l3Subcategories={l3Subcategories}
            l3Loading={l3Loading}
            handleL3Select={handleL3Select}
            l4Skills={l4Skills}
            l4Search={l4Search}
            setL4Search={setL4Search}
            l4Loading={l4Loading}
            showL4Dropdown={showL4Dropdown}
            setShowL4Dropdown={setShowL4Dropdown}
            selectedL4={selectedL4}
            setSelectedL4={setSelectedL4}
            setL4Name={setL4Name}
            level={level}
            setLevel={setLevel}
            lastUsedDate={lastUsedDate}
            setLastUsedDate={setLastUsedDate}
            proofUrl={proofUrl}
            setProofUrl={setProofUrl}
            proofNotes={proofNotes}
            setProofNotes={setProofNotes}
            saving={saving}
            handleSave={handleSave}
            handleBack={handleBack}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
