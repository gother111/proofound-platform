import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MatchingResultsCardProps {
  className?: string;
  basePath?: string; // '/app/i' or '/app/o/[slug]'
}

export function MatchingResultsCard({ className, basePath = '/app/i' }: MatchingResultsCardProps) {
  return (
    <Card
      className={`p-4 border border-proofound-stone dark:border-border bg-white dark:bg-card rounded-2xl ${className || ''}`}
    >
      <h5 className="text-sm font-['Crimson_Pro'] font-medium mb-3 text-proofound-charcoal dark:text-foreground">
        Matches
      </h5>
      <div className="text-center py-6">
        <Sparkles className="w-10 h-10 mx-auto mb-2 text-proofound-stone dark:text-muted-foreground" />
        <p className="text-xs mb-3 text-proofound-charcoal/70 dark:text-muted-foreground">
          Turn on matching to discover aligned people and projects.
        </p>
        <Link href={`${basePath}/matching`}>
          <Button
            size="sm"
            className="h-7 text-xs bg-proofound-forest hover:bg-proofound-forest/90 text-white rounded-full"
          >
            Open preferences
          </Button>
        </Link>
      </div>
    </Card>
  );
}
