'use client';

import type { Volunteering } from '@/types/profile';

import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, HandHeart, Pencil, Plus, Target, X } from 'lucide-react';
import {
  contextOutcomeClaimLabel,
  contextOutcomeVerificationLabel,
  formatContextOutcomeSummary,
} from '@/lib/profile/context-outcomes';

export interface ServiceTabProps {
  volunteering: Volunteering[];
  onAddService: () => void;
  onEditService: (volunteering: Volunteering) => void;
  onDeleteService: (id: string) => void;
}

export function ServiceSection({
  volunteering,
  onAddService,
  onEditService,
  onDeleteService,
}: ServiceTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Volunteering context that shows contribution, ownership, and real-world relevance.
        </p>
        {volunteering.length > 0 && (
          <Button
            size="sm"
            className="rounded-full bg-[#7A9278] hover:bg-[#7A9278]/90"
            onClick={onAddService}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add volunteering context
          </Button>
        )}
      </div>

      {volunteering.length === 0 ? (
        <Card className="p-12 border-2 border-dashed border-muted-foreground/20">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#C67B5C]/5 to-[#7A9278]/10 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-20 h-20">
                  <path
                    d="M 20 60 Q 35 75 50 60 T 80 60"
                    fill="none"
                    stroke="#C67B5C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 30 40 Q 45 25 60 40 T 90 40"
                    fill="none"
                    stroke="#7A9278"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="25"
                    fill="none"
                    stroke="#D4A574"
                    strokeWidth="1"
                    strokeDasharray="3 5"
                  />
                  <circle cx="50" cy="50" r="6" fill="#C67B5C" opacity="0.6" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Add volunteering context</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Capture the community or volunteering work that gives your proof stronger context
                and credibility.
              </p>
            </div>
            <Button
              className="rounded-full bg-[#C67B5C] hover:bg-[#C67B5C]/90"
              onClick={onAddService}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add volunteering context
            </Button>
            <div className="pt-4 text-xs text-muted-foreground">
              <p>Tip: Focus on one concrete contribution that your proof can point back to.</p>
            </div>
          </div>
        </Card>
      ) : (
        volunteering.map((vol) => (
          <Card
            key={vol.id}
            className="p-6 border-2 hover:border-[#C67B5C]/30 hover:shadow-md transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#C67B5C] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditService(vol)}
                aria-label={`Edit ${vol.title}`}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this volunteer work?')) {
                    onDeleteService(vol.id);
                  }
                }}
                aria-label={`Delete ${vol.title}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
                <HandHeart className="w-5 h-5 text-[#C67B5C]" />
              </div>
              <div className="flex-1 pr-8">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-display font-semibold">{vol.title}</h4>
                  {vol.verified && <CheckCircle2 className="w-4 h-4 text-[#7A9278]" />}
                </div>
                <p className="text-sm text-muted-foreground mb-1">{vol.orgDescription}</p>
                <p className="text-xs text-muted-foreground mb-4">{vol.duration}</p>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-[#C67B5C]/5 border-[#C67B5C]/20">
                    <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <HandHeart className="w-3 h-3 text-[#C67B5C]" />
                      Personal Connection
                    </h5>
                    <p className="text-sm mb-2 font-medium">{vol.cause}</p>
                    <p className="text-xs text-muted-foreground italic">{vol.personalWhy}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">Impact Made</h5>
                    <p className="text-sm">{vol.impact}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">
                      Skills Deployed
                    </h5>
                    <p className="text-sm">{vol.skillsDeployed}</p>
                  </div>
                  {vol.measuredOutcomes?.length ? (
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Measured outcomes
                      </h5>
                      <ul className="space-y-2">
                        {vol.measuredOutcomes.map((outcome) => (
                          <li key={outcome.id} className="space-y-1 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">
                                {formatContextOutcomeSummary(outcome)}
                              </span>
                              <Badge variant="outline" className="bg-white text-[11px]">
                                {contextOutcomeClaimLabel(outcome)}
                              </Badge>
                            </div>
                            {outcome.supportingSkills?.length ? (
                              <div className="flex flex-wrap gap-1">
                                {outcome.supportingSkills.slice(0, 3).map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="px-1.5 py-0 text-[11px]"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                            <p className="text-xs text-muted-foreground">
                              {outcome.proofPackTitle
                                ? `Linked to ${outcome.proofPackTitle}. ${contextOutcomeVerificationLabel(outcome)}.`
                                : contextOutcomeVerificationLabel(outcome)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

export function ServiceTab(props: ServiceTabProps) {
  return (
    <TabsContent value="service" className="space-y-6">
      <ServiceSection {...props} />
    </TabsContent>
  );
}
