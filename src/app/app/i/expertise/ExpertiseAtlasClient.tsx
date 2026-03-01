'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { CVJDAutoSuggest } from '@/components/expertise/CVJDAutoSuggest';
import { SkillGapsClient } from '@/components/skill-gaps/SkillGapsClient';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BookOpen, TrendingUp, FileText, Grid3x3 } from 'lucide-react';
import { AboutSection } from './components/AboutSection';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { normalizeSkillForClient } from './utils/normalizeSkill';

interface ExpertiseAtlasClientProps {
  initialSkills: any[];
  domains: any[];
  taxonomyReady: boolean;
  widgetData: any | null;
  initialTab?: 'atlas' | 'gap-analysis' | 'import-cv';
}

export function ExpertiseAtlasClient({
  initialSkills,
  domains,
  taxonomyReady,
  widgetData,
  initialTab = 'atlas',
}: ExpertiseAtlasClientProps) {
  const router = useRouter();
  const [skills, setSkills] = useState(initialSkills);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedL1, setSelectedL1] = useState<number | null>(null);
  const [selectedL2, setSelectedL2] = useState<any | null>(null);
  const [selectedL3, setSelectedL3] = useState<any | null>(null);
  const [isL2ModalOpen, setIsL2ModalOpen] = useState(false);
  const [isAddSkillDrawerOpen, setIsAddSkillDrawerOpen] = useState(false);
  const [isEditSkillWindowOpen, setIsEditSkillWindowOpen] = useState(false);
  const [editSkillFocus, setEditSkillFocus] = useState<'details' | 'proofs' | 'verification'>(
    'details'
  );
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
  const emitClientMetric = (event: string, payload?: Record<string, any>) => {
    try {
      console.debug('analytics:event', event, payload);
    } catch {
      // ignore
    }
  };
  const readiness = useMemo(() => {
    const total = skills.length;
    const proofed = skills.filter((s: any) => (s.proof_count || 0) > 0).length;
    const verified = skills.filter((s: any) => (s.verification_count || 0) > 0).length;
    const fresh = skills.filter((s: any) => {
      if (!s.lastUsedAt) return false;
      const monthsAgo =
        (Date.now() - new Date(s.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo <= 18;
    }).length;

    const score =
      Math.min(total / 3, 1) * 40 +
      Math.min(proofed / 2, 1) * 30 +
      Math.min(verified / 1, 1) * 20 +
      (total > 0 ? Math.min(fresh / total, 1) * 10 : 0);

    let nextStep = 'You look match-ready!';
    if (total < 3) nextStep = 'Add 3 skills to unlock the dashboard and matching.';
    else if (proofed < 2) nextStep = 'Attach proofs to your top 2 skills.';
    else if (verified < 1) nextStep = 'Request one verification to boost credibility.';
    else if (fresh < Math.max(1, Math.ceil(total * 0.5)))
      nextStep = 'Update recency on a key skill.';

    return {
      score: Math.round(Math.min(100, score)),
      total,
      proofed,
      verified,
      fresh,
      nextStep,
    };
  }, [skills]);

  // Keep local skills in sync when server data changes
  useEffect(() => {
    setSkills(initialSkills);
  }, [initialSkills]);

  // Keep selected tab synced with deep-link query values.
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Filter skills for side sheet (must be before early return)
  const filteredSkills = useMemo(() => {
    // Keep all skills; ensure we don’t drop custom/unnormalized items
    let filtered = skills.map((s) => normalizeSkillForClient(s) || s);

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

  const hasAnySkills = skills.length > 0;

  // Handle skill added - optimistic update + soft refresh
  const handleSkillAdded = (skill?: any) => {
    if (skill) {
      const normalized = normalizeSkillForClient(skill);
      setSkills((prev) => {
        const existing = normalized?.id ? prev.find((s) => s.id === normalized.id) : undefined;
        if (existing) {
          return prev.map((s) => (s.id === normalized?.id ? { ...existing, ...normalized } : s));
        }
        return normalized ? [...prev, normalized] : prev;
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
        taxonomyReady={taxonomyReady}
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

  const handleSkillEdit = (
    skill: any,
    focus: 'details' | 'proofs' | 'verification' = 'details'
  ) => {
    setSkillToEdit(skill);
    setEditSkillFocus(focus);
    setIsEditSkillWindowOpen(true);
  };

  const handleSkillDeleted = () => {
    if (skillToEdit?.id) {
      setSkills((prev) => prev.filter((skill) => skill.id !== skillToEdit.id));
    }
    setSkillToEdit(null);
    router.refresh();
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
    const domainName =
      domains.find((domain) => domain.catId === l1)?.nameI18n?.en || `Domain ${l1}`;
    const categoryName =
      l2CategoriesPerL1[l1]?.find((category) => category.subcatId === l2)?.nameI18n?.en ||
      `Category ${l2}`;

    setSideSheetFilter(`Skills in ${domainName} / ${categoryName}`);
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
  const credibilityTotal = widgetData
    ? (widgetData.credibility?.verified || 0) +
      (widgetData.credibility?.proofOnly || 0) +
      (widgetData.credibility?.claimOnly || 0)
    : 0;
  const relevanceTotal = widgetData
    ? (widgetData.relevance?.obsolete || 0) +
      (widgetData.relevance?.current || 0) +
      (widgetData.relevance?.emerging || 0)
    : 0;
  const verificationSourcesTotal = widgetData
    ? (widgetData.verificationSources?.self || 0) +
      (widgetData.verificationSources?.peer || 0) +
      (widgetData.verificationSources?.manager || 0) +
      (widgetData.verificationSources?.external || 0)
    : 0;
  const shouldShowCredibility = credibilityTotal > 0;
  const shouldShowRelevance = relevanceTotal > 0;
  const shouldShowSkillWheel = Boolean(widgetData?.skillWheel?.length);
  const shouldShowVerificationSources = verificationSourcesTotal > 0;
  const shouldShowScatter = Boolean(widgetData?.scatter?.length);
  const shouldShowCoverage = Boolean(widgetData?.coverage?.length);
  const shouldShowNextBestActions = Boolean(widgetData?.nextBestActions?.length);
  const shouldShowAnyWidget =
    shouldShowCredibility ||
    shouldShowRelevance ||
    shouldShowSkillWheel ||
    shouldShowVerificationSources ||
    shouldShowScatter ||
    shouldShowCoverage ||
    shouldShowNextBestActions;

  const handleSkillsImportedFromCV = () => {
    router.refresh();
  };

  const isV2 = process.env.NEXT_PUBLIC_UI_REFACTOR_V2 === 'true';
  const bgClass = isV2 ? 'bg-transparent' : 'bg-proofound-parchment';

  return (
    <div className={`min-h-[calc(100vh-3.5rem)] ${bgClass}`}>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
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
              asChild
            >
              <Link href="/docs/expertise-atlas">
                <BookOpen className="h-4 w-4 mr-2" />
                Learn More
              </Link>
            </Button>
            <Button
              onClick={() => {
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

        {!taxonomyReady && (
          <div className="mb-6 rounded-lg border border-[#C76B4A] bg-[#FFF0F0] px-4 py-3 text-sm text-[#8B4A36]">
            Expertise taxonomy data is currently unavailable. Dashboard coverage and add-skill
            search will be limited until recovery completes.
          </div>
        )}

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
            {!hasAnySkills ? (
              emptyStateContent
            ) : (
              <>
                {/* Dashboard Section */}
                {widgetData && (
                  <div className="mb-8 space-y-6">
                    <h2 className="text-2xl font-semibold text-proofound-charcoal font-display">
                      Dashboard
                    </h2>

                    <div className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-xl p-6 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Match-readiness snapshot</p>
                          <h3 className="text-xl font-semibold text-proofound-charcoal mt-1">
                            {readiness.score}% ready
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Why this matters: solid signals (skills + proofs + recency) increase
                            your rank transparency and intro quality.
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-proofound-parchment text-proofound-forest"
                        >
                          {readiness.nextStep}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <Progress value={readiness.score} className="h-2" />
                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                          <span>{readiness.total} skills</span>
                          <span>{readiness.proofed} with proofs</span>
                          <span>{readiness.verified} verified</span>
                          <span>{readiness.fresh} used in last 18 months</span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <Button
                          size="sm"
                          onClick={() => {
                            emitClientMetric('expertise_readiness_cta', { action: 'add_skill' });
                            setIsAddSkillDrawerOpen(true);
                          }}
                        >
                          Add skill or proof now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            emitClientMetric('expertise_readiness_cta', { action: 'import_cv' });
                            setActiveTab('import-cv');
                          }}
                        >
                          Auto-suggest from CV
                        </Button>
                      </div>
                    </div>

                    {/* Filters */}
                    <DashboardFilters filters={filters} onFilterChange={setFilters} />

                    {/* Widgets Grid */}
                    {shouldShowAnyWidget && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Row 1 */}
                        {shouldShowCredibility && (
                          <div className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-xl p-6 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300">
                            <p className="text-xs text-muted-foreground mb-2">
                              Why this matters: proofs + verifications boost trust in matches.
                            </p>
                            <CredibilityPie
                              data={widgetData.credibility}
                              onSegmentClick={handleCredibilityClick}
                            />
                          </div>
                        )}
                        {shouldShowRelevance && (
                          <div className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-xl p-6 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300">
                            <p className="text-xs text-muted-foreground mb-2">
                              Why this matters: align your skills to what roles need now.
                            </p>
                            <RelevanceBars
                              data={widgetData.relevance}
                              onBarClick={handleRelevanceClick}
                            />
                          </div>
                        )}

                        {/* Row 2 */}
                        {shouldShowSkillWheel && (
                          <div className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-xl p-6 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300">
                            <p className="text-xs text-muted-foreground mb-2">
                              Why this matters: breadth vs focus—click a sector to deepen proof.
                            </p>
                            <SkillWheel
                              data={widgetData.skillWheel}
                              onSectorClick={handleWheelClick}
                            />
                          </div>
                        )}
                        {shouldShowVerificationSources && (
                          <div className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-xl p-6 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300">
                            <p className="text-xs text-muted-foreground mb-2">
                              Why this matters: see where verifications come from; rebalance if
                              needed.
                            </p>
                            <VerificationSourcesPie
                              data={widgetData.verificationSources}
                              onSegmentClick={handleVerificationClick}
                            />
                          </div>
                        )}

                        {/* Row 3 - Full Width */}
                        {shouldShowScatter && (
                          <div className="lg:col-span-2 rounded-xl border border-white/40 bg-white/60 backdrop-blur-xl p-6 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300">
                            <p className="text-xs text-muted-foreground mb-2">
                              Why this matters: freshness drives match rank. Update stale items.
                            </p>
                            <RecencyScatter
                              data={widgetData.scatter}
                              onSkillClick={handleScatterClick}
                            />
                          </div>
                        )}

                        {/* Row 4 - Full Width */}
                        {shouldShowCoverage && (
                          <div className="lg:col-span-2 rounded-xl border border-white/40 bg-white/60 backdrop-blur-xl p-6 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300">
                            <p className="text-xs text-muted-foreground mb-2">
                              Why this matters: coverage shows where you’re strong and what to fill
                              next.
                            </p>
                            <CoverageHeatmap
                              data={widgetData.coverage}
                              onCellClick={handleCoverageClick}
                            />
                          </div>
                        )}

                        {/* Row 5 - Full Width */}
                        {shouldShowNextBestActions && (
                          <div className="lg:col-span-2 rounded-xl border border-white/40 bg-white/60 backdrop-blur-xl p-6 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300">
                            <p className="text-xs text-muted-foreground mb-2">
                              Why this matters: do the next best actions to lift readiness quickly.
                            </p>
                            <NextBestActions
                              actions={widgetData.nextBestActions}
                              onActionClick={handleActionClick}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* L1 Grid */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Skill Domains</h2>
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
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      Skills in {selectedL3?.nameI18n?.en || 'Unknown'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {l4Skills.map((skill: any) => (
                        <L4Card
                          key={skill.id}
                          skill={skill}
                          onEdit={(focus) => handleSkillEdit(skill, focus || 'details')}
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
            <SkillGapsClient />
          </TabsContent>

          {/* Import from CV Tab */}
          <TabsContent value="import-cv">
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Import Skills from CV/Resume
                </h2>
                <p className="text-muted-foreground mb-6">
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
          taxonomyReady={taxonomyReady}
          onSkillAdded={handleSkillAdded}
        />

        {/* Edit Skill Window */}
        <EditSkillWindow
          open={isEditSkillWindowOpen}
          onOpenChange={(open) => {
            setIsEditSkillWindowOpen(open);
            if (!open) {
              setEditSkillFocus('details');
            }
          }}
          skill={skillToEdit}
          initialFocus={editSkillFocus}
          onSkillUpdated={handleSkillAdded}
          onSkillDeleted={handleSkillDeleted}
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
