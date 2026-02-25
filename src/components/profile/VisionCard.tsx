import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PurposeLinks } from '@/types/profile';
import { Eye } from 'lucide-react';

interface VisionCardProps {
  vision: string | null;
  visionLinks?: PurposeLinks;
}

export function VisionCard({ vision, visionLinks }: VisionCardProps) {
  if (!vision) return null;

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-white to-stone-50 dark:from-stone-950 dark:to-stone-900 overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#7A9278]" />
      <CardHeader className="pb-3 pt-5">
        <CardTitle className="text-lg flex items-center gap-2 font-display tracking-tight">
          <div className="p-2 rounded-full bg-[#7A9278]/10 group-hover:bg-[#7A9278]/20 transition-colors">
            <Eye className="w-4 h-4 text-[#7A9278]" />
          </div>
          Vision
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed font-medium">{vision}</p>
        {!!visionLinks && (visionLinks.values.length > 0 || visionLinks.causes.length > 0) && (
          <div className="space-y-2">
            {visionLinks.values.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {visionLinks.values.map((value) => (
                  <Badge key={`vision-value-${value}`} variant="outline" className="text-xs">
                    Value: {value}
                  </Badge>
                ))}
              </div>
            )}
            {visionLinks.causes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {visionLinks.causes.map((cause) => (
                  <Badge key={`vision-cause-${cause}`} variant="outline" className="text-xs">
                    Cause: {cause}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
