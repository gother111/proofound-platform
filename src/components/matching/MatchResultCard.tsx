'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MapPin, Clock, DollarSign, Shield, Eye, EyeOff } from 'lucide-react';

interface MatchResultCardProps {
  result: {
    score: number;
    subscores: Record<string, number>;
    contributions: Record<string, number>;
    profileId?: string;
    assignmentId?: string;
    profile?: {
      workMode?: string;
      country?: string;
      hoursMin?: number;
      hoursMax?: number;
      compMin?: number;
      compMax?: number;
      currency?: string;
      valuesTags?: string[];
      causeTags?: string[];
    };
    assignment?: {
      role?: string;
      locationMode?: string;
      country?: string;
      hoursMin?: number;
      hoursMax?: number;
      compMin?: number;
      compMax?: number;
      currency?: string;
      valuesRequired?: string[];
      causeTags?: string[];
    };
    gaps?: Array<{ id: string; required: number; have: number }>;
  };
  variant?: 'blind' | 'revealed';
  onInterested?: () => void;
  onHide?: () => void;
  skills?: Array<{ id: string; label: string; level: number }>;
}

/**
 * Match result card showing blind-first or revealed match details.
 */
export function MatchResultCard({
  result,
  variant = 'blind',
  onInterested,
  onHide,
  skills = [],
}: MatchResultCardProps) {
  const isOrgView = !!result.profileId; // Org viewing candidates

  // Top 3 skills
  const topSkills = skills.slice(0, 3);

  const displayTags =
    (isOrgView
      ? (result.profile?.valuesTags ?? result.profile?.causeTags)
      : (result.assignment?.valuesRequired ?? result.assignment?.causeTags)) ?? [];

  const locationMode = isOrgView ? result.profile?.workMode : result.assignment?.locationMode;
  const country = isOrgView ? result.profile?.country : result.assignment?.country;
  const hoursMin = isOrgView ? result.profile?.hoursMin : result.assignment?.hoursMin;
  const hoursMax = isOrgView ? result.profile?.hoursMax : result.assignment?.hoursMax;
  const compMin = isOrgView ? result.profile?.compMin : result.assignment?.compMin;
  const compMax = isOrgView ? result.profile?.compMax : result.assignment?.compMax;
  const currency = isOrgView ? result.profile?.currency : result.assignment?.currency;

  const hoursLabel =
    hoursMin != null && hoursMax != null
      ? `${hoursMin}-${hoursMax} hrs/week`
      : hoursMin != null
        ? `${hoursMin}+ hrs/week`
        : hoursMax != null
          ? `Up to ${hoursMax} hrs/week`
          : null;

  const compensationLabel =
    compMin != null && compMax != null
      ? `${compMin.toLocaleString()}-${compMax.toLocaleString()}`
      : compMin != null
        ? `${compMin.toLocaleString()}+`
        : compMax != null
          ? `Up to ${compMax.toLocaleString()}`
          : null;

  // Match score percentage
  const scorePercent = Math.round(result.score * 100);

  // Contribution bars
  const contributions = Object.entries(result.contributions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <Card className="p-4" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {isOrgView ? (
            <h4 className="text-base font-medium mb-1">
              {variant === 'revealed' ? 'John Doe' : 'Candidate Match'}
            </h4>
          ) : (
            <h4 className="text-base font-medium mb-1">
              {result.assignment?.role || 'Opportunity Match'}
            </h4>
          )}

          {/* Match score */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: '#1C4D3A' }}>
              {scorePercent}% Match
            </span>
            {variant === 'blind' ? (
              <EyeOff className="w-3 h-3" style={{ color: '#6B6760' }} />
            ) : (
              <Eye className="w-3 h-3" style={{ color: '#1C4D3A' }} />
            )}
          </div>
        </div>
      </div>

      {/* Top Skills */}
      {topSkills.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {topSkills.map((skill) => (
              <Badge
                key={skill.id}
                variant="secondary"
                className="text-xs px-2 py-0.5"
                style={{ backgroundColor: '#E8E6DD' }}
              >
                {skill.label} L{skill.level}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Values/Causes */}
      {displayTags.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {displayTags.slice(0, 3).map((tag: string) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs px-2 py-0.5"
                style={{ borderColor: '#7A9278', color: '#1C4D3A' }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Key details */}
      <div className="space-y-2 mb-3 text-xs" style={{ color: '#6B6760' }}>
        {/* Location */}
        {locationMode && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            <span>
              {locationMode}
              {country && variant === 'revealed' && ` • ${country}`}
              {country && variant === 'blind' && ' • Region hidden'}
            </span>
          </div>
        )}

        {/* Hours */}
        {hoursLabel && (
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>{hoursLabel}</span>
          </div>
        )}

        {/* Compensation */}
        {compensationLabel && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-3 h-3" />
            <span>
              {currency ? `${currency} ` : ''}
              {compensationLabel}
            </span>
          </div>
        )}

        {/* Verifications (generic in blind mode) */}
        {variant === 'blind' && (
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3" />
            <span>Verified profile</span>
          </div>
        )}
      </div>

      {/* Contribution breakdown */}
      <div className="mb-4">
        <p className="text-xs mb-2" style={{ color: '#6B6760' }}>
          Match breakdown:
        </p>
        <div className="space-y-1">
          {contributions.map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs w-20 capitalize" style={{ color: '#6B6760' }}>
                {key}:
              </span>
              <Progress
                value={value * 100}
                className="h-1.5 flex-1"
                style={{ backgroundColor: '#E8E6DD' }}
              />
              <span className="text-xs w-10 text-right">{Math.round(value * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {variant === 'blind' && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onInterested}
            style={{ backgroundColor: '#1C4D3A' }}
            className="flex-1"
          >
            Interested
          </Button>
          <Button size="sm" variant="outline" onClick={onHide}>
            Hide
          </Button>
        </div>
      )}

      {variant === 'revealed' && (
        <div>
          <Button size="sm" className="w-full" style={{ backgroundColor: '#1C4D3A' }}>
            View Full Profile
          </Button>
        </div>
      )}

      {/* Gaps (if any) */}
      {result.gaps && result.gaps.length > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
          <p className="text-xs mb-1" style={{ color: '#C76B4A' }}>
            Skill gaps:
          </p>
          {result.gaps.slice(0, 2).map((gap) => (
            <p key={gap.id} className="text-xs" style={{ color: '#6B6760' }}>
              {gap.id}: Needs L{gap.required}, has L{gap.have}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}
