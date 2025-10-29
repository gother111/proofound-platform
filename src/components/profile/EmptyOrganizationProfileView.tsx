'use client';

// This component renders the empty organization profile experience that mirrors the Figma design.
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  Building2,
  Heart,
  Target,
  Eye,
  Sparkles,
  Plus,
  Upload,
  Compass,
  Edit3,
  Building,
  Info,
  UserCog,
  FileCheck,
  TrendingUp,
  Briefcase,
  Handshake,
  Layers,
  ScrollText,
  Coffee,
  Flag,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface EmptyOrganizationProfileViewProps {
  organizationName: string;
  profileCompletion: number;
}

export function EmptyOrganizationProfileView({
  organizationName = 'Your Organization',
  profileCompletion = 5,
}: EmptyOrganizationProfileViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Profile Completion Banner */}
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
                  <span className="text-sm text-muted-foreground">{profileCompletion}% complete</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Build trust and transparency by completing your organization profile. Share your
                  mission, structure, and commitments with the community.
                </p>
                <Progress value={profileCompletion} className="h-2 mb-4" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Compass className="w-3 h-3" />
                  <span>Start by adding your logo, basic information, and ownership structure</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Card className="relative overflow-hidden border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-all duration-300 group cursor-pointer">
            {/* Cover with subtle pattern */}
            <div className="h-48 bg-gradient-to-br from-[#7A9278]/10 via-[#5C8B89]/5 to-[#D4A574]/10 relative">
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full">
                  <defs>
                    <pattern
                      id="org-pattern-empty"
                      x="0"
                      y="0"
                      width="60"
                      height="60"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="30" cy="30" r="2" fill="currentColor" className="text-[#7A9278]" />
                      <path
                        d="M 30 30 L 45 45 M 30 30 L 15 15"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="text-[#7A9278]"
                        opacity="0.3"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#org-pattern-empty)" />
                </svg>
              </div>

              {/* Upload Cover CTA */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-background/90 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#7A9278]" />
                  <span className="text-sm">Add cover image</span>
                </div>
              </div>
            </div>

            {/* Organization Info */}
            <div className="px-8 pb-8">
              <div className="-mt-16 mb-6">
                <div className="flex items-end gap-6">
                  {/* Logo */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative cursor-pointer group/logo"
                  >
                    <Avatar className="w-32 h-32 border-4 border-card shadow-lg ring-2 ring-[#7A9278]/20 bg-card">
                      <AvatarFallback className="text-3xl bg-gradient-to-br from-[#7A9278]/30 to-[#5C8B89]/30 text-muted-foreground">
                        <Building2 className="w-12 h-12" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                      <Upload className="w-6 h-6 text-[#7A9278]" />
                    </div>
                  </motion.div>

                  <div className="mb-2 flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <h1 className="text-3xl text-muted-foreground/60">{organizationName}</h1>
                        <Button variant="ghost" size="sm" className="h-8">
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tagline - Empty State */}
              <div className="mb-6">
                <button className="w-full text-left p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-colors group/tagline">
                  <div className="flex items-start gap-3">
                    <Edit3 className="w-4 h-4 text-muted-foreground/60 mt-1 group-hover/tagline:text-[#7A9278]" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Add a tagline</p>
                      <p className="text-xs text-muted-foreground/60">
                        A brief statement that captures your organization&apos;s purpose
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Crucial Business Information - Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-8 border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <Building className="w-6 h-6 text-[#7A9278]" />
              <h2>Organization Details</h2>
              <Badge variant="outline" className="text-xs gap-1 ml-auto">
                <Info className="w-3 h-3" />
                Required for verification
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <button className="p-4 text-left border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-[#7A9278]/40 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">Industry</p>
                <p className="text-sm text-muted-foreground/60">Add industry</p>
              </button>
              <button className="p-4 text-left border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-[#7A9278]/40 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">Organization Size</p>
                <p className="text-sm text-muted-foreground/60">Add size</p>
              </button>
              <button className="p-4 text-left border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-[#7A9278]/40 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">Impact Area</p>
                <p className="text-sm text-muted-foreground/60">Add impact area</p>
              </button>
              <button className="p-4 text-left border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-[#7A9278]/40 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">Legal Form</p>
                <p className="text-sm text-muted-foreground/60">Add legal form</p>
              </button>
              <button className="p-4 text-left border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-[#7A9278]/40 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">Founded</p>
                <p className="text-sm text-muted-foreground/60">Add founding date</p>
              </button>
              <button className="p-4 text-left border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-[#7A9278]/40 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">Registration</p>
                <p className="text-sm text-muted-foreground/60">Add country/region</p>
              </button>
              <button className="p-4 text-left border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-[#7A9278]/40 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">Organization Number</p>
                <p className="text-sm text-muted-foreground/60 font-mono">Add org number</p>
              </button>
              <button className="md:col-span-2 p-4 text-left border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-[#7A9278]/40 transition-colors">
                <p className="text-xs text-muted-foreground mb-1">Locations</p>
                <p className="text-sm text-muted-foreground/60">Add office locations</p>
              </button>
            </div>

            <Separator className="my-6" />

            {/* Ownership & Control - Empty State */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <UserCog className="w-5 h-5 text-[#C76B4A]" />
                <h3>Ownership & Control Structure</h3>
                <Badge variant="outline" className="text-xs gap-1">
                  <Info className="w-3 h-3" />
                  Transparency
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Build trust by disclosing who holds ownership and decision-making power in your
                organization. This transparency helps stakeholders understand your governance
                structure.
              </p>
              <Card className="p-8 border-2 border-dashed border-muted-foreground/20 hover:border-[#C76B4A]/40 transition-colors cursor-pointer">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#C76B4A]/10 flex items-center justify-center">
                      <UserCog className="w-8 h-8 text-[#C76B4A]/60" />
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2">Add Ownership Information</h4>
                    <p className="text-sm text-muted-foreground">
                      List individuals, organizations, or collectives who hold ownership stakes and
                      decision-making power
                    </p>
                  </div>
                  <Button className="rounded-full bg-[#C76B4A] hover:bg-[#C76B4A]/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Owner/Controller
                  </Button>
                </div>
              </Card>
            </div>

            <Separator className="my-6" />

            {/* Licenses & Certifications - Empty State */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileCheck className="w-5 h-5 text-[#5C8B89]" />
                <h3>Licenses & Certifications</h3>
              </div>
              <Card className="p-8 border-2 border-dashed border-muted-foreground/20 hover:border-[#5C8B89]/40 transition-colors cursor-pointer">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#5C8B89]/10 flex items-center justify-center">
                      <FileCheck className="w-8 h-8 text-[#5C8B89]/60" />
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2">Add Licenses & Certifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Display your official licenses, certifications, and accreditations (B Corp, ISO,
                      Fair Trade, etc.)
                    </p>
                  </div>
                  <Button className="rounded-full bg-[#5C8B89] hover:bg-[#5C8B89]/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add License/Certification
                  </Button>
                </div>
              </Card>
            </div>
          </Card>
        </motion.div>

        {/* Mission, Vision, Values - Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-8"
        >
          <Card className="p-8 border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-colors">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Mission - Empty */}
              <button className="p-6 text-left border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-[#7A9278]/40 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-6 h-6 text-[#7A9278]" />
                  <h3>Mission</h3>
                </div>
                <p className="text-sm text-muted-foreground/60 italic">
                  What is your organization&apos;s purpose? What problem are you solving?
                </p>
              </button>

              {/* Vision - Empty */}
              <button className="p-6 text-left border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-[#5C8B89]/40 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-6 h-6 text-[#5C8B89]" />
                  <h3>Vision</h3>
                </div>
                <p className="text-sm text-muted-foreground/60 italic">
                  What future are you working toward? What&apos;s your long-term aspiration?
                </p>
              </button>
            </div>

            <Separator className="my-8" />

            {/* Core Values - Empty */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-[#C76B4A]" />
                <h3>Core Values</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                      <div className="w-4 h-4 rounded-full border-2 border-dashed border-muted-foreground/40" />
                    </div>
                    <p className="text-xs text-muted-foreground/60">Value {i}</p>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Define Your Core Values
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Main Content - Tabs */}
        <Tabs defaultValue="impact" className="w-full">
          <TabsList className="grid w-full grid-cols-7 rounded-full bg-muted/30 mb-8">
            <TabsTrigger value="impact" className="rounded-full">
              Impact
            </TabsTrigger>
            <TabsTrigger value="projects" className="rounded-full">
              Projects
            </TabsTrigger>
            <TabsTrigger value="partnerships" className="rounded-full">
              Partnerships
            </TabsTrigger>
            <TabsTrigger value="structure" className="rounded-full">
              Structure
            </TabsTrigger>
            <TabsTrigger value="statute" className="rounded-full">
              Statute
            </TabsTrigger>
            <TabsTrigger value="culture" className="rounded-full">
              Culture
            </TabsTrigger>
            <TabsTrigger value="goals" className="rounded-full">
              Goals
            </TabsTrigger>
          </TabsList>

          {/* Impact Tab - Empty */}
          <TabsContent value="impact" className="space-y-6">
            <Card className="p-12 border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-colors cursor-pointer">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#7A9278]/10 to-[#5C8B89]/10 flex items-center justify-center">
                    <TrendingUp className="w-16 h-16 text-[#7A9278]/60" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg">Impact Creation Pipeline</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Map how your organization creates value and impact through your core operations.
                    Show each stage from sourcing to end-of-life.
                  </p>
                </div>

                <Button className="rounded-full bg-[#7A9278] hover:bg-[#7A9278]/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Impact Pipeline
                </Button>

                <div className="pt-4 text-xs text-muted-foreground">
                  <p>
                    💡 Tip: Focus on continuous operations - sourcing, processing, manufacturing,
                    distribution, end-of-life
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Projects Tab - Empty */}
          <TabsContent value="projects" className="space-y-6">
            <Card className="p-12 border-2 border-dashed border-muted-foreground/20 hover:border-[#5C8B89]/40 transition-colors cursor-pointer">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#5C8B89]/10 to-[#7A9278]/10 flex items-center justify-center">
                    <Briefcase className="w-16 h-16 text-[#5C8B89]/60" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg">Strategic Projects</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Showcase time-bound initiatives with defined start and end dates. Include impact
                    created, business value, and measurable outcomes.
                  </p>
                </div>

                <Button className="rounded-full bg-[#5C8B89] hover:bg-[#5C8B89]/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>

                <div className="pt-4 text-xs text-muted-foreground">
                  <p>💡 Tip: Include completed and ongoing projects with verified impact metrics</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Partnerships Tab - Empty */}
          <TabsContent value="partnerships" className="space-y-6">
            <Card className="p-12 border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-colors cursor-pointer">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#7A9278]/10 to-[#5C8B89]/10 flex items-center justify-center">
                    <Handshake className="w-16 h-16 text-[#7A9278]/60" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg">Strategic Partnerships</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Showcase your collaborative relationships with other organizations, the scope of
                    partnership, and impact created together.
                  </p>
                </div>

                <Button className="rounded-full bg-[#7A9278] hover:bg-[#7A9278]/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Partnership
                </Button>

                <div className="pt-4 text-xs text-muted-foreground">
                  <p>
                    💡 Tip: Include details about partnership duration, collaborative scope, and
                    measurable impact
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Structure Tab - Empty */}
          <TabsContent value="structure" className="space-y-6">
            <Card className="p-12 border-2 border-dashed border-muted-foreground/20 hover:border-[#C76B4A]/40 transition-colors cursor-pointer">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#C76B4A]/10 to-[#7A9278]/10 flex items-center justify-center">
                    <Layers className="w-16 h-16 text-[#C76B4A]/60" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg">Company Structure</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Share your organizational structure including executive leadership, departments,
                    team sizes, and areas of focus.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <Button className="rounded-full bg-[#C67B5C] hover:bg-[#C67B5C]/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Executive Team
                  </Button>
                  <Button variant="outline" className="rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Department
                  </Button>
                </div>

                <div className="pt-4 text-xs text-muted-foreground">
                  <p>
                    💡 Tip: Be transparent about your organizational hierarchy and team composition
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Statute Tab - Empty */}
          <TabsContent value="statute" className="space-y-6">
            <Card className="p-12 border-2 border-dashed border-muted-foreground/20 hover:border-[#5C8B89]/40 transition-colors cursor-pointer">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#5C8B89]/10 to-[#7A9278]/10 flex items-center justify-center">
                    <ScrollText className="w-16 h-16 text-[#5C8B89]/60" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg">Company Statute</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Share key provisions of your organizational statute or governing documents. Include
                    purpose, governance structure, and stakeholder rights.
                  </p>
                </div>

                <Button className="rounded-full bg-[#5C8B89] hover:bg-[#5C8B89]/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Statute Provisions
                </Button>

                <div className="pt-4 text-xs text-muted-foreground">
                  <p>
                    💡 Tip: Focus on the most relevant sections that define your organizational values
                    and governance
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Culture Tab - Empty */}
          <TabsContent value="culture" className="space-y-6">
            <Card className="p-12 border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-colors cursor-pointer">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#7A9278]/10 to-[#D4A574]/10 flex items-center justify-center">
                    <Coffee className="w-16 h-16 text-[#7A9278]/60" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg">Work Culture</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Describe how your organization works, collaborates, makes decisions, supports
                    learning, wellbeing, and fosters inclusion.
                  </p>
                </div>

                <Button className="rounded-full bg-[#7A9278] hover:bg-[#7A9278]/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Describe Your Culture
                </Button>

                <div className="pt-4 text-xs text-muted-foreground">
                  <p>
                    💡 Tip: Be specific about working styles, collaboration methods, and cultural
                    values
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Goals Tab - Empty */}
          <TabsContent value="goals" className="space-y-6">
            <Card className="p-12 border-2 border-dashed border-muted-foreground/20 hover:border-[#D4A574]/40 transition-colors cursor-pointer">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#D4A574]/10 to-[#7A9278]/10 flex items-center justify-center">
                    <Flag className="w-16 h-16 text-[#D4A574]/60" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg">Organizational Goals</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Set and track major organizational goals like carbon neutrality targets, diversity
                    commitments, or product innovation milestones.
                  </p>
                </div>

                <Button className="rounded-full bg-[#D4A574] hover:bg-[#D4A574]/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Goal
                </Button>

                <div className="pt-4 text-xs text-muted-foreground">
                  <p>
                    💡 Example: &quot;Achieve carbon neutrality by 2030&quot; or &quot;Reach 50% gender parity in
                    leadership by 2026&quot;
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Encouragement */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12"
        >
          <Card className="p-6 bg-gradient-to-r from-[#7A9278]/5 via-[#5C8B89]/5 to-[#C67B5C]/5 border-[#7A9278]/20">
            <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  ✨ Transparency builds trust. A complete profile helps stakeholders understand your
                  organization&apos;s values, structure, and commitments.
                </p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/60">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Verified info
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Trust & transparency
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  Impact-driven
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

