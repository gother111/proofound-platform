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
  onVisibilityChange,
}: TasksCardProps = {}) {
  const [summary, setSummary] = useState<MomentumSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
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
  }, [orgRef, persona]);

  const actions = useMemo(() => summary?.topActions.slice(0, 3) || [], [summary]);

  useEffect(() => {
    if (loading) return;
    onVisibilityChange?.(error ? true : actions.length > 0);
  }, [actions.length, error, loading, onVisibilityChange]);

  const fallbackHref = getTasksFallbackHref(persona, orgRef);

  if (loading) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Tasks
          </h5>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1C4D3A' }} />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Tasks
          </h5>
        </div>
        <div className="text-center py-4">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#DC2626' }} />
          <p className="text-xs" style={{ color: '#6B6760' }}>
            {error}
          </p>
        </div>
      </Card>
    );
  }

  if (actions.length === 0) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Tasks
          </h5>
        </div>
        <div className="text-center py-6">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2" style={{ color: '#1C4D3A' }} />
          <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
            No urgent tasks right now. Stay proactive with your next update.
          </p>
          <Link href={fallbackHref}>
            <Button
              size="sm"
              className="h-7 text-xs"
              style={{
                backgroundColor: isHovered ? '#2D5F4A' : '#1C4D3A',
                color: '#F7F6F1',
                transition: 'background-color 200ms',
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              Open dashboard area
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Tasks
          </h5>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0"
            style={{ backgroundColor: '#D8EDE4', color: '#1C4D3A' }}
          >
            {actions.length}
          </Badge>
        </div>
      </div>

      <div className="space-y-2.5">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.actionUrl}
            className="block rounded-lg border border-[#E8E6DD] px-3 py-2 hover:border-[#1C4D3A] hover:bg-[#F7F6F1]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#2D3330] truncate">{action.title}</p>
                <p className="text-xs text-[#6B6760] mt-1">{action.description}</p>
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

      <div
        className="mt-4 pt-3 border-t flex items-center justify-between"
        style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
      >
        <p className="text-xs text-[#6B6760] truncate pr-2">
          {summary?.summary || 'Stay on top of your highest-value actions.'}
        </p>
        <Link href={fallbackHref}>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            style={{ color: '#1C4D3A' }}
          >
            Open
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
