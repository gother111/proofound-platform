import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, GraduationCap, MapPin, Sparkles, Briefcase, Target } from 'lucide-react';
import type { PublicSnippetViewModel } from '@/lib/profile/public-snippet';

type PublicSnippetViewProps = {
  viewModel: PublicSnippetViewModel;
  compact?: boolean;
};

function themeSurface(theme: PublicSnippetViewModel['theme']) {
  if (theme === 'dark') {
    return 'bg-slate-950 text-slate-100';
  }
  return 'bg-gradient-to-b from-[#F5F1E9] via-[#FAF8F3] to-white text-slate-900';
}

function sectionTitle(text: string) {
  return <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-500">{text}</h2>;
}

export function PublicSnippetView({ viewModel, compact = false }: PublicSnippetViewProps) {
  if (viewModel.redacted) {
    return (
      <div className="min-h-[240px] flex items-center justify-center p-6">
        <Card className="w-full max-w-xl border-slate-200">
          <CardContent className="py-10 text-center space-y-2">
            <p className="text-lg font-semibold">Profile is currently hidden</p>
            <p className="text-sm text-slate-600">
              The owner enabled privacy mode and this public snapshot is unavailable right now.
            </p>
          </CardContent>
        </Card>
      </div>
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
    <div
      className={`w-full ${themeSurface(viewModel.theme)} ${compact ? 'p-4' : 'min-h-screen p-6 md:p-10'}`}
    >
      <div className={`mx-auto ${compact ? 'max-w-2xl' : 'max-w-5xl'} space-y-6`}>
        <Card className="overflow-hidden border-slate-200/80 shadow-lg">
          <CardContent className="p-0">
            {viewModel.heroImage ? (
              <div
                className="h-28 bg-cover bg-center"
                style={{ backgroundImage: `url(${viewModel.heroImage})` }}
              />
            ) : (
              <div className="h-24 bg-gradient-to-r from-[#28503A] via-[#4C7C64] to-[#8BAF90]" />
            )}
            <div className="px-5 py-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold">{viewModel.title}</h1>
                    <Badge variant="outline" className="capitalize">
                      {viewModel.profileType}
                    </Badge>
                  </div>
                  {viewModel.subtitle && (
                    <p className="text-sm text-slate-600">{viewModel.subtitle}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    {viewModel.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {viewModel.location}
                      </span>
                    )}
                    {viewModel.website && (
                      <a
                        href={viewModel.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Website
                      </a>
                    )}
                    {viewModel.foundedYear && <span>Founded {viewModel.foundedYear}</span>}
                    {viewModel.typeLabel && (
                      <span className="capitalize">{viewModel.typeLabel}</span>
                    )}
                  </div>
                </div>
                {viewModel.avatarImage ? (
                  <Image
                    src={viewModel.avatarImage}
                    alt={`${viewModel.title} avatar`}
                    width={64}
                    height={64}
                    sizes="64px"
                    unoptimized
                    className="h-16 w-16 rounded-xl object-cover border border-slate-200"
                  />
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {!viewModel.hasVisibleFields ? (
          <Card className="border-dashed border-slate-300">
            <CardContent className="py-10 text-center space-y-2">
              <p className="font-medium">Nothing is publicly visible in this shared profile yet.</p>
              <p className="text-sm text-slate-600">
                The owner can enable more sections from the profile sharing settings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewModel.about && (
              <Card className="border-slate-200/80">
                <CardHeader className="pb-2">{sectionTitle('About')}</CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 whitespace-pre-line text-slate-700">
                    {viewModel.about}
                  </p>
                </CardContent>
              </Card>
            )}

            {(skills.length > 0 || experiences.length > 0 || education.length > 0) && (
              <div className="grid gap-4 md:grid-cols-3">
                {skills.length > 0 && (
                  <Card className="border-slate-200/80">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {skills.map((skill) => (
                        <div key={skill.id} className="flex items-center justify-between text-sm">
                          <span>{skill.name}</span>
                          {typeof skill.level === 'number' && (
                            <Badge variant="secondary">L{skill.level}</Badge>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {experiences.length > 0 && (
                  <Card className="border-slate-200/80">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {experiences.map((entry) => (
                        <div key={entry.id} className="text-sm">
                          <p className="font-medium">{entry.title}</p>
                          {entry.orgDescription && (
                            <p className="text-slate-600">{entry.orgDescription}</p>
                          )}
                          {entry.duration && (
                            <p className="text-xs text-slate-500">{entry.duration}</p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {education.length > 0 && (
                  <Card className="border-slate-200/80">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Education
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {education.map((entry) => (
                        <div key={entry.id} className="text-sm">
                          <p className="font-medium">{entry.degree}</p>
                          <p className="text-slate-600">{entry.institution}</p>
                          {entry.duration && (
                            <p className="text-xs text-slate-500">{entry.duration}</p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {(values.length > 0 || causes.length > 0 || culture.length > 0) && (
              <div className="grid gap-4 md:grid-cols-3">
                {values.length > 0 && (
                  <Card className="border-slate-200/80">
                    <CardHeader className="pb-2">{sectionTitle('Values')}</CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {values.map((value) => (
                        <Badge key={value} variant="secondary">
                          {value}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}
                {causes.length > 0 && (
                  <Card className="border-slate-200/80">
                    <CardHeader className="pb-2">{sectionTitle('Causes')}</CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {causes.map((cause) => (
                        <Badge key={cause} variant="outline">
                          {cause}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}
                {culture.length > 0 && (
                  <Card className="border-slate-200/80">
                    <CardHeader className="pb-2">{sectionTitle('Work Culture')}</CardHeader>
                    <CardContent className="space-y-2">
                      {culture.map((item) => (
                        <p key={item} className="text-sm text-slate-700 capitalize">
                          {item}
                        </p>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {impactEntries.length > 0 && (
              <Card className="border-slate-200/80">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Impact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {impactEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="space-y-2 border-b border-slate-200/80 pb-4 last:border-b-0"
                    >
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <p className="font-medium">{entry.title}</p>
                        {entry.timeframe && (
                          <p className="text-xs text-slate-500">{entry.timeframe}</p>
                        )}
                      </div>
                      {entry.description && (
                        <p className="text-sm text-slate-700">{entry.description}</p>
                      )}
                      {entry.metrics.length > 0 && (
                        <div className="grid gap-2 md:grid-cols-3">
                          {entry.metrics.map((metric) => (
                            <div
                              key={`${entry.id}-${metric.name}`}
                              className="rounded-md border border-slate-200 p-2"
                            >
                              <p className="text-xs text-slate-500">{metric.name}</p>
                              <p className="text-sm font-medium">
                                {metric.value}
                                {metric.unit ? ` ${metric.unit}` : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
