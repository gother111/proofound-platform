import Image from 'next/image';
import { Globe, GraduationCap, MapPin, Sparkles, Briefcase, Target } from 'lucide-react';
import { PublicProfileSection } from '@/components/public-profile/PublicProfileSection';
import { PublicProfileShell } from '@/components/public-profile/PublicProfileShell';
import type { PublicSnippetViewModel } from '@/lib/profile/public-snippet';

type PublicSnippetViewProps = {
  viewModel: PublicSnippetViewModel;
  compact?: boolean;
};

function themeWrapper(theme: PublicSnippetViewModel['theme']): string {
  if (theme === 'dark') {
    return 'bg-[#1E2421]';
  }
  return 'bg-japandi-bg';
}

export function PublicSnippetView({ viewModel, compact = false }: PublicSnippetViewProps) {
  if (viewModel.redacted) {
    return (
      <PublicProfileShell compact={compact} maxWidthClassName={compact ? 'max-w-2xl' : 'max-w-4xl'}>
        <PublicProfileSection title="Public profile status">
          <p className="text-sm font-semibold text-foreground">Profile is currently hidden</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The owner enabled privacy mode and this public snapshot is unavailable right now.
          </p>
        </PublicProfileSection>
      </PublicProfileShell>
    );
  }

  const skills = compact ? viewModel.skills.slice(0, 4) : viewModel.skills;
  const experiences = compact ? viewModel.experiences.slice(0, 2) : viewModel.experiences;
  const education = compact ? viewModel.education.slice(0, 2) : viewModel.education;
  const impactEntries = compact ? viewModel.impactEntries.slice(0, 2) : viewModel.impactEntries;
  const causes = compact ? viewModel.causes.slice(0, 4) : viewModel.causes;
  const values = compact ? viewModel.values.slice(0, 4) : viewModel.values;
  const culture = compact
    ? viewModel.workCultureHighlights.slice(0, 4)
    : viewModel.workCultureHighlights;

  return (
    <PublicProfileShell
      compact={compact}
      className={themeWrapper(viewModel.theme)}
      maxWidthClassName={compact ? 'max-w-3xl' : 'max-w-5xl'}
      header={
        <div className="space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-foreground">{viewModel.title}</h1>
                <span className="rounded-full border border-[#D9D5CC] bg-japandi-bg px-2.5 py-1 text-xs capitalize text-foreground">
                  {viewModel.profileType}
                </span>
              </div>
              {viewModel.subtitle ? (
                <p className="text-sm text-muted-foreground">{viewModel.subtitle}</p>
              ) : null}
            </div>
            {viewModel.avatarImage ? (
              <Image
                src={viewModel.avatarImage}
                alt={`${viewModel.title} avatar`}
                width={64}
                height={64}
                sizes="64px"
                unoptimized
                className="h-16 w-16 rounded-xl border border-proofound-stone object-cover"
              />
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {viewModel.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {viewModel.location}
              </span>
            ) : null}
            {viewModel.website ? (
              <a
                href={viewModel.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-proofound-forest"
              >
                <Globe className="h-3.5 w-3.5" />
                Website
              </a>
            ) : null}
            {viewModel.foundedYear ? <span>Founded {viewModel.foundedYear}</span> : null}
            {viewModel.typeLabel ? <span className="capitalize">{viewModel.typeLabel}</span> : null}
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <span>proofound Public Profile template</span>
          <span>Shared link view</span>
        </div>
      }
    >
      {!viewModel.hasVisibleFields ? (
        <PublicProfileSection title="Public visibility">
          <p className="text-sm font-medium text-foreground">
            Nothing is publicly visible in this shared profile yet.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            The owner can enable more sections from profile sharing settings.
          </p>
        </PublicProfileSection>
      ) : (
        <div className="space-y-4">
          {viewModel.about ? (
            <PublicProfileSection title="Profile narrative">
              <p className="whitespace-pre-line text-sm leading-6 text-foreground">
                {viewModel.about}
              </p>
            </PublicProfileSection>
          ) : null}

          {skills.length > 0 || experiences.length > 0 || education.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {skills.length > 0 ? (
                <PublicProfileSection
                  title="Skills snapshot"
                  right={<Sparkles className="h-4 w-4 text-muted-foreground" />}
                >
                  <div className="space-y-2">
                    {skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between text-sm text-foreground"
                      >
                        <span>{skill.name}</span>
                        {typeof skill.level === 'number' ? (
                          <span className="rounded-full border border-[#D9D5CC] bg-japandi-bg px-2 py-0.5 text-xs">
                            L{skill.level}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </PublicProfileSection>
              ) : null}

              {experiences.length > 0 ? (
                <PublicProfileSection
                  title="Experience"
                  right={<Briefcase className="h-4 w-4 text-muted-foreground" />}
                >
                  <div className="space-y-2.5">
                    {experiences.map((entry) => (
                      <div key={entry.id} className="text-sm">
                        <p className="font-medium text-foreground">{entry.title}</p>
                        {entry.orgDescription ? (
                          <p className="text-muted-foreground">{entry.orgDescription}</p>
                        ) : null}
                        {entry.duration ? (
                          <p className="text-xs text-muted-foreground">{entry.duration}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </PublicProfileSection>
              ) : null}

              {education.length > 0 ? (
                <PublicProfileSection
                  title="Education"
                  right={<GraduationCap className="h-4 w-4 text-muted-foreground" />}
                >
                  <div className="space-y-2.5">
                    {education.map((entry) => (
                      <div key={entry.id} className="text-sm">
                        <p className="font-medium text-foreground">{entry.degree}</p>
                        <p className="text-muted-foreground">{entry.institution}</p>
                        {entry.duration ? (
                          <p className="text-xs text-muted-foreground">{entry.duration}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </PublicProfileSection>
              ) : null}
            </div>
          ) : null}

          {values.length > 0 || causes.length > 0 || culture.length > 0 ? (
            <PublicProfileSection title="Values, causes, and culture">
              <div className="space-y-3">
                {values.length > 0 ? (
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      Values
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {values.map((value) => (
                        <span
                          key={value}
                          className="rounded-full border border-[#D9D5CC] bg-japandi-bg px-2.5 py-1 text-xs text-foreground"
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {causes.length > 0 ? (
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      Causes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {causes.map((cause) => (
                        <span
                          key={cause}
                          className="rounded-full border border-[#D9D5CC] bg-japandi-bg px-2.5 py-1 text-xs text-foreground"
                        >
                          {cause}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {culture.length > 0 ? (
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      Work culture
                    </p>
                    <div className="space-y-1">
                      {culture.map((item) => (
                        <p key={item} className="text-sm capitalize text-foreground">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </PublicProfileSection>
          ) : null}

          {impactEntries.length > 0 ? (
            <PublicProfileSection
              title="Impact"
              right={<Target className="h-4 w-4 text-muted-foreground" />}
            >
              <div className="space-y-3">
                {impactEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="space-y-1.5 border-b border-proofound-stone pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-foreground">{entry.title}</p>
                      {entry.timeframe ? (
                        <p className="text-xs text-muted-foreground">{entry.timeframe}</p>
                      ) : null}
                    </div>
                    {entry.description ? (
                      <p className="text-sm text-foreground">{entry.description}</p>
                    ) : null}
                    {entry.metrics.length > 0 ? (
                      <div className="grid gap-2 sm:grid-cols-3">
                        {entry.metrics.map((metric) => (
                          <div
                            key={`${entry.id}-${metric.name}`}
                            className="rounded-md border border-proofound-stone bg-white px-2.5 py-2"
                          >
                            <p className="text-xs text-muted-foreground">{metric.name}</p>
                            <p className="text-sm font-medium text-foreground">
                              {metric.value}
                              {metric.unit ? ` ${metric.unit}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </PublicProfileSection>
          ) : null}
        </div>
      )}
    </PublicProfileShell>
  );
}
