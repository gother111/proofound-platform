'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MatchResultCard } from './MatchResultCard';
import { toast } from 'sonner';
import { Plus, Settings } from 'lucide-react';

interface Assignment {
  id: string;
  role: string;
  status: string;
  createdAt: string;
}

interface MatchingOrganizationViewProps {
  assignments: Assignment[];
  onCreateNew: () => void;
  onOpenWeights?: () => void;
}

/**
 * Filled matching view for organizations showing matches per assignment.
 */
export function MatchingOrganizationView({
  assignments,
  onCreateNew,
  onOpenWeights,
}: MatchingOrganizationViewProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<string>(assignments[0]?.id || '');
  const [matches, setMatches] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [preset, setPreset] = useState<string>('balanced');

  const currentAssignment = assignments.find((a) => a.id === selectedAssignment);

  // Fetch matches when assignment or preset changes
  useEffect(() => {
    if (!selectedAssignment) return;

    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/match/assignment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentId: selectedAssignment,
            mode: preset,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }

        const data = await response.json();
        setMatches(data.items || []);
      } catch (error) {
        toast.error('Failed to load matches');
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [selectedAssignment, preset]);

  const handleInterested = async (profileId: string) => {
    try {
      const response = await fetch('/api/match/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: selectedAssignment,
          targetProfileId: profileId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record interest');
      }

      const data = await response.json();

      if (data.revealed) {
        toast.success('Mutual interest! Identity revealed.');
        // Refresh matches to show revealed card
        // In a real implementation, you'd update the specific match
      } else {
        toast.success('Interest recorded! Waiting for candidate response.');
      }
    } catch (error) {
      toast.error('Failed to record interest');
    }
  };

  const handleHide = (profileId: string) => {
    setMatches(matches.filter((m: any) => m.profileId !== profileId));
    toast.success('Hidden from results');
  };

  if (assignments.length === 0) {
    return null; // Should not reach here, but safety check
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Matching</h1>
            <p className="text-sm" style={{ color: '#6B6760' }}>
              Find candidates aligned with your mission and needs
            </p>
          </div>
          <Button onClick={onCreateNew} style={{ backgroundColor: '#1C4D3A' }}>
            <Plus className="w-4 h-4 mr-2" />
            New Assignment
          </Button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Match strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mission-first">Mission-First</SelectItem>
              <SelectItem value="skills-first">Skills-First</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
            </SelectContent>
          </Select>

          {onOpenWeights && (
            <Button variant="outline" size="sm" onClick={onOpenWeights}>
              <Settings className="w-4 h-4 mr-2" />
              Weights & Filters
            </Button>
          )}
        </div>
      </div>

      {/* Assignment tabs */}
      <Tabs value={selectedAssignment} onValueChange={setSelectedAssignment} className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          {assignments.map((assignment) => (
            <TabsTrigger key={assignment.id} value={assignment.id} className="flex-shrink-0">
              {assignment.role}
            </TabsTrigger>
          ))}
        </TabsList>

        {assignments.map((assignment) => (
          <TabsContent key={assignment.id} value={assignment.id}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p>Loading matches...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg mb-2" style={{ color: '#2D3330' }}>
                  No matches yet
                </p>
                <p className="text-sm" style={{ color: '#6B6760' }}>
                  Check back soon or adjust your filters
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
                  {matches.length} candidate{matches.length !== 1 ? 's' : ''} match this assignment
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.map((match: any, index: number) => (
                    <MatchResultCard
                      key={match.profileId || index}
                      result={match}
                      variant="blind"
                      skills={
                        match.profile?.skills
                          ? Object.entries(match.profile.skills).map(
                              ([id, data]: [string, any]) => ({
                                id,
                                label: id,
                                level: data.level,
                              })
                            )
                          : []
                      }
                      onInterested={() => handleInterested(match.profileId)}
                      onHide={() => handleHide(match.profileId)}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Assignment info footer */}
      {currentAssignment && (
        <div className="mt-6 p-4 rounded-md" style={{ backgroundColor: '#F7F6F1' }}>
          <p className="text-sm" style={{ color: '#2D3330' }}>
            <strong>Status:</strong> {currentAssignment.status} • <strong>Created:</strong>{' '}
            {new Date(currentAssignment.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
