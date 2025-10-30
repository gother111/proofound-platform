'use client';

import { useState } from 'react';
import { EmptyState } from './components/EmptyState';
import { L1Grid } from './components/L1Grid';
import { L2Modal } from './components/L2Modal';
import { L4Card } from './components/L4Card';
import { AddSkillDrawer } from './components/AddSkillDrawer';
import { EditSkillWindow } from './components/EditSkillWindow';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen } from 'lucide-react';

interface ExpertiseAtlasClientProps {
  initialSkills: any[];
  domains: any[];
  hasSkills: boolean;
}

export function ExpertiseAtlasClient({ 
  initialSkills, 
  domains, 
  hasSkills 
}: ExpertiseAtlasClientProps) {
  const [selectedL1, setSelectedL1] = useState<number | null>(null);
  const [selectedL2, setSelectedL2] = useState<any | null>(null);
  const [selectedL3, setSelectedL3] = useState<any | null>(null);
  const [isL2ModalOpen, setIsL2ModalOpen] = useState(false);
  const [isAddSkillDrawerOpen, setIsAddSkillDrawerOpen] = useState(false);
  const [isEditSkillWindowOpen, setIsEditSkillWindowOpen] = useState(false);
  const [skillToEdit, setSkillToEdit] = useState<any | null>(null);

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

        {/* L1 Grid */}
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
              Skills in {selectedL3.nameI18n.en}
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
      </div>
    </div>
  );
}

