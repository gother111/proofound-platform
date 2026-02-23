'use client';

import { AssignmentTemplatePayload } from '@/lib/templates/prefill';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export type AssignmentTemplate = {
  id: string;
  name: string;
  roleFamily: string;
  summary?: string | null;
  description?: string | null;
  appliesToSteps: string[];
  presetPayload: AssignmentTemplatePayload;
  recommendedBuilderMode?: 'basic' | 'advanced';
  isGlobal: boolean;
  status: string;
};

type TemplatePickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: AssignmentTemplate[];
  isLoading?: boolean;
  onApply: (template: AssignmentTemplate) => void;
  appliedTemplateId?: string | null;
};

function roleFamilyLabel(family: string) {
  const map: Record<string, string> = {
    software_engineering: 'Software Engineering',
    product_management: 'Product Management',
    design: 'Design',
  };
  return map[family] || family;
}

function resolveRecommendedMode(template: AssignmentTemplate): 'basic' | 'advanced' {
  if (template.recommendedBuilderMode) {
    return template.recommendedBuilderMode;
  }

  const advancedMarkers = ['weights', 'weight-matrix', 'stakeholders', 'step-3'];
  return template.appliesToSteps.some((step) => advancedMarkers.includes(step))
    ? 'advanced'
    : 'basic';
}

function TemplatePreview({ payload }: { payload?: AssignmentTemplatePayload }) {
  if (!payload) return null;
  const outcomes = payload.outcomes || [];
  const mustHave = payload.mustHaveSkills || [];

  return (
    <div className="space-y-3 text-sm text-muted-foreground">
      {payload.businessValue && (
        <div>
          <p className="font-medium text-foreground">Business value</p>
          <p>{payload.businessValue}</p>
        </div>
      )}
      {outcomes.length > 0 && (
        <div>
          <p className="font-medium text-foreground">Top outcomes</p>
          <ul className="list-disc list-inside">
            {outcomes.slice(0, 3).map((outcome, idx) => (
              <li key={idx}>
                {outcome.metric} → {outcome.target} ({outcome.timeframe})
              </li>
            ))}
          </ul>
        </div>
      )}
      {mustHave.length > 0 && (
        <div>
          <p className="font-medium text-foreground">Core skills</p>
          <div className="flex flex-wrap gap-2">
            {mustHave.slice(0, 5).map((skill) => (
              <Badge key={skill.id} variant="secondary">
                {skill.label || skill.id}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TemplatePicker({
  open,
  onOpenChange,
  templates,
  isLoading,
  onApply,
  appliedTemplateId,
}: TemplatePickerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Load a template</SheetTitle>
          <SheetDescription>
            Pick a role-family preset to prefill the 5-step assignment builder.
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <div className="space-y-3">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {!isLoading && templates.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No templates yet. Create your first preset to speed up future assignments.
            </p>
          )}

          <ScrollArea className="h-[60vh] pr-3">
            <div className="space-y-3">
              {templates.map((template) => {
                const recommendedMode = resolveRecommendedMode(template);
                return (
                  <Card key={template.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{template.name}</p>
                          <Badge variant={template.isGlobal ? 'default' : 'outline'}>
                            {template.isGlobal ? 'Global' : 'Org'}
                          </Badge>
                          <Badge variant="secondary">{roleFamilyLabel(template.roleFamily)}</Badge>
                          <Badge variant="outline">
                            {recommendedMode === 'basic'
                              ? 'Basic mode recommended'
                              : 'Advanced mode recommended'}
                          </Badge>
                        </div>
                        {template.summary && (
                          <p className="text-sm text-muted-foreground">{template.summary}</p>
                        )}
                      </div>
                      <Button
                        onClick={() => onApply(template)}
                        variant="default"
                        disabled={template.status !== 'active'}
                      >
                        {appliedTemplateId === template.id ? 'Applied' : 'Apply'}
                      </Button>
                    </div>

                    <TemplatePreview payload={template.presetPayload} />
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
