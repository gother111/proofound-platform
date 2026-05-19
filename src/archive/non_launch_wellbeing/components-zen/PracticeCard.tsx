'use client';

import { ZenPractice } from '@/data/zen';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Sparkles, Play, Zap } from 'lucide-react';

interface PracticeCardProps {
  practice: ZenPractice;
  onStart: () => void;
}

export function PracticeCard({ practice, onStart }: PracticeCardProps) {
  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden border border-proofound-stone bg-white p-5 transition-all hover:border-proofound-forest hover:shadow-md dark:border-[#3C332C] dark:bg-[#2F2823]">
      <div>
        <div className="flex items-start justify-between mb-3">
          <Badge
            variant="outline"
            className="bg-japandi-bg text-proofound-forest border-proofound-forest/20 dark:bg-[#3A332E] dark:text-[#CBE5CA]"
          >
            {practice.style}
          </Badge>
          <span className="flex items-center text-xs font-medium text-muted-foreground dark:text-[#C9C2B8]">
            <Clock className="mr-1 h-3 w-3" />
            {practice.duration}
          </span>
        </div>

        <h3 className="mb-2 font-serif text-xl font-medium text-foreground group-hover:text-proofound-forest dark:text-[#E8E6DD] dark:group-hover:text-[#CBE5CA]">
          {practice.title}
        </h3>

        <p className="mb-4 text-sm text-muted-foreground dark:text-[#C9C2B8] line-clamp-2">
          {practice.whatToExpect}
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-proofound-forest/5 px-2 py-0.5 text-xs font-medium text-proofound-forest dark:bg-[#3F473B] dark:text-[#D8E8D0]">
            <Sparkles className="mr-1 h-3 w-3" />
            {practice.benefit}
          </span>
          {practice.evidenceType && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
              <Zap className="mr-1 h-3 w-3" />
              {practice.evidenceType.replace('-', ' ')}
            </span>
          )}
        </div>
      </div>

      <Button
        onClick={onStart}
        className="w-full bg-japandi-bg text-proofound-forest hover:bg-proofound-forest hover:text-white transition-colors dark:bg-[#3A332E] dark:text-[#E8E6DD] dark:hover:bg-[#CBE5CA] dark:hover:text-proofound-forest"
        variant="ghost"
      >
        <Play className="mr-2 h-4 w-4" />
        Start Practice
      </Button>
    </Card>
  );
}
