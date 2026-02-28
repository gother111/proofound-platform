/**
 * Match Score Breakdown Component
 *
 * Shows detailed breakdown of match score components:
 * - Skills match
 * - Constraints satisfaction
 * - Verification status
 * - PAC (Purpose-Alignment Contribution)
 *
 * PRD References:
 * - Part 2: PAC visibility
 * - Part 7: Match detail transparency
 */

'use client';

import { PACBadge } from './PACBadge';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, Target, Shield, Heart } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';

interface MatchScoreBreakdownProps {
  overallScore: number; // 0-100
  subscores: {
    skills?: number;
    constraints?: number;
    verification?: number;
    purposeAlignment?: number;
  };
  showDetails?: boolean;
}

export function MatchScoreBreakdown({
  overallScore,
  subscores,
  showDetails = true,
}: MatchScoreBreakdownProps) {
  const { skills = 0, constraints = 0, verification = 0, purposeAlignment = 0 } = subscores;

  const subscoreItems = [
    {
      icon: Target,
      label: 'Skills Match',
      score: skills,
      description: 'How well your skills match the requirements',
      color: 'text-blue-600',
    },
    {
      icon: CheckCircle2,
      label: 'Constraints',
      score: constraints,
      description: 'Availability, location, and compensation alignment',
      color: 'text-green-600',
    },
    {
      icon: Shield,
      label: 'Verification',
      score: verification,
      description: 'Verified skills and experience',
      color: 'text-purple-600',
    },
    {
      icon: Heart,
      label: 'Purpose Alignment',
      score: purposeAlignment,
      description: 'Values and causes alignment',
      color: 'text-rose-600',
    },
  ];

  // Radar Chart Data Prep
  const radarData = [
    { subject: 'Skills', score: skills },
    { subject: 'Constraints', score: constraints },
    { subject: 'Verification', score: verification },
    { subject: 'Purpose', score: purposeAlignment },
  ];

  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-[#E8E6DD] shadow-sm">
          <p className="text-xs font-semibold text-[#2D3330] mb-2">{data.subject}</p>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-[#1C4D3A]" />
            <span className="text-[#6B6760] font-medium">Score:</span>
            <span className="text-[#2D3330] font-bold">{data.score.toFixed(0)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card variant="bento" className="rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Match Score Breakdown</span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-[#1C4D3A]">{overallScore.toFixed(0)}</span>
            <span className="text-sm text-[#6B6760]">/ 100</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Match Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#2D3330]">Overall Match</span>
            <span className="text-sm text-[#6B6760]">{overallScore.toFixed(1)}%</span>
          </div>
          <Progress value={overallScore} className="h-3" />
        </div>

        {/* Subscores */}
        {showDetails && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[#2D3330] pt-4 border-t border-[#E8E6DD]">
              Match Profile Shape
            </h4>
            <div className="h-[220px] w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                  <PolarGrid stroke="#E8E6DD" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B6760', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#1C4D3A"
                    fill="#1C4D3A"
                    fillOpacity={0.4}
                  />
                  <RechartsTooltip content={<CustomRadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <h4 className="text-sm font-semibold text-[#2D3330] pt-2 border-t border-[#E8E6DD]">
              Score Components
            </h4>
            {subscoreItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${item.color}`} />
                      <span className="text-sm font-medium text-[#2D3330]">{item.label}</span>
                    </div>
                    <span className="text-sm text-[#6B6760]">{item.score.toFixed(0)}</span>
                  </div>
                  <Progress value={item.score} className="h-2" />
                  <p className="text-xs text-[#9B9891]">{item.description}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* PAC Badge */}
        {purposeAlignment > 0 && (
          <div className="pt-4 border-t border-[#E8E6DD]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#2D3330]">
                Purpose-Alignment Contribution
              </span>
              <PACBadge pacScore={purposeAlignment} showTooltip />
            </div>
            <p className="text-xs text-[#9B9891] mt-2">
              {purposeAlignment >= 71
                ? 'This organization strongly aligns with your values and causes.'
                : purposeAlignment >= 31
                  ? 'This organization moderately aligns with your values and causes.'
                  : 'Limited alignment with your stated values and causes.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
