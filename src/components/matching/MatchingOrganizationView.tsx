'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { apiFetch } from '@/lib/api/fetch';
import { getOrganizationRecoveryActions } from '@/lib/ui/recovery-actions';

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
  const params = useParams();
  const router = useRouter();
  const rawSlug = (params as { slug?: string | string[] })?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const [selectedAssignment, setSelectedAssignment] = useState<string>(assignments[0]?.id || '');
  const [matches, setMatches] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [preset, setPreset] = useState<string>('balanced');

  const currentAssignment = assignments.find((a) => a.id === selectedAssignment);
  const recoveryActions = getOrganizationRecoveryActions(
    'assignment-no-matches',
    slug || null,
    selectedAssignment || undefined
  );

  // Fetch matches when assignment or preset changes
  useEffect(() => {
    if (!selectedAssignment) return;

    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        const response = await apiFetch('/api/match/assignment', {
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
      const response = await apiFetch('/api/match/interest', {
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
    <AppSurface>
      <div className="max-w-6xl mx-auto">
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

        {/* Assignment list with quick actions */}
        <div className="grid gap-3 sm:grid-cols-2">
          {assignments.map((assignment) => (
            <Link
              key={assignment.id}
              href={slug ? `/app/o/${slug}/assignments/${assignment.id}/review` : '#'}
              onClick={() => setSelectedAssignment(assignment.id)}
            >
              <Card className="p-4 hover:border-primary/60 transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-base">{assignment.role}</h3>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(assignment.createdAt).toLocaleDateString()}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {assignment.status}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    View / Edit
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Matches for the currently selected assignment */}
        {selectedAssignment && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Matches</h2>
                {currentAssignment && (
                  <p className="text-sm text-muted-foreground">
                    {currentAssignment.role} — {currentAssignment.status}
                  </p>
                )}
              </div>
            </div>

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
                <div className="mt-4 grid grid-cols-1 gap-2 text-left md:grid-cols-3">
                  {recoveryActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => router.push(action.actionUrl)}
                      className="rounded-lg border border-[#E8E6DD] bg-white px-3 py-2 hover:border-[#1C4D3A] hover:bg-[#F7F6F1]"
                    >
                      <p className="text-sm font-medium text-[#2D3330]">{action.title}</p>
                      <p className="text-xs text-[#6B6760]">{action.description}</p>
                    </button>
                  ))}
                </div>
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
          </div>
        )}
      </div>
    </AppSurface>
  );
}
