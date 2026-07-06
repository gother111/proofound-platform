'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, FileText, CheckCircle2, Clock, TrendingUp, Lock, ShieldCheck } from 'lucide-react';
import { skillDisplayLabel } from '@/lib/copy/labels';

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
  skill_name?: string; // Computed skill name from API
  custom_skill_name?: string; // For custom user-created skills
  is_custom?: boolean; // Whether this is a custom skill
  proof_count?: number;
  verification_count?: number;
  taxonomy?: {
    code: string;
    nameI18n?: { en?: string };
    tags: string[];
  } | null;
}

interface L4CardProps {
  skill: L4Skill;
  onEdit: (focus?: 'details' | 'proofs' | 'verification') => void;
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
  const proofCount = skill.proof_count ?? 0;
  const verificationCount = skill.verification_count ?? 0;
  const skillName = skillDisplayLabel({
    skillName: skill.skill_name,
    taxonomyName: skill.taxonomy?.nameI18n?.en,
    customSkillName: skill.custom_skill_name,
    id: skill.id,
    code: skill.skillCode,
  });

  const recencyText = skill.lastUsedAt ? getRecencyText(new Date(skill.lastUsedAt)) : 'Never used';

  return (
    <Card variant="flat" className="p-6 space-y-5 rounded-xl">
      {/* Header Row */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-xl font-semibold text-proofound-charcoal mb-1 font-display">
            {skillName}
          </h4>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            <Lock className="h-3.5 w-3.5" />
            Proof visibility: shared after mutual match
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            {verificationCount > 0 ? `${verificationCount} verified` : 'Request verification'}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit('details')}
          className="text-proofound-forest hover:bg-proofound-forest/10 hover:text-proofound-forest rounded-full h-8 w-8 p-0"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border border-proofound-stone/70 bg-proofound-parchment/60 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Proofs and verifications
            </p>
            <p className="text-sm font-medium text-proofound-charcoal">
              {proofCount} {proofCount === 1 ? 'proof' : 'proofs'} • {verificationCount}{' '}
              {verificationCount === 1 ? 'verification' : 'verifications'}
            </p>
            <p className="text-xs text-muted-foreground">
              Open this section directly to manage evidence.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit('proofs')}
            className="border-proofound-forest/40 text-proofound-forest hover:bg-proofound-forest/10"
          >
            Open Proofs
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {/* Level */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Competency</span>
          </div>
          <p className={`text-sm font-semibold ${levelInfo.color} font-display`}>
            Level {skill.level} - {levelInfo.label}
          </p>
        </div>

        {/* Experience */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5" />
            <span>Experience</span>
          </div>
          <p className="text-sm font-semibold text-proofound-charcoal font-display">
            {skill.monthsExperience} months
          </p>
        </div>

        {/* Recency */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5" />
            <span>Last Used</span>
          </div>
          <p className="text-sm font-semibold text-proofound-charcoal font-display">
            {recencyText}
          </p>
        </div>

        {/* Relevance */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Relevance</span>
          </div>
          <Badge
            className={`${relevanceStyle.bg} ${relevanceStyle.text} ${relevanceStyle.border} capitalize font-medium border shadow-none`}
          >
            {skill.relevance}
          </Badge>
        </div>
      </div>

      {/* Evidence & Impact Bar */}
      <div className="space-y-4 pt-4 border-t border-proofound-stone">
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-medium">Evidence Strength</span>
            <span className="font-mono">{Math.round(skill.evidenceStrength * 100)}%</span>
          </div>
          <div className="h-2 bg-proofound-stone/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-proofound-forest transition-all duration-500 ease-out rounded-full"
              style={{ width: `${skill.evidenceStrength * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-medium">Impact Score</span>
            <span className="font-mono">{Math.round(skill.impactScore * 100)}%</span>
          </div>
          <div className="h-2 bg-proofound-stone/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-proofound-terracotta transition-all duration-500 ease-out rounded-full"
              style={{ width: `${skill.impactScore * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      {skill.taxonomy?.tags && skill.taxonomy.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-proofound-stone">
          {skill.taxonomy.tags.slice(0, 5).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs border-proofound-stone text-muted-foreground bg-proofound-parchment/50 font-normal"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-proofound-stone">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit('proofs')}
          className="flex-1 text-proofound-forest border-proofound-forest/30 hover:bg-proofound-forest/5 hover:border-proofound-forest hover:text-proofound-forest transition-all"
        >
          <FileText className="h-4 w-4 mr-2" />
          Open Proofs
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit('verification')}
          className="flex-1 text-proofound-teal border-proofound-teal/30 hover:bg-proofound-teal/5 hover:border-proofound-teal hover:text-proofound-teal transition-all"
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
