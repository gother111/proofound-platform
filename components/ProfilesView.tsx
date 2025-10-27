"use client";

import { useState } from 'react';
import { IndividualProfileView } from '@/components/IndividualProfileView';
import { OrganizationProfileView } from '@/components/OrganizationProfileView';
import { User, Building2, Landmark } from 'lucide-react';

type ProfileType = 'individual' | 'organization' | 'government';

interface ProfilesViewProps {
  profile: any;
  proofs: any[];
  expertiseAtlas: any[];
}

export function ProfilesView({ profile, proofs, expertiseAtlas }: ProfilesViewProps) {
  // Determine initial profile type from user's account_type
  const initialType: ProfileType = profile?.account_type === 'organization' ? 'organization' : 'individual';
  const [selectedProfile, setSelectedProfile] = useState<ProfileType>(initialType);

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Type Toggle - Fixed at Top */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-2 p-1 bg-muted/30 rounded-full max-w-md mx-auto">
            <button
              onClick={() => setSelectedProfile('individual')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm transition-all duration-300 ${
                selectedProfile === 'individual'
                  ? 'bg-[#7A9278] text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Individual</span>
            </button>
            <button
              onClick={() => setSelectedProfile('organization')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm transition-all duration-300 ${
                selectedProfile === 'organization'
                  ? 'bg-[#C67B5C] text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Organization</span>
            </button>
            <button
              onClick={() => setSelectedProfile('government')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm transition-all duration-300 ${
                selectedProfile === 'government'
                  ? 'bg-[#5C8B89] text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span className="hidden sm:inline">Government</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div>
        {selectedProfile === 'individual' && (
          <IndividualProfileView 
            profile={profile}
            proofs={proofs}
            expertiseAtlas={expertiseAtlas}
          />
        )}
        {selectedProfile === 'organization' && (
          <OrganizationProfileView 
            profile={profile}
            proofs={proofs}
          />
        )}
        {selectedProfile === 'government' && (
          <div className="max-w-5xl mx-auto p-8 text-center">
            <h2 className="text-2xl font-display font-semibold mb-4">Government Profiles</h2>
            <p className="text-muted-foreground">Coming soon in future updates</p>
          </div>
        )}
      </div>
    </div>
  );
}

