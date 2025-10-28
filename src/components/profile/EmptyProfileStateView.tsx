'use client';

// This component renders the empty profile experience that mirrors the Figma design.
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  HandHeart,
  Heart,
  Target,
  Sparkles,
  Edit3,
  Plus,
  MapPin,
  Calendar,
  Upload,
  CircleDashed,
  Compass,
  Lightbulb,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AvatarUpload } from './AvatarUpload';
import { CoverUpload } from './CoverUpload';
import type { BasicInfo } from '@/types/profile';

interface EmptyProfileStateViewProps {
  basicInfo: BasicInfo;
  profileCompletion: number;
  isPending: boolean;
  pending: {
    updatingBasicInfo: boolean;
    mission: boolean;
    values: boolean;
    causes: boolean;
    skills: boolean;
    impactStory: boolean;
    experience: boolean;
    education: boolean;
    volunteering: boolean;
  };
  onEditProfile: () => void;
  onOpenMission: () => void;
  onOpenValues: () => void;
  onOpenCauses: () => void;
  onOpenSkills: () => void;
  onAddImpactStory: () => void;
  onAddExperience: () => void;
  onAddEducation: () => void;
  onAddVolunteering: () => void;
  onUpdateBasicInfo: (updates: Partial<BasicInfo>) => void;
}

export function EmptyProfileStateView({
  basicInfo,
  profileCompletion,
  isPending,
  pending,
  onEditProfile,
  onOpenMission,
  onOpenValues,
  onOpenCauses,
  onOpenSkills,
  onAddImpactStory,
  onAddExperience,
  onAddEducation,
  onAddVolunteering,
  onUpdateBasicInfo,
}: EmptyProfileStateViewProps) {
  // Show a friendly placeholder name if nothing is stored yet.
  const displayName = basicInfo.name?.trim() || 'Your Name';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Onboarding banner nudges the user to start populating the profile */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Card className="p-6 border-2 border-[#7A9278]/30 bg-gradient-to-br from-[#7A9278]/5 via-background to-[#5C8B89]/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#7A9278]/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-[#7A9278]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg">Welcome to Proofound!</h3>
                  <span className="text-sm text-muted-foreground">
                    {profileCompletion}% complete
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Your profile is a space to share your impact, values, and growth journey. Add
                  meaningful context to help others understand who you are and what you care about.
                </p>
                <Progress value={profileCompletion} className="h-2 mb-4" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Compass className="w-3 h-3" />
                  <span>Start by adding a photo, tagline, and your mission</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Hero section with cover upload and avatar placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <Card className="relative overflow-hidden border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-all duration-300">
            <CoverUpload
              coverImage={basicInfo.coverImage}
              onUpload={(image) => onUpdateBasicInfo({ coverImage: image })}
            />

            <div className="px-8 pb-8">
              <div className="-mt-16 mb-6 flex items-end gap-6">
                <div className="relative">
                  <AvatarUpload
                    avatar={basicInfo.avatar}
                    onUpload={(image) => onUpdateBasicInfo({ avatar: image })}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1.5 shadow-md border-2 border-card">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h1 className="text-3xl text-muted-foreground/80">{displayName}</h1>
                    <Button variant="ghost" size="sm" className="h-8" onClick={onEditProfile}>
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground/70">
                    <button
                      type="button"
                      onClick={onEditProfile}
                      className="flex items-center gap-1 hover:text-[#7A9278] transition-colors"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{basicInfo.location || 'Add location'}</span>
                    </button>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Joined {basicInfo.joinedDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <button
                  type="button"
                  onClick={onEditProfile}
                  className="w-full text-left p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Edit3 className="w-4 h-4 text-muted-foreground/60 mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Add a tagline</p>
                      <p className="text-xs text-muted-foreground/60">
                        A brief statement that captures who you are and what you care about
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column with mission, values, and causes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <Card
              className="p-6 border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-colors cursor-pointer"
              onClick={onOpenMission}
            >
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[#7A9278]" />
                <h3>Mission</h3>
              </div>
              <p className="text-sm text-muted-foreground/60 leading-relaxed italic mb-3">
                What drives your work? Share the change you want to create in the world.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={onOpenMission}
                disabled={pending.mission || isPending}
              >
                <Plus className="w-3 h-3 mr-2" />
                Add your mission
              </Button>
            </Card>

            <Card
              className="p-6 border-2 border-dashed border-muted-foreground/20 hover:border-[#C67B5C]/40 transition-colors cursor-pointer"
              onClick={onOpenValues}
            >
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-[#C67B5C]" />
                <h3>Core Values</h3>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground/60 leading-relaxed italic">
                  The principles that guide your decisions and actions.
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[1, 2, 3].map((index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs text-muted-foreground/40 border-dashed"
                    >
                      <CircleDashed className="w-3 h-3 mr-1" />
                      Value {index}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={onOpenValues}
                  disabled={pending.values || isPending}
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Define your values
                </Button>
              </div>
            </Card>

            <Card
              className="p-6 border-2 border-dashed border-muted-foreground/20 hover:border-[#5C8B89]/40 transition-colors cursor-pointer"
              onClick={onOpenCauses}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#5C8B89]" />
                <h3>Causes I Support</h3>
              </div>
              <p className="text-sm text-muted-foreground/60 leading-relaxed italic mb-3">
                The issues and movements you&apos;re passionate about.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={onOpenCauses}
                disabled={pending.causes || isPending}
              >
                <Plus className="w-3 h-3 mr-2" />
                Add causes
              </Button>
            </Card>

            <Card
              className="p-6 border-2 border-dashed border-muted-foreground/20 hover:border-[#D4A574]/40 transition-colors cursor-pointer"
              onClick={onOpenSkills}
            >
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-[#D4A574]" />
                <h3>Skills & Expertise</h3>
              </div>
              <p className="text-sm text-muted-foreground/60 leading-relaxed italic mb-3">
                Highlight the capabilities you want to be known for.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={onOpenSkills}
                disabled={pending.skills || isPending}
              >
                <Plus className="w-3 h-3 mr-2" />
                Add skills
              </Button>
            </Card>
          </motion.div>

          {/* Right column contains impact, journey, and service tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2 space-y-8"
          >
            <Tabs defaultValue="impact" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-full bg-muted/30">
                <TabsTrigger value="impact" className="rounded-full">
                  Impact
                </TabsTrigger>
                <TabsTrigger value="journey" className="rounded-full">
                  Journey
                </TabsTrigger>
                <TabsTrigger value="service" className="rounded-full">
                  Service
                </TabsTrigger>
              </TabsList>

              {/* Impact Tab - Impact Stories */}
              <TabsContent value="impact" className="space-y-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Projects and initiatives with verified impact
                  </p>
                </div>

                <Card
                  className="p-12 border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-all duration-300 cursor-pointer"
                  onClick={onAddImpactStory}
                >
                  <div className="text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#7A9278]/10 to-[#5C8B89]/10 flex items-center justify-center">
                        <Sparkles className="w-16 h-16 text-[#7A9278]/70" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg">Share Your Impact Stories</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Highlight the meaningful work you have done. Focus on the change created,
                        lives touched, and value delivered—not just tasks completed.
                      </p>
                    </div>
                    <Button
                      className="rounded-full bg-[#7A9278] hover:bg-[#7A9278]/90"
                      onClick={onAddImpactStory}
                      disabled={pending.impactStory || isPending}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Impact Story
                    </Button>
                    <div className="pt-4 text-xs text-muted-foreground">
                      <p>
                        💡 Tip: Include context about the organization, your role, and measurable
                        outcomes.
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="journey" className="space-y-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Chronological timeline of educational and working experiences
                  </p>
                </div>

                <Card
                  className="p-12 border-2 border-dashed border-muted-foreground/20 hover:border-[#C67B5C]/40 transition-all duration-300 cursor-pointer"
                  onClick={onAddExperience}
                >
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
                      <h3 className="text-lg">Map Your Journey</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Share your chronological timeline of education and work experiences. Focus
                        on what you learned, how you grew, and the skills you developed along the
                        way.
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <Button
                        className="rounded-full bg-[#C67B5C] hover:bg-[#C67B5C]/90"
                        onClick={onAddExperience}
                        disabled={pending.experience || isPending}
                      >
                        <Briefcase className="w-4 h-4 mr-2" />
                        Add Work Experience
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={onAddEducation}
                        disabled={pending.education || isPending}
                      >
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Add Education
                      </Button>
                    </div>
                    <div className="pt-4 text-xs text-muted-foreground">
                      <p>
                        💡 Tip: Emphasize personal growth and learning over job titles and
                        responsibilities
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card
                    className="p-6 border-2 border-dashed border-muted-foreground/20 hover:border-[#C67B5C]/40 transition-colors cursor-pointer"
                    onClick={onAddExperience}
                  >
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-5 h-5 text-[#C67B5C] mt-1" />
                      <div>
                        <h4 className="text-sm mb-1">Professional Experience</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          Share what you learned and how you grew in each role
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={onAddExperience}
                          disabled={pending.experience || isPending}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Experience
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card
                    className="p-6 border-2 border-dashed border-muted-foreground/20 hover:border-[#5C8B89]/40 transition-colors cursor-pointer"
                    onClick={onAddEducation}
                  >
                    <div className="flex items-start gap-3">
                      <GraduationCap className="w-5 h-5 text-[#5C8B89] mt-1" />
                      <div>
                        <h4 className="text-sm mb-1">Education</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          Include skills gained and meaningful projects
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={onAddEducation}
                          disabled={pending.education || isPending}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Education
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Service Tab - Volunteering */}
              <TabsContent value="service" className="space-y-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Volunteering projects and experiences
                  </p>
                </div>

                <Card
                  className="p-12 border-2 border-dashed border-muted-foreground/20 hover:border-[#C67B5C]/40 transition-all duration-300 cursor-pointer"
                  onClick={onAddVolunteering}
                >
                  <div className="text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#C67B5C]/10 to-[#7A9278]/10 flex items-center justify-center">
                        <HandHeart className="w-16 h-16 text-[#C67B5C]/60" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg">Share Your Volunteering</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Highlight your volunteer work and community involvement. Explain why these
                        causes matter to you and what impact you&apos;ve created.
                      </p>
                    </div>
                    <Button
                      className="rounded-full bg-[#C67B5C] hover:bg-[#C67B5C]/90"
                      onClick={onAddVolunteering}
                      disabled={pending.volunteering || isPending}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Volunteer Experience
                    </Button>
                    <div className="pt-4 text-xs text-muted-foreground">
                      <p>
                        💡 Tip: Connect your service to your values and explain your personal
                        motivation
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="p-6 bg-gradient-to-r from-[#7A9278]/5 via-[#5C8B89]/5 to-[#C67B5C]/5 border-[#7A9278]/20">
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  ✨ Your profile is a reflection of your impact, not your résumé. Take your time to
                  tell your story authentically.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/60">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Privacy-first
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified impact
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Anti-bias design
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
