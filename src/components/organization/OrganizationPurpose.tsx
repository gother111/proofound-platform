import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PurposeLinks } from '@/types/profile';
import { Target, Users, Sparkles } from 'lucide-react';

interface OrganizationPurposeProps {
  mission?: string;
  vision?: string;
  missionLinks?: PurposeLinks;
  visionLinks?: PurposeLinks;
  culture?: any;
}

function PurposeLinksGroup({ links }: { links?: PurposeLinks }) {
  if (!links || (links.values.length === 0 && links.causes.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-2 mt-3">
      {links.values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.values.map((value) => (
            <Badge key={`org-link-value-${value}`} variant="outline" className="text-xs">
              Value: {value}
            </Badge>
          ))}
        </div>
      )}
      {links.causes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.causes.map((cause) => (
            <Badge key={`org-link-cause-${cause}`} variant="outline" className="text-xs">
              Cause: {cause}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrganizationPurpose({
  mission,
  vision,
  missionLinks,
  visionLinks,
  culture,
}: OrganizationPurposeProps) {
  if (!mission && !vision && !culture) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card className="border-0 shadow-md bg-gradient-to-br from-white to-proofound-parchment dark:from-stone-900 dark:to-stone-950 overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-proofound-forest" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl text-proofound-forest">
            <Target className="w-5 h-5" />
            Our Purpose
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {mission && (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Mission
              </h4>
              <p className="text-lg font-display italic text-proofound-charcoal dark:text-foreground leading-relaxed">
                &ldquo;{mission}&rdquo;
              </p>
              <PurposeLinksGroup links={missionLinks} />
            </div>
          )}
          {vision && (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Vision
              </h4>
              <p className="text-base text-muted-foreground leading-relaxed">{vision}</p>
              <PurposeLinksGroup links={visionLinks} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md bg-white dark:bg-stone-900 overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-proofound-terracotta" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl text-proofound-terracotta">
            <Users className="w-5 h-5" />
            Culture & Values
          </CardTitle>
        </CardHeader>
        <CardContent>
          {culture ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">How we work and what we value.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-proofound-terracotta/10 text-proofound-terracotta text-sm font-medium">
                  Remote-first
                </span>
                <span className="px-3 py-1 rounded-full bg-proofound-terracotta/10 text-proofound-terracotta text-sm font-medium">
                  Async
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
              <Sparkles className="w-8 h-8 mb-2 opacity-20" />
              <p>Culture details not yet added.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
