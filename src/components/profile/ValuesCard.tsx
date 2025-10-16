import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Sparkles,
  Users,
  CheckCircle2,
  Eye,
  Target,
  Shield,
  Leaf,
  Lightbulb,
  HandHeart,
} from 'lucide-react';

interface Value {
  icon: string;
  label: string;
  verified: boolean;
}

interface ValuesCardProps {
  values: Value[] | null;
}

const iconMap: Record<string, any> = {
  Heart,
  Sparkles,
  Users,
  Eye,
  Target,
  Shield,
  Leaf,
  Lightbulb,
  HandHeart,
};

export function ValuesCard({ values }: ValuesCardProps) {
  if (!values || values.length === 0) return null;

  return (
    <Card className="border-2 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Core Values</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {values.map((value, index) => {
            const IconComponent = iconMap[value.icon] || Heart;
            return (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                <IconComponent
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: 'rgb(198, 123, 92)' }}
                />
                <span className="text-sm flex-1">{value.label}</span>
                {value.verified && (
                  <CheckCircle2
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: 'rgb(122, 146, 120)' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
