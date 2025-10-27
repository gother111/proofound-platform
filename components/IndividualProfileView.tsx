"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import {
  Edit,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Shield,
  Calendar,
  ExternalLink,
  Plus,
  Star,
  CheckCircle2
} from 'lucide-react';

interface IndividualProfileViewProps {
  profile: any;
  proofs: any[];
  expertiseAtlas: any[];
}

export function IndividualProfileView({ profile, proofs, expertiseAtlas }: IndividualProfileViewProps) {
  const router = useRouter();
  
  // Calculate profile stats
  const verifiedProofs = proofs.filter(p => p.verification_status === 'verified').length;
  const totalExpertise = expertiseAtlas.length;
  const completionPercent = profile?.profile_completion_percentage || 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Avatar className="w-24 h-24">
          <AvatarFallback className="text-2xl bg-[#7A9278] text-white">
            {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-display font-semibold" style={{ color: '#2D3330' }}>
                {profile?.full_name || 'User Profile'}
              </h1>
              {profile?.tagline && (
                <p className="text-lg mt-1" style={{ color: '#6B6760' }}>
                  {profile.tagline}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/profile/edit')}
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>

          {/* Quick Info */}
          <div className="flex flex-wrap gap-4 text-sm" style={{ color: '#6B6760' }}>
            {profile?.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile?.created_at && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>

          {/* Profile Completion */}
          {completionPercent < 100 && (
            <Card className="p-4 bg-[#F7F6F1]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: '#2D3330' }}>
                  Profile Completion
                </span>
                <span className="text-sm font-semibold" style={{ color: '#1C4D3A' }}>
                  {completionPercent}%
                </span>
              </div>
              <Progress value={completionPercent} className="h-2" />
              <p className="text-xs mt-2" style={{ color: '#6B6760' }}>
                Complete your profile to unlock full matching potential
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-[#7A9278]/10">
              <Shield className="w-6 h-6" style={{ color: '#7A9278' }} />
            </div>
            <div>
              <div className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                {verifiedProofs}
              </div>
              <div className="text-sm" style={{ color: '#6B6760' }}>
                Verified Proofs
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-[#5C8B89]/10">
              <Award className="w-6 h-6" style={{ color: '#5C8B89' }} />
            </div>
            <div>
              <div className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                {totalExpertise}
              </div>
              <div className="text-sm" style={{ color: '#6B6760' }}>
                Expertise Areas
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-[#C76B4A]/10">
              <Star className="w-6 h-6" style={{ color: '#C76B4A' }} />
            </div>
            <div>
              <div className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                {profile?.matching_preferences?.min_expected_comp || 0}
              </div>
              <div className="text-sm" style={{ color: '#6B6760' }}>
                Matches Received
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* About Section */}
      {profile?.bio && (
        <Card className="p-6">
          <h2 className="text-xl font-display font-semibold mb-4" style={{ color: '#2D3330' }}>
            About
          </h2>
          <p className="text-base leading-relaxed" style={{ color: '#2D3330' }}>
            {profile.bio}
          </p>
        </Card>
      )}

      {/* Expertise Atlas */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-semibold" style={{ color: '#2D3330' }}>
            Expertise Atlas
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/profile/expertise')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </Button>
        </div>

        {expertiseAtlas.length > 0 ? (
          <div className="space-y-4">
            {expertiseAtlas.slice(0, 5).map((expertise, index) => (
              <div key={index} className="flex items-start justify-between p-4 rounded-lg" style={{ backgroundColor: '#F7F6F1' }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4" style={{ color: '#7A9278' }} />
                    <h3 className="font-semibold" style={{ color: '#2D3330' }}>
                      {expertise.skill_name || 'Skill'}
                    </h3>
                  </div>
                  {expertise.sub_skills && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {expertise.sub_skills.slice(0, 3).map((subSkill: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {subSkill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {expertise.proof_links && expertise.proof_links.length > 0 && (
                  <CheckCircle2 className="w-5 h-5 ml-3" style={{ color: '#7A9278' }} />
                )}
              </div>
            ))}
            {expertiseAtlas.length > 5 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/profile/expertise')}
              >
                View All {expertiseAtlas.length} Skills
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Award className="w-12 h-12 mx-auto mb-4" style={{ color: '#E8E6DD' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#2D3330' }}>
              No expertise added yet
            </h3>
            <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
              Add your skills to improve matching accuracy
            </p>
            <Button onClick={() => router.push('/profile/expertise')}>
              Add Your First Skill
            </Button>
          </div>
        )}
      </Card>

      {/* Verified Proofs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-semibold" style={{ color: '#2D3330' }}>
            Verified Proofs
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/profile/proofs/new')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Proof
          </Button>
        </div>

        {proofs.length > 0 ? (
          <div className="space-y-4">
            {proofs.slice(0, 5).map((proof, index) => (
              <div key={proof.id || index} className="flex items-start gap-4 p-4 rounded-lg" style={{ backgroundColor: '#F7F6F1' }}>
                <div className="p-2 rounded-lg bg-white">
                  {proof.verification_status === 'verified' ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#7A9278' }} />
                  ) : (
                    <Shield className="w-5 h-5" style={{ color: '#C76B4A' }} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold" style={{ color: '#2D3330' }}>
                      {proof.claim_text || 'Claim'}
                    </h3>
                    <Badge 
                      variant={proof.verification_status === 'verified' ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {proof.verification_status || 'pending'}
                    </Badge>
                  </div>
                  <p className="text-sm" style={{ color: '#6B6760' }}>
                    {proof.proof_type} • {new Date(proof.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {proofs.length > 5 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/profile/proofs')}
              >
                View All {proofs.length} Proofs
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: '#E8E6DD' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#2D3330' }}>
              No proofs submitted yet
            </h3>
            <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
              Build trust by adding verified proofs of your work
            </p>
            <Button onClick={() => router.push('/profile/proofs/new')}>
              Submit Your First Proof
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

