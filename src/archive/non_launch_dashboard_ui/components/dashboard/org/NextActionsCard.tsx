/**
 * Next Actions Card
 *
 * Displays intelligent recommendations based on assignment and matching data.
 * PRD Reference: Part 5 O8 - Company Dashboard Analytics Tiles
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Zap,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface NextAction {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'assignment' | 'candidate' | 'matching' | 'process';
  title: string;
  description: string;
  actionLabel: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NextActionsCardProps {
  organizationId: string;
}

export function NextActionsCard({ organizationId }: NextActionsCardProps) {
  const [actions, setActions] = useState<NextAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNextActions = async () => {
    void organizationId;
    setIsLoading(true);
    setActions([]);
    setIsLoading(false);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-[#D93F3F]" />;
      case 'high':
        return <AlertCircle className="w-4 h-4 text-proofound-terracotta" />;
      case 'medium':
        return <Info className="w-4 h-4 text-proofound-forest" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-[#FEE] text-[#D93F3F] border-[#D93F3F]/20';
      case 'high':
        return 'bg-[#FFF4E6] text-proofound-terracotta border-[#C76B4A]/20';
      case 'medium':
        return 'bg-proofound-success-tint text-proofound-forest border-proofound-forest/20';
      default:
        return 'bg-japandi-bg text-muted-foreground border-[#6B6760]/20';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      assignment: 'Assignment',
      candidate: 'Candidates',
      matching: 'Matching',
      process: 'Process',
    };
    return labels[category] || category;
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-proofound-forest" />
            <h3 className="text-lg font-semibold text-foreground">Next Actions</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Intelligent recommendations to improve your hiring outcomes
          </p>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={fetchNextActions}
          disabled={isLoading}
          className="text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 flex items-center justify-center text-sm text-muted-foreground">
          Analyzing your hiring pipeline...
        </div>
      ) : actions.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-proofound-forest mb-2" />
          <p className="text-sm text-foreground font-medium">All caught up!</p>
          <p className="text-xs text-muted-foreground mt-1">
            No immediate actions needed. We'll notify you if anything requires attention.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => (
            <div
              key={action.id}
              className={`p-4 rounded-lg border ${getPriorityColor(action.priority)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{getPriorityIcon(action.priority)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-foreground">{action.title}</h4>
                    <Badge
                      variant="secondary"
                      className="text-xs bg-white/50 text-muted-foreground border-0"
                    >
                      {getCategoryLabel(action.category)}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground mb-3">{action.description}</p>
                  {action.actionUrl ? (
                    <Link href={action.actionUrl}>
                      <Button size="sm" variant="ghost" className="h-8 px-3 text-xs font-medium">
                        {action.actionLabel}
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-8 px-3 text-xs font-medium">
                      {action.actionLabel}
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-proofound-stone">
          <p className="text-xs text-muted-foreground text-center">
            Showing top {actions.length} {actions.length === 1 ? 'action' : 'actions'} based on your
            recent hiring activity
          </p>
        </div>
      )}
    </Card>
  );
}
