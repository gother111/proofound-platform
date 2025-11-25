import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf } from 'lucide-react';

interface CausesCardProps {
  causes: string[] | null;
}

export function CausesCard({ causes }: CausesCardProps) {
  if (!causes || causes.length === 0) return null;

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-white to-stone-50 dark:from-stone-950 dark:to-stone-900 overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#5C8B89]" />
      <CardHeader className="pb-3 pt-5">
        <CardTitle className="text-lg flex items-center gap-2 font-display tracking-tight">
          <div className="p-2 rounded-full bg-[#5C8B89]/10 group-hover:bg-[#5C8B89]/20 transition-colors">
            <Leaf className="w-4 h-4 text-[#5C8B89]" />
          </div>
          Causes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {causes.map((cause, index) => (
            <Badge
              key={index}
              variant="outline"
              className="rounded-full px-3 py-1 bg-white dark:bg-stone-900 border-[#5C8B89]/20 text-[#5C8B89] hover:bg-[#5C8B89]/10 transition-colors"
            >
              {cause}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
