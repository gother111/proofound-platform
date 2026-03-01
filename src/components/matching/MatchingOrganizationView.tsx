'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useResponsiveModalMode } from '@/hooks/use-responsive-modal-mode';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MatchResultCard } from './MatchResultCard';
import { ScheduleInterviewButton } from '@/components/interviews/ScheduleInterviewButton';
import { toast } from 'sonner';
import { MailPlus, Plus, Settings } from 'lucide-react';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { apiFetch } from '@/lib/api/fetch';
import { getOrganizationRecoveryActions } from '@/lib/ui/recovery-actions';
import {
  CardGridSkeleton,
  CenteredStatusSkeleton,
} from '@/components/skeletons/CoreLoadingPrimitives';

interface Assignment {
  id: string;
  orgId: string;
  role: string;
  status: string;
  createdAt: string;
}

interface TestMatchItem {
  matchId: string;
  assignmentId: string;
  assignmentRole: string | null;
  assignmentStatus: string;
  candidateProfileId: string | null;
  candidateDisplayName: string | null;
  candidateHandle: string | null;
  candidateAvatarUrl: string | null;
  conversationId: string | null;
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

  const [testMatches, setTestMatches] = useState<TestMatchItem[]>([]);
  const [isTestMatchesLoading, setIsTestMatchesLoading] = useState(false);
  const [canInitiateTest, setCanInitiateTest] = useState(false);

  const [isInitiateTestOpen, setIsInitiateTestOpen] = useState(false);
  const [testInviteEmail, setTestInviteEmail] = useState('');
  const [testInviteAssignmentId, setTestInviteAssignmentId] = useState(assignments[0]?.id || '');
  const [isSubmittingTestInvite, setIsSubmittingTestInvite] = useState(false);
  const isDesktop = useResponsiveModalMode(isInitiateTestOpen);

  const currentAssignment = assignments.find((a) => a.id === selectedAssignment);
  const currentOrgId = currentAssignment?.orgId || assignments[0]?.orgId || null;
  const recoveryActions = getOrganizationRecoveryActions(
    'assignment-no-matches',
    slug || null,
    selectedAssignment || undefined
  );

  useEffect(() => {
    if (assignments.length === 0) {
      return;
    }

    const assignmentStillExists = assignments.some(
      (assignment) => assignment.id === selectedAssignment
    );
    if (!selectedAssignment || !assignmentStillExists) {
      setSelectedAssignment(assignments[0].id);
    }

    if (!testInviteAssignmentId) {
      setTestInviteAssignmentId(assignments[0].id);
    }
  }, [assignments, selectedAssignment, testInviteAssignmentId]);

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
      } catch {
        toast.error('Failed to load matches');
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchMatches();
  }, [selectedAssignment, preset]);

  useEffect(() => {
    if (!currentOrgId) {
      return;
    }

    const fetchTestMatches = async () => {
      setIsTestMatchesLoading(true);
      try {
        const query = selectedAssignment
          ? `?assignmentId=${encodeURIComponent(selectedAssignment)}`
          : '';
        const response = await apiFetch(`/api/organizations/${currentOrgId}/test-matches${query}`);

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load test matches');
        }

        setTestMatches(payload?.items || []);
        setCanInitiateTest(Boolean(payload?.permissions?.canInitiateTest));
      } catch (error) {
        console.error('Failed to load test matches:', error);
        setTestMatches([]);
        setCanInitiateTest(false);
      } finally {
        setIsTestMatchesLoading(false);
      }
    };

    void fetchTestMatches();
  }, [currentOrgId, selectedAssignment]);

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
      } else {
        toast.success('Interest recorded! Waiting for candidate response.');
      }
    } catch {
      toast.error('Failed to record interest');
    }
  };

  const handleHide = (profileId: string) => {
    setMatches(matches.filter((m: any) => m.profileId !== profileId));
    toast.success('Hidden from results');
  };

  const handleInitiateTest = async () => {
    if (!currentOrgId) {
      toast.error('Organization context not found');
      return;
    }

    if (!testInviteAssignmentId) {
      toast.error('Choose an assignment for this test');
      return;
    }

    const normalizedEmail = testInviteEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error('Enter tester email');
      return;
    }

    setIsSubmittingTestInvite(true);
    try {
      const response = await apiFetch(`/api/organizations/${currentOrgId}/candidate-invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          flowType: 'test_match',
          assignmentId: testInviteAssignmentId,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to send test invite');
      }

      toast.success('Test invite sent');
      setTestInviteEmail('');
      setIsInitiateTestOpen(false);

      const query = selectedAssignment
        ? `?assignmentId=${encodeURIComponent(selectedAssignment)}`
        : '';
      const refreshResponse = await apiFetch(
        `/api/organizations/${currentOrgId}/test-matches${query}`
      );
      const refreshPayload = await refreshResponse.json().catch(() => null);
      if (refreshResponse.ok) {
        setTestMatches(refreshPayload?.items || []);
        setCanInitiateTest(Boolean(refreshPayload?.permissions?.canInitiateTest));
      }
    } catch (error) {
      console.error('Failed to send test invite:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send test invite');
    } finally {
      setIsSubmittingTestInvite(false);
    }
  };

  const InitiateTestModalContentBody = () => (
    <div className="px-4 md:px-0">
      <DialogHeader className="md:px-0 text-left">
        <DialogTitle>Initiate test</DialogTitle>
        <DialogDescription>
          Invite a tester candidate by email. Once they accept, a Test match is created.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="test-assignment">Assignment</Label>
          <Select value={testInviteAssignmentId} onValueChange={setTestInviteAssignmentId}>
            <SelectTrigger id="test-assignment">
              <SelectValue placeholder="Choose assignment" />
            </SelectTrigger>
            <SelectContent>
              {assignments.map((assignment) => (
                <SelectItem key={assignment.id} value={assignment.id}>
                  {assignment.role || 'Untitled assignment'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tester-email">Tester email</Label>
          <Input
            id="tester-email"
            type="email"
            placeholder="tester@example.com"
            value={testInviteEmail}
            onChange={(event) => setTestInviteEmail(event.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const InitiateTestModalFooter = () => (
    <div className="px-4 md:px-0 pb-4 md:pb-0">
      <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
        <Button
          variant="outline"
          onClick={() => setIsInitiateTestOpen(false)}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          onClick={handleInitiateTest}
          disabled={isSubmittingTestInvite}
          className="w-full sm:w-auto"
        >
          {isSubmittingTestInvite ? 'Sending...' : 'Send invite'}
        </Button>
      </DialogFooter>
    </div>
  );

  const renderInitiateTestModal = () => {
    if (isDesktop) {
      return (
        <Dialog open={isInitiateTestOpen} onOpenChange={setIsInitiateTestOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <InitiateTestModalContentBody />
            <InitiateTestModalFooter />
          </DialogContent>
        </Dialog>
      );
    }
    return (
      <Drawer open={isInitiateTestOpen} onOpenChange={setIsInitiateTestOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm overflow-y-auto pb-6">
            <InitiateTestModalContentBody />
            <InitiateTestModalFooter />
          </div>
        </DrawerContent>
      </Drawer>
    );
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
            <div className="flex items-center gap-2">
              {canInitiateTest ? (
                <Button variant="outline" onClick={() => setIsInitiateTestOpen(true)}>
                  <MailPlus className="w-4 h-4 mr-2" />
                  Initiate test
                </Button>
              ) : null}
              <Button onClick={onCreateNew} style={{ backgroundColor: '#1C4D3A' }}>
                <Plus className="w-4 h-4 mr-2" />
                New Assignment
              </Button>
            </div>
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
              <CardGridSkeleton
                count={4}
                columnsClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
                tileClassName="min-h-[220px]"
              />
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
                      className="rounded-lg border border-proofound-stone bg-white px-3 py-2 hover:border-proofound-forest hover:bg-japandi-bg"
                    >
                      <p className="text-sm font-medium text-foreground">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
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

        <div className="mt-10 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Test matches</h2>
            {currentAssignment ? (
              <p className="text-xs text-muted-foreground">
                {currentAssignment.role || 'Selected assignment'}
              </p>
            ) : null}
          </div>

          {isTestMatchesLoading ? (
            <Card className="p-4">
              <CenteredStatusSkeleton containerClassName="min-h-[80px]" />
            </Card>
          ) : testMatches.length === 0 ? (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">
                No test matches yet for this assignment.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {testMatches.map((testMatch) => (
                <Card key={testMatch.matchId} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {testMatch.candidateDisplayName ||
                          testMatch.candidateHandle ||
                          'Test candidate'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Assignment: {testMatch.assignmentRole || 'Untitled'}
                      </p>
                    </div>
                    <Badge variant="outline">Test match</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {testMatch.conversationId && slug ? (
                      <Link
                        href={`/app/o/${slug}/messages?conversation=${testMatch.conversationId}`}
                      >
                        <Button size="sm" variant="outline">
                          Open messages
                        </Button>
                      </Link>
                    ) : null}
                    <ScheduleInterviewButton
                      matchId={testMatch.matchId}
                      matchAgreedAt={new Date(testMatch.createdAt)}
                      variant="outline"
                      size="sm"
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {renderInitiateTestModal()}
    </AppSurface>
  );
}
