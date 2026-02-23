'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import type { SkillGap, GapMatrixRow } from '@/lib/skills/gap-service';
import type { LearningRecommendations } from '@/lib/learning/types';
import { LearningRecommendationsList } from './LearningRecommendations';

type Goal = {
  id: string;
  title: string;
  goal: string | null;
  targetLevel: number | null;
  targetDate: string | null;
  status: string;
  progress: number;
  nextStep: string;
};

type Coverage = { totalRequired: number; missing: number; covered: number };

type Filters = {
  timeframe: number;
  role: string;
};

type Props = {
  initialGaps?: SkillGap[];
  assignments?: Array<{ id: string; role?: string; status?: string }>;
  matrix?: GapMatrixRow[];
  coverage?: Coverage;
  learning?: LearningRecommendations;
  goals?: Goal[];
};

type GoalApiResponse = {
  goal?: unknown;
  legacyGoal?: unknown;
};

type SkillGapOverviewResponse = {
  gaps?: SkillGap[];
  assignments?: Array<{ id: string; role?: string; status?: string }>;
  matrix?: GapMatrixRow[];
  coverage?: Coverage;
  learning?: LearningRecommendations;
  goals?: Goal[];
};

function normalizeGoal(rawGoal: unknown, rawLegacyGoal?: unknown): Goal {
  const canonical =
    typeof rawGoal === 'object' && rawGoal !== null
      ? (rawGoal as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  const legacy =
    typeof rawLegacyGoal === 'object' && rawLegacyGoal !== null
      ? (rawLegacyGoal as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  return {
    id: String(canonical.id ?? legacy.id ?? ''),
    title: String(canonical.title ?? legacy.title ?? 'Untitled goal'),
    goal:
      canonical.goal !== undefined
        ? (canonical.goal as string | null)
        : ((legacy.goal as string | null) ?? null),
    targetLevel:
      canonical.targetLevel !== undefined
        ? (canonical.targetLevel as number | null)
        : ((legacy.target_level as number | null) ?? null),
    targetDate:
      canonical.targetDate !== undefined
        ? (canonical.targetDate as string | null)
        : ((legacy.target_date as string | null) ?? null),
    status: String(canonical.status ?? legacy.status ?? 'planned'),
    progress: Number(canonical.progress ?? 0),
    nextStep: String(canonical.nextStep ?? 'Define your first milestone'),
  };
}

const StatCard = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <Card className="border-proofound-stone dark:border-border">
    <CardHeader className="pb-2">
      <CardDescription className="overline">{label}</CardDescription>
      <CardTitle className="text-2xl">{value}</CardTitle>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </CardHeader>
  </Card>
);

export function SkillGapsClient({
  initialGaps,
  assignments,
  matrix,
  coverage,
  learning,
  goals: initialGoals,
}: Props) {
  const hasInitialOverview =
    Array.isArray(initialGaps) &&
    Array.isArray(assignments) &&
    Array.isArray(matrix) &&
    coverage !== undefined &&
    learning !== undefined &&
    Array.isArray(initialGoals);
  const initialCoverage = coverage ?? { totalRequired: 0, missing: 0, covered: 0 };

  const [filters, setFilters] = useState<Filters>({ timeframe: 180, role: '' });
  const [gaps, setGaps] = useState<SkillGap[]>(initialGaps ?? []);
  const [grid, setGrid] = useState<GapMatrixRow[]>(matrix ?? []);
  const [stats, setStats] = useState<Coverage>(initialCoverage);
  const [assignmentList, setAssignmentList] = useState(assignments ?? []);
  const [learningResources, setLearningResources] = useState<LearningRecommendations>(
    learning ?? {}
  );
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(!hasInitialOverview);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>(() =>
    (initialGoals ?? []).map((goal) => normalizeGoal(goal))
  );
  const [isPending, startTransition] = useTransition();
  const hasLoadedOnce = useRef(false);

  const loadOverview = async () => {
    setInitializing(true);
    setInitialLoadError(null);
    try {
      const response = await fetch('/api/skill-gaps/overview', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Unable to load skill gap overview');
      }
      const data = (await response.json()) as SkillGapOverviewResponse;
      setGaps(data.gaps ?? []);
      setGrid(data.matrix ?? []);
      setStats(data.coverage ?? initialCoverage);
      setAssignmentList(data.assignments ?? []);
      setLearningResources(data.learning ?? {});
      setGoals((data.goals ?? []).map((goal) => normalizeGoal(goal)));
    } catch (error) {
      console.error(error);
      setInitialLoadError('Could not load gap analysis. Please try again.');
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    if (hasInitialOverview) {
      return;
    }
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialOverview]);

  const skillNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    gaps.forEach((gap) => {
      map[gap.skillCode] = gap.skillName;
      if (gap.skillName) {
        map[gap.skillName.toLowerCase()] = gap.skillName;
      }
    });
    return map;
  }, [gaps]);

  const topSkillCode = gaps[0]?.skillCode;

  const refreshGaps = async (currentFilters: Filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        timeframe: String(currentFilters.timeframe),
      });
      if (currentFilters.role) params.set('role', currentFilters.role);

      const res = await fetch(`/api/skill-gaps?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to refresh gaps');
      const data = await res.json();
      setGaps(data.gaps ?? []);
      setGrid(data.matrix ?? []);
      setStats(data.coverage ?? initialCoverage);
      setAssignmentList(data.assignments ?? []);
    } catch (error) {
      console.error(error);
      toast.error('Could not refresh gap analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Only fetch when filters change (skip first render)
  useEffect(() => {
    if (!hasLoadedOnce.current) {
      hasLoadedOnce.current = true;
      return;
    }
    refreshGaps(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.timeframe, filters.role]);

  const handleSaveGoal = (skillCode: string) => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/skill-gaps/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skillCode, targetLevel: 3 }),
        });
        if (!res.ok) throw new Error('Failed to save goal');
        const payload = (await res.json()) as GoalApiResponse;
        const normalizedGoal = payload.goal
          ? normalizeGoal(payload.goal, payload.legacyGoal)
          : null;
        setGoals((prev) => (normalizedGoal ? [normalizedGoal, ...prev] : prev));
        toast.success('Goal saved');
      } catch (error) {
        console.error(error);
        toast.error('Could not save goal');
      }
    });
  };

  const handleCompleteGoal = (id: string) => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/skill-gaps/goals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'completed' }),
        });
        if (!res.ok) throw new Error('Failed to update goal');
        const payload = (await res.json()) as GoalApiResponse;
        const normalizedGoal = payload.goal
          ? normalizeGoal(payload.goal, payload.legacyGoal)
          : null;
        setGoals((prev) => prev.map((g) => (g.id === id ? (normalizedGoal ?? g) : g)));
        toast.success('Goal marked complete');
      } catch (error) {
        console.error(error);
        toast.error('Could not update goal');
      }
    });
  };

  const missingSkillsCount = gaps.filter((gap) => gap.gap > 0).length;

  if (initializing) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Loading gap analysis...
        </CardContent>
      </Card>
    );
  }

  if (initialLoadError) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">{initialLoadError}</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={loadOverview}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-proofound-charcoal dark:text-foreground">
            Skill Gap Analysis
          </h1>
          <p className="text-sm text-muted-foreground">
            Compare your current skills to the assignments you care about and get learning paths.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[30, 90, 180, 365].map((days) => (
            <Button
              key={days}
              variant={filters.timeframe === days ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, timeframe: days }))}
              disabled={loading || initializing}
            >
              Last {days}d
            </Button>
          ))}
          <Input
            placeholder="Filter by role title"
            className="w-48"
            value={filters.role}
            onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
            disabled={loading || initializing}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Missing skills"
          value={String(missingSkillsCount)}
          hint="Gaps where your level is below the requirement"
        />
        <StatCard
          label="Assignments analyzed"
          value={String(assignmentList.length)}
          hint="Assignments you matched or showed interest in"
        />
        <StatCard
          label="Coverage"
          value={
            stats.totalRequired > 0
              ? `${Math.round((stats.covered / stats.totalRequired) * 100)}%`
              : '0%'
          }
          hint={`${stats.covered} of ${stats.totalRequired} requirements covered`}
        />
      </div>

      <Tabs defaultValue="gaps">
        <TabsList>
          <TabsTrigger value="gaps">Top gaps</TabsTrigger>
          <TabsTrigger value="map">Assignments map</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="gaps" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                Refreshing gaps…
              </CardContent>
            </Card>
          ) : gaps.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                No gaps detected for the selected filters.
              </CardContent>
            </Card>
          ) : (
            gaps.map((gap) => {
              const progress = Math.min(
                100,
                gap.targetLevel > 0 ? Math.round((gap.currentLevel / gap.targetLevel) * 100) : 0
              );
              return (
                <Card key={gap.skillCode} className="border-proofound-stone dark:border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{gap.skillName}</CardTitle>
                        <CardDescription>
                          Target L{gap.targetLevel} • You are at L{gap.currentLevel} • Importance{' '}
                          {gap.importance}% • Expected lift {gap.expectedImpact.min}-
                          {gap.expectedImpact.max}%
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={gap.importance >= 80 ? 'destructive' : 'secondary'}>
                          {gap.importance >= 80
                            ? 'Critical'
                            : gap.importance >= 60
                              ? 'High'
                              : 'Medium'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveGoal(gap.skillCode)}
                          disabled={isPending}
                        >
                          Save goal
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={progress} />
                    <div className="flex flex-wrap gap-2">
                      {gap.assignments.map((assignment) => (
                        <Badge key={assignment.id} variant="outline">
                          {assignment.role ?? 'Assignment'} • weight {assignment.weight}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignments × Skills</CardTitle>
              <CardDescription>
                Each row shows required skills per assignment. Red badges are gaps to close.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Requirements</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grid.map((row) => (
                    <TableRow key={row.assignmentId}>
                      <TableCell className="font-medium">{row.role ?? 'Assignment'}</TableCell>
                      <TableCell className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {row.requirements.map((req) => (
                            <Badge
                              key={`${row.assignmentId}-${req.skillCode}`}
                              variant={req.gap > 0 ? 'destructive' : 'secondary'}
                            >
                              {skillNameMap[req.skillCode] ?? req.skillCode} • need L
                              {req.targetLevel}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                Curated courses based on your top gaps. Starts with the most important skills.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LearningRecommendationsList
                resources={learningResources}
                skillNames={skillNameMap}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-3">
          {goals.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                No goals yet. Save a goal from the gap list to track progress.
              </CardContent>
            </Card>
          ) : (
            goals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{goal.title ?? goal.goal}</CardTitle>
                      <CardDescription>
                        Target level {goal.targetLevel ?? 3}
                        {goal.targetDate ? ` • Target date ${goal.targetDate}` : ''}
                      </CardDescription>
                    </div>
                    <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'}>
                      {goal.status ?? 'planned'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Saved for {goal.goal ?? 'skill'} • Next: {goal.nextStep}
                  </div>
                  {goal.status !== 'completed' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCompleteGoal(goal.id)}
                      disabled={isPending}
                    >
                      Mark complete
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {topSkillCode ? (
        <p className="text-xs text-muted-foreground">
          Tip: Focus on{' '}
          <span className="font-medium">{skillNameMap[topSkillCode] ?? topSkillCode}</span> first —
          it has the highest importance score for your target assignments.
        </p>
      ) : null}
    </div>
  );
}
