'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MagneticButton } from '@/components/ui/magnetic-button';
import {
  MapPin,
  Calendar,
  CheckCircle2,
  User,
  Target,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  HandHeart,
  Network,
  FolderOpen,
} from 'lucide-react';
import { SkillsCard } from './SkillsCard';
import { getTaxonomyLabel, CAUSES_TAXONOMY } from '@/lib/taxonomy/data';
import { verificationStatusLabel } from '@/lib/copy/labels';
import type { ImpactStory, ImpactStoryVerificationRequestStatus } from '@/types/profile';

interface ProfileViewProps {
  data: {
    profile: {
      displayName: string;
      location: string;
      joinedDate: string;
      avatarUrl: string | null;
      tagline: string;
      verified: boolean;
      skills: string[];
    };
    impactStories: ImpactStory[];
    experiences: Array<{
      id: string;
      title: string;
      organizationName?: string | null;
      orgDescription: string;
      duration: string;
      outcomes: string;
      projects: string;
      measuredOutcomes?: Array<{
        id: string;
        name: string;
        value?: number | null;
        unit?: string | null;
      }>;
      projectEntries?: Array<{
        id: string;
        name: string;
        participationCapacity: 'owned' | 'co_led' | 'contributed';
        duration: string;
      }>;
      verified: boolean;
    }>;
    education: Array<{
      id: string;
      institution: string;
      degree: string;
      duration: string;
      skills: string;
      projects: string;
      verified: boolean;
    }>;
    volunteering: Array<{
      id: string;
      title: string;
      orgDescription: string;
      duration: string;
      cause: string;
      impact: string;
      skillsDeployed: string;
      personalWhy: string;
      verified: boolean;
    }>;
  };
}

export function ProfileView({ data }: ProfileViewProps) {
  const { profile, impactStories, experiences, education, volunteering } = data;
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

  const getParticipationCapacityLabel = (capacity?: string | null) => {
    if (capacity === 'owned') return 'Owned';
    if (capacity === 'co_led') return 'Co-led';
    if (capacity === 'contributed') return 'Contributed';
    return 'Contributed';
  };

  const getCauseLabels = (story: ImpactStory) => {
    const keys = [story.primaryCause, ...(story.secondaryCauses || [])].filter(Boolean) as string[];
    return keys.map((key) => getTaxonomyLabel(key, CAUSES_TAXONOMY));
  };

  const getOutcomeChangeText = (outcome: NonNullable<ImpactStory['measuredOutcomes']>[number]) => {
    return (outcome.change || outcome.label || 'Outcome').trim();
  };

  const getOutcomeMetricText = (outcome: NonNullable<ImpactStory['measuredOutcomes']>[number]) => {
    const hasValue =
      outcome.value !== null &&
      outcome.value !== undefined &&
      String(outcome.value).trim().length > 0;
    if (!hasValue) return null;

    const valueText = String(outcome.value).trim();
    const unitSuffix = outcome.unit?.trim() ? ` ${outcome.unit.trim()}` : '';
    const meta = [outcome.valueMode, outcome.timeframe].filter(Boolean).join(', ');
    return `${valueText}${unitSuffix}${meta ? ` (${meta})` : ''}`;
  };

  const getVerificationBadge = (
    status: ImpactStoryVerificationRequestStatus | null | undefined
  ) => {
    if (!status) return null;

    if (status === 'accepted') {
      return (
        <Badge
          variant="outline"
          className="gap-1 bg-[#7A9278]/10 border-[#7A9278]/30 text-[#7A9278]"
        >
          Request Accepted
        </Badge>
      );
    }

    if (status === 'failed') {
      return <Badge variant="destructive">Request Email Failed</Badge>;
    }

    return <Badge variant="outline">Request {verificationStatusLabel(status)}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative">
        {/* Cover Image */}
        <div
          className="h-48 w-full bg-gradient-to-br from-[rgb(122,146,120)] via-[rgb(92,139,137)] to-[rgb(212,165,116)]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)',
          }}
        />

        {/* Profile Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 mb-8">
            <GlassCard className="p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-card shadow-lg ring-2 ring-[#7A9278]/20 ring-offset-2">
                    <AvatarImage src={profile.avatarUrl || undefined} />
                    <AvatarFallback className="bg-[#F5F3EE] text-2xl">
                      <User className="w-12 h-12 text-[#7A9278]" />
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-display font-semibold">{profile.displayName}</h1>
                    {profile.verified && (
                      <Badge
                        variant="outline"
                        className="gap-1 bg-[#7A9278]/10 border-[#7A9278]/30 text-[#7A9278]"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {profile.joinedDate}
                    </span>
                  </div>

                  <p className="text-base text-foreground mb-4 max-w-3xl">{profile.tagline}</p>

                  <div className="flex gap-3">
                    <MagneticButton className="rounded-full bg-[#7A9278]/10 border border-[#7A9278]/30 text-[#7A9278] px-4 py-2">
                      Edit Profile
                    </MagneticButton>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left Sidebar */}
            <div className="space-y-6">
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="h-5 w-5 text-[#7A9278]" />
                  <h2 className="font-display font-medium">Proof profile</h2>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  This MVP profile emphasizes proof, context, skills, freshness, and scoped
                  verification.
                </p>
              </GlassCard>
            </div>

            {/* Main Content - Tabs */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="impact" className="space-y-6">
                <TabsList className="grid grid-cols-5 w-full rounded-full bg-muted/30 p-1">
                  <TabsTrigger
                    value="impact"
                    className="rounded-full text-xs sm:text-sm text-foreground/70 hover:text-foreground dark:text-[#E8DCC4]/70 dark:hover:text-[#E8DCC4] data-[state=active]:text-foreground dark:data-[state=active]:text-[#E8DCC4]"
                  >
                    <Target className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Impact</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="journey"
                    className="rounded-full text-xs sm:text-sm text-foreground/70 hover:text-foreground dark:text-[#E8DCC4]/70 dark:hover:text-[#E8DCC4] data-[state=active]:text-foreground dark:data-[state=active]:text-[#E8DCC4]"
                  >
                    <Briefcase className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Journey</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="learning"
                    className="rounded-full text-xs sm:text-sm text-foreground/70 hover:text-foreground dark:text-[#E8DCC4]/70 dark:hover:text-[#E8DCC4] data-[state=active]:text-foreground dark:data-[state=active]:text-[#E8DCC4]"
                  >
                    <GraduationCap className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Learning</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="service"
                    className="rounded-full text-xs sm:text-sm text-foreground/70 hover:text-foreground dark:text-[#E8DCC4]/70 dark:hover:text-[#E8DCC4] data-[state=active]:text-foreground dark:data-[state=active]:text-[#E8DCC4]"
                  >
                    <HandHeart className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Service</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="network"
                    className="rounded-full text-xs sm:text-sm text-foreground/70 hover:text-foreground dark:text-[#E8DCC4]/70 dark:hover:text-[#E8DCC4] data-[state=active]:text-foreground dark:data-[state=active]:text-[#E8DCC4]"
                  >
                    <Network className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Network</span>
                  </TabsTrigger>
                </TabsList>

                {/* Impact Tab */}
                <TabsContent value="impact" className="space-y-6">
                  {impactStories.map((story) => (
                    <GlassCard key={story.id} interactive className="p-6">
                      <div className="flex items-start justify-between mb-4">
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
                            {getVerificationBadge(story.verificationRequestStatus)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {story.orgDescription}
                          </p>
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
                                <Badge
                                  key={`${story.id}-${cause}`}
                                  variant="outline"
                                  className="text-xs"
                                >
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
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            Business Value
                          </h4>
                          <p className="text-sm">{story.businessValue}</p>
                        </div>

                        <div className="p-4 bg-muted/20 rounded-xl">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            Outcomes
                          </h4>
                          {story.measuredOutcomes && story.measuredOutcomes.length > 0 ? (
                            <ul className="space-y-2">
                              {story.measuredOutcomes.map((outcome) => {
                                const metricText = getOutcomeMetricText(outcome);
                                return (
                                  <li key={outcome.id} className="text-sm">
                                    <span className="font-medium">
                                      {getOutcomeChangeText(outcome)}
                                    </span>
                                    {metricText ? (
                                      <span className="text-muted-foreground"> · {metricText}</span>
                                    ) : null}
                                  </li>
                                );
                              })}
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
                                    className="text-proofound-forest underline underline-offset-2"
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

                        {story.verificationWarning &&
                          story.verificationWarning !== story.saveWarning && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                              {story.verificationWarning}
                            </p>
                          )}

                        {story.verificationRequestStatus && (
                          <p className="text-xs text-muted-foreground">
                            Latest verification request: {story.verificationRequestStatus}
                            {story.verificationVerifierEmail
                              ? ` • ${story.verificationVerifierEmail}`
                              : ''}
                            {story.verificationRequestedAt
                              ? ` • ${new Date(story.verificationRequestedAt).toLocaleDateString()}`
                              : ''}
                          </p>
                        )}

                        {story.verificationEmailError && (
                          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                            {story.verificationEmailError}
                          </p>
                        )}
                      </div>
                    </GlassCard>
                  ))}
                </TabsContent>

                {/* Journey Tab */}
                <TabsContent value="journey" className="space-y-6">
                  {experiences.map((experience) => (
                    <GlassCard key={experience.id} interactive className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-5 h-5" style={{ color: 'rgb(198, 123, 92)' }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-display font-semibold">
                              {experience.title}
                            </h4>
                            {experience.verified && (
                              <CheckCircle2
                                className="w-4 h-4"
                                style={{ color: 'rgb(122, 146, 120)' }}
                              />
                            )}
                          </div>
                          {experience.organizationName ? (
                            <p className="text-sm mb-1">{experience.organizationName}</p>
                          ) : null}
                          <p className="text-sm text-muted-foreground mb-1">
                            {experience.orgDescription}
                          </p>
                          <p className="text-xs text-muted-foreground mb-4">
                            {experience.duration}
                          </p>

                          <div className="space-y-3">
                            <div>
                              <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                Outcomes
                              </h5>
                              {experience.measuredOutcomes &&
                              experience.measuredOutcomes.length > 0 ? (
                                <ul className="space-y-1">
                                  {experience.measuredOutcomes.map((outcome) => (
                                    <li key={outcome.id} className="text-sm">
                                      <span className="font-medium">{outcome.name}</span>
                                      {outcome.value !== null &&
                                      outcome.value !== undefined &&
                                      String(outcome.value).trim().length > 0 ? (
                                        <span className="text-muted-foreground">
                                          {`: ${String(outcome.value)}${outcome.unit ? ` ${outcome.unit}` : ''}`}
                                        </span>
                                      ) : null}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm">{experience.outcomes}</p>
                              )}
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <FolderOpen className="w-3 h-3" />
                                Projects
                              </h5>
                              {experience.projectEntries && experience.projectEntries.length > 0 ? (
                                <ul className="space-y-1">
                                  {experience.projectEntries.map((project) => (
                                    <li key={project.id} className="text-sm">
                                      <span className="font-medium">{project.name}</span>
                                      <span className="text-muted-foreground">
                                        {' '}
                                        (
                                        {getParticipationCapacityLabel(
                                          project.participationCapacity
                                        )}
                                        , {project.duration})
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm">{experience.projects}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </TabsContent>

                {/* Learning Tab */}
                <TabsContent value="learning" className="space-y-6">
                  {education.map((edu) => (
                    <GlassCard key={edu.id} interactive className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
                          <GraduationCap
                            className="w-5 h-5"
                            style={{ color: 'rgb(92, 139, 137)' }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-display font-semibold">{edu.degree}</h4>
                            {edu.verified && (
                              <CheckCircle2
                                className="w-4 h-4"
                                style={{ color: 'rgb(122, 146, 120)' }}
                              />
                            )}
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
                    </GlassCard>
                  ))}
                </TabsContent>

                {/* Service Tab */}
                <TabsContent value="service" className="space-y-6">
                  {volunteering.map((vol) => (
                    <GlassCard key={vol.id} interactive className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
                          <HandHeart className="w-5 h-5" style={{ color: 'rgb(198, 123, 92)' }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-display font-semibold">{vol.title}</h4>
                            {vol.verified && (
                              <CheckCircle2
                                className="w-4 h-4"
                                style={{ color: 'rgb(122, 146, 120)' }}
                              />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{vol.orgDescription}</p>
                          <p className="text-xs text-muted-foreground mb-4">{vol.duration}</p>

                          <div className="space-y-3">
                            {/* Personal Connection - HIGHLIGHTED */}
                            <div className="p-3 rounded-lg border bg-[#C67B5C]/5 border-[#C67B5C]/20">
                              <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <HandHeart className="w-3 h-3 text-[#C67B5C]" />
                                Personal Connection
                              </h5>
                              <p className="text-sm mb-2 font-medium">{vol.cause}</p>
                              <p className="text-xs text-muted-foreground italic">
                                {vol.personalWhy}
                              </p>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-muted-foreground mb-1">
                                Impact Made
                              </h5>
                              <p className="text-sm">{vol.impact}</p>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-muted-foreground mb-1">
                                Skills Deployed
                              </h5>
                              <p className="text-sm">{vol.skillsDeployed}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </TabsContent>

                {/* Network Tab */}
                <TabsContent value="network">
                  <GlassCard className="p-8">
                    <div className="text-center mb-8">
                      <Network
                        className="w-16 h-16 mx-auto mb-4"
                        style={{ color: 'rgb(122, 146, 120)' }}
                      />
                      <h3 className="text-2xl font-display font-semibold mb-2">Living Network</h3>
                      <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                        Your network is fluid and dynamic. Connections that no longer hold mutual
                        value naturally dissolve, ensuring your network always reflects authentic,
                        active relationships.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                      <div className="text-center p-4 bg-muted/20 rounded-xl">
                        <User
                          className="w-6 h-6 mx-auto mb-2"
                          style={{ color: 'rgb(122, 146, 120)' }}
                        />
                        <p className="text-sm text-muted-foreground mb-1">People</p>
                        <p className="text-2xl font-semibold">127</p>
                        <p className="text-xs text-muted-foreground mt-1">Active connections</p>
                      </div>
                      <div className="text-center p-4 bg-muted/20 rounded-xl">
                        <Briefcase
                          className="w-6 h-6 mx-auto mb-2"
                          style={{ color: 'rgb(198, 123, 92)' }}
                        />
                        <p className="text-sm text-muted-foreground mb-1">Organizations</p>
                        <p className="text-2xl font-semibold">18</p>
                        <p className="text-xs text-muted-foreground mt-1">Active connections</p>
                      </div>
                      <div className="text-center p-4 bg-muted/20 rounded-xl">
                        <GraduationCap
                          className="w-6 h-6 mx-auto mb-2"
                          style={{ color: 'rgb(92, 139, 137)' }}
                        />
                        <p className="text-sm text-muted-foreground mb-1">Institutions</p>
                        <p className="text-2xl font-semibold">5</p>
                        <p className="text-xs text-muted-foreground mt-1">Active connections</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <Button
                        className="rounded-full"
                        style={{
                          backgroundColor: 'rgb(122, 146, 120)',
                        }}
                      >
                        <Network className="w-4 h-4 mr-2" />
                        Visualize Network Graph
                      </Button>
                      <p className="text-xs text-muted-foreground mt-3">
                        See how your connections relate to each other and discover new collaboration
                        opportunities
                      </p>
                    </div>
                  </GlassCard>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
