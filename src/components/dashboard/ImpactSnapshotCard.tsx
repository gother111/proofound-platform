import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function ImpactSnapshotCard() {
  return (
    <Card className="p-4 border border-proofound-stone dark:border-border bg-white dark:bg-card rounded-2xl">
      <h5 className="text-sm font-['Crimson_Pro'] font-medium mb-3 text-proofound-charcoal dark:text-foreground">
        Impact
      </h5>
      <div className="text-center py-6">
        <TrendingUp className="w-10 h-10 mx-auto mb-2 text-proofound-stone dark:text-muted-foreground" />
        <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground">
          Track your impact as you grow.
        </p>
      </div>
    </Card>
  );
}
