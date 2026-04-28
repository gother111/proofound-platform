'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, TrendingUp, Clock, CheckCircle2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { L4Card } from './L4Card';
import { skillDisplayLabel } from '@/lib/copy/labels';

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
  onL4Edit: (skill: any, focus?: 'details' | 'proofs' | 'verification') => void;
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
  const [searchQuery, setSearchQuery] = useState('');

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
    const skills = l4Skills.filter(
      (skill: any) =>
        skill.taxonomy?.cat_id === l3.catId &&
        skill.taxonomy?.subcat_id === l3.subcatId &&
        skill.taxonomy?.l3_id === l3.l3Id
    );

    if (!searchQuery) return skills;

    return skills.filter((skill: any) => {
      const skillName = skillDisplayLabel(
        {
          skillName: skill.skill_name,
          taxonomyName: skill.taxonomy?.name_i18n?.en,
          customSkillName: skill.custom_skill_name,
          id: skill.id,
          code: skill.skillCode || skill.skill_code,
        },
        ''
      );
      return skillName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  // Filter L3 subcategories based on search
  const filteredL3Subcategories = l3Subcategories.filter((l3) => {
    if (!searchQuery) return true;

    const l3Name = l3.nameI18n?.en || '';
    const l3Matches = l3Name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchingSkills = getL4SkillsForL3(l3);
    const skillsMatch = matchingSkills.length > 0;

    return l3Matches || skillsMatch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-proofound-parchment border-proofound-stone p-0 gap-0">
        {/* Breadcrumb Header */}
        <div className="sticky top-0 z-10 bg-proofound-parchment/95 backdrop-blur-sm border-b border-proofound-stone px-6 py-4">
          <DialogHeader>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-sans">
              <span>{l1Name}</span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-semibold text-proofound-charcoal">
                {l2Category?.nameI18n?.en || 'Loading...'}
              </span>
            </div>
            <DialogTitle className="text-2xl text-proofound-charcoal mt-2 font-display">
              Browse Skills by Subcategory
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 bg-white border-b border-proofound-stone">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search skills or subcategories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-proofound-parchment/30 border-proofound-stone focus-visible:ring-proofound-forest"
            />
          </div>
        </div>

        {/* L3 Subcategories List */}
        <div className="p-6 space-y-3">
          {filteredL3Subcategories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No subcategories found matching "{searchQuery}".</p>
              <p className="text-sm mt-2">Try a different search term.</p>
            </div>
          ) : (
            filteredL3Subcategories.map((l3) => {
              // Auto-expand if searching and skills match
              const hasMatchingSkills = searchQuery && getL4SkillsForL3(l3).length > 0;
              const isExpanded = expandedL3 === l3.l3Id || (!!searchQuery && hasMatchingSkills);

              return (
                <div
                  key={l3.l3Id}
                  className={`border border-proofound-stone rounded-xl bg-white overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-md ring-1 ring-proofound-stone' : 'hover:shadow-sm'}`}
                >
                  {/* L3 Row - Clickable */}
                  <button
                    onClick={() => handleL3Click(l3)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-proofound-parchment/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-proofound-forest" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <h4 className="font-semibold text-proofound-charcoal font-display text-lg">
                          {l3.nameI18n?.en || 'Unknown'}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 font-sans">
                          {l3.l4Count} {l3.l4Count === 1 ? 'skill' : 'skills'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-proofound-forest text-proofound-forest shrink-0 bg-proofound-forest/5"
                    >
                      {l3.l4Count} skills
                    </Badge>
                  </button>

                  {/* Expanded L4 Skills Area */}
                  {isExpanded &&
                    (() => {
                      const l3L4Skills = getL4SkillsForL3(l3);

                      return (
                        <div className="px-6 py-4 bg-proofound-parchment/30 border-t border-proofound-stone space-y-3 animate-in slide-in-from-top-2 duration-200">
                          {l3L4Skills.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                              No skills found in this subcategory.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {l3L4Skills.map((skill: any) => {
                                const isL4Expanded = expandedL4 === skill.id;
                                const skillName = skillDisplayLabel({
                                  skillName: skill.skill_name,
                                  taxonomyName: skill.taxonomy?.name_i18n?.en,
                                  customSkillName: skill.custom_skill_name,
                                  id: skill.id,
                                  code: skill.skillCode || skill.skill_code,
                                });

                                const LEVEL_COLORS: Record<number, string> = {
                                  1: 'bg-proofound-stone/30 text-proofound-charcoal border-proofound-stone',
                                  2: 'bg-proofound-teal/10 text-proofound-teal border-proofound-teal/30',
                                  3: 'bg-proofound-sage/10 text-proofound-sage border-proofound-sage/30',
                                  4: 'bg-proofound-ochre/10 text-[#8B6F47] border-proofound-ochre/30',
                                  5: 'bg-proofound-forest/10 text-proofound-forest border-proofound-forest/30',
                                };

                                const LEVEL_LABELS: Record<number, string> = {
                                  1: 'Novice',
                                  2: 'Competent',
                                  3: 'Proficient',
                                  4: 'Advanced',
                                  5: 'Expert',
                                };

                                return (
                                  <div
                                    key={skill.id}
                                    className="border border-proofound-stone rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                                  >
                                    {/* L4 Skill Row - Clickable to expand */}
                                    <button
                                      onClick={() => onL4Toggle(skill.id)}
                                      className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-proofound-parchment/50 transition-colors"
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        {isL4Expanded ? (
                                          <ChevronDown className="h-4 w-4 text-proofound-forest" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <div className="flex-1">
                                          <p className="font-semibold text-proofound-charcoal text-sm font-display">
                                            {skillName}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1.5">
                                            <Badge
                                              variant="outline"
                                              className={`text-[10px] px-2 py-0.5 ${LEVEL_COLORS[skill.level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS[1]}`}
                                            >
                                              Level {skill.level} -{' '}
                                              {LEVEL_LABELS[
                                                skill.level as keyof typeof LEVEL_LABELS
                                              ] || 'Unknown'}
                                            </Badge>
                                            {skill.proof_count > 0 && (
                                              <Badge
                                                variant="outline"
                                                className="text-[10px] px-2 py-0.5 bg-proofound-forest/5 text-proofound-forest border-proofound-forest/20"
                                              >
                                                {skill.proof_count}{' '}
                                                {skill.proof_count === 1 ? 'Proof' : 'Proofs'}
                                              </Badge>
                                            )}
                                            {skill.verification_count > 0 && (
                                              <Badge
                                                variant="outline"
                                                className="text-[10px] px-2 py-0.5 bg-proofound-teal/10 text-proofound-teal border-proofound-teal/20"
                                              >
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
                                      <div className="px-5 py-5 bg-white border-t border-proofound-stone animate-in slide-in-from-top-1 duration-200">
                                        <L4Card
                                          skill={skill}
                                          onEdit={(focus) => onL4Edit(skill, focus)}
                                        />
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
        <div className="p-4 border-t border-proofound-stone bg-proofound-parchment/50">
          <p className="text-xs text-muted-foreground text-center font-sans">
            Click a subcategory to see your skills in that area
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
