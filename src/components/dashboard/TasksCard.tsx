import { Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function TasksCard() {
  return (
    <Card className="p-4 border border-proofound-stone dark:border-border bg-white dark:bg-card rounded-2xl">
      <h5 className="text-sm font-['Crimson_Pro'] font-medium mb-3 text-proofound-charcoal dark:text-foreground">
        Tasks
      </h5>
      <div className="text-center py-6">
        <Shield className="w-10 h-10 mx-auto mb-2 text-proofound-stone dark:text-muted-foreground" />
        <p className="text-xs mb-3 text-proofound-charcoal/70 dark:text-muted-foreground">
          Build trust through verification.
        </p>
        <Button
          size="sm"
          className="h-7 text-xs bg-proofound-forest hover:bg-proofound-forest/90 text-white rounded-full"
        >
          Start
        </Button>
      </div>
    </Card>
  );
}
