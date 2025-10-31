'use client';

import { useState, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import { Plus, BookOpen } from 'lucide-react';

interface ExpertiseAtlasClientProps {
  initialSkills: any[];
  domains: any[];
  hasSkills: boolean;
  widgetData: any | null;
}

export function ExpertiseAtlasClient({ 
  initialSkills, 
  domains, 
  hasSkills,
  widgetData
}: ExpertiseAtlasClientProps) {
  const [selectedL1, setSelectedL1] = useState<number | null>(null);
  const [selectedL2, setSelectedL2] = useState<any | null>(null);
  const [selectedL3, setSelectedL3] = useState<any | null>(null);
  const [isL2ModalOpen, setIsL2ModalOpen] = useState(false);
  const [isAddSkillDrawerOpen, setIsAddSkillDrawerOpen] = useState(false);
  const [isEditSkillWindowOpen, setIsEditSkillWindowOpen] = useState(false);
  const [skillToEdit, setSkillToEdit] = useState<any | null>(null);
  
  // Dashboard state
  const [filters, setFilters] = useState<FilterState>({
    l1Domains: [],
    status: 'all',
    recency: 'all',
  });
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [sideSheetFilter, setSideSheetFilter] = useState<string>('');

  // Filter skills for side sheet (must be before early return)
  const filteredSkills = useMemo(() => {
    // First filter out skills without taxonomy (custom skills with null skill_code)
    let filtered = initialSkills.filter(skill => skill.taxonomy !== null && skill.taxonomy !== undefined);

    // Apply L1 domain filter
    if (filters.l1Domains.length > 0) {
      filtered = filtered.filter(skill => 
        filters.l1Domains.includes(skill.taxonomy?.cat_id)
      );
    }

    // Apply status filter (credibility)
    if (filters.status !== 'all') {
      filtered = filtered.filter(skill => {
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
      filtered = filtered.filter(skill => {
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
  }, [initialSkills, filters]);

  // Handle skill added - refresh page
  const handleSkillAdded = () => {
    // Trigger page refresh to show new skill
    window.location.reload();
  };

  // If no skills, show empty state
  if (!hasSkills) {
    return (
      <div className="min-h-screen bg-[#F7F6F1]">
        <EmptyState onAddSkill={() => setIsAddSkillDrawerOpen(true)} />
        <AddSkillDrawer
          open={isAddSkillDrawerOpen}
          onOpenChange={setIsAddSkillDrawerOpen}
          domains={domains}
          onSkillAdded={handleSkillAdded}
        />
      </div>
    );
  }

  // Filter L3 subcategories based on selected L2
  const l3Subcategories = selectedL2
    ? initialSkills
        .filter((skill: any) => 
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
    ? initialSkills.filter((skill: any) =>
        skill.taxonomy?.cat_id === selectedL3.catId &&
        skill.taxonomy?.subcat_id === selectedL3.subcatId &&
        skill.taxonomy?.l3_id === selectedL3.l3Id
      )
    : [];

  const handleDomainClick = (catId: number) => {
    setSelectedL1(catId);
    setIsL2ModalOpen(true); // Open the modal to show L2 categories
    // In a real implementation, we'd fetch L2 categories here
  };

  const handleL3Click = (l3: any) => {
    setSelectedL3(l3);
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
    const skill = initialSkills.find(s => s.id === skillId);
    if (skill) handleSkillEdit(skill);
  };

  const handleActionClick = (skillId: string) => {
    const skill = initialSkills.find(s => s.id === skillId);
    if (skill) handleSkillEdit(skill);
  };

  const selectedDomain = domains.find((d) => d.catId === selectedL1);

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#2D3330] mb-2">
              Expertise Atlas
            </h1>
            <p className="text-[#6B6760]">
              Your skills mapped across {initialSkills.length} entries in {domains.filter(d => d.skillCount > 0).length} domains
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-[#4A5943] text-[#4A5943] hover:bg-[#EEF1EA]"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Learn More
            </Button>
            <Button
              onClick={() => setIsAddSkillDrawerOpen(true)}
              className="bg-[#4A5943] text-white hover:bg-[#3C4936]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>
        </div>

        {/* Dashboard Section */}
        {widgetData && (
          <div className="mb-8 space-y-6">
            <h2 className="text-2xl font-semibold text-[#2D3330]">Dashboard</h2>
            
            {/* Filters */}
            <DashboardFilters filters={filters} onFilterChange={setFilters} />

            {/* Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Row 1 */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <CredibilityPie 
                  data={widgetData.credibility} 
                  onSegmentClick={handleCredibilityClick}
                />
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <RelevanceBars 
                  data={widgetData.relevance} 
                  onBarClick={handleRelevanceClick}
                />
              </div>

              {/* Row 2 */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <SkillWheel 
                  data={widgetData.skillWheel} 
                  onSectorClick={handleWheelClick}
                />
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <VerificationSourcesPie 
                  data={widgetData.verificationSources} 
                  onSegmentClick={handleVerificationClick}
                />
              </div>

              {/* Row 3 - Full Width */}
              <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border">
                <RecencyScatter 
                  data={widgetData.scatter} 
                  onSkillClick={handleScatterClick}
                />
              </div>

              {/* Row 4 - Full Width */}
              <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border">
                <CoverageHeatmap 
                  data={widgetData.coverage} 
                  onCellClick={handleCoverageClick}
                />
              </div>

              {/* Row 5 - Full Width */}
              <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border">
                <NextBestActions 
                  actions={widgetData.nextBestActions} 
                  onActionClick={handleActionClick}
                />
              </div>
            </div>
          </div>
        )}

        {/* L1 Grid */}
        <h2 className="text-2xl font-semibold text-[#2D3330] mb-4">Skill Domains</h2>
        <L1Grid domains={domains} onDomainClick={handleDomainClick} />

        {/* L2 Modal */}
        <L2Modal
          open={isL2ModalOpen}
          onOpenChange={setIsL2ModalOpen}
          l1Name={selectedDomain?.nameI18n?.en || ''}
          l2Category={selectedL2}
          l3Subcategories={l3Subcategories}
          onL3Click={handleL3Click}
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

        {/* Skills Side Sheet */}
        <SkillsSideSheet
          open={isSideSheetOpen}
          onOpenChange={setIsSideSheetOpen}
          skills={filteredSkills}
          filterDescription={sideSheetFilter || 'All Skills'}
          onSkillClick={(skillId: string) => {
            const skill = initialSkills.find(s => s.id === skillId);
            if (skill) handleSkillEdit(skill);
          }}
        />
      </div>
    </div>
  );
}

