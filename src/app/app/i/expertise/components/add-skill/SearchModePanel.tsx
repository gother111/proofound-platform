import type { KeyboardEvent } from 'react';
import { Check, ChevronRight, Loader2, Plus, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { DOMAIN_COLORS } from './constants';
import type { L4Skill } from './types';

type SearchModePanelProps = {
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
  handleKeyActivate: (event: KeyboardEvent, action: () => void) => void;
};

export function SearchModePanel({
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
  handleKeyActivate,
}: SearchModePanelProps) {
  return (
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

      {!searchLoading && !searchError && searchQuery.length >= 2 && searchResults.length === 0 && (
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
                Selected {bulkSelection.size} skill{bulkSelection.size > 1 ? 's' : ''} for bulk add
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
                    onKeyDown={(e) => handleKeyActivate(e, () => handleSearchResultSelect(skill))}
                  >
                    <h4 className="font-medium text-[#2D3330] mb-1">
                      {skill.nameI18n?.en || 'Unknown'}
                    </h4>
                    {skill.descriptionI18n?.en && (
                      <p className="text-sm text-[#6B6760] mb-2 line-clamp-2">
                        {skill.descriptionI18n?.en}
                      </p>
                    )}
                    {(skill.l1 || skill.l2 || skill.l3) && (
                      <div className="flex items-center gap-1 text-xs text-[#6B6760]">
                        {skill.l1 && (
                          <span className={domainColor.text}>{skill.l1.nameI18n?.en}</span>
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
  );
}
