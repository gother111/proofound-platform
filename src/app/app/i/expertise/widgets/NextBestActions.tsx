'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileQuestion, CheckCircle2, RefreshCcw, PartyPopper } from 'lucide-react';

interface NextBestActionsProps {
  actions: Array<{
    skillId: string;
    skillName: string;
    action: string;
    reason: string;
    priority: number;
  }>;
  onActionClick: (skillId: string) => void;
}

const REASON_COLORS: Record<string, string> = {
  'Stale': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  'Low Credibility': 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  'Unverified': 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
};

const REASON_ICONS: Record<string, any> = {
  'Stale': RefreshCcw,
  'Low Credibility': FileQuestion,
  'Unverified': CheckCircle2,
};

export function NextBestActions({ actions, onActionClick }: NextBestActionsProps) {
  // Empty state - all good!
  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center p-6">
        <PartyPopper className="w-12 h-12 text-green-500 mb-3" />
        <p className="text-lg font-semibold text-green-700 dark:text-green-400">
          All skills are up to date!
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Great job maintaining your Expertise Atlas
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Next Best Actions</h3>
        <Badge variant="secondary">{actions.length} pending</Badge>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {actions.map((action, index) => {
          const Icon = REASON_ICONS[action.reason] || FileQuestion;
          const colorClass = REASON_COLORS[action.reason] || REASON_COLORS['Low Credibility'];

          return (
            <div
              key={`${action.skillId}-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{action.skillName}</p>
                <p className="text-xs text-muted-foreground">{action.action}</p>
              </div>

              <Badge className={`flex-shrink-0 ${colorClass}`}>
                {action.reason}
              </Badge>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onActionClick(action.skillId)}
                className="flex-shrink-0"
              >
                Take Action
              </Button>
            </div>
          );
        })}
      </div>

      {actions.length >= 10 && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          Showing top 10 actions • Fix these to unlock more suggestions
        </p>
      )}
    </div>
  );
}

