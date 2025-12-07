/**
 * Gap Map Widget for Dashboard
 *
 * Condensed version of Gap Map showing top 3 skill gaps
 * Links to full Gap Analysis in Expertise Atlas
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, ArrowRight, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/fetch';

interface SkillGap {
  skillCode: string;
  skillName: string;
  l1: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  importance: number;
}

export function GapMapWidget() {
  const [topGaps, setTopGaps] = useState<SkillGap[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchTopGaps() {
      try {
        const response = await apiFetch('/api/expertise/gap-analysis');
        if (response.ok) {
          const data = await response.json();
          // Get top 3 gaps sorted by importance
          const top3 = (data.gaps || [])
            .sort((a: SkillGap, b: SkillGap) => b.importance - a.importance)
            .slice(0, 3);
          setTopGaps(top3);
        }
      } catch (error) {
        console.error('Failed to fetch skill gaps:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTopGaps();
  }, []);

  const handleViewAll = () => {
    router.push('/app/i/expertise?tab=gap-analysis');
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display text-foreground">
            <Target className="h-5 w-5 text-primary" />
            Skill Gaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-secondary/20 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-secondary/20 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topGaps.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display text-foreground">
            <Target className="h-5 w-5 text-primary" />
            Skill Gaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No skill gaps identified yet. Add more skills to get personalized recommendations.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/app/i/expertise')}
              className="border-primary text-primary hover:bg-primary/10"
            >
              Add Skills
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-display text-foreground">
          <Target className="h-5 w-5 text-primary" />
          Top Skill Gaps
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewAll}
          className="text-primary hover:bg-primary/10 hover:text-primary"
        >
          View All
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topGaps.map((gap, index) => (
            <div key={gap.skillCode} className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{gap.skillName}</span>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: index === 0 ? '#E17055' : index === 1 ? '#FDCB6E' : '#74B9FF',
                        color: index === 0 ? '#E17055' : index === 1 ? '#FDCB6E' : '#74B9FF',
                      }}
                    >
                      Priority {index + 1}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{gap.l1}</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Current: L{gap.currentLevel}</span>
                  <span>Target: L{gap.targetLevel}</span>
                </div>
                <Progress
                  value={(gap.currentLevel / gap.targetLevel) * 100}
                  className="h-2 bg-secondary/20"
                />
                <p className="text-xs text-muted-foreground">
                  Gap: {gap.gap} level{gap.gap > 1 ? 's' : ''}
                </p>
              </div>

              {index < topGaps.length - 1 && <div className="border-b border-border pt-2"></div>}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <Button
            onClick={handleViewAll}
            variant="outline"
            size="sm"
            className="w-full border-primary text-primary hover:bg-primary/10"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Analyze All Gaps
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
