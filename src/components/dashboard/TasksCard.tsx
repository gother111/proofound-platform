'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MomentumSummary, ReadinessAction } from '@/lib/momentum/types';

interface TasksCardProps {
  persona?: 'individual' | 'organization';
  orgRef?: string;
  initialData?: any;
  onVisibilityChange?: (visible: boolean) => void;
}

const priorityStyles: Record<ReadinessAction['priority'], { bg: string; text: string }> = {
  high: { bg: '#FEE2E2', text: '#B91C1C' },
  medium: { bg: '#FEF3C7', text: '#92400E' },
  low: { bg: '#DBEAFE', text: '#1E40AF' },
};

function getTasksFallbackHref(persona: 'individual' | 'organization', orgRef?: string): string {
  if (persona === 'organization') {
    return orgRef ? `/app/o/${orgRef}/assignments` : '/app/o';
  }

  return '/app/i/profile';
}

export function TasksCard({
  persona = 'individual',
  orgRef,
  initialData,
  onVisibilityChange,
}: TasksCardProps = {}) {
  const [summary, setSummary] = useState<MomentumSummary | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSummary(initialData);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchTasks() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ persona });
        if (orgRef) params.set('org', orgRef);

        const response = await fetch(`/api/momentum/summary?${params.toString()}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const payload = (await response.json()) as MomentumSummary;
        if (mounted) {
          setSummary(payload);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load tasks');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchTasks();
    return () => {
      mounted = false;
    };
  }, [orgRef, persona, initialData]);

  const actions = useMemo(() => summary?.topActions.slice(0, 3) || [], [summary]);

  useEffect(() => {
    if (loading) return;
    onVisibilityChange?.(error ? true : actions.length > 0);
  }, [actions.length, error, loading, onVisibilityChange]);

  const fallbackHref = getTasksFallbackHref(persona, orgRef);

  if (loading) {
    return (
      <Card variant="bento" className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-base font-semibold text-foreground">Tasks</h5>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="bento" className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-base font-semibold text-foreground">Tasks</h5>
        </div>
        <div className="text-center py-6">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </Card>
    );
  }

  if (actions.length === 0) {
    return (
      <Card variant="bento" className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-base font-semibold text-foreground">Tasks</h5>
        </div>
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-sm mb-4 text-muted-foreground">
            No urgent tasks right now. Stay proactive with your next update.
          </p>
          <Link href={fallbackHref}>
            <Button size="sm" variant="secondary" className="rounded-full">
              Open dashboard area
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="bento" className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h5 className="text-base font-semibold text-foreground">Tasks</h5>
          <Badge variant="secondary" className="rounded-full px-2 py-0">
            {actions.length}
          </Badge>
        </div>
      </div>

      <div className="space-y-2.5">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.actionUrl}
            className="block rounded-xl border border-black/[0.04] px-4 py-3 transition-colors hover:bg-black/[0.02] hover:border-black/[0.08] dark:border-white/5 dark:hover:bg-white/5 dark:hover:border-white/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{action.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
              </div>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wide font-semibold"
                style={{
                  backgroundColor: priorityStyles[action.priority].bg,
                  color: priorityStyles[action.priority].text,
                }}
              >
                {action.priority}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-black/[0.04] dark:border-white/5 flex items-center justify-between">
        <p className="text-sm text-muted-foreground truncate pr-2">
          {summary?.summary || 'Stay on top of your highest-value actions.'}
        </p>
        <Link href={fallbackHref}>
          <Button size="sm" variant="ghost" className="rounded-full shrink-0">
            Open
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
