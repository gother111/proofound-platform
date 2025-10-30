'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Edit2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Link as LinkIcon
} from 'lucide-react';

interface L4Skill {
  id: string;
  skillCode: string;
  level: number;
  competencyLabel: string;
  relevance: 'obsolete' | 'current' | 'emerging';
  lastUsedAt: string | null;
  monthsExperience: number;
  evidenceStrength: number;
  impactScore: number;
  taxonomy: {
    code: string;
    nameI18n: { en: string };
    tags: string[];
  };
}

interface L4CardProps {
  skill: L4Skill;
  onEdit: () => void;
}

const RELEVANCE_COLORS = {
  obsolete: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  current: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  emerging: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

const LEVEL_LABELS = {
  1: { label: 'Foundational', color: 'text-gray-600' },
  2: { label: 'Intermediate', color: 'text-blue-600' },
  3: { label: 'Advanced', color: 'text-purple-600' },
  4: { label: 'Expert', color: 'text-orange-600' },
  5: { label: 'Master', color: 'text-red-600' },
};

export function L4Card({ skill, onEdit }: L4CardProps) {
  const relevanceStyle = RELEVANCE_COLORS[skill.relevance];
  const levelInfo = LEVEL_LABELS[skill.level as keyof typeof LEVEL_LABELS] || LEVEL_LABELS[1];
  
  const recencyText = skill.lastUsedAt 
    ? getRecencyText(new Date(skill.lastUsedAt))
    : 'Never used';

  return (
    <Card className="border border-[#D8D2C8] bg-white p-6 space-y-4">
      {/* Header Row */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-[#2D3330] mb-1">
            {skill.taxonomy.nameI18n.en}
          </h4>
          <p className="text-xs text-[#6B6760] font-mono">{skill.skillCode}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="text-[#4A5943] hover:bg-[#EEF1EA]"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Level */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#6B6760]">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Competency</span>
          </div>
          <p className={`text-sm font-semibold ${levelInfo.color}`}>
            Level {skill.level} - {levelInfo.label}
          </p>
        </div>

        {/* Experience */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#6B6760]">
            <Clock className="h-3.5 w-3.5" />
            <span>Experience</span>
          </div>
          <p className="text-sm font-semibold text-[#2D3330]">
            {skill.monthsExperience} months
          </p>
        </div>

        {/* Recency */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#6B6760]">
            <Clock className="h-3.5 w-3.5" />
            <span>Last Used</span>
          </div>
          <p className="text-sm font-semibold text-[#2D3330]">{recencyText}</p>
        </div>

        {/* Relevance */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#6B6760]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Relevance</span>
          </div>
          <Badge 
            className={`${relevanceStyle.bg} ${relevanceStyle.text} ${relevanceStyle.border} capitalize`}
          >
            {skill.relevance}
          </Badge>
        </div>
      </div>

      {/* Evidence & Impact Bar */}
      <div className="space-y-3 pt-3 border-t border-[#D8D2C8]">
        <div>
          <div className="flex items-center justify-between text-xs text-[#6B6760] mb-1">
            <span>Evidence Strength</span>
            <span>{Math.round(skill.evidenceStrength * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#4A5943] transition-all"
              style={{ width: `${skill.evidenceStrength * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-[#6B6760] mb-1">
            <span>Impact Score</span>
            <span>{Math.round(skill.impactScore * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#C76B4A] transition-all"
              style={{ width: `${skill.impactScore * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      {skill.taxonomy.tags && skill.taxonomy.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-[#D8D2C8]">
          {skill.taxonomy.tags.slice(0, 5).map((tag) => (
            <Badge 
              key={tag} 
              variant="outline"
              className="text-xs border-[#D8D2C8] text-[#6B6760]"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-3 border-t border-[#D8D2C8]">
        <Button 
          size="sm" 
          variant="outline"
          className="flex-1 text-[#4A5943] border-[#4A5943] hover:bg-[#EEF1EA]"
        >
          <FileText className="h-4 w-4 mr-2" />
          Add Proof
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          className="flex-1 text-[#4A5943] border-[#4A5943] hover:bg-[#EEF1EA]"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Request Verification
        </Button>
      </div>
    </Card>
  );
}

/**
 * Helper to convert date to recency text
 */
function getRecencyText(date: Date): string {
  const now = new Date();
  const monthsAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  if (monthsAgo < 1) return 'This month';
  if (monthsAgo < 6) return `${monthsAgo} months ago`;
  if (monthsAgo < 12) return `${monthsAgo} months ago (Recent)`;
  if (monthsAgo < 24) return `${Math.floor(monthsAgo / 12)} year ago`;
  return `${Math.floor(monthsAgo / 12)} years ago (Rusty)`;
}

