import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';

interface VisionCardProps {
  vision: string | null;
}

export function VisionCard({ vision }: VisionCardProps) {
  if (!vision) return null;

  return (
    <Card className="border-2 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="w-5 h-5" style={{ color: 'rgb(122, 146, 120)' }} />
          Vision
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{vision}</p>
      </CardContent>
    </Card>
  );
}
