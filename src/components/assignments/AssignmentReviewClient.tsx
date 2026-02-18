'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Edit, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  role: string;
  businessValue: string;
  expectedImpact?: string;
  outcomes: any[];
  missionWeight: number;
  expertiseWeight: number;
  compensationMin?: number;
  compensationMax?: number;
  currency: string;
  location?: string;
  requiredSkills: any[];
  niceToHaveSkills: any[];
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

export function AssignmentReviewClient({ initialAssignment, assignmentId, slug }: Props) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(initialAssignment);
  const [isLoading, setIsLoading] = useState(!initialAssignment);
  const [hasFetched, setHasFetched] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

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
    try {
      const response = await fetch(
        `/api/assignments/${assignmentId}/publish?orgSlug=${encodeURIComponent(slug)}`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        toast.success('Assignment published');
        router.push(`/app/o/${slug}/matching`);
      } else {
        const errorPayload = await response.json().catch(() => ({}));
        toast.error(errorPayload.error || 'Failed to publish assignment');
      }
    } catch (error) {
      console.error('Failed to publish:', error);
      toast.error('Failed to publish assignment');
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
    <div className="min-h-screen bg-[#F7F6F1] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2D3330]">Review Assignment</h1>
            <p className="text-[#6B6760]">Review all details before publishing</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push(`/app/o/${slug}/assignments/new`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-[#1C4D3A] hover:bg-[#2D5F4A]"
            >
              {isPublishing ? 'Publishing...' : 'Publish Assignment'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Business Value */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#1C4D3A] text-white flex items-center justify-center font-semibold">
              1
            </div>
            <h2 className="text-xl font-semibold text-[#2D3330]">Business Value</h2>
          </div>
          <div className="space-y-3 ml-10">
            <div>
              <p className="text-sm text-[#6B6760]">Role</p>
              <p className="font-medium text-[#2D3330]">{assignment.role}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B6760]">Business Value</p>
              <p className="text-[#2D3330]">{assignment.businessValue}</p>
            </div>
            {assignment.expectedImpact && (
              <div>
                <p className="text-sm text-[#6B6760]">Expected Impact</p>
                <p className="text-[#2D3330]">{assignment.expectedImpact}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Target Outcomes */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#1C4D3A] text-white flex items-center justify-center font-semibold">
              2
            </div>
            <h2 className="text-xl font-semibold text-[#2D3330]">Target Outcomes</h2>
          </div>
          <div className="ml-10">
            {assignment.outcomes && assignment.outcomes.length > 0 ? (
              <div className="space-y-3">
                {assignment.outcomes.map((outcome: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-[#F7F6F1] rounded-lg">
                    <Check className="h-5 w-5 text-[#1C4D3A]" />
                    <div className="flex-1">
                      <p className="font-medium text-[#2D3330]">{outcome.metric}</p>
                      <p className="text-sm text-[#6B6760]">
                        Target: {outcome.target} • Timeframe: {outcome.timeframe}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#6B6760]">No outcomes defined</p>
            )}
          </div>
        </Card>

        {/* Weight Matrix */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#1C4D3A] text-white flex items-center justify-center font-semibold">
              3
            </div>
            <h2 className="text-xl font-semibold text-[#2D3330]">Weight Matrix</h2>
          </div>
          <div className="ml-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#6B6760]">Mission/Purpose Fit</span>
              <span className="font-semibold text-[#2D3330]">{assignment.missionWeight}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B6760]">Expertise Depth</span>
              <span className="font-semibold text-[#2D3330]">{assignment.expertiseWeight}%</span>
            </div>
          </div>
        </Card>

        {/* Practical Details */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#1C4D3A] text-white flex items-center justify-center font-semibold">
              4
            </div>
            <h2 className="text-xl font-semibold text-[#2D3330]">Practical Details</h2>
          </div>
          <div className="ml-10 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {assignment.compensationMin != null && assignment.compensationMax != null && (
                <div>
                  <p className="text-sm text-[#6B6760]">Compensation Range</p>
                  <p className="font-medium text-[#2D3330]">
                    {assignment.currency} {assignment.compensationMin.toLocaleString()} -{' '}
                    {assignment.compensationMax.toLocaleString()}
                  </p>
                </div>
              )}
              {assignment.location && (
                <div>
                  <p className="text-sm text-[#6B6760]">Location</p>
                  <p className="font-medium text-[#2D3330]">{assignment.location}</p>
                </div>
              )}
            </div>

            {/* Verification Gates */}
            {assignment.verificationGates && assignment.verificationGates.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-[#6B6760] mb-2">Verification Requirements</p>
                <div className="flex flex-wrap gap-2">
                  {assignment.verificationGates.map((gate) => (
                    <Badge key={gate} variant="secondary" className="bg-[#E8E6DD] text-[#2D3330]">
                      {VERIFICATION_GATE_LABELS[gate] || gate}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Required Skills */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#1C4D3A] text-white flex items-center justify-center font-semibold">
              5
            </div>
            <h2 className="text-xl font-semibold text-[#2D3330]">Required Skills</h2>
          </div>
          <div className="ml-10">
            {assignment.requiredSkills && assignment.requiredSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assignment.requiredSkills.map((skill: any, index: number) => (
                  <Badge key={index} variant="outline" className="border-[#7A9278] text-[#1C4D3A]">
                    {getSkillDisplayLabel(skill)} (Level {skill.level}/5)
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-[#6B6760]">No required skills defined</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
