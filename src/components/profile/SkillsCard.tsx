import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Wrench, ArrowRight, Sparkles } from 'lucide-react';

interface Skill {
  name: string;
  verified: boolean;
}

interface SkillsCardProps {
  skills: string[] | Skill[] | null;
  showManageLink?: boolean;
}

export function SkillsCard({ skills, showManageLink = true }: SkillsCardProps) {
  // Handle both string[] and Skill[] formats
  const skillsArray: Skill[] = (skills || []).map((skill) =>
    typeof skill === 'string' ? { name: skill, verified: false } : skill
  );

  // Empty state with link to the launch MVP proof surface
  if (skillsArray.length === 0) {
    return (
      <Card className="border-0 shadow-md bg-gradient-to-br from-white to-stone-50 dark:from-stone-950 dark:to-stone-900 overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#D4A574]" />
        <CardHeader className="pb-3 pt-5">
          <CardTitle className="text-lg flex items-center gap-2 font-display tracking-tight">
            <div className="p-2 rounded-full bg-[#D4A574]/10 group-hover:bg-[#D4A574]/20 transition-colors">
              <Wrench className="w-4 h-4 text-[#D4A574]" />
            </div>
            Skills & Expertise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[#D4A574]/5 to-[#7A9278]/10 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-8 h-8">
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="none"
                  stroke="#D4A574"
                  strokeWidth="2"
                  strokeDasharray="4 6"
                  opacity="0.8"
                />
                <path
                  d="M 50 30 L 50 70 M 30 50 L 70 50"
                  stroke="#7A9278"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="50" cy="50" r="6" fill="#D4A574" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">
              Strengthen your public portfolio with proof-backed examples of your work
            </p>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/app/i/profile?profileView=full&tab=visibility">
                Review portfolio visibility
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-white to-stone-50 dark:from-stone-950 dark:to-stone-900 overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#D4A574]" />
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 font-display tracking-tight">
            <div className="p-2 rounded-full bg-[#D4A574]/10 group-hover:bg-[#D4A574]/20 transition-colors">
              <Wrench className="w-4 h-4 text-[#D4A574]" />
            </div>
            Skills
          </CardTitle>
          {showManageLink && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <Link href="/app/i/profile?profileView=full&tab=proof_packs">
                Review public portfolio
                <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {skillsArray.map((skill, index) => (
            <Badge
              key={index}
              variant="outline"
              className="rounded-full px-3 py-1 flex items-center gap-1 bg-white dark:bg-stone-900 border-[#D4A574]/20 text-[#D4A574] hover:bg-[#D4A574]/10 transition-colors"
            >
              {skill.name}
              {skill.verified && <CheckCircle2 className="w-3 h-3 text-[#7A9278]" />}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
