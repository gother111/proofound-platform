import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MatchingResultsCardProps {
  className?: string;
  basePath?: string; // '/app/i' or '/o/[slug]'
}

export function MatchingResultsCard({ className, basePath = '/app/i' }: MatchingResultsCardProps) {
  return (
    <Card
      className={`p-4 border ${className || ''}`}
      style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
    >
      <h5 className="text-sm font-medium mb-3" style={{ color: '#2D3330' }}>
        Matches
      </h5>
      <div className="text-center py-6">
        <Sparkles className="w-10 h-10 mx-auto mb-2 text-muted" />
        <p className="text-xs mb-3 text-muted-foreground">
          Turn on matching to discover aligned people and projects.
        </p>
        <Link href={`${basePath}/matching`}>
          <Button size="sm" className="h-7 text-xs">
            Open preferences
          </Button>
        </Link>
      </div>
    </Card>
  );
}
