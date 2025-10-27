"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sliders, TrendingUp, MapPin, DollarSign, Clock, Award, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface MatchingIndividualViewProps {
  matches: any[];
  profile: any;
}

export function MatchingIndividualView({ matches, profile }: MatchingIndividualViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter matches by search
  const filteredMatches = matches.filter(match => {
    const assignment = match.assignment;
    if (!assignment) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      assignment.title?.toLowerCase().includes(searchLower) ||
      assignment.description?.toLowerCase().includes(searchLower) ||
      assignment.organization?.name?.toLowerCase().includes(searchLower)
    );
  });

  const handleViewMatch = (matchId: string) => {
    router.push(`/matches/${matchId}`);
  };

  const handleAcceptMatch = async (matchId: string) => {
    // TODO: Implement match acceptance
    console.log('Accept match:', matchId);
  };

  const handleDeclineMatch = async (matchId: string) => {
    // TODO: Implement match decline
    console.log('Decline match:', matchId);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Search & Filters Bar */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(232, 230, 221, 0.6)', backgroundColor: '#FDFCFA' }}>
        <div className="flex items-center gap-3 max-w-4xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#6B6760' }} />
            <Input
              type="text"
              placeholder="Search opportunities..."
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

      {/* Matches List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                Your Matches
              </h2>
              <p className="text-sm mt-1" style={{ color: '#6B6760' }}>
                {filteredMatches.length} {filteredMatches.length === 1 ? 'opportunity' : 'opportunities'} match your profile
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/profile')}>
              Update Preferences
            </Button>
          </div>

          {/* Matches */}
          {filteredMatches.length > 0 ? (
            <div className="space-y-4">
              {filteredMatches.map((match) => {
                const assignment = match.assignment;
                const organization = assignment?.organization;
                const matchScore = match.overall_score || 0;

                return (
                  <Card 
                    key={match.id} 
                    className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewMatch(match.id)}
                  >
                    {/* Match Score Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-display font-semibold" style={{ color: '#2D3330' }}>
                            {assignment?.title || 'Assignment'}
                          </h3>
                          {match.status === 'suggested' && (
                            <Badge variant="outline" className="gap-1 bg-[#7A9278]/10 text-[#7A9278] border-[#7A9278]">
                              <TrendingUp className="w-3 h-3" />
                              New Match
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mb-3" style={{ color: '#6B6760' }}>
                          {organization?.name || 'Organization'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: '#6B6760' }}>Match Score</span>
                          <div 
                            className="px-3 py-1 rounded-full font-semibold"
                            style={{ 
                              backgroundColor: matchScore >= 80 ? '#7A9278' : matchScore >= 60 ? '#D4A574' : '#C76B4A',
                              color: '#FFFFFF'
                            }}
                          >
                            {Math.round(matchScore)}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm mb-4 line-clamp-2" style={{ color: '#2D3330' }}>
                      {assignment?.description || 'No description available'}
                    </p>

                    {/* Details */}
                    <div className="flex flex-wrap gap-4 mb-4 text-sm" style={{ color: '#6B6760' }}>
                      {assignment?.location_type && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{assignment.location_type}</span>
                        </div>
                      )}
                      {assignment?.compensation_type && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{assignment.compensation_type}</span>
                        </div>
                      )}
                      {assignment?.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{assignment.duration}</span>
                        </div>
                      )}
                    </div>

                    {/* Skills Match */}
                    {match.matched_expertise && match.matched_expertise.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4" style={{ color: '#7A9278' }} />
                          <span className="text-sm font-medium" style={{ color: '#2D3330' }}>
                            Matching Skills
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

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptMatch(match.id);
                        }}
                        className="bg-[#1C4D3A] hover:bg-[#1C4D3A]/90 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        I'm Interested
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewMatch(match.id);
                        }}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeclineMatch(match.id);
                        }}
                        className="ml-auto"
                      >
                        Not Interested
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <TrendingUp className="w-16 h-16 mx-auto mb-4" style={{ color: '#E8E6DD' }} />
              <h3 className="text-xl font-display font-semibold mb-2" style={{ color: '#2D3330' }}>
                {searchQuery ? 'No matches found' : 'No matches yet'}
              </h3>
              <p className="text-sm mb-6" style={{ color: '#6B6760' }}>
                {searchQuery 
                  ? 'Try adjusting your search criteria'
                  : 'Complete your profile to receive personalized matches'}
              </p>
              {!searchQuery && (
                <Button onClick={() => router.push('/profile')}>
                  Complete Your Profile
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

