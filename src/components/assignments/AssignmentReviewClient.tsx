'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, Edit, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Assignment {
  id: string;
  orgId?: string;
  title?: string;
  engagementType?: string;
  role: string;
  description?: string;
  rolePurpose?: string;
  businessValue: string;
  proofExpectations?: string;
  expectedImpact?: string;
  expectedOutcomes?: any[];
  outcomes: any[];
  compensationMin?: number;
  compensationMax?: number;
  currency: string;
  location?: string;
  requiredSkills: any[];
  verificationGates?: string[];
  status: string;
}

function getSkillDisplayLabel(skill: any) {
  return skill?.label || skill?.name || skill?.skillName || skill?.id || 'Unknown skill';
}

const VERIFICATION_GATE_LABELS: Record<string, string> = {
  identity: 'Identity Verification',
  work_email: 'Work Email Verification',
  linkedin: 'LinkedIn Profile Verification',
  background_check: 'Background Check',
  education: 'Education Verification',
};

type Props = {
  initialAssignment: Assignment | null;
  assignmentId: string;
  slug: string;
};

type PublishBlock = {
  blockCode: string;
  field: string;
  message: string;
  details?: Record<string, unknown>;
};

export function AssignmentReviewClient({ initialAssignment, assignmentId, slug }: Props) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(initialAssignment);
  const [isLoading, setIsLoading] = useState(!initialAssignment);
  const [hasFetched, setHasFetched] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishBlocks, setPublishBlocks] = useState<PublishBlock[]>([]);

  // Fallback fetch only if server fetch returned nothing
  useEffect(() => {
    if (assignment || hasFetched) return;

    const fetchClient = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/assignments/${assignmentId}`);
        if (res.ok) {
          const data = await res.json();
          setAssignment(data.assignment);
        } else {
          setAssignment(null);
        }
      } catch (error) {
        console.error('Client fetch failed', error);
        setAssignment(null);
      } finally {
        setIsLoading(false);
        setHasFetched(true);
      }
    };

    fetchClient();
  }, [assignment, assignmentId, hasFetched]);

  const handlePublish = async () => {
    if (!confirm('Are you ready to publish this assignment and start matching?')) return;

    setIsPublishing(true);
    setPublishBlocks([]);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/publish?orgSlug=${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principalContext: assignment?.orgId
            ? {
                principalType: 'organization',
                orgId: assignment.orgId,
              }
            : undefined,
        }),
      });

      if (response.ok) {
        router.push(`/app/o/${slug}/matching`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const blocks = Array.isArray(errorData.details?.blocks)
          ? (errorData.details.blocks as PublishBlock[])
          : [];
        setPublishBlocks(
          blocks.length > 0
            ? blocks
            : [
                {
                  blockCode: 'publish_blocked',
                  field: 'publish',
                  message:
                    errorData.message ||
                    errorData.error ||
                    'Assignment publishing is currently blocked.',
                },
              ]
        );
      }
    } catch (error) {
      console.error('Failed to publish:', error);
      setPublishBlocks([
        {
          blockCode: 'publish_request_failed',
          field: 'publish',
          message: 'Failed to publish assignment. Try again.',
        },
      ]);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-6">
        <p>Assignment not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-japandi-bg p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Internal review before publish</h1>
            <p className="text-muted-foreground">
              Confirm the assignment is specific, credible, and ready for a narrow publish path.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/app/o/${slug}/assignments/new?draftId=${assignmentId}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-proofound-forest hover:bg-proofound-forest/90"
            >
              {isPublishing ? 'Publishing...' : 'Publish Assignment'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {publishBlocks.length > 0 ? (
          <Card className="border-amber-300 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-700" />
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-amber-900">Publishing is blocked</h2>
                <ul className="space-y-1 text-sm text-amber-900">
                  {publishBlocks.map((block) => (
                    <li key={`${block.field}-${block.blockCode}`}>{block.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Why this role exists */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-proofound-forest text-white flex items-center justify-center font-semibold">
              1
            </div>
            <h2 className="text-xl font-semibold text-foreground">Why this role exists</h2>
          </div>
          <div className="space-y-3 ml-10">
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium text-foreground">{assignment.title || assignment.role}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Engagement type</p>
              <p className="text-foreground">
                {assignment.engagementType?.replaceAll('_', ' ') || 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role purpose</p>
              <p className="text-foreground">
                {assignment.rolePurpose || assignment.businessValue}
              </p>
            </div>
          </div>
        </Card>

        {/* Work summary and outcomes */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-proofound-forest text-white flex items-center justify-center font-semibold">
              2
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              What work will actually be done
            </h2>
          </div>
          <div className="ml-10 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Work summary</p>
              <p className="text-foreground">
                {assignment.description || 'No work summary has been saved yet.'}
              </p>
            </div>
            {(assignment.expectedOutcomes || assignment.outcomes)?.length > 0 ? (
              <div className="space-y-3">
                {(assignment.expectedOutcomes || assignment.outcomes).map(
                  (outcome: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-japandi-bg rounded-lg"
                    >
                      <Check className="h-5 w-5 text-proofound-forest" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{outcome.metric}</p>
                        <p className="text-sm text-muted-foreground">
                          Target: {outcome.target} • Timeframe: {outcome.timeframe}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No outcomes defined</p>
            )}
          </div>
        </Card>

        {/* Proof expectations */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-proofound-forest text-white flex items-center justify-center font-semibold">
              3
            </div>
            <h2 className="text-xl font-semibold text-foreground">What proof would count</h2>
          </div>
          <div className="ml-10 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Proof expectations</p>
              <p className="text-foreground">
                {assignment.proofExpectations ||
                  assignment.expectedImpact ||
                  'No proof expectations have been saved yet.'}
              </p>
            </div>
            {assignment.verificationGates && assignment.verificationGates.length > 0 && (
              <div className="border-t pt-4">
                <p className="mb-2 text-sm text-muted-foreground">Verification requirements</p>
                <div className="flex flex-wrap gap-2">
                  {assignment.verificationGates.map((gate) => (
                    <Badge
                      key={gate}
                      variant="secondary"
                      className="bg-proofound-stone text-foreground"
                    >
                      {VERIFICATION_GATE_LABELS[gate] || gate}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Practical details */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-proofound-forest text-white flex items-center justify-center font-semibold">
              4
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              What practical constraints are real
            </h2>
          </div>
          <div className="ml-10 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {assignment.compensationMin != null && assignment.compensationMax != null ? (
                <div>
                  <p className="text-sm text-muted-foreground">Compensation range</p>
                  <p className="font-medium text-foreground">
                    {assignment.currency} {assignment.compensationMin.toLocaleString()} -{' '}
                    {assignment.compensationMax.toLocaleString()}
                  </p>
                </div>
              ) : null}
              {assignment.location ? (
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">{assignment.location}</p>
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        {/* Required skills */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-proofound-forest text-white flex items-center justify-center font-semibold">
              5
            </div>
            <h2 className="text-xl font-semibold text-foreground">Internal review checklist</h2>
          </div>
          <div className="ml-10">
            {assignment.requiredSkills && assignment.requiredSkills.length > 0 ? (
              <>
                <p className="mb-3 text-sm text-muted-foreground">
                  Must-have skills and proof expectations are ready for internal review.
                </p>
                <div className="flex flex-wrap gap-2">
                  {assignment.requiredSkills.map((skill: any, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-[#7A9278] text-proofound-forest"
                    >
                      {getSkillDisplayLabel(skill)} (Level {skill.level}/5)
                    </Badge>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No required skills defined</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
