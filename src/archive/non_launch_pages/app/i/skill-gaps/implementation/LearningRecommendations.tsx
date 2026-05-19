'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LearningRecommendations, LearningResource } from '@/lib/learning/types';

type Props = {
  resources: LearningRecommendations;
  skillNames: Record<string, string>;
};

const ResourceCard = ({ resource }: { resource: LearningResource }) => (
  <Card className="border-proofound-stone dark:border-border">
    <CardHeader>
      <div className="flex items-center justify-between gap-3">
        <CardTitle className="text-base">{resource.title}</CardTitle>
        <Badge variant="secondary" className="capitalize">
          {resource.provider}
        </Badge>
      </div>
      <CardDescription className="text-xs text-muted-foreground">
        Matches: {resource.skillMatch}
        {resource.level ? ` • Level: ${resource.level}` : ''}
        {resource.duration ? ` • ${resource.duration}` : ''}
      </CardDescription>
    </CardHeader>
    <CardContent className="flex items-center justify-between">
      <div className="flex flex-wrap gap-2">
        {resource.badges?.map((badge) => (
          <Badge key={badge} variant="outline">
            {badge}
          </Badge>
        ))}
        {resource.rating ? <Badge variant="outline">⭐ {resource.rating.toFixed(1)}</Badge> : null}
        {resource.price ? <Badge variant="outline">{resource.price}</Badge> : null}
      </div>
      <Button size="sm" variant="outline" asChild>
        <a href={resource.url} target="_blank" rel="noreferrer">
          Open
        </a>
      </Button>
    </CardContent>
  </Card>
);

export function LearningRecommendationsList({ resources, skillNames }: Props) {
  const entries = Object.entries(resources || {}).filter(([, items]) => items && items.length > 0);

  if (entries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-sm text-muted-foreground">
          No learning recommendations yet. Add a target role or refresh gaps to see suggestions.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map(([skill, list]) => (
        <div key={skill} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Skill</Badge>
              <span className="font-medium text-proofound-charcoal dark:text-foreground">
                {skillNames[skill] ?? skill}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{list.length} courses</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((item) => (
              <ResourceCard key={item.id} resource={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
