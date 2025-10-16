import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Wrench } from 'lucide-react';

interface Skill {
  name: string;
  verified: boolean;
}

interface SkillsCardProps {
  skills: string[] | Skill[] | null;
}

export function SkillsCard({ skills }: SkillsCardProps) {
  if (!skills || skills.length === 0) return null;

  // Handle both string[] and Skill[] formats
  const skillsArray: Skill[] = skills.map((skill) =>
    typeof skill === 'string' ? { name: skill, verified: false } : skill
  );

  return (
    <Card className="border-2 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wrench className="w-5 h-5" style={{ color: 'rgb(212, 165, 116)' }} />
          Skills
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {skillsArray.map((skill, index) => (
            <Badge
              key={index}
              variant="outline"
              className="rounded-full px-3 py-1 flex items-center gap-1"
              style={{
                backgroundColor: 'rgba(212, 165, 116, 0.1)',
                borderColor: 'rgba(212, 165, 116, 0.3)',
                color: 'rgb(212, 165, 116)',
              }}
            >
              {skill.name}
              {skill.verified && (
                <CheckCircle2 className="w-3 h-3" style={{ color: 'rgb(122, 146, 120)' }} />
              )}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
