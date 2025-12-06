import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  tips: string[];
  isLoading?: boolean;
};

export function PrepTipsList({ tips, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!tips || tips.length === 0) {
    return (
      <Card className="p-4 bg-white/70 dark:bg-[#1f1c19] border border-dashed border-[#E8E6DD] text-sm text-[#6B6760]">
        No tips available yet. Start a session to see contextual prep guidance.
      </Card>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {tips.map((tip, idx) => (
        <AccordionItem
          key={idx}
          value={`tip-${idx}`}
          className="border border-[#E8E6DD] dark:border-[#3C332C] rounded-lg px-3"
        >
          <AccordionTrigger className="text-left text-sm font-medium text-[#2D3330] dark:text-[#E8E6DD]">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Tip {idx + 1}
              </Badge>
              <span className="text-sm">
                {tip.slice(0, 60)}
                {tip.length > 60 ? '…' : ''}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-[#4D4A45] dark:text-[#C9C2B8] leading-relaxed pb-3">
            {tip}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
