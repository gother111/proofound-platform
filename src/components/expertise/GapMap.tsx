/**
 * Gap Map Component
 *
 * PRD Persona #2 (Mateo - Career Switcher)
 * Helps users identify skill gaps and prioritize learning
 * - Analyzes current skills vs target role requirements
 * - Shows top 10 skills to develop
 * - Provides actionable steps to close gaps
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Plus, Target, Info, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

interface SkillGap {
  skillCode: string;
  skillName: string;
  l1: string;
  l2: string;
  l3: string;
  importance: number; // 0-100, how important for target roles
  currentLevel: number; // 0-5
  targetLevel: number; // 0-5
  gap: number; // difference
  relatedRoles: string[];
  learningResources?: string[];
}

interface GapMapProps {
  targetRole?: string;
  userId?: string;
}

export function GapMap({ targetRole, userId }: GapMapProps) {
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function fetchGaps() {
      try {
        setLoading(true);
        const response = await fetch('/api/expertise/gap-analysis');

        if (!response.ok) {
          throw new Error('Failed to fetch gap analysis');
        }

        const data = await response.json();
        setGaps(data.gaps || []);
      } catch (err) {
        console.error('Gap analysis error:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze gaps');
      } finally {
        setLoading(false);
      }
    }

    fetchGaps();
  }, [targetRole, userId, reloadKey]);

  const handleAddSkill = async (skillCode: string) => {
    try {
      const response = await fetch('/api/expertise/user-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill_code: skillCode,
          level: 1,
          relevance: 'current',
          months_experience: 0,
          last_used_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        if (errorPayload.error === 'Skill already exists in your profile') {
          toast.info('Skill is already in your profile');
          return;
        }
        throw new Error(errorPayload.error || 'Failed to add skill');
      }

      toast.success('Skill added to your profile', {
        description: 'You can update the level in your skills section',
      });

      // Refresh gaps
      setGaps((prev) =>
        prev.map((gap) =>
          gap.skillCode === skillCode ? { ...gap, currentLevel: 1, gap: gap.targetLevel - 1 } : gap
        )
      );
    } catch (err) {
      console.error('Add skill error:', err);
      toast.error('Failed to add skill', {
        description: 'Please try again',
      });
    }
  };

  if (loading) {
    return (
      <Card className="border-proofound-stone dark:border-border rounded-3xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="space-y-3 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-proofound-forest mx-auto"></div>
              <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                Analyzing your skill gaps...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-proofound-stone dark:border-border rounded-3xl">
        <CardContent className="pt-6">
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                setReloadKey((prev) => prev + 1);
              }}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gaps.length === 0) {
    return (
      <Card className="border-proofound-stone dark:border-border rounded-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <CardTitle className="text-lg font-['Crimson_Pro']">No Skill Gaps Found</CardTitle>
              <CardDescription>Your profile is well-matched to your target roles</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const topGaps = gaps.slice(0, 10);

  // Prepare Radar Chart data
  const radarData = topGaps.map((gap) => ({
    subject: gap.skillName.length > 20 ? gap.skillName.substring(0, 20) + '...' : gap.skillName,
    Current: gap.currentLevel,
    Target: gap.targetLevel,
    fullMark: 5,
  }));

  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-[#E8E6DD] shadow-sm">
          <p className="text-xs font-semibold text-[#2D3330] mb-2">{data.subject}</p>
          <div className="flex items-center gap-2 text-xs mb-1">
            <div className="w-2 h-2 rounded-full bg-[#1C4D3A]" />
            <span className="text-[#6B6760] font-medium">Currently:</span>
            <span className="text-[#2D3330] font-bold">L{data.Current}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-[#C76B4A]" />
            <span className="text-[#6B6760] font-medium">Target:</span>
            <span className="text-[#2D3330] font-bold">L{data.Target}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-proofound-stone dark:border-border rounded-3xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-['Crimson_Pro']">Skill Gap Map</CardTitle>
            <CardDescription>
              Top skills to develop for {targetRole || 'your target roles'}
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="text-xs">
                  This analysis compares your current skills with those required for your target
                  roles. Focus on high-importance gaps first for maximum impact.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        {topGaps.length >= 3 && (
          <div className="h-[350px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                <PolarGrid stroke="#E8E6DD" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B6760', fontSize: 10 }} />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 5]}
                  tick={{ fill: '#6B6760', fontSize: 10 }}
                />
                <Radar
                  name="Current Proficiency"
                  dataKey="Current"
                  stroke="#1C4D3A"
                  fill="#1C4D3A"
                  fillOpacity={0.5}
                />
                <Radar
                  name="Target Requirement"
                  dataKey="Target"
                  stroke="#C76B4A"
                  fill="#C76B4A"
                  fillOpacity={0.2}
                />
                <RechartsTooltip content={<CustomRadarTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="space-y-4">
          {topGaps.map((gap, idx) => {
            const progressValue =
              gap.currentLevel > 0 ? (gap.currentLevel / gap.targetLevel) * 100 : 0;

            return (
              <div
                key={gap.skillCode}
                className="flex flex-col gap-3 p-4 border border-proofound-stone dark:border-border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Rank and Name */}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className="h-6 w-6 rounded-full flex items-center justify-center p-0"
                      >
                        {idx + 1}
                      </Badge>
                      <h4 className="font-medium text-proofound-charcoal dark:text-foreground truncate">
                        {gap.skillName}
                      </h4>
                      <Badge
                        variant={
                          gap.importance >= 80
                            ? 'destructive'
                            : gap.importance >= 60
                              ? 'default'
                              : 'secondary'
                        }
                        className="text-xs"
                      >
                        {gap.importance >= 80
                          ? 'Critical'
                          : gap.importance >= 60
                            ? 'High'
                            : 'Medium'}
                      </Badge>
                    </div>

                    {/* Taxonomy Path */}
                    <div className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground mb-3">
                      {gap.l1} → {gap.l2} → {gap.l3}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-proofound-charcoal/70 dark:text-muted-foreground">
                          Current: L{gap.currentLevel}
                        </span>
                        <span className="text-proofound-charcoal/70 dark:text-muted-foreground">
                          Target: L{gap.targetLevel}
                        </span>
                      </div>
                      <Progress value={progressValue} className="h-2" />
                    </div>

                    {/* Related Roles */}
                    {gap.relatedRoles && gap.relatedRoles.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-proofound-charcoal/60 dark:text-muted-foreground">
                        <Target className="h-3 w-3" />
                        <span>
                          Needed by {gap.relatedRoles.length} role
                          {gap.relatedRoles.length > 1 ? 's' : ''}
                          {gap.relatedRoles.length <= 3 && `: ${gap.relatedRoles.join(', ')}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div>
                    {gap.currentLevel === 0 ? (
                      <Button
                        size="sm"
                        onClick={() => handleAddSkill(gap.skillCode)}
                        className="bg-proofound-forest hover:bg-proofound-forest/90"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Skill
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.location.href = '/app/i/expertise';
                        }}
                      >
                        Update Level
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t border-proofound-stone dark:border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-proofound-charcoal/70 dark:text-muted-foreground">
              Showing top {topGaps.length} of {gaps.length} identified gaps
            </span>
            {gaps.length > 10 && (
              <Button variant="ghost" size="sm">
                View All Gaps
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
