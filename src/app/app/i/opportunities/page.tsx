/**
 * Opportunities Page - Individual
 * 
 * View assignments that matched the user
 * Express interest, pass, or snooze
 */

'use client';

import { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Clock, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Opportunity {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  organizationName: string;
  organizationMasked: boolean;
  matchScore: number;
  location?: string;
  compensationMin?: number;
  compensationMax?: number;
  currency?: string;
  workMode?: string;
  startDate?: string;
  status: 'new' | 'viewed' | 'interested' | 'passed' | 'snoozed';
  whyMatch?: string;
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterScore, setFilterScore] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('match');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/opportunities');
      if (response.ok) {
        const data = await response.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (error) {
      console.error('Failed to load opportunities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (opportunityId: string, action: 'interested' | 'passed' | 'snoozed') => {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        setOpportunities(prev =>
          prev.map(opp =>
            opp.id === opportunityId ? { ...opp, status: action } : opp
          )
        );
      }
    } catch (error) {
      console.error('Failed to update opportunity:', error);
    }
  };

  // Filter and sort
  const filteredOpportunities = opportunities.filter(opp => {
    if (filterStatus !== 'all' && opp.status !== filterStatus) return false;
    if (filterScore === 'high' && opp.matchScore < 80) return false;
    if (filterScore === 'medium' && (opp.matchScore < 60 || opp.matchScore >= 80)) return false;
    if (filterScore === 'low' && opp.matchScore >= 60) return false;
    return true;
  });

  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    if (sortBy === 'match') return b.matchScore - a.matchScore;
    if (sortBy === 'newest') return b.id.localeCompare(a.id);
    return 0;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D3330]">Opportunities</h1>
        <p className="text-sm text-[#6B6760]">
          Assignments matched to your profile based on skills, values, and practical fit
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={filterScore} onValueChange={setFilterScore}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Match Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Matches</SelectItem>
            <SelectItem value="high">High (80%+)</SelectItem>
            <SelectItem value="medium">Medium (60-79%)</SelectItem>
            <SelectItem value="low">Low (&lt;60%)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="interested">Interested</SelectItem>
            <SelectItem value="passed">Passed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="match">Best Match</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Opportunities List */}
      {sortedOpportunities.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <Briefcase className="h-16 w-16 mx-auto text-[#6B6760] opacity-50" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-[#2D3330]">
              No opportunities yet
            </p>
            <p className="text-sm text-[#6B6760] max-w-md mx-auto">
              Complete your profile and add your skills to get matched with relevant opportunities.
            </p>
          </div>
          <Button onClick={() => window.location.href = '/app/i/profile'} className="bg-[#4A5943] hover:bg-[#3A4733]">
            Complete Profile
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedOpportunities.map(opp => (
            <Card key={opp.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-[#2D3330] truncate">
                        {opp.assignmentTitle}
                      </h3>
                      <Badge className={cn(
                        'font-semibold',
                        opp.matchScore >= 80 ? 'bg-green-100 text-green-800' :
                        opp.matchScore >= 60 ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      )}>
                        {opp.matchScore}% Match
                      </Badge>
                    </div>
                    <p className="text-[#6B6760]">
                      {opp.organizationMasked ? 'Organization (revealed after introduction)' : opp.organizationName}
                    </p>
                  </div>

                  {opp.status === 'new' && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      New
                    </Badge>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-wrap gap-4 text-sm text-[#6B6760]">
                  {opp.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{opp.location}</span>
                    </div>
                  )}
                  {opp.compensationMin && opp.compensationMax && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {opp.currency} {opp.compensationMin.toLocaleString()} - {opp.compensationMax.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {opp.workMode && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{opp.workMode}</span>
                    </div>
                  )}
                  {opp.startDate && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Start: {opp.startDate}</span>
                    </div>
                  )}
                </div>

                {/* Why this match */}
                {opp.whyMatch && (
                  <div>
                    <button
                      onClick={() => setExpandedId(expandedId === opp.id ? null : opp.id)}
                      className="flex items-center gap-2 text-sm font-medium text-[#4A5943] hover:text-[#3A4733]"
                    >
                      Why this match?
                      {expandedId === opp.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {expandedId === opp.id && (
                      <p className="mt-2 text-sm text-[#6B6760] pl-4 border-l-2 border-[#7A9278]">
                        {opp.whyMatch}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {opp.status === 'new' || opp.status === 'viewed' ? (
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleAction(opp.id, 'interested')}
                      className="flex-1 bg-[#4A5943] hover:bg-[#3A4733]"
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Express Interest
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAction(opp.id, 'snoozed')}
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Snooze
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAction(opp.id, 'passed')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Pass
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 border-t">
                    <Badge variant="outline" className="text-[#4A5943]">
                      Status: {opp.status}
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
