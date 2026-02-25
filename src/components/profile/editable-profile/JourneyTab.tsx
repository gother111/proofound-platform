'use client';

import type { Experience } from '@/types/profile';

import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  CheckCircle2,
  FolderOpen,
  Pencil,
  Plus,
  Target,
  Trophy,
  Users,
  X,
} from 'lucide-react';

export interface JourneyTabProps {
  experiences: Experience[];
  onAddExperience: () => void;
  onEditExperience: (experience: Experience) => void;
  onDeleteExperience: (id: string) => void;
}

export function JourneyTab({
  experiences,
  onAddExperience,
  onEditExperience,
  onDeleteExperience,
}: JourneyTabProps) {
  return (
    <TabsContent value="journey" className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          My professional outcomes, projects, and achievements
        </p>
        {experiences.length > 0 && (
          <Button
            size="sm"
            className="rounded-full bg-[#7A9278] hover:bg-[#7A9278]/90"
            onClick={onAddExperience}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        )}
      </div>

      {experiences.length === 0 ? (
        <Card className="p-12 border-2 border-dashed border-muted-foreground/20">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#C67B5C]/5 to-[#D4A574]/10 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-20 h-20">
                  <path
                    d="M 15 75 Q 35 55 50 65 T 85 35"
                    fill="none"
                    stroke="#C67B5C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 30 85 L 30 40 M 70 85 L 70 50"
                    fill="none"
                    stroke="#D4A574"
                    strokeWidth="1.5"
                    opacity="0.5"
                    strokeDasharray="2 4"
                  />
                  <circle cx="85" cy="35" r="3" fill="#C67B5C" />
                  <circle cx="15" cy="75" r="3" fill="#7A9278" />
                  <circle
                    cx="70"
                    cy="20"
                    r="8"
                    fill="none"
                    stroke="#7A9278"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Map Your Journey</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Share your professional experiences with outcomes, key projects, collaboration
                context, and achievements.
              </p>
            </div>
            <Button
              className="rounded-full bg-[#C67B5C] hover:bg-[#C67B5C]/90"
              onClick={onAddExperience}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Experience
            </Button>
            <div className="pt-4 text-xs text-muted-foreground">
              <p>💡 Tip: Emphasize outcomes and teamwork over generic responsibility lists</p>
            </div>
          </div>
        </Card>
      ) : (
        experiences.map((exp) => (
          <Card
            key={exp.id}
            className="p-6 border-2 hover:border-[#C67B5C]/30 hover:shadow-md transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#C67B5C] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditExperience(exp)}
                aria-label={`Edit ${exp.title}`}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this experience?')) {
                    onDeleteExperience(exp.id);
                  }
                }}
                aria-label={`Delete ${exp.title}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-[#C67B5C]" />
              </div>
              <div className="flex-1 pr-8">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-display font-semibold">{exp.title}</h4>
                  {exp.verified && <CheckCircle2 className="w-4 h-4 text-[#7A9278]" />}
                </div>
                <p className="text-sm text-muted-foreground mb-1">{exp.orgDescription}</p>
                <p className="text-xs text-muted-foreground mb-4">{exp.duration}</p>
                <div className="space-y-3">
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Outcomes
                    </h5>
                    <p className="text-sm">{exp.outcomes}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <FolderOpen className="w-3 h-3" />
                      Projects
                    </h5>
                    <p className="text-sm">{exp.projects}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Colleagues
                    </h5>
                    <p className="text-sm">{exp.colleagues}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Achievements
                    </h5>
                    <p className="text-sm">{exp.achievements}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </TabsContent>
  );
}
