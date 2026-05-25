'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  HandHeart,
  Heart,
  Sparkles,
  Edit3,
  Plus,
  MapPin,
  Calendar,
  Compass,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvatarUpload } from './AvatarUpload';
import type { BasicInfo } from '@/types/profile';

interface EmptyProfileStateViewProps {
  basicInfo: BasicInfo;
  isPending: boolean;
  pending: {
    updatingBasicInfo: boolean;
    skills: boolean;
    impactStory: boolean;
    experience: boolean;
    education: boolean;
    volunteering: boolean;
  };
  onEditProfile: () => void;
  onOpenSkills: () => void;
  onAddImpactStory: () => void;
  onAddExperience: () => void;
  onAddEducation: () => void;
  onAddVolunteering: () => void;
  onUpdateBasicInfo: (updates: Partial<BasicInfo>) => void;
}

export function EmptyProfileStateView({
  basicInfo,
  isPending,
  pending,
  onEditProfile,
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
    <div className="min-h-screen bg-background" data-testid="individual-empty-profile-view">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Onboarding banner nudges the user to start populating the profile */}
        <div className="mb-8">
          <Card className="p-6 border-2 border-[#7A9278]/30 bg-gradient-to-br from-[#7A9278]/5 via-background to-[#5C8B89]/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#7A9278]/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-[#7A9278]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg">Welcome to Proofound!</h3>
                  <span className="text-sm text-muted-foreground">Proof-first setup</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Start with one context-backed Proof Pack, then add privacy choices and
                  verification checks when they strengthen the work.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Compass className="w-3 h-3" />
                  <span>First proof, Public Page, preferences, then non-self verification</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Hero section with avatar placeholder */}
        <div className="mb-12">
          <Card className="relative overflow-hidden border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-all duration-300 group cursor-pointer">
            {/* Proof Area with Network Visualization - Empty State */}
            <div className="h-48 bg-gradient-to-br from-[#7A9278]/10 via-[#C67B5C]/5 to-[#5C8B89]/10 relative">
              <div className="absolute inset-0 opacity-20">
                {/* Subtle network pattern */}
                <svg className="w-full h-full">
                  <defs>
                    <pattern
                      id="network-pattern-empty"
                      x="0"
                      y="0"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle
                        cx="20"
                        cy="20"
                        r="1"
                        fill="currentColor"
                        className="text-[#7A9278]"
                      />
                      <line
                        x1="20"
                        y1="20"
                        x2="40"
                        y2="20"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="text-[#7A9278]"
                        opacity="0.3"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#network-pattern-empty)" />
                </svg>
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-background/90 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7A9278]" />
                  <span className="text-sm">Add your first proof</span>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="px-8 pb-8">
              {/* Avatar - overlapping proof area */}
              <div className="-mt-16 mb-6">
                <div className="flex items-end gap-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative cursor-pointer group/avatar"
                  >
                    <AvatarUpload
                      avatar={basicInfo.avatar}
                      onUpload={(image) => onUpdateBasicInfo({ avatar: image })}
                    />
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1.5 shadow-md border-2 border-card">
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </motion.div>

                  <div className="mb-2 flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <h1 className="text-3xl text-muted-foreground/60">{displayName}</h1>
                        <Button variant="ghost" size="sm" className="h-8" onClick={onEditProfile}>
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground/60">
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
              </div>

              {/* Tagline - Empty State */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={onEditProfile}
                  className="w-full text-left p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-colors group/tagline"
                >
                  <div className="flex items-start gap-3">
                    <Edit3 className="w-4 h-4 text-muted-foreground/60 mt-1 group-hover/tagline:text-[#7A9278]" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Add a tagline</p>
                      <p className="text-xs text-muted-foreground">
                        A brief statement that captures who you are and what you care about
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column with proof-first readiness */}
          <div className="space-y-6">
            <Card className="p-6 border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-colors group">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-[#7A9278]" />
                <h3>Proof readiness</h3>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground/70 leading-relaxed">
                  Build this profile from one real context, one proof pack, and one scoped
                  verification request.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs group-hover:bg-[#7A9278]/10"
                  onClick={onAddImpactStory}
                  disabled={pending.impactStory || isPending}
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Add your first proof
                </Button>
              </div>
            </Card>
          </div>

          {/* Right column contains journey and volunteering tabs */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="journey" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted/30">
                <TabsTrigger value="journey" className="rounded-full">
                  Journey
                </TabsTrigger>
                <TabsTrigger value="volunteering" className="rounded-full">
                  Volunteering
                </TabsTrigger>
              </TabsList>

              {/* Journey Tab - Experiences and Education */}
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
                        on outcomes and projects along the way.
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
                      <p>💡 Tip: Emphasize outcomes and collaboration over job title summaries</p>
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
                          Share outcomes and projects in each role
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

              {/* Volunteering Tab */}
              <TabsContent value="volunteering" className="space-y-4 mt-6">
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
                        Highlight your volunteer work and community involvement. Emphasize the
                        context, outcomes, skills used, and proof you can attach.
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
                        Tip: Connect your service to concrete outcomes and the proof that supports
                        them
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
          </div>
        </div>
      </div>
    </div>
  );
}
