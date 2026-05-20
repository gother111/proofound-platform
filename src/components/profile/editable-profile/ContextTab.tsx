'use client';

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  CheckCircle2,
  FileUp,
  GraduationCap,
  HandHeart,
  Link2,
  Pencil,
  Plus,
  ShieldCheck,
  Target,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStartFromCvBetaStatus } from '@/hooks/useStartFromCvBetaStatus';
import { START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE } from '@/lib/ai/start-from-cv-contract';
import type { StartFromCvScaffoldingSurface } from '@/lib/ai/start-from-cv-contract';
import type { ContextMeasuredOutcome, Education, Experience, Volunteering } from '@/types/profile';
import {
  contextOutcomeClaimLabel,
  contextOutcomeVerificationLabel,
  formatContextOutcomeSummary,
} from '@/lib/profile/context-outcomes';

type StartFromCvDialogProps = {
  surface: StartFromCvScaffoldingSurface;
  onApplyComplete?: () => void;
};

let startFromCvDialogPromise: Promise<{
  StartFromCvDialog: ComponentType<StartFromCvDialogProps>;
}> | null = null;

function loadStartFromCvDialog() {
  startFromCvDialogPromise ??= import('@/components/profile/StartFromCvDialog');
  return startFromCvDialogPromise;
}

function preloadStartFromCvDialog() {
  void loadStartFromCvDialog();
}

function StartFromCvDialogSlot(props: StartFromCvDialogProps) {
  const [StartFromCvDialog, setStartFromCvDialog] =
    useState<ComponentType<StartFromCvDialogProps> | null>(null);

  useEffect(() => {
    let cancelled = false;

    void loadStartFromCvDialog().then((module) => {
      if (!cancelled) {
        setStartFromCvDialog(() => module.StartFromCvDialog);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!StartFromCvDialog) {
    return (
      <div className="rounded-lg border border-proofound-stone/60 p-4 text-sm text-muted-foreground">
        Preparing CV import...
      </div>
    );
  }

  return <StartFromCvDialog {...props} />;
}

type ContextTabProps = {
  experiences: Experience[];
  education: Education[];
  volunteering: Volunteering[];
  onAddExperience: () => void;
  onEditExperience: (experience: Experience) => void;
  onDeleteExperience: (id: string) => void;
  onAddEducation: () => void;
  onEditEducation: (education: Education) => void;
  onDeleteEducation: (id: string) => void;
  onAddVolunteering: () => void;
  onEditVolunteering: (volunteering: Volunteering) => void;
  onDeleteVolunteering: (id: string) => void;
  onImportComplete?: () => void;
  cvScaffoldingSurface?: StartFromCvScaffoldingSurface | null;
};

type ContextGroup = {
  id: 'work' | 'learning' | 'volunteering';
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  count: number;
  addLabel: string;
  onAdd: () => void;
  icon: typeof Briefcase;
};

function compactText(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'not specified') {
    return null;
  }
  return trimmed;
}

function VerificationBadge({ verified }: { verified: boolean | null | undefined }) {
  return verified ? (
    <Badge variant="verified-premium" className="gap-1">
      <CheckCircle2 className="h-3 w-3" />
      Verified
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 bg-white">
      <ShieldCheck className="h-3 w-3" />
      Private context
    </Badge>
  );
}

function ItemActionButtons({
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: {
  editLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button type="button" variant="ghost" size="icon" onClick={onEdit} aria-label={editLabel}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={onDelete} aria-label={deleteLabel}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ContextLinks() {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <Button asChild variant="outline" size="sm" className="h-8">
        <Link href="/app/i/profile?profileView=full&tab=proof_packs">
          <Link2 className="mr-2 h-3.5 w-3.5" />
          Proof Packs
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm" className="h-8">
        <Link href="/app/i/profile?profileView=full&tab=verification">
          <ShieldCheck className="mr-2 h-3.5 w-3.5" />
          Verification
        </Link>
      </Button>
    </div>
  );
}

function ContextOutcomeList({
  outcomes,
  fallback,
}: {
  outcomes?: ContextMeasuredOutcome[];
  fallback?: string | null;
}) {
  if (outcomes && outcomes.length > 0) {
    return (
      <ul className="mt-2 space-y-2 text-sm text-foreground">
        {outcomes.slice(0, 3).map((outcome) => (
          <li key={outcome.id} className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span>{formatContextOutcomeSummary(outcome)}</span>
              <Badge variant="outline" className="bg-white text-[11px]">
                {contextOutcomeClaimLabel(outcome)}
              </Badge>
            </div>
            {outcome.supportingSkills?.length ? (
              <div className="flex flex-wrap gap-1">
                {outcome.supportingSkills.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-1.5 py-0 text-[11px]">
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
    );
  }

  return fallback ? (
    <p className="mt-2 text-sm text-foreground">{fallback}</p>
  ) : (
    <p className="mt-2 text-sm text-muted-foreground">Add one outcome to anchor proof.</p>
  );
}

function WorkContextCard({
  experience,
  onEdit,
  onDelete,
}: {
  experience: Experience;
  onEdit: (experience: Experience) => void;
  onDelete: (id: string) => void;
}) {
  const legacyOutcome = compactText(experience.outcomes);

  const projects =
    experience.projectEntries && experience.projectEntries.length > 0
      ? experience.projectEntries.map((project) => project.name).filter(Boolean)
      : compactText(experience.projects)
        ? [compactText(experience.projects) as string]
        : [];

  return (
    <Card className="border-proofound-stone/60 p-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-proofound-terracotta/10 text-proofound-terracotta">
          <Briefcase className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-semibold text-foreground">{experience.title}</h4>
                <VerificationBadge verified={experience.verified} />
              </div>
              <p className="text-sm text-muted-foreground">
                {[compactText(experience.organizationName), compactText(experience.duration)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {compactText(experience.orgDescription) ? (
                <p className="text-sm text-muted-foreground">
                  {compactText(experience.orgDescription)}
                </p>
              ) : null}
            </div>
            <ItemActionButtons
              editLabel={`Edit ${experience.title}`}
              deleteLabel={`Delete ${experience.title}`}
              onEdit={() => onEdit(experience)}
              onDelete={() => {
                if (confirm('Are you sure you want to delete this experience?')) {
                  onDelete(experience.id);
                }
              }}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-proofound-stone/60 bg-japandi-bg/50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                Measured outcomes
              </p>
              <ContextOutcomeList outcomes={experience.measuredOutcomes} fallback={legacyOutcome} />
            </div>
            <div className="rounded-md border border-proofound-stone/60 bg-white p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Proof scope</p>
              {projects.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {projects.slice(0, 3).map((project) => (
                    <Badge key={project} variant="outline" className="bg-white">
                      {project}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No project scope added yet.</p>
              )}
            </div>
          </div>
          <ContextLinks />
        </div>
      </div>
    </Card>
  );
}

function LearningContextCard({
  education,
  onEdit,
  onDelete,
}: {
  education: Education;
  onEdit: (education: Education) => void;
  onDelete: (id: string) => void;
}) {
  const skills = compactText(education.skills);
  const projects = compactText(education.projects);

  return (
    <Card className="border-proofound-stone/60 p-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-extended-teal/10 text-extended-teal">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-semibold text-foreground">{education.degree}</h4>
                <VerificationBadge verified={education.verified} />
              </div>
              <p className="text-sm text-muted-foreground">
                {[compactText(education.institution), compactText(education.duration)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <ItemActionButtons
              editLabel={`Edit ${education.degree}`}
              deleteLabel={`Delete ${education.degree}`}
              onEdit={() => onEdit(education)}
              onDelete={() => {
                if (confirm('Are you sure you want to delete this education?')) {
                  onDelete(education.id);
                }
              }}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-proofound-stone/60 bg-japandi-bg/50 p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Skills</p>
              <p className="mt-2 text-sm text-foreground">
                {skills ?? 'Attach skills after they are backed by proof or real context.'}
              </p>
            </div>
            <div className="rounded-md border border-proofound-stone/60 bg-white p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Learning output</p>
              <p className="mt-2 text-sm text-foreground">
                {projects ?? 'Add a project, credential, or practical result when available.'}
              </p>
            </div>
            {education.measuredOutcomes?.length ? (
              <div className="rounded-md border border-proofound-stone/60 bg-japandi-bg/50 p-3 md:col-span-2">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                  <Target className="h-3.5 w-3.5" />
                  Measured outcomes
                </p>
                <ContextOutcomeList outcomes={education.measuredOutcomes} />
              </div>
            ) : null}
          </div>
          <ContextLinks />
        </div>
      </div>
    </Card>
  );
}

function VolunteeringContextCard({
  volunteering,
  onEdit,
  onDelete,
}: {
  volunteering: Volunteering;
  onEdit: (volunteering: Volunteering) => void;
  onDelete: (id: string) => void;
}) {
  const impact = compactText(volunteering.impact);
  const skills = compactText(volunteering.skillsDeployed);

  return (
    <Card className="border-proofound-stone/60 p-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-proofound-forest/10 text-proofound-forest">
          <HandHeart className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-semibold text-foreground">{volunteering.title}</h4>
                <VerificationBadge verified={volunteering.verified} />
              </div>
              <p className="text-sm text-muted-foreground">
                {[compactText(volunteering.orgDescription), compactText(volunteering.duration)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {compactText(volunteering.cause) ? (
                <p className="text-sm text-muted-foreground">{compactText(volunteering.cause)}</p>
              ) : null}
            </div>
            <ItemActionButtons
              editLabel={`Edit ${volunteering.title}`}
              deleteLabel={`Delete ${volunteering.title}`}
              onEdit={() => onEdit(volunteering)}
              onDelete={() => {
                if (confirm('Are you sure you want to delete this volunteer work?')) {
                  onDelete(volunteering.id);
                }
              }}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-proofound-stone/60 bg-japandi-bg/50 p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Contribution</p>
              <p className="mt-2 text-sm text-foreground">
                {impact ?? 'Add the contribution or outcome this context supports.'}
              </p>
            </div>
            <div className="rounded-md border border-proofound-stone/60 bg-white p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Skills</p>
              <p className="mt-2 text-sm text-foreground">
                {skills ?? 'Add skills that are visible through this work.'}
              </p>
            </div>
            {volunteering.measuredOutcomes?.length ? (
              <div className="rounded-md border border-proofound-stone/60 bg-japandi-bg/50 p-3 md:col-span-2">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                  <Target className="h-3.5 w-3.5" />
                  Measured outcomes
                </p>
                <ContextOutcomeList outcomes={volunteering.measuredOutcomes} />
              </div>
            ) : null}
          </div>
          <ContextLinks />
        </div>
      </div>
    </Card>
  );
}

function ContextGroupSection({ group, children }: { group: ContextGroup; children: ReactNode }) {
  const Icon = group.icon;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 rounded-lg border border-proofound-stone/60 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-japandi-bg text-proofound-forest">
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">{group.title}</h3>
              <Badge variant="outline" className="bg-white">
                {group.count} {group.count === 1 ? 'item' : 'items'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{group.description}</p>
          </div>
        </div>
        <Button type="button" size="sm" onClick={group.onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {group.addLabel}
        </Button>
      </div>
      {group.count > 0 ? (
        <div className="space-y-3">{children}</div>
      ) : (
        <div className="rounded-lg border border-dashed border-proofound-stone/80 bg-japandi-bg/40 p-5">
          <p className="text-sm font-medium text-foreground">{group.emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{group.emptyDescription}</p>
        </div>
      )}
    </section>
  );
}

export function ContextTab({
  experiences,
  education,
  volunteering,
  onAddExperience,
  onEditExperience,
  onDeleteExperience,
  onAddEducation,
  onEditEducation,
  onDeleteEducation,
  onAddVolunteering,
  onEditVolunteering,
  onDeleteVolunteering,
  onImportComplete,
  cvScaffoldingSurface = null,
}: ContextTabProps) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const startFromCvStatus = useStartFromCvBetaStatus();
  const startFromCvEnabled =
    startFromCvStatus.visible &&
    startFromCvStatus.available &&
    cvScaffoldingSurface === START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE;
  const openImport = () => {
    preloadStartFromCvDialog();
    setIsImportOpen(true);
  };
  const totalContextCount = experiences.length + education.length + volunteering.length;
  const verifiedContextCount = [...experiences, ...education, ...volunteering].filter(
    (item) => item.verified
  ).length;
  const measuredOutcomeCount =
    experiences.reduce(
      (count, experience) =>
        count + (experience.measuredOutcomes?.length ?? (compactText(experience.outcomes) ? 1 : 0)),
      0
    ) +
    education.reduce((count, item) => count + (item.measuredOutcomes?.length ?? 0), 0) +
    volunteering.reduce((count, item) => count + (item.measuredOutcomes?.length ?? 0), 0);
  const groups = useMemo<ContextGroup[]>(
    () => [
      {
        id: 'work',
        title: 'Work',
        description: 'Private delivery context, outcomes, and project scope for work-backed proof.',
        emptyTitle: 'Add one work context when your proof comes from paid or client work.',
        emptyDescription: 'Keep it short: where it happened, what you owned, and one outcome.',
        count: experiences.length,
        addLabel: 'Add work',
        onAdd: onAddExperience,
        icon: Briefcase,
      },
      {
        id: 'volunteering',
        title: 'Volunteering',
        description: 'Community or unpaid contribution context that can still anchor real proof.',
        emptyTitle: 'Add volunteering context when contribution is the clearest anchor.',
        emptyDescription: 'Capture contribution, skills used, and the result without padding.',
        count: volunteering.length,
        addLabel: 'Add volunteering',
        onAdd: onAddVolunteering,
        icon: HandHeart,
      },
      {
        id: 'learning',
        title: 'Education / learning',
        description:
          'Formal or informal learning context tied to skills, projects, and proof scope.',
        emptyTitle:
          'Add learning context when a course, program, or credential explains the proof.',
        emptyDescription:
          'Use this for practical learning outputs, not generic credential padding.',
        count: education.length,
        addLabel: 'Add learning',
        onAdd: onAddEducation,
        icon: GraduationCap,
      },
    ],
    [
      education.length,
      experiences.length,
      onAddEducation,
      onAddExperience,
      onAddVolunteering,
      volunteering.length,
    ]
  );

  return (
    <TabsContent value="context" className="space-y-6">
      <Card className="border-proofound-stone/60 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-proofound-forest/10 p-2 text-proofound-forest">
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Context</h3>
              <p className="text-sm text-muted-foreground">
                Context stays private by default. Use it as scaffolding for Proof Packs, summaries,
                matching explanations, and scoped verification.
              </p>
            </div>
          </div>
          {startFromCvEnabled ? (
            <Button
              type="button"
              variant="outline"
              onFocus={preloadStartFromCvDialog}
              onMouseEnter={preloadStartFromCvDialog}
              onClick={openImport}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Start from CV
            </Button>
          ) : null}
        </div>
      </Card>

      {startFromCvEnabled ? (
        <Card className="border-proofound-forest/20 bg-proofound-forest/5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Start from your CV</p>
              <p className="text-sm text-muted-foreground">
                Upload your CV to create private editable drafts. Nothing is published, verified,
                scored, ranked, or shown to organizations unless you choose what to keep later.
              </p>
            </div>
            <Button
              type="button"
              className="shrink-0 bg-proofound-forest hover:bg-proofound-forest/90"
              onFocus={preloadStartFromCvDialog}
              onMouseEnter={preloadStartFromCvDialog}
              onClick={openImport}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Start from CV
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-proofound-stone/60 bg-white p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Private contexts</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{totalContextCount}</p>
        </div>
        <div className="rounded-lg border border-proofound-stone/60 bg-white p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Measured outcomes</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{measuredOutcomeCount}</p>
        </div>
        <div className="rounded-lg border border-proofound-stone/60 bg-white p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Verification state</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{verifiedContextCount}</p>
        </div>
      </div>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Start from your CV</DialogTitle>
            <DialogDescription>
              Review private drafts before using anything as proof scaffolding.
            </DialogDescription>
          </DialogHeader>
          <StartFromCvDialogSlot
            surface={cvScaffoldingSurface ?? START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE}
            onApplyComplete={() => {
              setIsImportOpen(false);
              onImportComplete?.();
            }}
          />
        </DialogContent>
      </Dialog>

      <div className="space-y-5">
        {groups.map((group) => (
          <ContextGroupSection key={group.id} group={group}>
            {group.id === 'work'
              ? experiences.map((experience) => (
                  <WorkContextCard
                    key={experience.id}
                    experience={experience}
                    onEdit={onEditExperience}
                    onDelete={onDeleteExperience}
                  />
                ))
              : null}
            {group.id === 'volunteering'
              ? volunteering.map((item) => (
                  <VolunteeringContextCard
                    key={item.id}
                    volunteering={item}
                    onEdit={onEditVolunteering}
                    onDelete={onDeleteVolunteering}
                  />
                ))
              : null}
            {group.id === 'learning'
              ? education.map((item) => (
                  <LearningContextCard
                    key={item.id}
                    education={item}
                    onEdit={onEditEducation}
                    onDelete={onDeleteEducation}
                  />
                ))
              : null}
          </ContextGroupSection>
        ))}
      </div>
    </TabsContent>
  );
}
