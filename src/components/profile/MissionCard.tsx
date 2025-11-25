import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface MissionCardProps {
  mission: string | null;
}

export function MissionCard({ mission }: MissionCardProps) {
  if (!mission) return null;

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-white to-stone-50 dark:from-stone-950 dark:to-stone-900 overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#7A9278]" />
      <CardHeader className="pb-3 pt-5">
        <CardTitle className="text-lg flex items-center gap-2 font-display tracking-tight">
          <div className="p-2 rounded-full bg-[#7A9278]/10 group-hover:bg-[#7A9278]/20 transition-colors">
            <Target className="w-4 h-4 text-[#7A9278]" />
          </div>
          Mission
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed font-medium">{mission}</p>
      </CardContent>
    </Card>
  );
}
