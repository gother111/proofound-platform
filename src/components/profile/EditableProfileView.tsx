'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  Edit3,
  Plus,
  Sparkles,
  Compass,
  Lightbulb,
  TrendingUp,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useProfileData } from '@/hooks/useProfileData';
import { AvatarUpload } from './AvatarUpload';
import { CoverUpload } from './CoverUpload';
import { EditProfileModal } from './EditProfileModal';
import { MissionEditor } from './MissionEditor';
import { ValuesEditor } from './ValuesEditor';
import { CausesEditor } from './CausesEditor';
import { SkillsEditor } from './SkillsEditor';
import { ImpactStoryForm } from './forms/ImpactStoryForm';
import { ExperienceForm } from './forms/ExperienceForm';
import { EducationForm } from './forms/EducationForm';
import { VolunteerForm } from './forms/VolunteerForm';
import { MissionCard } from './MissionCard';
import { ValuesCard } from './ValuesCard';
import { CausesCard } from './CausesCard';
import { SkillsCard } from './SkillsCard';
import { Value, Skill } from '@/types/profile';

export function EditableProfileView() {
  const {
    profile,
    isLoading,
    isPending,
    pending,
    profileCompletion,
    updateBasicInfo,
    updateMission,
    replaceValues,
    replaceCauses,
    replaceSkills,
    addImpactStory,
    deleteImpactStory,
    addExperience,
    deleteExperience,
    addEducation,
    deleteEducation,
    addVolunteering,
    deleteVolunteering,
  } = useProfileData();

  // Modal/form states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isMissionEditorOpen, setIsMissionEditorOpen] = useState(false);
  const [isValuesEditorOpen, setIsValuesEditorOpen] = useState(false);
  const [isCausesEditorOpen, setIsCausesEditorOpen] = useState(false);
  const [isSkillsEditorOpen, setIsSkillsEditorOpen] = useState(false);
  const [isImpactStoryFormOpen, setIsImpactStoryFormOpen] = useState(false);
  const [isExperienceFormOpen, setIsExperienceFormOpen] = useState(false);
  const [isEducationFormOpen, setIsEducationFormOpen] = useState(false);
  const [isVolunteerFormOpen, setIsVolunteerFormOpen] = useState(false);

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-proofound-parchment dark:bg-background flex items-center justify-center">
        <p className="text-proofound-charcoal/70 dark:text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const showCompletionBanner = profileCompletion < 80;

  return (
    <div className="min-h-screen bg-proofound-parchment dark:bg-background">
      {/* Completion Banner */}
      {showCompletionBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        >
          <Card className="p-6 border-2 border-proofound-forest/30 dark:border-border rounded-2xl bg-gradient-to-br from-proofound-forest/5 via-background to-brand-teal/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-proofound-forest/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-proofound-forest dark:text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-['Crimson_Pro'] font-semibold text-proofound-charcoal dark:text-foreground">
                    Welcome to Proofound!
                  </h3>
                  <span className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                    {profileCompletion}% complete
                  </span>
                </div>
                <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-4">
                  Your profile is a space to share your impact, values, and growth journey. Add
                  meaningful context to help others understand who you are and what you care about.
                </p>
                <Progress value={profileCompletion} className="h-2 mb-4" />
                <div className="flex items-center gap-2 text-xs text-proofound-charcoal/70 dark:text-muted-foreground">
                  <Compass className="w-3 h-3" />
                  <span>Start by adding a photo, tagline, and your mission</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Hero Section */}
      <div className="relative">
        {/* Cover Upload */}
        <CoverUpload
          coverImage={profile.basicInfo.coverImage}
          onUpload={(base64) => updateBasicInfo({ coverImage: base64 })}
        />

        {/* Profile Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 mb-8">
            <Card className="p-6 border-2">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Avatar Upload */}
                <AvatarUpload
                  avatar={profile.basicInfo.avatar}
                  onUpload={(base64) => updateBasicInfo({ avatar: base64 })}
                />

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-display font-semibold">
                      {profile.basicInfo.name}
                    </h1>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditProfileOpen(true)}
                      className="h-8"
                      disabled={pending.updatingBasicInfo || isPending}
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    {profile.basicInfo.location ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {profile.basicInfo.location}
                      </span>
                    ) : (
                      <button
                        onClick={() => setIsEditProfileOpen(true)}
                        className="flex items-center gap-1 hover:text-[#7A9278] transition-colors"
                      >
                        <MapPin className="w-4 h-4" />
                        Add location
                      </button>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {profile.basicInfo.joinedDate}
                    </span>
                  </div>

                  {/* Tagline */}
                  {profile.basicInfo.tagline ? (
                    <p className="text-base text-foreground mb-4 max-w-3xl">
                      {profile.basicInfo.tagline}
                    </p>
                  ) : (
                    <button
                      onClick={() => setIsEditProfileOpen(true)}
                      className="w-full text-left p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-colors group/tagline mb-4"
                    >
                      <div className="flex items-start gap-3">
                        <Edit3 className="w-4 h-4 text-muted-foreground/60 mt-1 group-hover/tagline:text-[#7A9278]" />
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Add a tagline</p>
                          <p className="text-xs text-muted-foreground/60">
                            A brief statement that captures who you are and what you care about
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left Sidebar */}
            <div className="space-y-6">
              {/* Mission Card - Click to edit */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsMissionEditorOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setIsMissionEditorOpen(true);
                  }
                }}
                className="cursor-pointer"
              >
                {profile.mission ? (
                  <MissionCard mission={profile.mission} />
                ) : (
                  <Card className="p-6 border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-colors">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5 text-[#7A9278]" />
                      <h3>Mission</h3>
                    </div>
                    <p className="text-sm text-muted-foreground/60 leading-relaxed italic mb-3">
                      What drives your work? Share the change you want to create in the world.
                    </p>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                      <Plus className="w-3 h-3 mr-2" />
                      Add your mission
                    </Button>
                  </Card>
                )}
              </div>

              {/* Values Card - Click to edit */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsValuesEditorOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setIsValuesEditorOpen(true);
                  }
                }}
                className="cursor-pointer"
              >
                {profile.values.length > 0 ? (
                  <ValuesCard values={profile.values} />
                ) : (
                  <Card className="p-6 border-2 border-dashed border-muted-foreground/20 hover:border-[#C67B5C]/40 transition-colors">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-[#C67B5C]" />
                      <h3>Core Values</h3>
                    </div>
                    <p className="text-sm text-muted-foreground/60 leading-relaxed italic mb-3">
                      The principles that guide your decisions and actions.
                    </p>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                      <Plus className="w-3 h-3 mr-2" />
                      Define your values
                    </Button>
                  </Card>
                )}
              </div>

              {/* Causes Card - Click to edit */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsCausesEditorOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setIsCausesEditorOpen(true);
                  }
                }}
                className="cursor-pointer"
              >
                {profile.causes.length > 0 ? (
                  <CausesCard causes={profile.causes} />
                ) : (
                  <Card className="p-6 border-2 border-dashed border-muted-foreground/20 hover:border-[#5C8B89]/40 transition-colors">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-[#5C8B89]" />
                      <h3>Causes I Support</h3>
                    </div>
                    <p className="text-sm text-muted-foreground/60 leading-relaxed italic mb-3">
                      The issues and movements you&apos;re passionate about.
                    </p>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                      <Plus className="w-3 h-3 mr-2" />
                      Add causes
                    </Button>
                  </Card>
                )}
              </div>

              {/* Skills Card - Click to edit */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsSkillsEditorOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setIsSkillsEditorOpen(true);
                  }
                }}
                className="cursor-pointer"
              >
                {profile.skills.length > 0 ? (
                  <SkillsCard skills={profile.skills} />
                ) : (
                  <Card className="p-6 border-2 border-dashed border-muted-foreground/20 hover:border-[#D4A574]/40 transition-colors">
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="w-5 h-5 text-[#D4A574]" />
                      <h3>Skills & Expertise</h3>
                    </div>
                    <p className="text-sm text-muted-foreground/60 leading-relaxed italic mb-3">
                      Your capabilities and areas of knowledge.
                    </p>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                      <Plus className="w-3 h-3 mr-2" />
                      Add skills
                    </Button>
                  </Card>
                )}
              </div>
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

                {/* Impact Stories Tab - CONTINUED IN NEXT FILE SEGMENT */}
                <TabsContent value="impact" className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      Projects and initiatives with verified impact
                    </p>
                    {!!profile.impactStories.length && (
                      <Button
                        size="sm"
                        className="rounded-full bg-[#7A9278] hover:bg-[#7A9278]/90"
                        onClick={() => setIsImpactStoryFormOpen(true)}
                        disabled={pending.impactStory || isPending}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Story
                      </Button>
                    )}
                  </div>

                  {profile.impactStories.length === 0 ? (
                    <Card className="p-12 border-2 border-dashed border-muted-foreground/20">
                      <div className="text-center space-y-6">
                        <div className="flex justify-center">
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#7A9278]/10 to-[#5C8B89]/10 flex items-center justify-center">
                            <svg viewBox="0 0 100 100" className="w-20 h-20">
                              <circle
                                cx="50"
                                cy="50"
                                r="30"
                                fill="none"
                                stroke="#7A9278"
                                strokeWidth="1.5"
                                strokeDasharray="4 4"
                              />
                              <path
                                d="M 50 30 L 50 70 M 30 50 L 70 50"
                                stroke="#7A9278"
                                strokeWidth="1.5"
                                opacity="0.6"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Share Your Impact Stories</h3>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Highlight the meaningful work you&apos;ve done. Focus on the change
                            created, lives touched, and value delivered—not just tasks completed.
                          </p>
                        </div>
                        <Button
                          className="rounded-full bg-[#7A9278] hover:bg-[#7A9278]/90"
                          onClick={() => setIsImpactStoryFormOpen(true)}
                          disabled={pending.impactStory || isPending}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Impact Story
                        </Button>
                        <div className="pt-4 text-xs text-muted-foreground">
                          <p>
                            💡 Tip: Include context about the organization, your role, and
                            measurable outcomes
                          </p>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    profile.impactStories.map((story) => (
                      <Card
                        key={story.id}
                        className="p-6 border-2 hover:border-[rgb(122,146,120)]/30 transition-colors group relative"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this impact story?')) {
                              deleteImpactStory(story.id);
                            }
                          }}
                          disabled={pending.impactStory || isPending}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <div className="flex items-start justify-between mb-4 pr-8">
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
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                              Impact
                            </h4>
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
                    ))
                  )}
                </TabsContent>

                {/* Journey Tab - EXPERIENCES */}
                <TabsContent value="journey" className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      My professional growth and learning journey
                    </p>
                    {profile.experiences.length > 0 && (
                      <Button
                        size="sm"
                        className="rounded-full bg-[#7A9278] hover:bg-[#7A9278]/90"
                        onClick={() => setIsExperienceFormOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Experience
                      </Button>
                    )}
                  </div>

                  {profile.experiences.length === 0 ? (
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
                            Share your professional experiences. Focus on what you learned, how you
                            grew, and the skills you developed along the way.
                          </p>
                        </div>
                        <Button
                          className="rounded-full bg-[#C67B5C] hover:bg-[#C67B5C]/90"
                          onClick={() => setIsExperienceFormOpen(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Experience
                        </Button>
                        <div className="pt-4 text-xs text-muted-foreground">
                          <p>
                            💡 Tip: Emphasize personal growth over job titles and responsibilities
                          </p>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    profile.experiences.map((exp) => (
                      <Card
                        key={exp.id}
                        className="p-6 border-2 hover:border-[rgb(122,146,120)]/30 transition-colors group relative"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this experience?')) {
                              deleteExperience(exp.id);
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
                            <p className="text-sm text-muted-foreground mb-1">
                              {exp.orgDescription}
                            </p>
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

                {/* Learning Tab - EDUCATION */}
                <TabsContent value="learning" className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      Formal education and meaningful learning experiences
                    </p>
                    {profile.education.length > 0 && (
                      <Button
                        size="sm"
                        className="rounded-full bg-[#7A9278] hover:bg-[#7A9278]/90"
                        onClick={() => setIsEducationFormOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Education
                      </Button>
                    )}
                  </div>

                  {profile.education.length === 0 ? (
                    <Card className="p-12 border-2 border-dashed border-muted-foreground/20">
                      <div className="text-center space-y-6">
                        <div className="flex justify-center">
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#5C8B89]/10 to-[#7A9278]/10 flex items-center justify-center">
                            <GraduationCap className="w-16 h-16 text-[#5C8B89]/60" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Add Your Learning</h3>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Share your educational background. Include skills gained and meaningful
                            projects that shaped your path.
                          </p>
                        </div>
                        <Button
                          className="rounded-full bg-[#5C8B89] hover:bg-[#5C8B89]/90"
                          onClick={() => setIsEducationFormOpen(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Education
                        </Button>
                        <div className="pt-4 text-xs text-muted-foreground">
                          <p>
                            💡 Tip: Include both formal degrees and significant informal learning
                            experiences
                          </p>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    profile.education.map((edu) => (
                      <Card
                        key={edu.id}
                        className="p-6 border-2 hover:border-[rgb(122,146,120)]/30 transition-colors group relative"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this education?')) {
                              deleteEducation(edu.id);
                            }
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
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
                </TabsContent>

                {/* Service Tab - VOLUNTEERING */}
                <TabsContent value="service" className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      Community service connected to personal causes
                    </p>
                    {profile.volunteering.length > 0 && (
                      <Button
                        size="sm"
                        className="rounded-full bg-[#7A9278] hover:bg-[#7A9278]/90"
                        onClick={() => setIsVolunteerFormOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Service
                      </Button>
                    )}
                  </div>

                  {profile.volunteering.length === 0 ? (
                    <Card className="p-12 border-2 border-dashed border-muted-foreground/20">
                      <div className="text-center space-y-6">
                        <div className="flex justify-center">
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#C67B5C]/10 to-[#7A9278]/10 flex items-center justify-center">
                            <HandHeart className="w-16 h-16 text-[#C67B5C]/60" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Share Your Service</h3>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Highlight your volunteer work and community involvement. Explain why
                            these causes matter to you and what impact you&apos;ve created.
                          </p>
                        </div>
                        <Button
                          className="rounded-full bg-[#C67B5C] hover:bg-[#C67B5C]/90"
                          onClick={() => setIsVolunteerFormOpen(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Volunteer Work
                        </Button>
                        <div className="pt-4 text-xs text-muted-foreground">
                          <p>
                            💡 Tip: Connect your service to your values and explain your personal
                            motivation
                          </p>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    profile.volunteering.map((vol) => (
                      <Card
                        key={vol.id}
                        className="p-6 border-2 hover:border-[rgb(122,146,120)]/30 transition-colors group relative"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this volunteer work?')) {
                              deleteVolunteering(vol.id);
                            }
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
                            <HandHeart className="w-5 h-5 text-[#C67B5C]" />
                          </div>
                          <div className="flex-1 pr-8">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-lg font-display font-semibold">{vol.title}</h4>
                              {vol.verified && <CheckCircle2 className="w-4 h-4 text-[#7A9278]" />}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {vol.orgDescription}
                            </p>
                            <p className="text-xs text-muted-foreground mb-4">{vol.duration}</p>
                            <div className="space-y-3">
                              <div
                                className="p-3 rounded-lg border"
                                style={{
                                  backgroundColor: 'rgba(198, 123, 92, 0.05)',
                                  borderColor: 'rgba(198, 123, 92, 0.2)',
                                }}
                              >
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
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* Network Tab */}
                <TabsContent value="network">
                  <Card className="p-8 border-2">
                    <div className="text-center mb-8">
                      <Network className="w-16 h-16 mx-auto mb-4 text-[#7A9278]" />
                      <h3 className="text-2xl font-display font-semibold mb-2">Living Network</h3>
                      <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                        Your network is fluid and dynamic. Connections that no longer hold mutual
                        value naturally dissolve, ensuring your network always reflects authentic,
                        active relationships.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                      <div className="text-center p-4 bg-muted/20 rounded-xl">
                        <User className="w-6 h-6 mx-auto mb-2 text-[#7A9278]" />
                        <p className="text-sm text-muted-foreground mb-1">People</p>
                        <p className="text-2xl font-semibold">0</p>
                        <p className="text-xs text-muted-foreground mt-1">Active connections</p>
                      </div>
                      <div className="text-center p-4 bg-muted/20 rounded-xl">
                        <Briefcase className="w-6 h-6 mx-auto mb-2 text-[#C67B5C]" />
                        <p className="text-sm text-muted-foreground mb-1">Organizations</p>
                        <p className="text-2xl font-semibold">0</p>
                        <p className="text-xs text-muted-foreground mt-1">Active connections</p>
                      </div>
                      <div className="text-center p-4 bg-muted/20 rounded-xl">
                        <GraduationCap className="w-6 h-6 mx-auto mb-2 text-[#5C8B89]" />
                        <p className="text-sm text-muted-foreground mb-1">Institutions</p>
                        <p className="text-2xl font-semibold">0</p>
                        <p className="text-xs text-muted-foreground mt-1">Active connections</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <Button
                        className="rounded-full"
                        style={{ backgroundColor: 'rgb(122, 146, 120)' }}
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

      {/* All Modals/Forms */}
      <EditProfileModal
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        basicInfo={profile.basicInfo}
        onSave={updateBasicInfo}
      />
      <MissionEditor
        open={isMissionEditorOpen}
        onOpenChange={setIsMissionEditorOpen}
        mission={profile.mission}
        onSave={updateMission}
      />
      <ValuesEditor
        open={isValuesEditorOpen}
        onOpenChange={setIsValuesEditorOpen}
        values={profile.values}
        onSave={(values: Value[]) => {
          replaceValues(values);
        }}
      />
      <CausesEditor
        open={isCausesEditorOpen}
        onOpenChange={setIsCausesEditorOpen}
        causes={profile.causes}
        onSave={(causes: string[]) => {
          replaceCauses(causes);
        }}
      />
      <SkillsEditor
        open={isSkillsEditorOpen}
        onOpenChange={setIsSkillsEditorOpen}
        skills={profile.skills}
        onSave={(skills: Skill[]) => {
          replaceSkills(skills);
        }}
      />
      <ImpactStoryForm
        open={isImpactStoryFormOpen}
        onOpenChange={setIsImpactStoryFormOpen}
        onSave={addImpactStory}
      />
      <ExperienceForm
        open={isExperienceFormOpen}
        onOpenChange={setIsExperienceFormOpen}
        onSave={addExperience}
      />
      <EducationForm
        open={isEducationFormOpen}
        onOpenChange={setIsEducationFormOpen}
        onSave={addEducation}
      />
      <VolunteerForm
        open={isVolunteerFormOpen}
        onOpenChange={setIsVolunteerFormOpen}
        onSave={addVolunteering}
      />
    </div>
  );
}
