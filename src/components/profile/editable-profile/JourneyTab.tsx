'use client';

import type { Experience } from '@/types/profile';

import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Briefcase, CheckCircle2, Lightbulb, Plus, TrendingUp, X } from 'lucide-react';

export interface JourneyTabProps {
  experiences: Experience[];
  onAddExperience: () => void;
  onDeleteExperience: (id: string) => void;
}

export function JourneyTab({ experiences, onAddExperience, onDeleteExperience }: JourneyTabProps) {
  return (
    <TabsContent value="journey" className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">My professional growth and learning journey</p>
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
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#C67B5C]/10 to-[#D4A574]/10 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-20 h-20">
                  <path
                    d="M 20 70 Q 35 40, 50 50 T 80 30"
                    fill="none"
                    stroke="#C67B5C"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <circle cx="20" cy="70" r="5" fill="#C67B5C" />
                  <circle cx="50" cy="50" r="5" fill="#D4A574" />
                  <circle cx="80" cy="30" r="5" fill="#7A9278" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Map Your Journey</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Share your professional experiences. Focus on what you learned, how you grew, and
                the skills you developed along the way.
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
              <p>💡 Tip: Emphasize personal growth over job titles and responsibilities</p>
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
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                if (confirm('Are you sure you want to delete this experience?')) {
                  onDeleteExperience(exp.id);
                }
              }}
            >
              <X className="w-4 h-4" />
            </Button>
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
                      <Lightbulb className="w-3 h-3" />
                      What I Learned
                    </h5>
                    <p className="text-sm">{exp.learning}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      How I Grew
                    </h5>
                    <p className="text-sm">{exp.growth}</p>
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
