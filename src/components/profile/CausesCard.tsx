import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf } from 'lucide-react';

interface CausesCardProps {
  causes: string[] | null;
}

export function CausesCard({ causes }: CausesCardProps) {
  if (!causes || causes.length === 0) return null;

  return (
    <Card className="border-2 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Leaf className="w-5 h-5" style={{ color: 'rgb(92, 139, 137)' }} />
          Causes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {causes.map((cause, index) => (
            <Badge
              key={index}
              variant="outline"
              className="rounded-full px-3 py-1"
              style={{
                backgroundColor: 'rgba(92, 139, 137, 0.1)',
                borderColor: 'rgba(92, 139, 137, 0.3)',
                color: 'rgb(92, 139, 137)',
              }}
            >
              {cause}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
