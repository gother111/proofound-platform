'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { L1Domain, L2Category, L3Subcategory, L4Skill } from './types';

import { Search, ChevronRight, Check, List, Loader2, Plus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { DOMAIN_COLORS, LEVEL_LABELS } from './constants';

export interface AddSkillDrawerViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  mode: 'search' | 'browse';
  setMode: Dispatch<SetStateAction<'search' | 'browse'>>;
  step: number;
  setStep: Dispatch<SetStateAction<number>>;

  // Step 1: L1 domains
  loadedDomains: L1Domain[];
  domainsLoading: boolean;
  handleL1Select: (domain: L1Domain) => void;

  // Step 2: L2 categories
  selectedL1: L1Domain | null;
  l2Categories: L2Category[];
  l2Loading: boolean;
  handleL2Select: (category: L2Category) => void;

  // Step 3: L3 subcategories
  selectedL2: L2Category | null;
  l3Subcategories: L3Subcategory[];
  l3Loading: boolean;
  handleL3Select: (subcategory: L3Subcategory) => void;

  // Step 4: L4 details
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
  relevance: 'current' | 'emerging' | 'obsolete';
  setRelevance: Dispatch<SetStateAction<'current' | 'emerging' | 'obsolete'>>;
  proofUrl: string;
  setProofUrl: Dispatch<SetStateAction<string>>;
  proofNotes: string;
  setProofNotes: Dispatch<SetStateAction<string>>;
  saving: boolean;
  handleSave: (saveAndAddAnother?: boolean) => void;

  // Search mode
  searchQuery: string;
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
  relevance,
  setRelevance,
  proofUrl,
  setProofUrl,
  proofNotes,
  setProofNotes,
  saving,
  handleSave,
  searchQuery,
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
  const handleKeyActivate = (event: React.KeyboardEvent, action: () => void) => {
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

        {/* Mode Toggle */}
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

        {/* Search Mode UI */}
        {mode === 'search' && (
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="skill-search" className="text-[#2D3330] mb-2 block">
                Search for a skill
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6760]" />
                <Input
                  id="skill-search"
                  type="text"
                  placeholder="Type a skill name (e.g., Python, Project Management, React)..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-[#6B6760] mt-1">
                Start typing to see suggestions from our skills taxonomy
              </p>
            </div>

            {/* Search Results */}
            {searchLoading && (
              <div className="flex items-center justify-center gap-2 py-8 text-[#6B6760]">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Searching skills...</span>
              </div>
            )}

            {searchError && (
              <div className="text-center py-8 text-[#C76B4A] bg-[#FFF0F0] rounded-lg border border-[#C76B4A]">
                <p className="font-medium mb-1">Search Error</p>
                <p className="text-sm">{searchError}</p>
              </div>
            )}

            {!searchLoading &&
              !searchError &&
              searchQuery.length >= 2 &&
              searchResults.length === 0 && (
                <div className="text-center py-8 text-[#6B6760]">
                  <p className="mb-2">No skills found matching &ldquo;{searchQuery}&rdquo;</p>
                  <p className="text-sm">Try a different search term or browse categories above</p>
                </div>
              )}

            {!searchLoading && searchResults.length > 0 && (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                <p className="text-sm font-medium text-[#2D3330] mb-3">
                  Found {searchResults.length} skill{searchResults.length > 1 ? 's' : ''}
                </p>
                {bulkSelection.size > 0 && (
                  <div className="flex items-center justify-between bg-[#F7F6F1] border border-[#E5E3DA] rounded-lg px-3 py-2 text-sm">
                    <span className="text-[#2D3330]">
                      Selected {bulkSelection.size} skill{bulkSelection.size > 1 ? 's' : ''} for
                      bulk add
                    </span>
                    <Button
                      size="sm"
                      disabled={bulkAdding}
                      onClick={handleBulkAdd}
                      className="bg-[#1C4D3A] text-white hover:bg-[#2D5F4A]"
                    >
                      {bulkAdding ? 'Adding…' : 'Add selected'}
                    </Button>
                  </div>
                )}
                {searchResults.map((skill) => {
                  const domainColor = skill.l1
                    ? DOMAIN_COLORS[skill.l1.catId] || DOMAIN_COLORS[1]
                    : DOMAIN_COLORS[1];
                  const isQuickAdding = quickAddingCodes.has(skill.code);
                  const isSelected = bulkSelection.has(skill.code);

                  return (
                    <Card key={skill.code} className="p-4 border border-[#E5E3DA]">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          role="button"
                          tabIndex={0}
                          className="flex-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C4D3A] focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-md"
                          onClick={() => handleSearchResultSelect(skill)}
                          onKeyDown={(e) =>
                            handleKeyActivate(e, () => handleSearchResultSelect(skill))
                          }
                        >
                          <h4 className="font-medium text-[#2D3330] mb-1">
                            {skill.nameI18n?.en || 'Unknown'}
                          </h4>
                          {skill.descriptionI18n?.en && (
                            <p className="text-sm text-[#6B6760] mb-2 line-clamp-2">
                              {skill.descriptionI18n?.en}
                            </p>
                          )}
                          {/* Breadcrumb */}
                          {(skill.l1 || skill.l2 || skill.l3) && (
                            <div className="flex items-center gap-1 text-xs text-[#6B6760]">
                              {skill.l1 && (
                                <>
                                  <span className={domainColor.text}>{skill.l1.nameI18n?.en}</span>
                                </>
                              )}
                              {skill.l2 && (
                                <>
                                  <ChevronRight className="h-3 w-3" />
                                  <span>{skill.l2.nameI18n?.en}</span>
                                </>
                              )}
                              {skill.l3 && (
                                <>
                                  <ChevronRight className="h-3 w-3" />
                                  <span>{skill.l3.nameI18n?.en}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleBulkSelection(skill.code)}
                              aria-label="Select for bulk add"
                            />
                            <span className="text-xs text-[#6B6760]">Select</span>
                          </div>
                          <Button
                            size="sm"
                            disabled={isQuickAdding}
                            onClick={() => handleQuickAdd(skill)}
                            className="bg-[#1C4D3A] text-white hover:bg-[#2D5F4A]"
                          >
                            {isQuickAdding ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSearchResultSelect(skill)}
                            aria-label="Open details"
                            className="text-[#6B6760]"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Progress Indicator (only in browse mode) */}
        {mode === 'browse' && (
          <div className="mt-6 mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      s === step
                        ? 'bg-[#1C4D3A] text-white'
                        : s < step
                          ? 'bg-[#7A9278] text-white'
                          : 'bg-[#E5E3DA] text-[#6B6760]'
                    }`}
                  >
                    {s < step ? <Check className="h-4 w-4" /> : s}
                  </div>
                  {s < 4 && (
                    <div
                      className={`h-0.5 w-16 mx-2 ${s < step ? 'bg-[#7A9278]' : 'bg-[#E5E3DA]'}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-[#6B6760] mt-2">
              <span>Domain</span>
              <span>Category</span>
              <span>Subcategory</span>
              <span>Details</span>
            </div>
          </div>
        )}

        {/* Browse Mode: 4-Step Flow */}
        {mode === 'browse' && (
          <>
            {/* Step 1: Pick L1 Domain */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-[#2D3330] mb-2">Step 1: Choose Domain</h3>
                  <p className="text-sm text-[#6B6760] mb-4">
                    Select the top-level domain that best fits your skill. Pick the closest match;
                    you can refine wording later.
                  </p>
                </div>

                {domainsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-[#6B6760]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading domains...</span>
                  </div>
                ) : loadedDomains.length === 0 ? (
                  <div className="text-center py-8 text-[#6B6760]">
                    No domains available. Please try again later.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {loadedDomains.map((domain) => {
                      const colors = DOMAIN_COLORS[domain.catId] || DOMAIN_COLORS[1];
                      return (
                        <Card
                          key={domain.catId}
                          className={`${colors.bg} ${colors.border} border-2 hover:shadow-md transition-all cursor-pointer p-4`}
                          onClick={() => handleL1Select(domain)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{colors.icon}</div>
                            <div className="flex-1">
                              <h4 className={`font-semibold ${colors.text}`}>
                                {domain.nameI18n?.en || 'Unknown'}
                              </h4>
                              {domain.descriptionI18n?.en && (
                                <p className="text-sm text-[#6B6760] mt-1">
                                  {domain.descriptionI18n?.en}
                                </p>
                              )}
                            </div>
                            <ChevronRight className={`h-5 w-5 ${colors.text}`} />
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Pick L2 Category */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="mb-2 text-[#1C4D3A]"
                  >
                    ← Back to Domains
                  </Button>
                  <h3 className="text-lg font-medium text-[#2D3330] mb-2">
                    Step 2: Choose Category
                  </h3>
                  <p className="text-sm text-[#6B6760] mb-4">
                    Select a category within{' '}
                    <strong>{selectedL1?.nameI18n?.en || 'Unknown'}</strong>. If you can’t find the
                    exact wording, choose the nearest synonym—the next step will show examples.
                  </p>
                </div>

                {/* L2 List */}
                {l2Loading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-[#6B6760]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading categories...</span>
                  </div>
                ) : l2Categories.length === 0 ? (
                  <div className="text-center py-8 text-[#6B6760]">No categories found.</div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {l2Categories.map((category) => (
                      <Card
                        key={category.subcatId}
                        className="p-4 hover:bg-[#F7F6F1] transition-colors cursor-pointer border border-[#E5E3DA]"
                        onClick={() => handleL2Select(category)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-[#2D3330]">
                              {category.nameI18n?.en || 'Unknown'}
                            </h4>
                            {category.descriptionI18n?.en && (
                              <p className="text-sm text-[#6B6760] mt-1">
                                {category.descriptionI18n?.en}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-[#6B6760]" />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Pick L3 Subcategory */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="mb-2 text-[#1C4D3A]"
                  >
                    ← Back to Categories
                  </Button>
                  <h3 className="text-lg font-medium text-[#2D3330] mb-2">
                    Step 3: Choose Subcategory
                  </h3>
                  <p className="text-sm text-[#6B6760] mb-4">
                    Select a subcategory within{' '}
                    <strong>{selectedL2?.nameI18n?.en || 'Unknown'}</strong>. Look for example
                    descriptions—synonyms are supported.
                  </p>
                </div>

                {/* L3 List */}
                {l3Loading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-[#6B6760]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading subcategories...</span>
                  </div>
                ) : l3Subcategories.length === 0 ? (
                  <div className="text-center py-8 text-[#6B6760]">No subcategories found.</div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {l3Subcategories.map((subcategory) => (
                      <Card
                        key={subcategory.l3Id}
                        className="p-4 hover:bg-[#F7F6F1] transition-colors cursor-pointer border border-[#E5E3DA]"
                        onClick={() => handleL3Select(subcategory)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-[#2D3330]">
                              {subcategory.nameI18n?.en || 'Unknown'}
                            </h4>
                            {subcategory.descriptionI18n?.en && (
                              <p className="text-sm text-[#6B6760] mt-1">
                                {subcategory.descriptionI18n?.en}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-[#6B6760]" />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Enter L4 Skill Details */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="mb-2 text-[#1C4D3A]"
                  >
                    ← Back to Subcategories
                  </Button>
                  <h3 className="text-lg font-medium text-[#2D3330] mb-2">Step 4: Skill Details</h3>
                  <p className="text-sm text-[#6B6760] mb-4">Fill in the details for your skill.</p>
                </div>

                {/* Skill Name with Autocomplete */}
                <div className="relative">
                  <Label htmlFor="skill-name" className="text-[#2D3330]">
                    Skill Name *
                  </Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6760]" />
                    <Input
                      id="skill-name"
                      type="text"
                      placeholder="Search for a skill or enter custom name..."
                      value={l4Search}
                      onChange={(e) => {
                        setL4Search(e.target.value);
                        setShowL4Dropdown(true);
                      }}
                      onFocus={() => setShowL4Dropdown(true)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-[#6B6760] mt-1">
                    Tip: try synonyms or common terms. We’ll match close wording to the Atlas skill.
                  </p>

                  {/* Autocomplete Dropdown */}
                  {showL4Dropdown && l4Search && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-[#E5E3DA] rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
                      {l4Loading ? (
                        <div className="flex items-center justify-center gap-2 p-4 text-[#6B6760]">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading skills...</span>
                        </div>
                      ) : (
                        (() => {
                          const filtered = l4Skills
                            .filter((skill) =>
                              skill.nameI18n?.en?.toLowerCase().includes(l4Search.toLowerCase())
                            )
                            .slice(0, 50);

                          return filtered.length > 0 ? (
                            <>
                              {filtered.map((skill) => (
                                <button
                                  key={skill.code}
                                  type="button"
                                  className="w-full text-left p-3 hover:bg-[#F7F6F1] cursor-pointer border-b border-[#E5E3DA] last:border-b-0"
                                  onClick={() => {
                                    setSelectedL4(skill);
                                    setL4Name(skill.nameI18n?.en || '');
                                    setL4Search(skill.nameI18n?.en || '');
                                    setShowL4Dropdown(false);
                                  }}
                                >
                                  <div className="font-medium text-[#2D3330]">
                                    {skill.nameI18n?.en}
                                  </div>
                                  {skill.descriptionI18n?.en && (
                                    <div className="text-xs text-[#6B6760] mt-1">
                                      {skill.descriptionI18n?.en}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </>
                          ) : (
                            <div className="p-4 text-center text-[#6B6760]">
                              <p className="mb-2">No matching skills found</p>
                              <p className="text-sm">
                                You can continue with &ldquo;{l4Search}&rdquo; as a custom skill
                              </p>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}

                  {/* Selected Skill Indicator */}
                  {selectedL4 && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="bg-[#7A9278] text-white">
                        From Atlas
                      </Badge>
                      <span className="text-sm text-[#6B6760]">{selectedL4.nameI18n?.en}</span>
                    </div>
                  )}

                  {/* Custom Skill Indicator */}
                  {l4Search && !selectedL4 && (
                    <div className="mt-2">
                      <Badge variant="outline" className="border-[#D4A574] text-[#8B6F47]">
                        Custom Skill
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Proficiency Level */}
                <div>
                  <Label className="text-[#2D3330] mb-3 block">Proficiency Level *</Label>
                  <RadioGroup
                    value={level.toString()}
                    onValueChange={(val) => setLevel(parseInt(val))}
                  >
                    {LEVEL_LABELS.map((lvl) => (
                      <div
                        key={lvl.value}
                        className="flex items-center space-x-3 mb-2 p-3 rounded-lg border border-[#E5E3DA] hover:bg-[#F7F6F1] transition-colors"
                      >
                        <RadioGroupItem value={lvl.value.toString()} id={`level-${lvl.value}`} />
                        <Label htmlFor={`level-${lvl.value}`} className="flex-1 cursor-pointer">
                          <div className="font-medium text-[#2D3330]">{lvl.label}</div>
                          <div className="text-sm text-[#6B6760]">{lvl.description}</div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Last Used */}
                <div>
                  <Label htmlFor="last-used" className="text-[#2D3330]">
                    Last Used (Optional)
                  </Label>
                  <Input
                    id="last-used"
                    type="date"
                    value={lastUsedDate}
                    onChange={(e) => setLastUsedDate(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-[#6B6760] mt-1">When did you last use this skill?</p>
                </div>

                {/* Relevance */}
                <div>
                  <Label className="text-[#2D3330] mb-3 block">Relevance</Label>
                  <RadioGroup
                    value={relevance}
                    onValueChange={(val) =>
                      setRelevance(val as 'current' | 'emerging' | 'obsolete')
                    }
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <RadioGroupItem value="current" id="relevance-current" />
                      <Label htmlFor="relevance-current" className="cursor-pointer">
                        <Badge
                          variant="outline"
                          className="bg-[#EEF1EA] text-[#1C4D3A] border-[#7A9278]"
                        >
                          Current
                        </Badge>
                        <span className="ml-2 text-sm text-[#6B6760]">Widely used today</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 mb-2">
                      <RadioGroupItem value="emerging" id="relevance-emerging" />
                      <Label htmlFor="relevance-emerging" className="cursor-pointer">
                        <Badge
                          variant="outline"
                          className="bg-[#E8F3F8] text-[#3E5C73] border-[#6B9AB8]"
                        >
                          Emerging
                        </Badge>
                        <span className="ml-2 text-sm text-[#6B6760]">Growing in demand</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="obsolete" id="relevance-obsolete" />
                      <Label htmlFor="relevance-obsolete" className="cursor-pointer">
                        <Badge
                          variant="outline"
                          className="bg-[#FFF0F0] text-[#8B4A36] border-[#C76B4A]"
                        >
                          Obsolete
                        </Badge>
                        <span className="ml-2 text-sm text-[#6B6760]">Declining use</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Optional Proof */}
                <div className="border-t border-[#E5E3DA] pt-6">
                  <h4 className="font-medium text-[#2D3330] mb-3">Add Proof (Optional)</h4>
                  <div className="flex items-center gap-2 text-xs text-[#6B6760] mb-2">
                    <Lock className="h-3.5 w-3.5" />
                    Proofs default to <strong className="ml-1">match-only</strong>; you can change
                    visibility later.
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="proof-url" className="text-[#2D3330]">
                        Proof URL
                      </Label>
                      <Input
                        id="proof-url"
                        type="url"
                        placeholder="https://..."
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="proof-notes" className="text-[#2D3330]">
                        Notes
                      </Label>
                      <Textarea
                        id="proof-notes"
                        placeholder="Describe this proof..."
                        value={proofNotes}
                        onChange={(e) => setProofNotes(e.target.value)}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-[#E5E3DA]">
                  <Button
                    variant="outline"
                    onClick={() => handleSave(true)}
                    disabled={!l4Search || saving}
                    className="flex-1 border-[#1C4D3A] text-[#1C4D3A] hover:bg-[#EEF1EA]"
                  >
                    Save & Add Another
                  </Button>
                  <Button
                    onClick={() => handleSave(false)}
                    disabled={!l4Search || saving}
                    className="flex-1 bg-[#1C4D3A] text-white hover:bg-[#2D5F4A]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
