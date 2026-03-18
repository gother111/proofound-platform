'use client';

import type { Education } from '@/types/profile';

import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CheckCircle2, GraduationCap, Pencil, Plus, X } from 'lucide-react';

export interface LearningTabProps {
  education: Education[];
  onAddEducation: () => void;
  onEditEducation: (education: Education) => void;
  onDeleteEducation: (id: string) => void;
}

export function LearningSection({
  education,
  onAddEducation,
  onEditEducation,
  onDeleteEducation,
}: LearningTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Learning context that explains where your skills or proof were built.
        </p>
        {education.length > 0 && (
          <Button
            size="sm"
            className="rounded-full bg-[#7A9278] hover:bg-[#7A9278]/90"
            onClick={onAddEducation}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add learning context
          </Button>
        )}
      </div>

      {education.length === 0 ? (
        <Card className="p-12 border-2 border-dashed border-muted-foreground/20">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#5C8B89]/5 to-[#7A9278]/10 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-20 h-20">
                  <path
                    d="M 50 80 V 30 M 50 80 Q 30 90 15 75 V 25 Q 30 40 50 30 M 50 80 Q 70 90 85 75 V 25 Q 70 40 50 30"
                    fill="none"
                    stroke="#5C8B89"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="50" cy="20" r="4" fill="#7A9278" opacity="0.8" />
                  <path
                    d="M 40 10 A 15 15 0 0 1 60 10"
                    fill="none"
                    stroke="#D4A574"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Add learning context</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Capture formal education or serious learning that gives your proof real-world
                context.
              </p>
            </div>
            <Button
              className="rounded-full bg-[#5C8B89] hover:bg-[#5C8B89]/90"
              onClick={onAddEducation}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add learning context
            </Button>
            <div className="pt-4 text-xs text-muted-foreground">
              <p>
                Tip: Add the course, program, or learning environment that best anchors your proof.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        education.map((edu) => (
          <Card
            key={edu.id}
            className="p-6 border-2 hover:border-[#5C8B89]/30 hover:shadow-md transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#5C8B89] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditEducation(edu)}
                aria-label={`Edit ${edu.degree}`}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this education?')) {
                    onDeleteEducation(edu.id);
                  }
                }}
                aria-label={`Delete ${edu.degree}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-[#5C8B89]" />
              </div>
              <div className="flex-1 pr-8">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-display font-semibold">{edu.degree}</h4>
                  {edu.verified && <CheckCircle2 className="w-4 h-4 text-[#7A9278]" />}
                </div>
                <p className="text-sm text-muted-foreground mb-1">{edu.institution}</p>
                <p className="text-xs text-muted-foreground mb-4">{edu.duration}</p>
                <div className="space-y-3">
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">
                      Skills Gained
                    </h5>
                    <p className="text-sm">{edu.skills}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">
                      Meaningful Projects
                    </h5>
                    <p className="text-sm">{edu.projects}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

export function LearningTab(props: LearningTabProps) {
  return (
    <TabsContent value="learning" className="space-y-6">
      <LearningSection {...props} />
    </TabsContent>
  );
}
