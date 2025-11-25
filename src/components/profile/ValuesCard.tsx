import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="border-0 shadow-md bg-gradient-to-br from-white to-stone-50 dark:from-stone-950 dark:to-stone-900 overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#C67B5C]" />
      <CardHeader className="pb-3 pt-5">
        <CardTitle className="text-lg flex items-center gap-2 font-display tracking-tight">
          <div className="p-2 rounded-full bg-[#C67B5C]/10 group-hover:bg-[#C67B5C]/20 transition-colors">
            <Sparkles className="w-4 h-4 text-[#C67B5C]" />
          </div>
          Core Values
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {values.map((value, index) => {
            const IconComponent = iconMap[value.icon] || Heart;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 hover:border-[#C67B5C]/30 transition-colors shadow-sm"
              >
                <div className="p-1.5 rounded-md bg-[#C67B5C]/10 text-[#C67B5C]">
                  <IconComponent className="w-3.5 h-3.5 flex-shrink-0" />
                </div>
                <span className="text-sm font-medium flex-1 text-stone-700 dark:text-stone-300">
                  {value.label}
                </span>
                {value.verified && (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#7A9278]" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
