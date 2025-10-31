'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface L2Category {
  catId: number;
  subcatId: number;
  slug: string;
  nameI18n: { en: string };
  l4Count: number;
}

interface L3Subcategory {
  catId: number;
  subcatId: number;
  l3Id: number;
  slug: string;
  nameI18n: { en: string };
  l4Count: number;
}

interface L2ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  l1Name: string;
  l2Category: L2Category | null;
  l3Subcategories: L3Subcategory[];
  onL3Click: (l3: L3Subcategory) => void;
}

export function L2Modal({
  open,
  onOpenChange,
  l1Name,
  l2Category,
  l3Subcategories,
  onL3Click,
}: L2ModalProps) {
  const [expandedL3, setExpandedL3] = useState<number | null>(null);

  const handleL3Click = (l3: L3Subcategory) => {
    if (expandedL3 === l3.l3Id) {
      setExpandedL3(null);
    } else {
      setExpandedL3(l3.l3Id);
      onL3Click(l3);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-[#F7F6F1]">
        {/* Breadcrumb Header */}
        <DialogHeader>
          <div className="flex items-center gap-2 text-sm text-[#6B6760]">
            <span>{l1Name}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="font-semibold text-[#2D3330]">
              {l2Category?.nameI18n?.en || 'Loading...'}
            </span>
          </div>
          <DialogTitle className="text-2xl text-[#2D3330] mt-2">
            Browse Skills by Subcategory
          </DialogTitle>
        </DialogHeader>

        {/* L3 Subcategories List */}
        <div className="space-y-3 mt-6">
          {l3Subcategories.length === 0 ? (
            <div className="text-center py-12 text-[#6B6760]">
              <p>No subcategories found with your skills.</p>
              <p className="text-sm mt-2">Add skills to see them organized here.</p>
            </div>
          ) : (
            l3Subcategories.map((l3) => {
              const isExpanded = expandedL3 === l3.l3Id;

              return (
                <div
                  key={l3.l3Id}
                  className="border border-[#D8D2C8] rounded-lg bg-white/90 overflow-hidden transition-all hover:shadow-sm"
                >
                  {/* L3 Row - Clickable */}
                  <button
                    onClick={() => handleL3Click(l3)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#F7F6F1] transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-[#4A5943]" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-[#6B6760]" />
                      )}
                      <div>
                        <h4 className="font-medium text-[#2D3330]">{l3.nameI18n?.en || 'Unknown'}</h4>
                        <p className="text-xs text-[#6B6760] mt-1">
                          {l3.l4Count} {l3.l4Count === 1 ? 'skill' : 'skills'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-[#4A5943] text-[#4A5943] shrink-0"
                    >
                      {l3.l4Count} L4
                    </Badge>
                  </button>

                  {/* Expanded L4 Skills Area */}
                  {isExpanded && (
                    <div className="px-6 py-4 bg-[#F7F6F1] border-t border-[#D8D2C8]">
                      <p className="text-sm text-[#4A5943] italic">
                        Loading L4 skills for {l3.nameI18n?.en || 'Unknown'}...
                      </p>
                      {/* L4 skills will be rendered here in next step */}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-[#D8D2C8]">
          <p className="text-xs text-[#6B6760] text-center">
            Click a subcategory to see your L4 skills in that area
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}


