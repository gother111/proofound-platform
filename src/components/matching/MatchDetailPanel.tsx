/**
 * Match Detail Panel
 * Implements PRD Gap 4: "Why This Match" explainer UI
 *
 * Shows detailed breakdown of match score with:
 * - Overall composite score
 * - Subscore breakdown
 * - PAC (Purpose-Alignment Contribution)
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
import { Heart, TrendingUp, AlertCircle } from 'lucide-react';

interface MatchDetailPanelProps {
  match: {
    score: number; // 0-100
    subscores: {
      values: number;
      causes: number;
      skills: number;
      experience: number;
      location: number;
      compensation: number;
      recency: number;
    };
    weights: {
      mission: number; // Default 30
      expertise: number; // Default 40
      tools: number; // Default 10
      logistics: number; // Default 10
      recency: number; // Default 10
    };
    pac: number; // Purpose-Alignment Contribution (0-15)
  };
  assignment: {
    role: string;
    values: string[];
    causes: string[];
    mustHaveSkills: any[];
    niceToHaveSkills: any[];
  };
  profile: {
    values: string[];
    causes: string[];
    skills: any[];
  };
}

export function MatchDetailPanel({ match, assignment, profile }: MatchDetailPanelProps) {
  // Calculate weighted scores
  const missionScore = match.subscores.values * 0.6 + match.subscores.causes * 0.4;
  const expertiseScore = match.subscores.skills;
  const logisticsScore =
    match.subscores.location * 0.4 +
    match.subscores.compensation * 0.4 +
    match.subscores.recency * 0.2;

  const improvementTips = generateImprovementTips(match, profile, assignment);

  return (
    <Card className="w-full">
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
            label="Mission & Values Alignment"
            score={missionScore}
            weight={match.weights.mission}
            color="bg-blue-500"
          />

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

        {/* PAC Badge */}
        {match.pac > 0 && (
          <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-pink-600" />
              <span className="font-semibold text-pink-900">Purpose Alignment Boost</span>
            </div>
            <p className="text-sm text-pink-800">
              This role contributes <strong>+{match.pac}%</strong> to your purpose alignment score
              based on shared values and causes.
            </p>
          </div>
        )}

        {/* Detailed Subscores */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="values">
            <AccordionTrigger>Values Alignment Detail</AccordionTrigger>
            <AccordionContent>
              <ValuesMatchDetail
                profileValues={profile.values}
                assignmentValues={assignment.values}
                score={match.subscores.values}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="causes">
            <AccordionTrigger>Causes Alignment Detail</AccordionTrigger>
            <AccordionContent>
              <CausesMatchDetail
                profileCauses={profile.causes}
                assignmentCauses={assignment.causes}
                score={match.subscores.causes}
              />
            </AccordionContent>
          </AccordionItem>

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
 * Values Match Detail
 */
function ValuesMatchDetail({
  profileValues,
  assignmentValues,
  score,
}: {
  profileValues: string[];
  assignmentValues: string[];
  score: number;
}) {
  const overlap = profileValues.filter((v) => assignmentValues.includes(v));

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Match Score: <strong>{score}%</strong>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">Shared Values ({overlap.length})</div>
        <div className="flex flex-wrap gap-2">
          {overlap.map((value, i) => (
            <Badge key={i} variant="secondary">
              {value}
            </Badge>
          ))}
          {overlap.length === 0 && (
            <span className="text-sm text-muted-foreground">No shared values</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Causes Match Detail
 */
function CausesMatchDetail({
  profileCauses,
  assignmentCauses,
  score,
}: {
  profileCauses: string[];
  assignmentCauses: string[];
  score: number;
}) {
  const overlap = profileCauses.filter((c) => assignmentCauses.includes(c));

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Match Score: <strong>{score}%</strong>
      </div>
      <div>
        <div className="text-sm font-medium mb-2">Shared Causes ({overlap.length})</div>
        <div className="flex flex-wrap gap-2">
          {overlap.map((cause, i) => (
            <Badge key={i} variant="secondary">
              {cause}
            </Badge>
          ))}
          {overlap.length === 0 && (
            <span className="text-sm text-muted-foreground">No shared causes</span>
          )}
        </div>
      </div>
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
  const profileSkillNames = profileSkills.map((s) => s.name);
  const matchedMustHave = mustHaveSkills.filter((s) => profileSkillNames.includes(s.name));
  const matchedNiceToHave = niceToHaveSkills.filter((s) => profileSkillNames.includes(s.name));

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
              {profileSkillNames.includes(skill.name) ? (
                <Badge variant="default" className="text-xs">
                  ✓
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  ✗
                </Badge>
              )}
              <span>{skill.name}</span>
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
              {profileSkillNames.includes(skill.name) ? (
                <Badge variant="default" className="text-xs">
                  ✓
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  ✗
                </Badge>
              )}
              <span>{skill.name}</span>
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

  // Values/causes tips
  if (match.subscores.values < 70) {
    tips.push('Add more values that align with this organization to improve mission fit.');
  }
  if (match.subscores.causes < 70) {
    tips.push('Consider adding causes that relate to this role to boost purpose alignment.');
  }

  // Skills tips
  if (match.subscores.skills < 80) {
    const missingMustHave = assignment.mustHaveSkills.filter(
      (s: any) => !profile.skills.map((ps: any) => ps.name).includes(s.name)
    );
    if (missingMustHave.length > 0) {
      tips.push(
        `Add these must-have skills: ${missingMustHave
          .map((s: any) => s.name)
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
