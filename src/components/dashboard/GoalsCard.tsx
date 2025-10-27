import { Target, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function GoalsCard() {
  return (
    <Card className="p-4 border border-proofound-stone dark:border-border bg-white dark:bg-card rounded-2xl">
      <h5 className="text-sm font-['Crimson_Pro'] font-medium mb-3 text-proofound-charcoal dark:text-foreground">
        Goals
      </h5>
      <div className="text-center py-6">
        <Target className="w-10 h-10 mx-auto mb-2 text-proofound-stone dark:text-muted-foreground" />
        <p className="text-xs mb-3 text-proofound-charcoal/70 dark:text-muted-foreground">
          Set one meaningful goal for the week.
        </p>
        <Button
          size="sm"
          className="h-7 text-xs bg-proofound-forest hover:bg-proofound-forest/90 text-white rounded-full"
        >
          <Plus className="w-3 h-3 mr-1" />
          Create Goal
        </Button>
      </div>
    </Card>
  );
}
