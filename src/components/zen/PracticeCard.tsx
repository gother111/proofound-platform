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
    <Card className="group relative flex flex-col justify-between overflow-hidden border border-[#E8E6DD] bg-white p-5 transition-all hover:border-[#1C4D3A] hover:shadow-md dark:border-[#3C332C] dark:bg-[#2F2823]">
      <div>
        <div className="flex items-start justify-between mb-3">
          <Badge
            variant="outline"
            className="bg-[#F7F6F1] text-[#1C4D3A] border-[#1C4D3A]/20 dark:bg-[#3A332E] dark:text-[#CBE5CA]"
          >
            {practice.style}
          </Badge>
          <span className="flex items-center text-xs font-medium text-[#6B6760] dark:text-[#C9C2B8]">
            <Clock className="mr-1 h-3 w-3" />
            {practice.duration}
          </span>
        </div>

        <h3 className="mb-2 font-serif text-xl font-medium text-[#2D3330] group-hover:text-[#1C4D3A] dark:text-[#E8E6DD] dark:group-hover:text-[#CBE5CA]">
          {practice.title}
        </h3>

        <p className="mb-4 text-sm text-[#6B6760] dark:text-[#C9C2B8] line-clamp-2">
          {practice.whatToExpect}
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-[#EEF1EA] px-2 py-0.5 text-xs font-medium text-[#1C4D3A] dark:bg-[#3F473B] dark:text-[#D8E8D0]">
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
        className="w-full bg-[#F7F6F1] text-[#1C4D3A] hover:bg-[#1C4D3A] hover:text-white transition-colors dark:bg-[#3A332E] dark:text-[#E8E6DD] dark:hover:bg-[#CBE5CA] dark:hover:text-[#1C4D3A]"
        variant="ghost"
      >
        <Play className="mr-2 h-4 w-4" />
        Start Practice
      </Button>
    </Card>
  );
}
