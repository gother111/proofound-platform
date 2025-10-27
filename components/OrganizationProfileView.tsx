"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import {
  Edit,
  MapPin,
  Users,
  Building2,
  Award,
  Briefcase,
  Calendar,
  ExternalLink,
  Plus,
  CheckCircle2,
  Globe
} from 'lucide-react';

interface OrganizationProfileViewProps {
  profile: any;
  proofs: any[];
}

export function OrganizationProfileView({ profile, proofs }: OrganizationProfileViewProps) {
  const router = useRouter();
  
  // Calculate organization stats
  const verifiedProofs = proofs.filter(p => p.verification_status === 'verified').length;
  const teamSize = profile?.admin_ids?.length || 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Avatar className="w-24 h-24">
          <AvatarFallback className="text-2xl bg-[#C76B4A] text-white">
            {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'ORG'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-display font-semibold" style={{ color: '#2D3330' }}>
                {profile?.full_name || 'Organization Name'}
              </h1>
              {profile?.tagline && (
                <p className="text-lg mt-1" style={{ color: '#6B6760' }}>
                  {profile.tagline}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="gap-1">
                  <Building2 className="w-3 h-3" />
                  Organization
                </Badge>
                {profile?.verification_status === 'verified' && (
                  <Badge className="gap-1 bg-[#7A9278] text-white">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>
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
            {profile?.website && (
              <a 
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-[#1C4D3A] transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-[#C76B4A]/10">
              <Briefcase className="w-6 h-6" style={{ color: '#C76B4A' }} />
            </div>
            <div>
              <div className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                {profile?.assignments_count || 0}
              </div>
              <div className="text-sm" style={{ color: '#6B6760' }}>
                Active Assignments
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-[#7A9278]/10">
              <Users className="w-6 h-6" style={{ color: '#7A9278' }} />
            </div>
            <div>
              <div className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                {teamSize}
              </div>
              <div className="text-sm" style={{ color: '#6B6760' }}>
                Team Members
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
                {verifiedProofs}
              </div>
              <div className="text-sm" style={{ color: '#6B6760' }}>
                Verified Credentials
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

      {/* Mission & Values */}
      <Card className="p-6">
        <h2 className="text-xl font-display font-semibold mb-4" style={{ color: '#2D3330' }}>
          Mission & Impact
        </h2>
        <div className="space-y-4">
          {profile?.mission && (
            <div>
              <h3 className="font-semibold mb-2" style={{ color: '#2D3330' }}>
                Our Mission
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#6B6760' }}>
                {profile.mission}
              </p>
            </div>
          )}
          {profile?.impact_areas && profile.impact_areas.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2" style={{ color: '#2D3330' }}>
                Impact Areas
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.impact_areas.map((area: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Active Assignments */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-semibold" style={{ color: '#2D3330' }}>
            Active Assignments
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/assignments/new')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Post Assignment
          </Button>
        </div>

        {profile?.assignments_count > 0 ? (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: '#6B6760' }}>
              You have {profile.assignments_count} active assignment{profile.assignments_count !== 1 ? 's' : ''}.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/assignments')}
            >
              View All Assignments
            </Button>
          </div>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 mx-auto mb-4" style={{ color: '#E8E6DD' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#2D3330' }}>
              No active assignments
            </h3>
            <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
              Post your first assignment to find verified experts
            </p>
            <Button onClick={() => router.push('/assignments/new')}>
              Post Your First Assignment
            </Button>
          </div>
        )}
      </Card>

      {/* Credentials & Verification */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-semibold" style={{ color: '#2D3330' }}>
            Credentials & Verification
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/profile/proofs/new')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Credential
          </Button>
        </div>

        {proofs.length > 0 ? (
          <div className="space-y-4">
            {proofs.slice(0, 3).map((proof, index) => (
              <div key={proof.id || index} className="flex items-start gap-4 p-4 rounded-lg" style={{ backgroundColor: '#F7F6F1' }}>
                <div className="p-2 rounded-lg bg-white">
                  {proof.verification_status === 'verified' ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#7A9278' }} />
                  ) : (
                    <Award className="w-5 h-5" style={{ color: '#C76B4A' }} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold" style={{ color: '#2D3330' }}>
                      {proof.claim_text || 'Credential'}
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
            {proofs.length > 3 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/profile/proofs')}
              >
                View All {proofs.length} Credentials
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Award className="w-12 h-12 mx-auto mb-4" style={{ color: '#E8E6DD' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#2D3330' }}>
              No credentials added yet
            </h3>
            <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
              Build trust by adding verified credentials
            </p>
            <Button onClick={() => router.push('/profile/proofs/new')}>
              Add Your First Credential
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

