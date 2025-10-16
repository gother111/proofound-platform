import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface MissionCardProps {
  mission: string | null;
}

export function MissionCard({ mission }: MissionCardProps) {
  if (!mission) return null;

  return (
    <Card className="border-2 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5" style={{ color: 'rgb(122, 146, 120)' }} />
          Mission
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{mission}</p>
      </CardContent>
    </Card>
  );
}
