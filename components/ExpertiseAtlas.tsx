"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Plus,
  Edit,
  Trash2,
  Award,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Microscope,
  FileCheck,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ExpertiseAtlasProps {
  profile: any;
  expertiseData: any[];
  proofs: any[];
}

// Skill categories based on cognitive science
const SKILL_CATEGORIES = [
  { id: 'cognitive', name: 'Cognitive', icon: '🧠', color: '#7A9278' },
  { id: 'interpersonal', name: 'Interpersonal', icon: '🤝', color: '#C76B4A' },
  { id: 'technical', name: 'Technical', icon: '⚙️', color: '#5C8B89' },
  { id: 'creative', name: 'Creative', icon: '🎨', color: '#D4A574' },
  { id: 'leadership', name: 'Leadership', icon: '👥', color: '#8B9556' },
  { id: 'specialized', name: 'Specialized', icon: '🎯', color: '#B5695C' },
];

export function ExpertiseAtlas({ profile, expertiseData, proofs }: ExpertiseAtlasProps) {
  const router = useRouter();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Group expertise by category
  const expertiseByCategory = expertiseData.reduce((acc, item) => {
    const category = item.category || 'specialized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate completion percentage
  const totalSkills = expertiseData.length;
  const verifiedSkills = expertiseData.filter(e => e.verification_status === 'verified').length;
  const completionPercentage = totalSkills > 0 ? (verifiedSkills / totalSkills) * 100 : 0;

  const handleAddSkill = () => {
    router.push('/profile/expertise/new');
  };

  const handleEditSkill = (skillId: string) => {
    router.push(`/profile/expertise/${skillId}/edit`);
  };

  const handleDeleteSkill = async (skillId: string) => {
    // TODO: Implement skill deletion
    console.log('Delete skill:', skillId);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#1C4D3A', stopOpacity: 0.1 }} />
              <stop offset="50%" style={{ stopColor: '#C76B4A', stopOpacity: 0.05 }} />
              <stop offset="100%" style={{ stopColor: '#5F8C6F', stopOpacity: 0.1 }} />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg-gradient)" />
          <motion.circle
            cx="20%"
            cy="30%"
            r="300"
            fill="#1C4D3A"
            opacity="0.03"
            animate={{
              cx: ['20%', '25%', '20%'],
              cy: ['30%', '35%', '30%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.circle
            cx="80%"
            cy="70%"
            r="250"
            fill="#C76B4A"
            opacity="0.03"
            animate={{
              cx: ['80%', '75%', '80%'],
              cy: ['70%', '65%', '70%'],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl font-display font-semibold mb-2" style={{ color: '#2D3330' }}>
                Expertise Atlas
              </h1>
              <p className="text-lg" style={{ color: '#6B6760' }}>
                Map your capabilities with proof—individuals and organizations
              </p>
            </div>
            
            <Button onClick={handleAddSkill} className="bg-[#1C4D3A] hover:bg-[#1C4D3A]/90 text-white gap-2">
              <Plus className="w-4 h-4" />
              Add Skill
            </Button>
          </div>

          {/* Progress Card */}
          <Card className="p-6 bg-gradient-to-br from-[#1C4D3A]/5 to-[#C76B4A]/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold" style={{ color: '#2D3330' }}>
                  Atlas Completion
                </h3>
                <p className="text-sm" style={{ color: '#6B6760' }}>
                  {verifiedSkills} of {totalSkills} skills verified
                </p>
              </div>
              <div className="text-3xl font-display font-bold" style={{ color: '#1C4D3A' }}>
                {Math.round(completionPercentage)}%
              </div>
            </div>
            <Progress value={completionPercentage} className="h-3" />
          </Card>

          {/* About Section */}
          <Collapsible open={isAboutOpen} onOpenChange={setIsAboutOpen}>
            <Card className="p-6 bg-gradient-to-br from-[#1C4D3A]/5 to-[#C76B4A]/5 border border-[#1C4D3A]/20">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-0 hover:bg-transparent"
                >
                  <h3 className="text-lg font-semibold" style={{ color: '#2D3330' }}>
                    About Expertise Atlas
                  </h3>
                  {isAboutOpen ? (
                    <ChevronUp className="w-5 h-5" style={{ color: '#2D3330' }} />
                  ) : (
                    <ChevronDown className="w-5 h-5" style={{ color: '#2D3330' }} />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-6 space-y-6">
                <p style={{ color: '#2D3330' }}>
                  We at Proofound strive to improve the outdated CV standards. Instead of forcing people to fit into an A4 box, we provide a limitless field—an atlas—to map your expertise without pressure to fit external expectations.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-5">
                    <div className="w-10 h-10 rounded-xl bg-[#1C4D3A]/10 flex items-center justify-center mb-3">
                      <Microscope className="w-5 h-5" style={{ color: '#1C4D3A' }} />
                    </div>
                    <h4 className="font-semibold mb-2" style={{ color: '#2D3330' }}>
                      Scientific Research Base
                    </h4>
                    <p className="text-sm" style={{ color: '#6B6760' }}>
                      Our six skill categories are grounded in cognitive science and workforce development research, designed to reduce bias and capture the full spectrum of human capabilities.
                    </p>
                  </Card>

                  <Card className="p-5">
                    <div className="w-10 h-10 rounded-xl bg-[#C76B4A]/10 flex items-center justify-center mb-3">
                      <FileCheck className="w-5 h-5" style={{ color: '#C76B4A' }} />
                    </div>
                    <h4 className="font-semibold mb-2" style={{ color: '#2D3330' }}>
                      Proof Artifacts
                    </h4>
                    <p className="text-sm" style={{ color: '#6B6760' }}>
                      Each skill must be demonstrated by a comprehensible artifact, from project portfolios to certifications to impact metrics.
                    </p>
                  </Card>

                  <Card className="p-5">
                    <div className="w-10 h-10 rounded-xl bg-[#5F8C6F]/10 flex items-center justify-center mb-3">
                      <ShieldCheck className="w-5 h-5" style={{ color: '#5F8C6F' }} />
                    </div>
                    <h4 className="font-semibold mb-2" style={{ color: '#2D3330' }}>
                      Verification Layer
                    </h4>
                    <p className="text-sm" style={{ color: '#6B6760' }}>
                      The authenticity of skill and proof claims can be externally verified through our independent reviewers network.
                    </p>
                  </Card>

                  <Card className="p-5">
                    <div className="w-10 h-10 rounded-xl bg-[#D4A574]/10 flex items-center justify-center mb-3">
                      <TrendingUp className="w-5 h-5" style={{ color: '#D4A574' }} />
                    </div>
                    <h4 className="font-semibold mb-2" style={{ color: '#2D3330' }}>
                      Seniority to Expertise
                    </h4>
                    <p className="text-sm" style={{ color: '#6B6760' }}>
                      We move from rigid seniority levels to nuanced expertise mapping, recognizing that mastery comes in many forms.
                    </p>
                  </Card>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* Skill Categories */}
        <div className="space-y-6">
          {SKILL_CATEGORIES.map((category) => {
            const categorySkills = expertiseByCategory[category.id] || [];
            
            return (
              <Card key={category.id} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-semibold" style={{ color: '#2D3330' }}>
                        {category.name}
                      </h3>
                      <p className="text-sm" style={{ color: '#6B6760' }}>
                        {categorySkills.length} {categorySkills.length === 1 ? 'skill' : 'skills'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddSkill}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>

                {categorySkills.length > 0 ? (
                  <div className="space-y-4">
                    {categorySkills.map((skill: any) => {
                      const linkedProofs = proofs.filter((p: any) => skill.proof_links?.includes(p.id));
                      
                      return (
                        <div
                          key={skill.id}
                          className="p-4 rounded-lg"
                          style={{ backgroundColor: '#FDFCFA' }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold" style={{ color: '#2D3330' }}>
                                  {skill.skill_name}
                                </h4>
                                {skill.verification_status === 'verified' && (
                                  <CheckCircle2 className="w-4 h-4" style={{ color: '#7A9278' }} />
                                )}
                              </div>
                              {skill.proficiency_level && (
                                <Badge variant="outline" className="mb-2">
                                  Level {skill.proficiency_level}
                                </Badge>
                              )}
                              {skill.description && (
                                <p className="text-sm mt-2" style={{ color: '#6B6760' }}>
                                  {skill.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSkill(skill.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSkill(skill.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Sub-skills */}
                          {skill.sub_skills && skill.sub_skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {skill.sub_skills.map((subSkill: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {subSkill}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Linked Proofs */}
                          {linkedProofs.length > 0 && (
                            <div className="mt-3 pt-3 border-t" style={{ borderColor: '#E8E6DD' }}>
                              <div className="flex items-center gap-2 mb-2">
                                <Award className="w-4 h-4" style={{ color: '#7A9278' }} />
                                <span className="text-sm font-medium" style={{ color: '#2D3330' }}>
                                  Linked Proofs
                                </span>
                              </div>
                              <div className="space-y-2">
                                {linkedProofs.map((proof) => (
                                  <div key={proof.id} className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="w-3 h-3" style={{ color: '#7A9278' }} />
                                    <span style={{ color: '#2D3330' }}>{proof.claim_text}</span>
                                    {proof.proof_url && (
                                      <a 
                                        href={proof.proof_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-auto"
                                      >
                                        <ExternalLink className="w-3 h-3" style={{ color: '#6B6760' }} />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
                      No skills in this category yet
                    </p>
                    <Button variant="outline" onClick={handleAddSkill}>
                      Add Your First {category.name} Skill
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

