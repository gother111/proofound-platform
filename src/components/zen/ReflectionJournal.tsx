'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Calendar, Download, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';

interface Reflection {
  id: string;
  reflectionText: string;
  milestoneType?: 'rejection' | 'interview' | 'offer';
  createdAt: string;
}

export function ReflectionJournal() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchReflections();
  }, []);

  const fetchReflections = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/wellbeing/reflections');
      if (response.ok) {
        const data = await response.json();
        setReflections(data.reflections || []);
      }
    } catch (error) {
      console.error('Failed to fetch reflections', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleExport = () => {
    try {
      const content = reflections
        .map(
          (r) =>
            `Date: ${format(new Date(r.createdAt), 'PPpp')}\nMilestone: ${
              r.milestoneType || 'None'
            }\n\n${r.reflectionText}\n\n-------------------\n`
        )
        .join('\n');

      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reflections-export-${format(new Date(), 'yyyy-MM-dd')}.txt`;
      link.click();
      toast.success('Reflections exported successfully');
    } catch (error) {
      toast.error('Failed to export reflections');
    }
  };

  if (isLoading) {
    return <div className="text-center py-10 text-muted-foreground">Loading journal...</div>;
  }

  if (reflections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white/50 dark:bg-black/20 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
        <div className="bg-[#7A9278]/10 p-4 rounded-full mb-4">
          <BookOpen className="h-8 w-8 text-[#7A9278]" />
        </div>
        <h3 className="text-lg font-medium text-[#2D3330] dark:text-[#E8E6DD]">
          Your Journal is Empty
        </h3>
        <p className="text-sm text-[#6B6760] dark:text-[#C9C2B8] max-w-xs mt-2">
          Reflections help you process your journey. Start by writing your first entry using the
          button above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport} className="text-xs">
          <Download className="mr-2 h-3 w-3" /> Export Journal
        </Button>
      </div>

      <div className="space-y-4">
        {reflections.map((reflection) => {
          const isExpanded = expandedIds.has(reflection.id);
          const date = new Date(reflection.createdAt);

          return (
            <Card
              key={reflection.id}
              className="overflow-hidden border border-[#E8E6DD] dark:border-[#3C332C] bg-white dark:bg-[#2F2823]"
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F7F6F1] dark:hover:bg-[#3A332E] transition-colors"
                onClick={() => toggleExpand(reflection.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(reflection.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Collapse reflection' : 'Expand reflection'}
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center min-w-[60px] border-r border-[#E8E6DD] dark:border-[#3C332C] pr-4">
                    <span className="text-2xl font-bold text-[#1C4D3A] dark:text-[#E2EDD9]">
                      {format(date, 'dd')}
                    </span>
                    <span className="text-xs uppercase font-medium text-[#6B6760] dark:text-[#C9C2B8]">
                      {format(date, 'MMM')}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#2D3330] dark:text-[#E8E6DD]">
                        {format(date, 'h:mm a')}
                      </span>
                      {reflection.milestoneType && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-[#EEF1EA] text-[#1C4D3A] dark:bg-[#3F473B] dark:text-[#D8E8D0]"
                        >
                          {reflection.milestoneType}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#6B6760] dark:text-[#C9C2B8] line-clamp-1">
                      {reflection.reflectionText}
                    </p>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6B6760]">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {isExpanded && (
                <div className="p-4 pt-0 animate-in slide-in-from-top-2">
                  <div className="mt-2 p-4 bg-[#FDFCFA] dark:bg-[#2A2520] rounded-lg text-sm leading-relaxed text-[#2D3330] dark:text-[#E8E6DD] whitespace-pre-wrap font-serif">
                    {reflection.reflectionText}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
