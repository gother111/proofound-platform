'use client';

import type { ImpactStory } from '@/types/profile';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, Plus, X } from 'lucide-react';
import { getTaxonomyLabel, CAUSES_TAXONOMY } from '@/lib/taxonomy/data';

export interface ImpactTabProps {
  impactStories: ImpactStory[];
  onAddStory: () => void;
  onDeleteStory: (id: string) => void;
  actionsDisabled: boolean;
}

export function ImpactTab({
  impactStories,
  onAddStory,
  onDeleteStory,
  actionsDisabled,
}: ImpactTabProps) {
  const getTimelineLabel = (story: ImpactStory) => {
    const timeline = story.timelineStructured;
    if (!timeline) return story.timeline;
    if (timeline.mode === 'single') return timeline.start;
    if (timeline.ongoing) return `${timeline.start} - Present`;
    return timeline.end ? `${timeline.start} - ${timeline.end}` : timeline.start;
  };

  const getRoleScopeLabel = (scope?: string | null) => {
    if (scope === 'owned') return 'Owned';
    if (scope === 'co_led') return 'Co-led';
    if (scope === 'contributed') return 'Contributed';
    return null;
  };

  const getCauseLabels = (story: ImpactStory) => {
    const keys = [story.primaryCause, ...(story.secondaryCauses || [])].filter(Boolean) as string[];
    return keys.map((key) => getTaxonomyLabel(key, CAUSES_TAXONOMY));
  };

  return (
    <TabsContent value="impact" className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Projects and initiatives with verified impact
        </p>
        {!!impactStories.length && (
          <Button
            size="sm"
            className="rounded-full bg-[#7A9278] hover:bg-[#7A9278]/90"
            onClick={onAddStory}
            disabled={actionsDisabled}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Story
          </Button>
        )}
      </div>

      {impactStories.length === 0 ? (
        <Card className="p-12 border-2 border-dashed border-muted-foreground/20">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#7A9278]/5 to-[#5C8B89]/10 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-20 h-20">
                  <circle cx="50" cy="50" r="15" fill="none" stroke="#7A9278" strokeWidth="1.5" />
                  <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill="none"
                    stroke="#5C8B89"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                    opacity="0.7"
                  />
                  <path
                    d="M 50 10 V 25 M 50 75 V 90 M 10 50 H 25 M 75 50 H 90"
                    fill="none"
                    stroke="#D4A574"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                  <circle cx="50" cy="50" r="4" fill="#7A9278" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Share Your Impact Stories</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Highlight the meaningful work you&apos;ve done. Focus on the change created, lives
                touched, and value delivered—not just tasks completed.
              </p>
            </div>
            <Button
              className="rounded-full bg-[#7A9278] hover:bg-[#7A9278]/90"
              onClick={onAddStory}
              disabled={actionsDisabled}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Impact Story
            </Button>
            <div className="pt-4 text-xs text-muted-foreground">
              <p>
                💡 Tip: Include context about the organization, your role, and measurable outcomes
              </p>
            </div>
          </div>
        </Card>
      ) : (
        impactStories.map((story) => (
          <Card
            key={story.id}
            className="p-6 border-2 hover:border-[#7A9278]/30 hover:shadow-md transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#7A9278] opacity-0 group-hover:opacity-100 transition-opacity" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                if (confirm('Are you sure you want to delete this impact story?')) {
                  onDeleteStory(story.id);
                }
              }}
              disabled={actionsDisabled}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="flex items-start justify-between mb-4 pr-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xl font-display font-semibold">{story.title}</h3>
                  {story.verified && (
                    <Badge
                      variant="outline"
                      className="gap-1 bg-[#7A9278]/10 border-[#7A9278]/30 text-[#7A9278]"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-1">{story.orgDescription}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {getTimelineLabel(story)}
                </p>
                {(story.roleTitle || story.roleScope) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {story.roleTitle || 'Contributor'}
                    {story.roleScope ? ` • ${getRoleScopeLabel(story.roleScope)}` : ''}
                  </p>
                )}
                {getCauseLabels(story).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getCauseLabels(story).map((cause) => (
                      <Badge key={`${story.id}-${cause}`} variant="outline" className="text-xs">
                        {cause}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Impact</h4>
                <p className="text-sm">{story.impact}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Business Value</h4>
                <p className="text-sm">{story.businessValue}</p>
              </div>
              <div className="p-4 bg-muted/20 rounded-xl">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Outcomes</h4>
                {story.measuredOutcomes && story.measuredOutcomes.length > 0 ? (
                  <ul className="space-y-2">
                    {story.measuredOutcomes.map((outcome) => (
                      <li key={outcome.id} className="text-sm">
                        <span className="font-medium">{outcome.label}:</span> {outcome.value}{' '}
                        {outcome.unit}
                        <span className="text-muted-foreground">
                          {' '}
                          ({outcome.valueMode}, {outcome.timeframe})
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm">{story.outcomes}</p>
                )}
              </div>

              {story.supportingArtifacts && story.supportingArtifacts.length > 0 && (
                <div className="p-4 bg-muted/10 rounded-xl">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Supporting Artifacts
                  </h4>
                  <ul className="space-y-1">
                    {story.supportingArtifacts.map((artifact) => (
                      <li key={artifact.id} className="text-sm">
                        <a
                          href={artifact.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#1C4D3A] underline underline-offset-2"
                        >
                          {artifact.title}
                        </a>{' '}
                        <span className="text-muted-foreground">({artifact.kind})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {story.saveWarning && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                  {story.saveWarning}
                </p>
              )}

              {story.verificationWarning && story.verificationWarning !== story.saveWarning && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                  {story.verificationWarning}
                </p>
              )}
            </div>
          </Card>
        ))
      )}
    </TabsContent>
  );
}
