"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { showToast } from "@/components/common/Toaster";
import { Upload, MapPin, Calendar, Edit2, Plus, Briefcase, GraduationCap, Target, Heart, Sparkles, Lightbulb } from "lucide-react";

interface ProfileEditorProps {
  profile: any;
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"journey" | "volunteering">("journey");
  const [isEditing, setIsEditing] = useState({
    name: false,
    tagline: false,
    mission: false,
    values: false,
    causes: false,
  });

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "Your Name",
    region: profile?.region || "",
    professional_summary: profile?.professional_summary || "",
    mission: profile?.mission || "",
    values: profile?.values || [],
    causes: profile?.causes || [],
  });

  const profileCompletion = profile?.profile_completion_percentage || 5;

  const saveField = async (field: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("profiles")
        .update({ [field]: formData[field as keyof typeof formData], updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      if (error) throw error;

      // Show success notification
      const fieldName = field === "professional_summary" ? "tagline" : field.replace(/_/g, " ");
      showToast.success("Profile updated", `Your ${fieldName} has been saved`);

      setIsEditing({ ...isEditing, [field.replace("professional_summary", "tagline")]: false });
      router.refresh();
    } catch (error) {
      console.error("Error saving:", error);
      showToast.error("Failed to save", "Please try again");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome Banner */}
        <Card className="p-6 mb-8 bg-card border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--proofound-forest)', opacity: 0.1 }}>
                <Sparkles className="w-6 h-6" style={{ color: 'var(--proofound-forest)' }} />
              </div>
              <div className="flex-1">
                <h2 className="font-['Crimson_Pro'] text-2xl mb-2 text-foreground">
                  Welcome to Proofound!
                </h2>
                <p className="text-sm mb-3 text-muted-foreground font-['Inter']">
                  Your profile is a space to share your impact, values, and growth journey. Add meaningful context to help others understand who you are and what you care about.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'var(--proofound-stone)' }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        backgroundColor: 'var(--proofound-forest)',
                        width: `${profileCompletion}%`
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {profileCompletion}% complete
                  </span>
                </div>
                <p className="text-xs mt-2 flex items-center gap-1 text-muted-foreground font-['Inter']">
                  <Lightbulb className="w-3 h-3" />
                  Start by adding a photo, tagline, and your mission
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Header Section */}
        <Card className="p-8 mb-8 border-2 border-dashed bg-card" style={{ borderColor: 'var(--proofound-stone)' }}>
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div
                className="w-32 h-32 rounded-full border-4 flex items-center justify-center bg-background"
                style={{ borderColor: 'var(--proofound-stone)' }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Upload className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-xs">Upload</span>
                  </div>
                )}
              </div>
              <button
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: 'var(--proofound-forest)' }}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Name and Details */}
            <div className="flex-1">
              {/* Name */}
              <div className="mb-4">
                {isEditing.name ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="text-3xl font-['Crimson_Pro'] border-b-2 outline-none bg-transparent text-foreground"
                      style={{ borderColor: 'var(--proofound-forest)' }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => saveField("full_name")}
                      className="text-white"
                      style={{ backgroundColor: 'var(--proofound-forest)' }}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-['Crimson_Pro'] text-foreground">
                      {formData.full_name}
                    </h1>
                    <button onClick={() => setIsEditing({ ...isEditing, name: true })}>
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              {/* Location and Join Date */}
              <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground font-['Inter']">
                <button className="flex items-center gap-1 hover:underline">
                  <MapPin className="w-4 h-4" />
                  Add location
                </button>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Tagline */}
              <div className="p-4 rounded-lg border-2 border-dashed bg-background" style={{ borderColor: 'var(--proofound-stone)' }}>
                {isEditing.tagline ? (
                  <div>
                    <textarea
                      value={formData.professional_summary}
                      onChange={(e) => setFormData({ ...formData, professional_summary: e.target.value })}
                      rows={2}
                      className="w-full bg-transparent border-0 outline-none resize-none text-foreground font-['Inter']"
                      placeholder="A brief statement that captures who you are and what you care about"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => saveField("professional_summary")}
                      className="mt-2 text-white"
                      style={{ backgroundColor: 'var(--proofound-forest)' }}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing({ ...isEditing, tagline: true })}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-2">
                      <Edit2 className="w-4 h-4 mt-1 flex-shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm mb-1 text-foreground font-['Inter']">
                          {formData.professional_summary || "Add a tagline"}
                        </p>
                        {!formData.professional_summary && (
                          <p className="text-xs text-muted-foreground font-['Inter']">
                            A brief statement that captures who you are and what you care about
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* Mission */}
            <Card className="p-6 border-2 border-dashed bg-card" style={{ borderColor: 'var(--proofound-stone)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5" style={{ color: 'var(--proofound-forest)' }} />
                <h3 className="font-['Crimson_Pro'] text-lg text-foreground">
                  Mission
                </h3>
              </div>
              <p className="text-xs mb-4 text-muted-foreground font-['Inter']">
                What drives your work? Share the change you want to create in the world.
              </p>
              {formData.mission ? (
                <p className="text-sm text-foreground font-['Inter']">
                  {formData.mission}
                </p>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-4 justify-start gap-2"
                style={{ color: 'var(--proofound-forest)' }}
              >
                <Plus className="w-4 h-4" />
                {formData.mission ? 'Edit your mission' : 'Add your mission'}
              </Button>
            </Card>

            {/* Core Values */}
            <Card className="p-6 border-2 border-dashed bg-card" style={{ borderColor: 'var(--proofound-stone)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5" style={{ color: 'var(--proofound-terracotta)' }} />
                <h3 className="font-['Crimson_Pro'] text-lg text-foreground">
                  Core Values
                </h3>
              </div>
              <p className="text-xs mb-4 text-muted-foreground font-['Inter']">
                The principles that guide your decisions and actions.
              </p>
              <div className="space-y-2 mb-4">
                {[1, 2, 3].map((i) => (
                  <label key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" className="rounded" />
                    Value {i}
                  </label>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                style={{ color: 'var(--proofound-forest)' }}
              >
                <Plus className="w-4 h-4" />
                Define your values
              </Button>
            </Card>

            {/* Causes */}
            <Card className="p-6 border-2 border-dashed bg-card" style={{ borderColor: 'var(--proofound-stone)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5" style={{ color: 'var(--sage)' }} />
                <h3 className="font-['Crimson_Pro'] text-lg text-foreground">
                  Causes I Support
                </h3>
              </div>
              <p className="text-xs mb-4 text-muted-foreground font-['Inter']">
                The issues and movements you're passionate about.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                style={{ color: 'var(--proofound-forest)' }}
              >
                <Plus className="w-4 h-4" />
                Add causes
              </Button>
            </Card>
          </div>

          {/* Right Content - Journey */}
          <div>
            {/* Tab Navigation */}
            <div className="flex gap-4 mb-6 border-b" style={{ borderColor: 'var(--proofound-stone)' }}>
              <button
                onClick={() => setActiveTab("journey")}
                className={`pb-3 px-2 text-sm font-medium transition-colors font-['Inter'] ${
                  activeTab === "journey" ? "border-b-2" : ""
                }`}
                style={{
                  color: activeTab === "journey" ? 'var(--proofound-forest)' : 'var(--muted-foreground)',
                  borderColor: activeTab === "journey" ? 'var(--proofound-forest)' : 'transparent',
                }}
              >
                Journey
              </button>
              <button
                onClick={() => setActiveTab("volunteering")}
                className={`pb-3 px-2 text-sm font-medium transition-colors font-['Inter'] ${
                  activeTab === "volunteering" ? "border-b-2" : ""
                }`}
                style={{
                  color: activeTab === "volunteering" ? 'var(--proofound-forest)' : 'var(--muted-foreground)',
                  borderColor: activeTab === "volunteering" ? 'var(--proofound-forest)' : 'transparent',
                }}
              >
                Volunteering
              </button>
            </div>

            {/* Journey Content */}
            <Card className="p-8 border-2 border-dashed mb-6 bg-card" style={{ borderColor: 'var(--proofound-stone)' }}>
              <div className="text-center py-12">
                <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center bg-background">
                  <div className="relative w-12 h-12">
                    <div className="absolute w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--ochre)', top: 0, left: 10 }} />
                    <div className="absolute w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--proofound-terracotta)', top: 20, left: 5 }} />
                    <div className="absolute w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--sage)', bottom: 5, right: 5 }} />
                    <div className="absolute w-px h-10 left-5 top-2 rotate-45" style={{ backgroundColor: 'var(--proofound-stone)' }} />
                  </div>
                </div>
                <h3 className="font-['Crimson_Pro'] text-2xl mb-2 text-foreground">
                  Map Your Journey
                </h3>
                <p className="text-sm mb-6 max-w-md mx-auto text-muted-foreground font-['Inter']">
                  Share your chronological timeline of education and working experiences.
                  Focus on what you learned, how you grew, and the skills you developed along the way.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    className="gap-2 text-white"
                    style={{ backgroundColor: 'var(--proofound-terracotta)' }}
                  >
                    <Briefcase className="w-4 h-4" />
                    Add Work Experience
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 border-border"
                  >
                    <GraduationCap className="w-4 h-4" />
                    Add Education
                  </Button>
                </div>
                <p className="text-xs mt-4 flex items-center gap-1 justify-center font-['Inter']" style={{ color: 'var(--ochre)' }}>
                  <Lightbulb className="w-3 h-3" />
                  Tip: Emphasize personal growth and learning over job titles and responsibilities
                </p>
              </div>
            </Card>

            {/* Experience Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Professional Experience */}
              <Card className="p-6 bg-card border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-5 h-5" style={{ color: 'var(--proofound-terracotta)' }} />
                  <h4 className="font-['Crimson_Pro'] text-lg text-foreground">
                    Professional Experience
                  </h4>
                </div>
                <p className="text-xs mb-4 text-muted-foreground font-['Inter']">
                  Share what you learned and how you grew in each role
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center gap-2"
                  style={{ color: 'var(--proofound-forest)' }}
                >
                  <Plus className="w-4 h-4" />
                  Add Experience
                </Button>
              </Card>

              {/* Education */}
              <Card className="p-6 bg-card border-border">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5" style={{ color: 'var(--sage)' }} />
                  <h4 className="font-['Crimson_Pro'] text-lg text-foreground">
                    Education
                  </h4>
                </div>
                <p className="text-xs mb-4 text-muted-foreground font-['Inter']">
                  Include skills gained and meaningful projects
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center gap-2"
                  style={{ color: 'var(--proofound-forest)' }}
                >
                  <Plus className="w-4 h-4" />
                  Add Education
                </Button>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="mt-8 p-4 rounded-lg text-center bg-background border border-border">
          <p className="text-xs flex items-center justify-center gap-2 text-muted-foreground font-['Inter']">
            <Lightbulb className="w-4 h-4" />
            Your profile is a reflection of your impact, not your résumé. Take your time to tell your story authentically.
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span>🔒</span> Privacy-first
            </span>
            <span className="flex items-center gap-1">
              <span>✓</span> Verified impact
            </span>
            <span className="flex items-center gap-1">
              <span>🎯</span> Anti-bias design
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
