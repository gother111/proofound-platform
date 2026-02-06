'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Calendar,
  Target,
  Briefcase,
  GraduationCap,
  HandHeart,
  Network,
  Edit3,
  Plus,
  Sparkles,
  Eye,
  EyeOff,
  Share2,
  Leaf,
} from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
import { AvatarUpload } from './AvatarUpload';
import { CoverUpload } from './CoverUpload';
import { EditProfileModal } from './EditProfileModal';
import { MissionEditor } from './MissionEditor';
import { VisionEditor } from './VisionEditor';
import { ValuesEditor } from './ValuesEditor';
import { CausesEditor } from './CausesEditor';
// Skills are now managed via Expertise Atlas - SkillsEditor removed
import { ImpactStoryForm } from './forms/ImpactStoryForm';
import { ExperienceForm } from './forms/ExperienceForm';
import { EducationForm } from './forms/EducationForm';
import { VolunteerForm } from './forms/VolunteerForm';
import { MissionCard } from './MissionCard';
import { VisionCard } from './VisionCard';
import { ValuesCard } from './ValuesCard';
import { CausesCard } from './CausesCard';
import { SkillsCard } from './SkillsCard';
import type { Value } from '@/types/profile';
import { EmptyProfileStateView } from './EmptyProfileStateView';
import { ShareProfileDialog } from './ShareProfileDialog';
import { useProfileViewState } from './editable-profile/useProfileViewState';
import { ProfileCompletionBanner } from './editable-profile/ProfileCompletionBanner';
import { ImpactTab } from './editable-profile/ImpactTab';
import { JourneyTab } from './editable-profile/JourneyTab';
import { LearningTab } from './editable-profile/LearningTab';
import { ServiceTab } from './editable-profile/ServiceTab';
import { NetworkTab } from './editable-profile/NetworkTab';

export function EditableProfileView() {
  const router = useRouter();
  const {
    profile,
    isLoading,
    isPending,
    pending,
    profileCompletion,
    updateBasicInfo,
    updateMission,
    updateVision,
    replaceValues,
    replaceCauses,
    // replaceSkills removed - Skills managed via Expertise Atlas
    addImpactStory,
    deleteImpactStory,
    addExperience,
    deleteExperience,
    addEducation,
    deleteEducation,
    addVolunteering,
    deleteVolunteering,
    toggleRedactMode,
  } = useProfileData();

  // Modal/form states
  const {
    isEditProfileOpen,
    setIsEditProfileOpen,
    isMissionEditorOpen,
    setIsMissionEditorOpen,
    isVisionEditorOpen,
    setIsVisionEditorOpen,
    isValuesEditorOpen,
    setIsValuesEditorOpen,
    isCausesEditorOpen,
    setIsCausesEditorOpen,
    isImpactStoryFormOpen,
    setIsImpactStoryFormOpen,
    isExperienceFormOpen,
    setIsExperienceFormOpen,
    isEducationFormOpen,
    setIsEducationFormOpen,
    isVolunteerFormOpen,
    setIsVolunteerFormOpen,
    isShareDialogOpen,
    setIsShareDialogOpen,
  } = useProfileViewState();

  const isEmptyProfile = useMemo(() => {
    if (!profile) {
      return true;
    }

    const {
      basicInfo,
      mission,
      values,
      causes,
      skills,
      impactStories,
      experiences,
      education,
      volunteering,
    } = profile;

    const hasAvatar = Boolean(basicInfo.avatar);
    const hasTagline = Boolean(basicInfo.tagline?.trim());
    const hasMission = Boolean(mission?.trim());
    const hasValues = values.length > 0;
    const hasCauses = causes.length > 0;
    const hasSkills = skills.length > 0;
    const hasAnyEntries =
      impactStories.length > 0 ||
      experiences.length > 0 ||
      education.length > 0 ||
      volunteering.length > 0;

    return (
      !hasAvatar &&
      !hasTagline &&
      !hasMission &&
      !hasValues &&
      !hasCauses &&
      !hasSkills &&
      !hasAnyEntries
    );
  }, [profile]);

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-proofound-parchment dark:bg-background flex items-center justify-center">
        <p className="text-proofound-charcoal/70 dark:text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const showCompletionBanner = profileCompletion < 80;

  if (isEmptyProfile) {
    return (
      <EmptyProfileStateView
        basicInfo={profile.basicInfo}
        profileCompletion={profileCompletion}
        isPending={isPending}
        pending={pending}
        onEditProfile={() => setIsEditProfileOpen(true)}
        onOpenMission={() => setIsMissionEditorOpen(true)}
        onOpenValues={() => setIsValuesEditorOpen(true)}
        onOpenCauses={() => setIsCausesEditorOpen(true)}
        onOpenSkills={() => router.push('/app/i/expertise')}
        onAddImpactStory={() => setIsImpactStoryFormOpen(true)}
        onAddExperience={() => setIsExperienceFormOpen(true)}
        onAddEducation={() => setIsEducationFormOpen(true)}
        onAddVolunteering={() => setIsVolunteerFormOpen(true)}
        onUpdateBasicInfo={updateBasicInfo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-proofound-parchment dark:bg-background">
      {/* Completion Banner */}
      {showCompletionBanner && <ProfileCompletionBanner profileCompletion={profileCompletion} />}

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
            <Card className="p-6 border-0 shadow-xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7A9278] via-[#C67B5C] to-[#5C8B89]" />
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
                    {/* Redact Mode Toggle */}
                    <Button
                      variant={profile.redactMode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleRedactMode(!profile.redactMode)}
                      className={`h-8 gap-1.5 ${
                        profile.redactMode
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      disabled={pending.redactMode || isPending}
                      title={
                        profile.redactMode
                          ? 'Redact mode is ON - Your profile is hidden from viewers'
                          : 'Turn on redact mode to hide your profile temporarily'
                      }
                    >
                      {profile.redactMode ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span className="text-xs">Hidden</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          <span className="text-xs">Visible</span>
                        </>
                      )}
                    </Button>
                    {/* Share Profile Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsShareDialogOpen(true)}
                      className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                      title="Share your profile"
                    >
                      <Share2 className="w-3 h-3" />
                      <span className="text-xs">Share</span>
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
                      onClick={() => {
                        console.log('DEBUG: Clicked Add Tagline');
                        setIsEditProfileOpen(true);
                      }}
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
                  <Card className="p-6 border-2 border-dashed border-[#7A9278]/20 bg-[#7A9278]/5 hover:bg-[#7A9278]/10 hover:border-[#7A9278]/40 transition-all group/card">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-full bg-[#7A9278]/10 group-hover/card:bg-[#7A9278]/20 transition-colors">
                        <Target className="w-4 h-4 text-[#7A9278]" />
                      </div>
                      <h3 className="font-display font-medium">Mission</h3>
                    </div>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed italic mb-4">
                      What drives your work? Share the change you want to create in the world.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs hover:bg-[#7A9278]/20 text-[#7A9278]"
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      Add your mission
                    </Button>
                  </Card>
                )}
              </div>

              {/* Vision Card - Click to edit */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsVisionEditorOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setIsVisionEditorOpen(true);
                  }
                }}
                className="cursor-pointer"
              >
                {profile.vision ? (
                  <VisionCard vision={profile.vision} />
                ) : (
                  <Card className="p-6 border-2 border-dashed border-[#7A9278]/20 bg-[#7A9278]/5 hover:bg-[#7A9278]/10 hover:border-[#7A9278]/40 transition-all group/card">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-full bg-[#7A9278]/10 group-hover/card:bg-[#7A9278]/20 transition-colors">
                        <Eye className="w-4 h-4 text-[#7A9278]" />
                      </div>
                      <h3 className="font-display font-medium">Vision</h3>
                    </div>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed italic mb-4">
                      Where do you see yourself in the future? Describe your long-term aspirations.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs hover:bg-[#7A9278]/20 text-[#7A9278]"
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      Add your vision
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
                  <Card className="p-6 border-2 border-dashed border-[#C67B5C]/20 bg-[#C67B5C]/5 hover:bg-[#C67B5C]/10 hover:border-[#C67B5C]/40 transition-all group/card">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-full bg-[#C67B5C]/10 group-hover/card:bg-[#C67B5C]/20 transition-colors">
                        <Sparkles className="w-4 h-4 text-[#C67B5C]" />
                      </div>
                      <h3 className="font-display font-medium">Core Values</h3>
                    </div>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed italic mb-4">
                      The principles that guide your decisions and actions.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs hover:bg-[#C67B5C]/20 text-[#C67B5C]"
                    >
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
                  <Card className="p-6 border-2 border-dashed border-[#5C8B89]/20 bg-[#5C8B89]/5 hover:bg-[#5C8B89]/10 hover:border-[#5C8B89]/40 transition-all group/card">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-full bg-[#5C8B89]/10 group-hover/card:bg-[#5C8B89]/20 transition-colors">
                        <Leaf className="w-4 h-4 text-[#5C8B89]" />
                      </div>
                      <h3 className="font-display font-medium">Causes I Support</h3>
                    </div>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed italic mb-4">
                      The issues and movements you&apos;re passionate about.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs hover:bg-[#5C8B89]/20 text-[#5C8B89]"
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      Add causes
                    </Button>
                  </Card>
                )}
              </div>

              {/* Skills Card - Now linked to Expertise Atlas */}
              <div>
                <SkillsCard skills={profile.skills} showManageLink={true} />
              </div>
            </div>

            {/* Main Content - Tabs */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="impact" className="space-y-8">
                <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-6">
                  <TabsTrigger
                    value="impact"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#7A9278] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-3 text-muted-foreground data-[state=active]:text-[#7A9278] transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>Impact</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="journey"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#C67B5C] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-3 text-muted-foreground data-[state=active]:text-[#C67B5C] transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>Journey</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="learning"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#5C8B89] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-3 text-muted-foreground data-[state=active]:text-[#5C8B89] transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>Learning</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="service"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#C67B5C] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-3 text-muted-foreground data-[state=active]:text-[#C67B5C] transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <HandHeart className="w-4 h-4" />
                      <span>Service</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="network"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#7A9278] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-3 text-muted-foreground data-[state=active]:text-[#7A9278] transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4" />
                      <span>Network</span>
                    </div>
                  </TabsTrigger>
                </TabsList>

                <ImpactTab
                  impactStories={profile.impactStories}
                  onAddStory={() => setIsImpactStoryFormOpen(true)}
                  onDeleteStory={deleteImpactStory}
                  actionsDisabled={pending.impactStory || isPending}
                />

                <JourneyTab
                  experiences={profile.experiences}
                  onAddExperience={() => setIsExperienceFormOpen(true)}
                  onDeleteExperience={deleteExperience}
                />

                <LearningTab
                  education={profile.education}
                  onAddEducation={() => setIsEducationFormOpen(true)}
                  onDeleteEducation={deleteEducation}
                />

                <ServiceTab
                  volunteering={profile.volunteering}
                  onAddService={() => setIsVolunteerFormOpen(true)}
                  onDeleteService={deleteVolunteering}
                />

                <NetworkTab />
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
        visibility={
          (profile.fieldVisibility?.mission as 'public' | 'network' | 'private') || 'public'
        }
        onSave={updateMission}
      />
      <VisionEditor
        open={isVisionEditorOpen}
        onOpenChange={setIsVisionEditorOpen}
        vision={profile.vision}
        visibility={
          (profile.fieldVisibility?.vision as 'public' | 'network' | 'private') || 'network'
        }
        onSave={updateVision}
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
      {/* SkillsEditor removed - Skills are now managed via Expertise Atlas */}
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
      <ShareProfileDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        userName={profile.basicInfo.name}
        userHeadline={profile.basicInfo.tagline || undefined}
      />
    </div>
  );
}
