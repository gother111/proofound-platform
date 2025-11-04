'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { L4Card } from './L4Card';

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
  l4Skills: any[];
  expandedL4: string | null;
  onL3Click: (l3: L3Subcategory) => void;
  onL4Toggle: (skillId: string) => void;
  onL4Edit: (skill: any) => void;
}

export function L2Modal({
  open,
  onOpenChange,
  l1Name,
  l2Category,
  l3Subcategories,
  l4Skills,
  expandedL4,
  onL3Click,
  onL4Toggle,
  onL4Edit,
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

  // Get L4 skills for a specific L3
  const getL4SkillsForL3 = (l3: L3Subcategory) => {
    return l4Skills.filter(
      (skill: any) =>
        skill.taxonomy?.cat_id === l3.catId &&
        skill.taxonomy?.subcat_id === l3.subcatId &&
        skill.taxonomy?.l3_id === l3.l3Id
    );
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
                  {isExpanded && (() => {
                    const l3L4Skills = getL4SkillsForL3(l3);
                    
                    return (
                      <div className="px-6 py-4 bg-[#F7F6F1] border-t border-[#D8D2C8] space-y-3">
                        {l3L4Skills.length === 0 ? (
                          <p className="text-sm text-[#6B6760] italic">
                            No skills found in this subcategory.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {l3L4Skills.map((skill: any) => {
                              const isL4Expanded = expandedL4 === skill.id;
                              const skillName = skill.taxonomy?.name_i18n?.en || skill.custom_skill_name || 'Unknown';
                              
                              const LEVEL_COLORS: Record<number, string> = {
                                1: 'bg-gray-100 text-gray-700 border-gray-300',
                                2: 'bg-blue-100 text-blue-700 border-blue-300',
                                3: 'bg-purple-100 text-purple-700 border-purple-300',
                                4: 'bg-orange-100 text-orange-700 border-orange-300',
                                5: 'bg-red-100 text-red-700 border-red-300',
                              };
                              
                              const LEVEL_LABELS: Record<number, string> = {
                                1: 'Novice',
                                2: 'Competent',
                                3: 'Proficient',
                                4: 'Advanced',
                                5: 'Expert',
                              };

                              return (
                                <div key={skill.id} className="border border-[#E5E3DA] rounded-lg bg-white overflow-hidden">
                                  {/* L4 Skill Row - Clickable to expand */}
                                  <button
                                    onClick={() => onL4Toggle(skill.id)}
                                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#F7F6F1] transition-colors"
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      {isL4Expanded ? (
                                        <ChevronDown className="h-4 w-4 text-[#4A5943]" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-[#6B6760]" />
                                      )}
                                      <div className="flex-1">
                                        <p className="font-medium text-[#2D3330] text-sm">{skillName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge
                                            variant="outline"
                                            className={`text-xs ${LEVEL_COLORS[skill.level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS[1]}`}
                                          >
                                            Level {skill.level} - {LEVEL_LABELS[skill.level as keyof typeof LEVEL_LABELS] || 'Unknown'}
                                          </Badge>
                                          {skill.proof_count > 0 && (
                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                              {skill.proof_count} {skill.proof_count === 1 ? 'Proof' : 'Proofs'}
                                            </Badge>
                                          )}
                                          {skill.verification_count > 0 && (
                                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                                              <CheckCircle2 className="h-3 w-3 mr-1" />
                                              Verified
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </button>

                                  {/* Expanded L4 Card View */}
                                  {isL4Expanded && (
                                    <div className="px-4 py-4 bg-white border-t border-[#E5E3DA]">
                                      <L4Card skill={skill} onEdit={() => onL4Edit(skill)} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
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


