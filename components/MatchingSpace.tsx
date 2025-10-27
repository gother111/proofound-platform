"use client";

import { useState } from 'react';
import { User, Building2 } from 'lucide-react';
import { MatchingIndividualView } from '@/components/MatchingIndividualView';
import { MatchingOrganizationView } from '@/components/MatchingOrganizationView';

type PersonaType = 'individual' | 'organization';
type SubViewType = 'matches' | 'profile' | 'assignment';

interface MatchingSpaceProps {
  profile: any;
  matches: any[];
  assignments?: any[];
}

export function MatchingSpace({ profile, matches, assignments = [] }: MatchingSpaceProps) {
  // Determine persona from profile
  const initialPersona: PersonaType = profile?.account_type === 'organization' ? 'organization' : 'individual';
  const [persona, setPersona] = useState<PersonaType>(initialPersona);
  const [subView, setSubView] = useState<SubViewType>('matches');

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F7F6F1' }}>
      {/* Top navigation bar */}
      <div className="h-14 border-b flex items-center justify-between px-6" style={{ borderColor: 'rgba(232, 230, 221, 0.6)', backgroundColor: '#FDFCFA' }}>
        <div className="flex items-center gap-4">
          <h1 className="text-base font-semibold" style={{ color: '#2D3330' }}>Matching</h1>
          
          {/* Persona toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: '#E8E6DD' }}>
            <button
              onClick={() => {
                setPersona('individual');
                setSubView('matches');
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors"
              style={{
                backgroundColor: persona === 'individual' ? '#1C4D3A' : 'transparent',
                color: persona === 'individual' ? '#F7F6F1' : '#2D3330'
              }}
            >
              <User className="w-3 h-3" />
              Individual
            </button>
            <button
              onClick={() => {
                setPersona('organization');
                setSubView('matches');
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors"
              style={{
                backgroundColor: persona === 'organization' ? '#1C4D3A' : 'transparent',
                color: persona === 'organization' ? '#F7F6F1' : '#2D3330'
              }}
            >
              <Building2 className="w-3 h-3" />
              Organization
            </button>
          </div>

          {/* Sub-navigation */}
          <div className="h-6 w-px" style={{ backgroundColor: 'rgba(232, 230, 221, 0.6)' }} />
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSubView('matches')}
              className="px-3 py-1 rounded text-xs transition-colors"
              style={{
                color: subView === 'matches' ? '#1C4D3A' : '#6B6760',
                textDecoration: subView === 'matches' ? 'underline' : 'none'
              }}
            >
              Matches
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {persona === 'individual' ? (
          <MatchingIndividualView matches={matches} profile={profile} />
        ) : (
          <MatchingOrganizationView matches={matches} assignments={assignments} profile={profile} />
        )}
      </div>
    </div>
  );
}

