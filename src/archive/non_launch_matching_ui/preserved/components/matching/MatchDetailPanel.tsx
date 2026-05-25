/**
 * Match Detail Panel
 * Implements PRD Gap 4: "Why This Match" explainer UI
 *
 * Shows detailed breakdown of match score with:
 * - Overall composite score
 * - Subscore breakdown
 * - Improvement tips
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { skillDisplayLabel } from '@/lib/copy/labels';

interface MatchDetailPanelProps {
  match: {
    score: number; // 0-100
    subscores: {
      skills: number;
      experience: number;
      location: number;
      compensation: number;
      recency: number;
    };
    weights: {
      expertise: number; // Default 40
      tools: number; // Default 10
      logistics: number; // Default 10
      recency: number; // Default 10
    };
  };
  assignment: {
    role: string;
    mustHaveSkills: any[];
    niceToHaveSkills: any[];
  };
  profile: {
    skills: any[];
  };
}

export function MatchDetailPanel({ match, assignment, profile }: MatchDetailPanelProps) {
  // Calculate weighted scores
  const expertiseScore = match.subscores.skills;
  const logisticsScore =
    match.subscores.location * 0.4 +
    match.subscores.compensation * 0.4 +
    match.subscores.recency * 0.2;

  const improvementTips = generateImprovementTips(match, profile, assignment);

  return (
    <Card variant="bento" className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Why This Match?</span>
          <div className="text-4xl font-bold text-proofound-forest">{match.score}%</div>
        </CardTitle>
        <CardDescription>Breakdown of how this match was calculated</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Breakdown */}
        <div className="space-y-4">
          <ScoreBreakdown
            label="Skills & Expertise Match"
            score={expertiseScore}
            weight={match.weights.expertise}
            color="bg-green-500"
          />

          <ScoreBreakdown
            label="Logistics Compatibility"
            score={logisticsScore}
            weight={match.weights.logistics}
            color="bg-purple-500"
          />
        </div>

        {/* Detailed Subscores */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="skills">
            <AccordionTrigger>Skills Match Detail</AccordionTrigger>
            <AccordionContent>
              <SkillsMatchDetail
                profileSkills={profile.skills}
                mustHaveSkills={assignment.mustHaveSkills}
                niceToHaveSkills={assignment.niceToHaveSkills}
                score={match.subscores.skills}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Improvement Tips */}
        {improvementTips.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">How to Improve Your Match Score</span>
            </div>
            <ul className="space-y-2">
              {improvementTips.map((tip, i) => (
                <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getSkillDisplayLabel(skill: any): string {
  return skillDisplayLabel({
    label: skill?.label,
    name: skill?.name,
    skillName: skill?.skillName,
    id: skill?.id,
  });
}

function normalizeSkillKey(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Score Breakdown Component
 */
function ScoreBreakdown({
  label,
  score,
  weight,
  color,
}: {
  label: string;
  score: number;
  weight: number;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {score.toFixed(0)}% × {weight}% weight = {((score * weight) / 100).toFixed(1)} pts
        </span>
      </div>
      <Progress value={score} className="h-2" indicatorClassName={color} />
    </div>
  );
}

/**
 * Skills Match Detail
 */
function SkillsMatchDetail({
  profileSkills,
  mustHaveSkills,
  niceToHaveSkills,
  score,
}: {
  profileSkills: any[];
  mustHaveSkills: any[];
  niceToHaveSkills: any[];
  score: number;
}) {
  const profileSkillKeys = new Set(
    profileSkills
      .flatMap((skill) => [skill?.name, skill?.label, skill?.skillName, skill?.id])
      .filter(Boolean)
      .map((value) => normalizeSkillKey(String(value)))
  );

  const isMatched = (skill: any) => {
    const keys = [skill?.label, skill?.name, skill?.skillName, skill?.id]
      .filter(Boolean)
      .map((value) => normalizeSkillKey(String(value)));

    return keys.some((key) => profileSkillKeys.has(key));
  };

  const matchedMustHave = mustHaveSkills.filter((skill) => isMatched(skill));
  const matchedNiceToHave = niceToHaveSkills.filter((skill) => isMatched(skill));

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Match Score: <strong>{score}%</strong>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">
          Must-Have Skills ({matchedMustHave.length}/{mustHaveSkills.length})
        </div>
        <div className="space-y-1">
          {mustHaveSkills.map((skill, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {isMatched(skill) ? (
                <Badge variant="default" className="text-xs">
                  ✓
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  ✗
                </Badge>
              )}
              <span>{getSkillDisplayLabel(skill)}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">
          Nice-to-Have Skills ({matchedNiceToHave.length}/{niceToHaveSkills.length})
        </div>
        <div className="space-y-1">
          {niceToHaveSkills.map((skill, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {isMatched(skill) ? (
                <Badge variant="default" className="text-xs">
                  ✓
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  ✗
                </Badge>
              )}
              <span>{getSkillDisplayLabel(skill)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Generate improvement tips
 */
function generateImprovementTips(match: any, profile: any, assignment: any): string[] {
  const tips: string[] = [];

  // Skills tips
  if (match.subscores.skills < 80) {
    const profileSkillKeys = new Set(
      (profile.skills || [])
        .flatMap((skill: any) => [skill?.name, skill?.label, skill?.skillName, skill?.id])
        .filter(Boolean)
        .map((value: any) => normalizeSkillKey(String(value)))
    );

    const missingMustHave = assignment.mustHaveSkills.filter(
      (skill: any) =>
        ![skill?.name, skill?.label, skill?.skillName, skill?.id]
          .filter(Boolean)
          .map((value: any) => normalizeSkillKey(String(value)))
          .some((key: string) => profileSkillKeys.has(key))
    );
    if (missingMustHave.length > 0) {
      tips.push(
        `Add these must-have skills: ${missingMustHave
          .map((skill: any) => getSkillDisplayLabel(skill))
          .slice(0, 3)
          .join(', ')}`
      );
    }
  }

  if (tips.length === 0) {
    tips.push('Your profile is well-matched! Consider applying.');
  }

  return tips;
}
