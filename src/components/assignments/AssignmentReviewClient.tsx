'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, Edit, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { engagementTypeLabel, internalValueLabel, skillDisplayLabel } from '@/lib/copy/labels';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

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

const VERIFICATION_GATE_LABELS: Record<string, string> = {
  identity: 'Identity Verification',
  work_email: 'Work Email Verification',
  background_check: 'Background Check',
  education: 'Education Verification',
};

const SKILL_REQUIREMENT_DEPTH_LABELS: Record<number, string> = {
  1: 'Baseline proof depth',
  2: 'Working proof depth',
  3: 'Solid proof depth',
  4: 'Strong proof depth',
  5: 'Deep proof depth',
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

type ReviewItem = {
  label: string;
  ready: boolean;
  detail: string;
};

const PUBLISH_RETURNED_ERROR_MESSAGES = new Map([
  [
    'ASSIGNMENT_INTERNAL_REVIEW_REQUIRED',
    'Assignment must reach internal review before it can be published.',
  ],
  [
    'ASSIGNMENT_NOT_PUBLISHABLE',
    'Assignment is not in a publishable state. Refresh the review page before trying again.',
  ],
  ['ORG_NOT_READY', 'Complete the organization trust basics before publishing this assignment.'],
  ['ASSIGNMENT_PUBLISH_STATE_CHANGED', 'Assignment publish state changed. Refresh and try again.'],
  ['ASSIGNMENT_PUBLISH_BLOCKED', 'Publishing is blocked by trust or policy requirements.'],
  ['ASSIGNMENT_PUBLISH_ON_HOLD', 'Publishing is on hold pending trust or policy review.'],
  ['Assignment is not ready to publish', 'Complete all required sections before publishing.'],
  [
    'Assignment not found or access denied',
    'Assignment could not be published from this organization context. Refresh access and try again.',
  ],
  [
    'Organization context mismatch',
    'Assignment could not be published from this organization context. Refresh access and try again.',
  ],
  [
    'Forbidden. Organization manager or owner role is required to publish assignments.',
    'Your role cannot publish this assignment. Ask an owner or manager to publish it.',
  ],
  ['Unauthorized', 'Sign in again before publishing this assignment.'],
]);

const PUBLISH_RETURNED_FALLBACK_MESSAGE =
  'Assignment publishing is currently blocked. Review the draft and retry from this page.';

function hasText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function getSkillRequirementDepthLabel(level: unknown) {
  const numericLevel = typeof level === 'number' ? level : Number(level);
  if (!Number.isFinite(numericLevel)) {
    return 'Proof depth not set';
  }

  return SKILL_REQUIREMENT_DEPTH_LABELS[Math.round(numericLevel)] ?? 'Proof depth not set';
}

function formatCompensationRange(assignment: Assignment) {
  const currency =
    typeof assignment.currency === 'string' && assignment.currency.trim().length > 0
      ? assignment.currency.trim().toUpperCase()
      : 'Compensation';
  const min = assignment.compensationMin?.toLocaleString() ?? 'not set';
  const max = assignment.compensationMax?.toLocaleString() ?? 'not set';
  return `${currency} ${min} to ${max}`;
}

function getReviewItems(assignment: Assignment): ReviewItem[] {
  const outcomes = assignment.expectedOutcomes || assignment.outcomes || [];
  const items: ReviewItem[] = [
    {
      label: 'Role purpose',
      ready:
        hasText(assignment.title || assignment.role) &&
        hasText(assignment.rolePurpose || assignment.businessValue),
      detail: 'Name the role and why the work matters.',
    },
    {
      label: 'Work summary',
      ready: hasText(assignment.description),
      detail: 'Describe the real work before publishing.',
    },
    {
      label: 'Outcomes',
      ready: outcomes.length > 0,
      detail: 'Add at least one outcome the reviewer can recognize.',
    },
    {
      label: 'Proof expectations',
      ready: hasText(assignment.proofExpectations || assignment.expectedImpact),
      detail: 'Say what proof would count for this assignment.',
    },
    {
      label: 'Must-have skills',
      ready: (assignment.requiredSkills || []).length > 0,
      detail: 'Attach the skills reviewers should use as anchors.',
    },
  ];

  if (hasUnsupportedVerificationGates(assignment.verificationGates)) {
    items.push({
      label: 'Trust requirements',
      ready: false,
      detail: 'Remove unsupported trust requirements before publishing.',
    });
  }

  return items;
}

function getSupportedVerificationGates(gates: string[] | undefined) {
  return (gates ?? []).filter((gate) => VERIFICATION_GATE_LABELS[gate]);
}

function hasUnsupportedVerificationGates(gates: string[] | undefined) {
  return (gates ?? []).some((gate) => !VERIFICATION_GATE_LABELS[gate]);
}

function getResponseStatus(response: Response) {
  return typeof response.status === 'number' ? response.status : 'unknown';
}

function getReturnedErrorCode(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { error?: unknown };
  return typeof record.error === 'string' && record.error.trim().length > 0
    ? record.error.trim()
    : null;
}

function hasReturnedError(payload: unknown) {
  if (!payload || typeof payload !== 'object') return false;
  const record = payload as { error?: unknown; message?: unknown };
  return (
    (typeof record.error === 'string' && record.error.trim().length > 0) ||
    (typeof record.message === 'string' && record.message.trim().length > 0)
  );
}

function getPublishReturnedMessage(payload: unknown) {
  const errorCode = getReturnedErrorCode(payload);
  if (errorCode) {
    return PUBLISH_RETURNED_ERROR_MESSAGES.get(errorCode) ?? PUBLISH_RETURNED_FALLBACK_MESSAGE;
  }

  return PUBLISH_RETURNED_FALLBACK_MESSAGE;
}

export function AssignmentReviewClient({ initialAssignment, assignmentId, slug }: Props) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(initialAssignment);
  const [isLoading, setIsLoading] = useState(!initialAssignment);
  const [hasFetched, setHasFetched] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishBlocks, setPublishBlocks] = useState<PublishBlock[]>([]);

  // Fallback fetch only if server fetch returned nothing
  useEffect(() => {
    if (assignment || hasFetched) return;

    const fetchClient = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/assignments/${assignmentId}?orgSlug=${encodeURIComponent(slug)}`
        );
        if (res.ok) {
          const data = await res.json();
          setAssignment(data.assignment);
        } else {
          setAssignment(null);
        }
      } catch (error) {
        dispatchClientErrorDiagnostic('assignment_review.client_fetch_failed', error);
        setAssignment(null);
      } finally {
        setIsLoading(false);
        setHasFetched(true);
      }
    };

    fetchClient();
  }, [assignment, assignmentId, hasFetched, slug]);

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishBlocks([]);
    try {
      const response = await apiFetch(`/api/assignments/${assignmentId}/publish?orgSlug=${slug}`, {
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
        setPublishDialogOpen(false);
        router.push(`/app/o/${slug}/assignments?assignment=${encodeURIComponent(assignmentId)}`);
      } else {
        setPublishDialogOpen(false);
        const errorData = await response.json().catch(() => ({}));
        const blocks = Array.isArray(errorData.details?.blocks)
          ? (errorData.details.blocks as PublishBlock[])
          : [];
        if (blocks.length === 0) {
          dispatchClientDiagnostic('assignment_review.publish_returned_error', {
            status: getResponseStatus(response),
            hasReturnedError: hasReturnedError(errorData),
          });
        }
        setPublishBlocks(
          blocks.length > 0
            ? blocks
            : [
                {
                  blockCode: 'publish_blocked',
                  field: 'publish',
                  message: getPublishReturnedMessage(errorData),
                },
              ]
        );
      }
    } catch (error) {
      dispatchClientErrorDiagnostic('assignment_review.publish_failed', error);
      setPublishDialogOpen(false);
      setPublishBlocks([
        {
          blockCode: 'publish_request_failed',
          field: 'publish',
          message:
            'Assignment could not be published. Your review is still here; retry when the connection is back.',
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
      <div className="min-h-screen bg-japandi-bg p-4 sm:p-6">
        <div className="mx-auto max-w-3xl">
          <Card className="border-proofound-stone/80 bg-white/85 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-proofound-parchment text-amber-700">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Assignment review
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold text-foreground">
                    Assignment review unavailable
                  </h1>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  This assignment could not be opened for this organization. It may have been moved,
                  deleted, or no longer available to your current role.
                </p>
                <div className="rounded-lg border border-proofound-stone/70 bg-proofound-parchment/60 p-3 text-sm leading-6 text-muted-foreground">
                  No proof submissions, proof-review participant details, or review-stage data are
                  shown from this unavailable state.
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button onClick={() => router.push(`/app/o/${slug}/assignments`)}>
                    Back to assignments
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/app/o/${slug}/assignments/new`)}
                  >
                    Create assignment
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const isPublished = assignment.status === 'active';
  const isClosed = assignment.status === 'closed';
  const reviewItems = getReviewItems(assignment);
  const missingReviewItems = reviewItems.filter((item) => !item.ready);
  const isReviewReady = missingReviewItems.length === 0;
  const publishDisabled = isPublishing || isPublished || isClosed || !isReviewReady;
  const statusTitle = isPublished
    ? 'This assignment is published.'
    : isClosed
      ? 'This assignment is closed.'
      : isReviewReady
        ? 'Ready to publish.'
        : `${missingReviewItems.length} ${missingReviewItems.length === 1 ? 'item needs' : 'items need'} review.`;
  const statusDescription = isPublished
    ? 'Review and matching can continue from the assignment list.'
    : isClosed
      ? 'Closed assignments stay visible for context, but publishing actions are disabled.'
      : isReviewReady
        ? 'Everything needed for the narrow publish path is present. Publish when your team is ready to start matching.'
        : 'Finish the missing items before publishing so submitters see a specific, proof-led assignment.';

  return (
    <div className="min-h-screen bg-japandi-bg p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-semibold text-foreground">
              Internal review before publish
            </h1>
            <p className="text-muted-foreground">
              Confirm the assignment is specific, credible, and ready for a narrow publish path.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => router.push(`/app/o/${slug}/assignments/new?draftId=${assignmentId}`)}
              className="w-full justify-center sm:w-auto"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            {isPublished ? (
              <Badge className="bg-proofound-forest text-white">Published</Badge>
            ) : (
              <Button
                onClick={() => setPublishDialogOpen(true)}
                disabled={publishDisabled}
                className="w-full justify-center bg-proofound-forest hover:bg-proofound-forest/90 sm:w-auto"
              >
                {isPublishing
                  ? 'Publishing...'
                  : isClosed
                    ? 'Assignment closed'
                    : 'Publish assignment'}
                {!isClosed ? <ChevronRight className="h-4 w-4 ml-2" /> : null}
              </Button>
            )}
          </div>
        </div>

        <Card className="border-proofound-stone/80 bg-white/80 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Review readiness
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">{statusTitle}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {statusDescription}
              </p>
            </div>
            {!isPublished && !isClosed && !isReviewReady ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(`/app/o/${slug}/assignments/new?draftId=${assignmentId}`)
                }
                className="w-full justify-center lg:w-auto"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit missing items
              </Button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {reviewItems.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-proofound-stone/70 bg-proofound-parchment/60 p-3"
              >
                <div className="flex items-center gap-2">
                  {item.ready ? (
                    <Check className="h-4 w-4 text-proofound-forest" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-700" />
                  )}
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        {publishBlocks.length > 0 ? (
          <Card className="border-amber-300 bg-amber-50 p-5" role="alert" aria-live="assertive">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-amber-900">Publishing is blocked</h2>
                  <p className="text-sm leading-6 text-amber-900">
                    This assignment has not been published. Retry publish from here after the block
                    clears, or edit the draft before trying again.
                  </p>
                  <ul className="space-y-1 text-sm text-amber-900">
                    {publishBlocks.map((block) => (
                      <li key={`${block.field}-${block.blockCode}`}>{block.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {!isPublished && !isClosed && isReviewReady ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full shrink-0 border-amber-700 text-amber-950 hover:bg-amber-100 sm:w-auto"
                  onClick={() => {
                    void handlePublish();
                  }}
                  disabled={isPublishing}
                >
                  {isPublishing ? 'Retrying...' : 'Retry publish'}
                </Button>
              ) : null}
            </div>
          </Card>
        ) : null}

        <Dialog
          open={publishDialogOpen}
          onOpenChange={(open) => {
            if (!isPublishing) setPublishDialogOpen(open);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-proofound-forest">
                <Check className="h-5 w-5" aria-hidden="true" />
                Publish assignment
              </DialogTitle>
              <DialogDescription>
                This starts the proof-led assignment-review flow for this assignment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 rounded-lg border border-[#d8e6d2] bg-[#f5faf1] p-3 text-sm text-proofound-forest">
              <p className="font-medium">Publication makes the assignment discoverable.</p>
              <p>
                Reviewers will use this brief, its proof expectations, and its required skills to
                assess fit. You can still manage the flow from the assignment list after
                publishing.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPublishDialogOpen(false)}
                disabled={isPublishing}
              >
                Keep reviewing
              </Button>
              <Button
                onClick={() => {
                  void handlePublish();
                }}
                disabled={isPublishing}
                className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
              >
                {isPublishing ? 'Publishing...' : 'Publish assignment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Why this role exists */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-proofound-forest text-white flex items-center justify-center font-semibold">
              1
            </div>
            <h2 className="text-xl font-semibold text-foreground">Why this role exists</h2>
          </div>
          <div className="space-y-3 sm:ml-10">
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium text-foreground">{assignment.title || assignment.role}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Engagement type</p>
              <p className="text-foreground">{engagementTypeLabel(assignment.engagementType)}</p>
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
          <div className="space-y-4 sm:ml-10">
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
          <div className="space-y-4 sm:ml-10">
            <div>
              <p className="text-sm text-muted-foreground">Proof expectations</p>
              <p className="text-foreground">
                {assignment.proofExpectations ||
                  assignment.expectedImpact ||
                  'No proof expectations have been saved yet.'}
              </p>
            </div>
            {getSupportedVerificationGates(assignment.verificationGates).length > 0 && (
              <div className="border-t pt-4">
                <p className="mb-2 text-sm text-muted-foreground">Verification requirements</p>
                <div className="flex flex-wrap gap-2">
                  {getSupportedVerificationGates(assignment.verificationGates).map((gate) => (
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
            {hasUnsupportedVerificationGates(assignment.verificationGates) ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Remove unsupported trust requirements before publishing this assignment.
              </p>
            ) : null}
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
          <div className="space-y-4 sm:ml-10">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {assignment.compensationMin != null && assignment.compensationMax != null ? (
                <div>
                  <p className="text-sm text-muted-foreground">Compensation range</p>
                  <p className="font-medium text-foreground">
                    {formatCompensationRange(assignment)}
                  </p>
                </div>
              ) : null}
              {assignment.location ? (
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">
                    {internalValueLabel(assignment.location)}
                  </p>
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
          <div className="sm:ml-10">
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
                      {skillDisplayLabel(skill)}: {getSkillRequirementDepthLabel(skill.level)}
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
