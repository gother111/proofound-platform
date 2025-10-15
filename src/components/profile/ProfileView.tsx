'use client';

import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Calendar,
  CheckCircle2,
  User,
  Target,
  Briefcase,
  GraduationCap,
  HandHeart,
  Network,
} from 'lucide-react';
import { MissionCard } from './MissionCard';
import { ValuesCard } from './ValuesCard';
import { CausesCard } from './CausesCard';
import { SkillsCard } from './SkillsCard';

interface ProfileViewProps {
  data: {
    profile: {
      displayName: string;
      location: string;
      joinedDate: string;
      avatarUrl: string | null;
      tagline: string;
      verified: boolean;
      mission: string;
      values: Array<{ icon: string; label: string; verified: boolean }>;
      causes: string[];
      skills: string[];
    };
    impactStories: Array<{
      id: string;
      title: string;
      orgDescription: string;
      impact: string;
      businessValue: string;
      outcomes: string;
      timeline: string;
      verified: boolean;
    }>;
    experiences: Array<{
      id: string;
      title: string;
      orgDescription: string;
      duration: string;
      learning: string;
      growth: string;
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
            <Card className="p-6 border-2">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-card shadow-lg ring-2 ring-[rgba(122,146,120,0.2)] ring-offset-2">
                    <AvatarImage src={profile.avatarUrl || undefined} />
                    <AvatarFallback className="bg-[rgb(245,243,238)] text-2xl">
                      <User className="w-12 h-12" style={{ color: 'rgb(122, 146, 120)' }} />
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
                        className="gap-1"
                        style={{
                          backgroundColor: 'rgba(122, 146, 120, 0.1)',
                          borderColor: 'rgba(122, 146, 120, 0.3)',
                          color: 'rgb(122, 146, 120)',
                        }}
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
                    <Button
                      variant="outline"
                      className="rounded-full"
                      style={{
                        backgroundColor: 'rgba(122, 146, 120, 0.1)',
                        borderColor: 'rgba(122, 146, 120, 0.3)',
                        color: 'rgb(122, 146, 120)',
                      }}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left Sidebar */}
            <div className="space-y-6">
              <MissionCard mission={profile.mission} />
              <ValuesCard values={profile.values} />
              <CausesCard causes={profile.causes} />
              <SkillsCard skills={profile.skills} />
            </div>

            {/* Main Content - Tabs */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="impact" className="space-y-6">
                <TabsList className="grid grid-cols-5 w-full rounded-full bg-muted/30 p-1">
                  <TabsTrigger value="impact" className="rounded-full text-xs sm:text-sm">
                    <Target className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Impact</span>
                  </TabsTrigger>
                  <TabsTrigger value="journey" className="rounded-full text-xs sm:text-sm">
                    <Briefcase className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Journey</span>
                  </TabsTrigger>
                  <TabsTrigger value="learning" className="rounded-full text-xs sm:text-sm">
                    <GraduationCap className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Learning</span>
                  </TabsTrigger>
                  <TabsTrigger value="service" className="rounded-full text-xs sm:text-sm">
                    <HandHeart className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Service</span>
                  </TabsTrigger>
                  <TabsTrigger value="network" className="rounded-full text-xs sm:text-sm">
                    <Network className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Network</span>
                  </TabsTrigger>
                </TabsList>

                {/* Impact Tab */}
                <TabsContent value="impact" className="space-y-6">
                  {impactStories.map((story) => (
                    <Card
                      key={story.id}
                      className="p-6 border-2 hover:border-[rgb(122,146,120)]/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-xl font-display font-semibold">{story.title}</h3>
                            {story.verified && (
                              <Badge
                                variant="outline"
                                className="gap-1"
                                style={{
                                  backgroundColor: 'rgba(122, 146, 120, 0.1)',
                                  borderColor: 'rgba(122, 146, 120, 0.3)',
                                  color: 'rgb(122, 146, 120)',
                                }}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {story.orgDescription}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {story.timeline}
                          </p>
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
                          <p className="text-sm">{story.outcomes}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                {/* Journey Tab */}
                <TabsContent value="journey" className="space-y-6">
                  {experiences.map((experience) => (
                    <Card
                      key={experience.id}
                      className="p-6 border-2 hover:border-[rgb(122,146,120)]/30 transition-colors"
                    >
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
                                What I Learned
                              </h5>
                              <p className="text-sm">{experience.learning}</p>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                How I Grew
                              </h5>
                              <p className="text-sm">{experience.growth}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                {/* Learning Tab */}
                <TabsContent value="learning" className="space-y-6">
                  {education.map((edu) => (
                    <Card
                      key={edu.id}
                      className="p-6 border-2 hover:border-[rgb(122,146,120)]/30 transition-colors"
                    >
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
                    </Card>
                  ))}
                </TabsContent>

                {/* Service Tab */}
                <TabsContent value="service" className="space-y-6">
                  {volunteering.map((vol) => (
                    <Card
                      key={vol.id}
                      className="p-6 border-2 hover:border-[rgb(122,146,120)]/30 transition-colors"
                    >
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
                            <div
                              className="p-3 rounded-lg border"
                              style={{
                                backgroundColor: 'rgba(198, 123, 92, 0.05)',
                                borderColor: 'rgba(198, 123, 92, 0.2)',
                              }}
                            >
                              <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <HandHeart
                                  className="w-3 h-3"
                                  style={{ color: 'rgb(198, 123, 92)' }}
                                />
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
                    </Card>
                  ))}
                </TabsContent>

                {/* Network Tab */}
                <TabsContent value="network">
                  <Card className="p-8 border-2">
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
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
