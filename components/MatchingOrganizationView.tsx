"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sliders, User, Award, MapPin, DollarSign, Clock, CheckCircle2, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';

interface MatchingOrganizationViewProps {
  matches: any[];
  assignments: any[];
  profile: any;
}

export function MatchingOrganizationView({ matches, assignments, profile }: MatchingOrganizationViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(
    assignments.length > 0 ? assignments[0].id : null
  );

  // Filter matches by selected assignment and search
  const filteredMatches = matches.filter(match => {
    if (selectedAssignment && match.assignment_id !== selectedAssignment) {
      return false;
    }
    
    if (!searchQuery) return true;
    
    const profile = match.profile;
    if (!profile) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      profile.full_name?.toLowerCase().includes(searchLower) ||
      profile.tagline?.toLowerCase().includes(searchLower) ||
      profile.bio?.toLowerCase().includes(searchLower)
    );
  });

  const currentAssignment = assignments.find(a => a.id === selectedAssignment);

  const handleViewCandidate = (matchId: string) => {
    router.push(`/matches/${matchId}`);
  };

  const handleContactCandidate = async (matchId: string) => {
    // TODO: Implement candidate contact
    console.log('Contact candidate:', matchId);
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Sidebar - Assignments */}
      <div 
        className="w-80 border-r overflow-y-auto flex-shrink-0"
        style={{ borderColor: 'rgba(232, 230, 221, 0.6)', backgroundColor: '#FDFCFA' }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: '#2D3330' }}>Your Assignments</h3>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => router.push('/assignments/new')}
              className="gap-1"
            >
              <Plus className="w-3 h-3" />
              New
            </Button>
          </div>
        </div>

        <div className="p-2">
          {assignments.length > 0 ? (
            assignments.map((assignment) => {
              const matchCount = matches.filter(m => m.assignment_id === assignment.id).length;
              
              return (
                <button
                  key={assignment.id}
                  onClick={() => setSelectedAssignment(assignment.id)}
                  className="w-full text-left p-3 rounded-lg mb-2 transition-colors"
                  style={{
                    backgroundColor: selectedAssignment === assignment.id ? '#E8E6DD' : 'transparent',
                  }}
                >
                  <div className="font-medium text-sm mb-1" style={{ color: '#2D3330' }}>
                    {assignment.title}
                  </div>
                  <div className="text-xs" style={{ color: '#6B6760' }}>
                    {matchCount} {matchCount === 1 ? 'candidate' : 'candidates'}
                  </div>
                  <Badge 
                    variant="outline" 
                    className="text-xs mt-2"
                  >
                    {assignment.status || 'published'}
                  </Badge>
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm mb-3" style={{ color: '#6B6760' }}>
                No assignments yet
              </p>
              <Button 
                size="sm"
                onClick={() => router.push('/assignments/new')}
              >
                Create First Assignment
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Candidate Matches */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search & Filters Bar */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(232, 230, 221, 0.6)', backgroundColor: '#FDFCFA' }}>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#6B6760' }} />
              <Input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{ backgroundColor: '#F7F6F1' }}
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Sliders className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Candidates List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-display font-semibold mb-1" style={{ color: '#2D3330' }}>
                {currentAssignment?.title || 'Select an Assignment'}
              </h2>
              <p className="text-sm" style={{ color: '#6B6760' }}>
                {filteredMatches.length} {filteredMatches.length === 1 ? 'candidate matches' : 'candidates match'} this assignment
              </p>
            </div>

            {/* Candidate Matches */}
            {filteredMatches.length > 0 ? (
              <div className="space-y-4">
                {filteredMatches.map((match) => {
                  const candidate = match.profile;
                  const matchScore = match.overall_score || 0;

                  return (
                    <Card 
                      key={match.id} 
                      className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewCandidate(match.id)}
                    >
                      {/* Candidate Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="bg-[#7A9278] text-white text-lg">
                            {candidate?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-display font-semibold" style={{ color: '#2D3330' }}>
                                {candidate?.full_name || 'Candidate'}
                              </h3>
                              {candidate?.tagline && (
                                <p className="text-sm mt-1" style={{ color: '#6B6760' }}>
                                  {candidate.tagline}
                                </p>
                              )}
                            </div>
                            <div 
                              className="px-3 py-1 rounded-full font-semibold"
                              style={{ 
                                backgroundColor: matchScore >= 80 ? '#7A9278' : matchScore >= 60 ? '#D4A574' : '#C76B4A',
                                color: '#FFFFFF'
                              }}
                            >
                              {Math.round(matchScore)}% Match
                            </div>
                          </div>

                          {/* Quick Info */}
                          <div className="flex flex-wrap gap-3 text-sm" style={{ color: '#6B6760' }}>
                            {candidate?.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{candidate.location}</span>
                              </div>
                            )}
                            {candidate?.matching_preferences?.availability && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{candidate.matching_preferences.availability}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      {candidate?.bio && (
                        <p className="text-sm mb-4 line-clamp-2" style={{ color: '#2D3330' }}>
                          {candidate.bio}
                        </p>
                      )}

                      {/* Matching Skills */}
                      {match.matched_expertise && match.matched_expertise.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Award className="w-4 h-4" style={{ color: '#7A9278' }} />
                            <span className="text-sm font-medium" style={{ color: '#2D3330' }}>
                              Matching Expertise
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {match.matched_expertise.slice(0, 5).map((skill: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {match.matched_expertise.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{match.matched_expertise.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Match Explanation */}
                      {match.explanation && (
                        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#F7F6F1' }}>
                          <p className="text-sm" style={{ color: '#2D3330' }}>
                            <strong>Why this match?</strong> {match.explanation}
                          </p>
                        </div>
                      )}

                      {/* Verification Status */}
                      {candidate?.profile_completion_percentage >= 80 && (
                        <div className="flex items-center gap-2 mb-4 text-sm">
                          <CheckCircle2 className="w-4 h-4" style={{ color: '#7A9278' }} />
                          <span style={{ color: '#7A9278' }}>Verified profile</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactCandidate(match.id);
                          }}
                          className="bg-[#1C4D3A] hover:bg-[#1C4D3A]/90 text-white"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Contact Candidate
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCandidate(match.id);
                          }}
                        >
                          View Full Profile
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <User className="w-16 h-16 mx-auto mb-4" style={{ color: '#E8E6DD' }} />
                <h3 className="text-xl font-display font-semibold mb-2" style={{ color: '#2D3330' }}>
                  {searchQuery ? 'No candidates found' : currentAssignment ? 'No matches yet' : 'Select an assignment'}
                </h3>
                <p className="text-sm mb-6" style={{ color: '#6B6760' }}>
                  {searchQuery 
                    ? 'Try adjusting your search criteria'
                    : currentAssignment
                    ? 'Matches will appear here once the algorithm processes your assignment'
                    : 'Choose an assignment from the left to view candidate matches'}
                </p>
                {!currentAssignment && (
                  <Button onClick={() => router.push('/assignments/new')}>
                    Create New Assignment
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

