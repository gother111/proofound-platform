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
  Stale: 'bg-proofound-ochre/20 text-[#8B6F47] border-proofound-ochre/30',
  'Low Credibility':
    'bg-proofound-terracotta/20 text-proofound-terracotta border-proofound-terracotta/30',
  Unverified: 'bg-proofound-teal/20 text-proofound-teal border-proofound-teal/30',
};

const REASON_ICONS: Record<string, any> = {
  Stale: RefreshCcw,
  'Low Credibility': FileQuestion,
  Unverified: CheckCircle2,
};

export function NextBestActions({ actions, onActionClick }: NextBestActionsProps) {
  // Empty state - all good!
  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center p-6">
        <PartyPopper className="w-12 h-12 text-proofound-forest mb-3" />
        <p className="text-lg font-semibold font-display text-proofound-forest">
          All skills are up to date!
        </p>
        <p className="text-sm text-muted-foreground mt-1 font-sans">
          Great job maintaining your Expertise Atlas
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold font-display text-proofound-charcoal">
          Next Best Actions
        </h3>
        <Badge
          variant="secondary"
          className="bg-proofound-parchment text-proofound-charcoal border-proofound-stone"
        >
          {actions.length} pending
        </Badge>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {actions.map((action, index) => {
          const Icon = REASON_ICONS[action.reason] || FileQuestion;
          const colorClass = REASON_COLORS[action.reason] || REASON_COLORS['Low Credibility'];

          return (
            <div
              key={`${action.skillId}-${index}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-proofound-stone bg-white hover:border-proofound-forest/30 hover:shadow-sm transition-all duration-200"
            >
              <div className={`p-2 rounded-lg ${colorClass.split(' ')[0]}`}>
                <Icon className={`w-5 h-5 ${colorClass.split(' ')[1]}`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-proofound-charcoal font-display">
                  {action.skillName}
                </p>
                <p className="text-xs text-muted-foreground font-sans">{action.action}</p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onActionClick(action.skillId)}
                className="flex-shrink-0 border-proofound-stone hover:bg-proofound-parchment text-proofound-charcoal font-medium"
              >
                Take Action
              </Button>
            </div>
          );
        })}
      </div>

      {actions.length >= 10 && (
        <p className="text-xs text-muted-foreground text-center mt-4 font-sans">
          Showing top 10 actions • Fix these to unlock more suggestions
        </p>
      )}
    </div>
  );
}
