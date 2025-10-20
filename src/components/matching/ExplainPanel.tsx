'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface ExplainPanelProps {
  result: {
    score: number;
    subscores: Record<string, number>;
    contributions: Record<string, number>;
    gaps?: Array<{ id: string; required: number; have: number }>;
    missing?: string[];
  };
  className?: string;
}

const SUBSCORE_LABELS: Record<string, string> = {
  values: 'Values Alignment',
  causes: 'Causes & Impact',
  skills: 'Skills Match',
  experience: 'Experience Level',
  verifications: 'Verifications',
  availability: 'Availability',
  location: 'Location Match',
  compensation: 'Compensation Fit',
  language: 'Language Proficiency',
};

const SUBSCORE_DESCRIPTIONS: Record<string, string> = {
  values: 'How well their values align with yours',
  causes: 'Shared impact areas and causes',
  skills: 'Technical and functional skill match',
  experience: 'Years of relevant experience',
  verifications: 'Completed identity and credential verifications',
  availability: 'Start date and hours availability',
  location: 'Work mode and location compatibility',
  compensation: 'Compensation range overlap',
  language: 'Language proficiency requirements',
};

/**
 * Detailed explanation panel showing match breakdown.
 */
export function ExplainPanel({ result, className }: ExplainPanelProps) {
  const scorePercent = Math.round(result.score * 100);

  // Sort subscores by contribution (highest first)
  const sortedSubscores = Object.entries(result.subscores).sort(
    (a, b) => (result.contributions[b[0]] || 0) - (result.contributions[a[0]] || 0)
  );

  // Determine overall quality
  const getQualityBadge = (score: number) => {
    if (score >= 0.8) return { label: 'Excellent', color: '#1C4D3A' };
    if (score >= 0.6) return { label: 'Good', color: '#7A9278' };
    if (score >= 0.4) return { label: 'Fair', color: '#C76B4A' };
    return { label: 'Weak', color: '#6B6760' };
  };

  const quality = getQualityBadge(result.score);

  return (
    <Card className={`p-6 ${className || ''}`} style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      {/* Overall score */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold mb-2" style={{ color: quality.color }}>
          {scorePercent}%
        </div>
        <Badge
          variant="secondary"
          className="px-3 py-1"
          style={{ backgroundColor: quality.color, color: 'white' }}
        >
          {quality.label} Match
        </Badge>
      </div>

      <Separator className="my-6" />

      {/* Why this match */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2" style={{ color: '#2D3330' }}>
          Why This Match?
        </h3>
        <p className="text-sm" style={{ color: '#6B6760' }}>
          {scorePercent >= 80
            ? 'This is an exceptional match. Strong alignment across skills, values, and logistics makes this a high-potential collaboration.'
            : scorePercent >= 60
              ? 'This is a solid match. Key requirements are met with good alignment on values and practical considerations.'
              : scorePercent >= 40
                ? 'This is a moderate match. Some requirements are met, but there are gaps that may need consideration.'
                : 'This match has significant gaps. Review carefully to see if flexibility is possible.'}
        </p>
      </div>

      <Separator className="my-6" />

      {/* Subscore breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4" style={{ color: '#2D3330' }}>
          Score Breakdown
        </h3>
        <div className="space-y-4">
          {sortedSubscores.map(([key, score]) => {
            const contribution = (result.contributions[key] || 0) * 100;
            const scorePercent = score * 100;

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{SUBSCORE_LABELS[key] || key}</span>
                    {scorePercent >= 70 ? (
                      <TrendingUp className="w-3 h-3" style={{ color: '#1C4D3A' }} />
                    ) : scorePercent < 40 ? (
                      <TrendingDown className="w-3 h-3" style={{ color: '#C76B4A' }} />
                    ) : null}
                  </div>
                  <span className="text-sm font-medium">{Math.round(scorePercent)}%</span>
                </div>
                <Progress
                  value={scorePercent}
                  className="h-2 mb-1"
                  style={{ backgroundColor: '#E8E6DD' }}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: '#6B6760' }}>
                    {SUBSCORE_DESCRIPTIONS[key] || ''}
                  </p>
                  <span className="text-xs" style={{ color: '#6B6760' }}>
                    Contributes {contribution.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gaps & Missing */}
      {((result.gaps && result.gaps.length > 0) ||
        (result.missing && result.missing.length > 0)) && (
        <>
          <Separator className="my-6" />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4" style={{ color: '#C76B4A' }} />
              <h3 className="text-lg font-medium" style={{ color: '#2D3330' }}>
                Gaps & Considerations
              </h3>
            </div>

            {result.gaps && result.gaps.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-2">Skill Gaps:</p>
                <ul className="space-y-1">
                  {result.gaps.map((gap) => (
                    <li key={gap.id} className="text-sm" style={{ color: '#6B6760' }}>
                      • <strong>{gap.id}:</strong> Has level {gap.have}, needs level {gap.required}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.missing && result.missing.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Missing Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {result.missing.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: '#C76B4A', color: '#C76B4A' }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <Separator className="my-6" />

      {/* Next steps */}
      <div className="rounded-md p-3" style={{ backgroundColor: '#F7F6F1' }}>
        <h4 className="text-sm font-medium mb-1" style={{ color: '#2D3330' }}>
          Next Steps
        </h4>
        <p className="text-xs" style={{ color: '#6B6760' }}>
          Click &quot;Interested&quot; to express interest. If they&apos;re also interested,
          identities will be revealed and you can connect directly.
        </p>
      </div>
    </Card>
  );
}
