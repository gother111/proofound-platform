'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from './components/EmptyState';
import { L1Grid } from './components/L1Grid';
import { L2Modal } from './components/L2Modal';
import { L4Card } from './components/L4Card';
import { AddSkillDrawer } from './components/AddSkillDrawer';
import { EditSkillWindow } from './components/EditSkillWindow';
import { DashboardFilters, FilterState } from './components/DashboardFilters';
import { SkillsSideSheet } from './components/SkillsSideSheet';
import { CredibilityPie } from './widgets/CredibilityPie';
import { CoverageHeatmap } from './widgets/CoverageHeatmap';
import { RelevanceBars } from './widgets/RelevanceBars';
import { RecencyScatter } from './widgets/RecencyScatter';
import { SkillWheel } from './widgets/SkillWheel';
import { VerificationSourcesPie } from './widgets/VerificationSourcesPie';
import { NextBestActions } from './widgets/NextBestActions';
import { LinkedInImportModal } from '@/components/expertise/LinkedInImportModal';
import { GapMap } from '@/components/expertise/GapMap';
import { CVJDAutoSuggest } from '@/components/expertise/CVJDAutoSuggest';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BookOpen, Linkedin, TrendingUp, FileText, Grid3x3 } from 'lucide-react';
import { AboutSection } from './components/AboutSection';

interface ExpertiseAtlasClientProps {
  initialSkills: any[];
  domains: any[];
  hasSkills: boolean;
  widgetData: any | null;
  linkedInConnected: boolean;
}

export function ExpertiseAtlasClient({
  initialSkills,
  domains,
  hasSkills,
  widgetData,
  linkedInConnected,
}: ExpertiseAtlasClientProps) {
  const router = useRouter();
  const [skills, setSkills] = useState(initialSkills);
  const [activeTab, setActiveTab] = useState<string>('atlas');
  const [selectedL1, setSelectedL1] = useState<number | null>(null);
  const [selectedL2, setSelectedL2] = useState<any | null>(null);
  const [selectedL3, setSelectedL3] = useState<any | null>(null);
  const [isL2ModalOpen, setIsL2ModalOpen] = useState(false);
  const [isAddSkillDrawerOpen, setIsAddSkillDrawerOpen] = useState(false);
  const [isEditSkillWindowOpen, setIsEditSkillWindowOpen] = useState(false);
  const [isLinkedInImportModalOpen, setIsLinkedInImportModalOpen] = useState(false);
  const [skillToEdit, setSkillToEdit] = useState<any | null>(null);
  const [expandedL4, setExpandedL4] = useState<string | null>(null);

  // Dashboard state
  const [filters, setFilters] = useState<FilterState>({
    l1Domains: [],
    status: 'all',
    recency: 'all',
  });
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [sideSheetFilter, setSideSheetFilter] = useState<string>('');

  // Keep local skills in sync when server data changes
  useEffect(() => {
    setSkills(initialSkills);
  }, [initialSkills]);

  // Filter skills for side sheet (must be before early return)
  const filteredSkills = useMemo(() => {
    // First filter out skills without taxonomy (custom skills with null skill_code)
    let filtered = skills.filter((skill) => skill.taxonomy !== null && skill.taxonomy !== undefined);

    // Apply L1 domain filter
    if (filters.l1Domains.length > 0) {
      filtered = filtered.filter((skill) => filters.l1Domains.includes(skill.taxonomy?.cat_id));
    }

    // Apply status filter (credibility)
    if (filters.status !== 'all') {
      filtered = filtered.filter((skill) => {
        const hasProof = (skill.proof_count || 0) > 0;
        const hasVerification = (skill.verification_count || 0) > 0;

        if (filters.status === 'verified') {
          return hasProof && hasVerification;
        } else if (filters.status === 'proofOnly') {
          return hasProof && !hasVerification;
        } else if (filters.status === 'claimOnly') {
          return !hasProof && !hasVerification;
        }
        return true;
      });
    }

    // Apply recency filter
    if (filters.recency !== 'all') {
      const now = new Date();
      filtered = filtered.filter((skill) => {
        if (!skill.lastUsedAt) return filters.recency === 'rusty';

        const monthsAgo = Math.floor(
          (now.getTime() - new Date(skill.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        if (filters.recency === 'active') return monthsAgo <= 6;
        if (filters.recency === 'recent') return monthsAgo > 6 && monthsAgo <= 24;
        if (filters.recency === 'rusty') return monthsAgo > 24;
        return true;
      });
    }

    return filtered;
  }, [skills, filters]);

  // Handle skill added - optimistic update + soft refresh
  const handleSkillAdded = (skill?: any) => {
    if (skill) {
      setSkills((prev) => {
        const existing = prev.find((s) => s.id === skill.id);
        if (existing) {
          return prev.map((s) => (s.id === skill.id ? { ...existing, ...skill } : s));
        }
        return [...prev, skill];
      });
    }
    router.refresh();
  };

  // Render empty state in a tab if no skills
  const emptyStateContent = (
    <>
      <EmptyState
        onAddSkill={() => setIsAddSkillDrawerOpen(true)}
        onImportCV={() => setActiveTab('import-cv')}
      />
      <AddSkillDrawer
        open={isAddSkillDrawerOpen}
        onOpenChange={setIsAddSkillDrawerOpen}
        domains={domains}
        onSkillAdded={handleSkillAdded}
      />
    </>
  );

  // Filter L3 subcategories based on selected L2
  const l3Subcategories = selectedL2
    ? skills
        .filter(
          (skill: any) =>
            skill.taxonomy?.cat_id === selectedL2.catId &&
            skill.taxonomy?.subcat_id === selectedL2.subcatId
        )
        .reduce((acc: any[], skill: any) => {
          const existing = acc.find((item) => item.l3Id === skill.taxonomy.l3_id);
          if (!existing && skill.taxonomy) {
            acc.push({
              catId: skill.taxonomy.cat_id,
              subcatId: skill.taxonomy.subcat_id,
              l3Id: skill.taxonomy.l3_id,
              slug: skill.taxonomy.slug,
              nameI18n: skill.taxonomy.name_i18n || { en: 'Unknown' },
              l4Count: 1,
            });
          } else if (existing) {
            existing.l4Count++;
          }
          return acc;
        }, [])
    : [];

  // Filter L4 skills based on selected L3
  const l4Skills = selectedL3
    ? skills.filter(
        (skill: any) =>
          skill.taxonomy?.cat_id === selectedL3.catId &&
          skill.taxonomy?.subcat_id === selectedL3.subcatId &&
          skill.taxonomy?.l3_id === selectedL3.l3Id
      )
    : [];

  // Calculate L2 categories per L1 domain (only those with user skills)
  const l2CategoriesPerL1 = useMemo(() => {
    const result: Record<number, any[]> = {};

    skills.forEach((skill: any) => {
      if (!skill.taxonomy?.cat_id || !skill.taxonomy?.subcat_id) return;

      const catId = skill.taxonomy.cat_id;
      const subcatId = skill.taxonomy.subcat_id;

      if (!result[catId]) {
        result[catId] = [];
      }

      // Check if this L2 category already exists in the array
      const existing = result[catId].find((l2: any) => l2.subcatId === subcatId);
      if (!existing) {
        result[catId].push({
          catId: skill.taxonomy.cat_id,
          subcatId: skill.taxonomy.subcat_id,
          slug: skill.taxonomy.slug || `l2-${subcatId}`,
          nameI18n: skill.taxonomy.name_i18n || { en: 'Unknown' },
          l4Count: 1,
        });
      } else {
        existing.l4Count++;
      }
    });

    return result;
  }, [skills]);

  const handleDomainClick = (catId: number) => {
    setSelectedL1(catId);
    // Don't automatically open modal - let expansion show L2 categories inline
  };

  const handleL2Click = (l2: any) => {
    setSelectedL2(l2);
    setIsL2ModalOpen(true);
  };

  const handleL3Click = (l3: any) => {
    setSelectedL3(l3);
  };

  const handleL4Toggle = (skillId: string) => {
    setExpandedL4(expandedL4 === skillId ? null : skillId);
  };

  const handleSkillEdit = (skill: any) => {
    setSkillToEdit(skill);
    setIsEditSkillWindowOpen(true);
  };

  const handleSkillDeleted = () => {
    // Refresh page after deletion
    window.location.reload();
  };

  // Widget click handlers
  const handleCredibilityClick = (status: 'verified' | 'proofOnly' | 'claimOnly') => {
    setSideSheetFilter(`${status} Skills`);
    setFilters({ ...filters, status });
    setIsSideSheetOpen(true);
  };

  const handleRelevanceClick = (relevance: 'obsolete' | 'current' | 'emerging') => {
    setSideSheetFilter(`${relevance.charAt(0).toUpperCase() + relevance.slice(1)} Skills`);
    setIsSideSheetOpen(true);
  };

  const handleCoverageClick = (l1: number, l2: number) => {
    setSideSheetFilter(`Skills in L1-${l1} / L2-${l2}`);
    setFilters({ ...filters, l1Domains: [l1] });
    setIsSideSheetOpen(true);
  };

  const handleWheelClick = (domain: string) => {
    setSideSheetFilter(`Skills in ${domain}`);
    setIsSideSheetOpen(true);
  };

  const handleVerificationClick = (source: 'self' | 'peer' | 'manager' | 'external') => {
    setSideSheetFilter(`${source.charAt(0).toUpperCase() + source.slice(1)} Verified Skills`);
    setIsSideSheetOpen(true);
  };

  const handleScatterClick = (skillId: string) => {
    const skill = skills.find((s) => s.id === skillId);
    if (skill) handleSkillEdit(skill);
  };

  const handleActionClick = (skillId: string) => {
    const skill = skills.find((s) => s.id === skillId);
    if (skill) handleSkillEdit(skill);
  };

  const selectedDomain = domains.find((d) => d.catId === selectedL1);

  const handleSkillsImportedFromCV = () => {
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-proofound-parchment">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold text-proofound-charcoal mb-2 font-display">
              Expertise Atlas
            </h1>
            <p className="text-muted-foreground font-sans text-lg">
              Your skills mapped across {skills.length} entries in{' '}
              {domains.filter((d) => d.skillCount > 0).length} domains
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-proofound-forest text-proofound-forest hover:bg-proofound-forest/10 font-medium rounded-xl"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Learn More
            </Button>
            {linkedInConnected && (
              <Button
                onClick={() => setIsLinkedInImportModalOpen(true)}
                variant="outline"
                className="border-[#0A66C2] text-[#0A66C2] hover:bg-blue-50 font-medium rounded-xl"
              >
                <Linkedin className="h-4 w-4 mr-2" />
                Import from LinkedIn
              </Button>
            )}
            <Button
              onClick={() => {
                console.log('DEBUG: Add Skill button clicked');
                setIsAddSkillDrawerOpen(true);
              }}
              className="bg-proofound-forest text-white hover:bg-proofound-forest/90 font-medium rounded-xl shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>
        </div>

        {/* About Section */}
        <AboutSection />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="atlas" className="flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              Skills Atlas
            </TabsTrigger>
            <TabsTrigger
              value="gap-analysis"
              className="flex items-center gap-2"
              data-tour="gap-analysis-tab"
            >
              <TrendingUp className="h-4 w-4" />
              Gap Analysis
            </TabsTrigger>
            <TabsTrigger
              value="import-cv"
              className="flex items-center gap-2"
              data-tour="import-cv-tab"
            >
              <FileText className="h-4 w-4" />
              Import from CV
            </TabsTrigger>
          </TabsList>

          {/* Skills Atlas Tab */}
          <TabsContent value="atlas" className="space-y-6">
            {!hasSkills ? (
              emptyStateContent
            ) : (
              <>
                {/* Dashboard Section */}
                {widgetData && (
                  <div className="mb-8 space-y-6">
                    <h2 className="text-2xl font-semibold text-proofound-charcoal font-display">
                      Dashboard
                    </h2>

                    {/* Filters */}
                    <DashboardFilters filters={filters} onFilterChange={setFilters} />

                    {/* Widgets Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Row 1 */}
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-proofound-stone hover:shadow-md transition-shadow duration-300">
                        <CredibilityPie
                          data={widgetData.credibility}
                          onSegmentClick={handleCredibilityClick}
                        />
                      </div>
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-proofound-stone hover:shadow-md transition-shadow duration-300">
                        <RelevanceBars
                          data={widgetData.relevance}
                          onBarClick={handleRelevanceClick}
                        />
                      </div>

                      {/* Row 2 */}
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-proofound-stone hover:shadow-md transition-shadow duration-300">
                        <SkillWheel data={widgetData.skillWheel} onSectorClick={handleWheelClick} />
                      </div>
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-proofound-stone hover:shadow-md transition-shadow duration-300">
                        <VerificationSourcesPie
                          data={widgetData.verificationSources}
                          onSegmentClick={handleVerificationClick}
                        />
                      </div>

                      {/* Row 3 - Full Width */}
                      <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-proofound-stone hover:shadow-md transition-shadow duration-300">
                        <RecencyScatter
                          data={widgetData.scatter}
                          onSkillClick={handleScatterClick}
                        />
                      </div>

                      {/* Row 4 - Full Width */}
                      <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-proofound-stone hover:shadow-md transition-shadow duration-300">
                        <CoverageHeatmap
                          data={widgetData.coverage}
                          onCellClick={handleCoverageClick}
                        />
                      </div>

                      {/* Row 5 - Full Width */}
                      <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-proofound-stone hover:shadow-md transition-shadow duration-300">
                        <NextBestActions
                          actions={widgetData.nextBestActions}
                          onActionClick={handleActionClick}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* L1 Grid */}
                <div>
                  <h2 className="text-2xl font-semibold text-[#2D3330] mb-4">Skill Domains</h2>
                  <L1Grid
                    domains={domains}
                    onDomainClick={handleDomainClick}
                    l2CategoriesPerL1={l2CategoriesPerL1}
                    onL2Click={handleL2Click}
                  />
                </div>

                {/* L2 Modal */}
                <L2Modal
                  open={isL2ModalOpen}
                  onOpenChange={setIsL2ModalOpen}
                  l1Name={selectedDomain?.nameI18n?.en || ''}
                  l2Category={selectedL2}
                  l3Subcategories={l3Subcategories}
                  l4Skills={l4Skills}
                  expandedL4={expandedL4}
                  onL3Click={handleL3Click}
                  onL4Toggle={handleL4Toggle}
                  onL4Edit={handleSkillEdit}
                />

                {/* L4 Skills Grid (when L3 is selected) */}
                {selectedL3 && l4Skills.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-[#2D3330] mb-4">
                      Skills in {selectedL3?.nameI18n?.en || 'Unknown'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {l4Skills.map((skill: any) => (
                        <L4Card
                          key={skill.id}
                          skill={skill}
                          onEdit={() => handleSkillEdit(skill)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Gap Analysis Tab */}
          <TabsContent value="gap-analysis">
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h2 className="text-2xl font-semibold text-[#2D3330] mb-4">
                  Identify Your Skill Gaps
                </h2>
                <p className="text-[#6B6760] mb-6">
                  Analyze your current skills against target role requirements and get personalized
                  recommendations for growth.
                </p>
                <GapMap />
              </div>
            </div>
          </TabsContent>

          {/* Import from CV Tab */}
          <TabsContent value="import-cv">
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h2 className="text-2xl font-semibold text-[#2D3330] mb-4">
                  Import Skills from CV/Resume
                </h2>
                <p className="text-[#6B6760] mb-6">
                  Paste your CV, resume, or job description to automatically extract and suggest
                  relevant skills.
                </p>
                <CVJDAutoSuggest onSkillsAdded={handleSkillsImportedFromCV} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Skill Drawer */}
        <AddSkillDrawer
          open={isAddSkillDrawerOpen}
          onOpenChange={setIsAddSkillDrawerOpen}
          domains={domains}
          onSkillAdded={handleSkillAdded}
        />

        {/* Edit Skill Window */}
        <EditSkillWindow
          open={isEditSkillWindowOpen}
          onOpenChange={setIsEditSkillWindowOpen}
          skill={skillToEdit}
          onSkillUpdated={handleSkillAdded}
          onSkillDeleted={handleSkillDeleted}
        />

        {/* LinkedIn Import Modal */}
        <LinkedInImportModal
          open={isLinkedInImportModalOpen}
          onOpenChange={setIsLinkedInImportModalOpen}
          onSkillsImported={handleSkillAdded}
        />

        {/* Skills Side Sheet */}
        <SkillsSideSheet
          open={isSideSheetOpen}
          onOpenChange={setIsSideSheetOpen}
          skills={filteredSkills}
          filterDescription={sideSheetFilter || 'All Skills'}
          onSkillClick={(skillId: string) => {
            const skill = skills.find((s) => s.id === skillId);
            if (skill) handleSkillEdit(skill);
          }}
        />
      </div>
    </div>
  );
}
