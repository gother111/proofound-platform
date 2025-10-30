'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Calendar, TrendingUp, Award } from 'lucide-react';

interface Skill {
  id: string;
  taxonomy?: {
    name_i18n?: { en: string };
  };
  custom_skill_name?: string;
  level?: number;
  lastUsedAt?: string;
  relevance?: string;
}

interface SkillsSideSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skills: Skill[];
  filterDescription: string;
  onSkillClick: (skillId: string) => void;
}

function getLevelLabel(level: number): string {
  const labels = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
  return labels[level] || 'Unknown';
}

function getLevelColor(level: number): string {
  if (level <= 2) return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
  if (level === 3) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
  if (level === 4) return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
  return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
}

function formatRecency(lastUsedAt?: string): string {
  if (!lastUsedAt) return 'Never used';
  
  const now = new Date();
  const lastUsed = new Date(lastUsedAt);
  const monthsAgo = Math.floor(
    (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  if (monthsAgo === 0) return 'This month';
  if (monthsAgo === 1) return '1 month ago';
  if (monthsAgo < 12) return `${monthsAgo} months ago';
  
  const yearsAgo = Math.floor(monthsAgo / 12);
  return yearsAgo === 1 ? '1 year ago' : `${yearsAgo} years ago`;
}

export function SkillsSideSheet({
  open,
  onOpenChange,
  skills,
  filterDescription,
  onSkillClick,
}: SkillsSideSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{filterDescription}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {skills.length} {skills.length === 1 ? 'skill' : 'skills'} found
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {skills.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                No skills match the current filters
              </p>
            </div>
          ) : (
            skills.map(skill => {
              const skillName = skill.taxonomy?.name_i18n?.en || skill.custom_skill_name || 'Unknown Skill';
              const level = skill.level || 1;
              const recency = formatRecency(skill.lastUsedAt);
              const relevance = skill.relevance || 'current';

              return (
                <div
                  key={skill.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="font-medium flex-1">{skillName}</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSkillClick(skill.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={getLevelColor(level)}>
                      {getLevelLabel(level)}
                    </Badge>

                    <Badge variant="outline" className="gap-1">
                      <Calendar className="w-3 h-3" />
                      {recency}
                    </Badge>

                    {relevance !== 'current' && (
                      <Badge 
                        variant="outline" 
                        className={`gap-1 ${
                          relevance === 'emerging' 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        <TrendingUp className="w-3 h-3" />
                        {relevance === 'emerging' ? 'Emerging' : 'Obsolete'}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

