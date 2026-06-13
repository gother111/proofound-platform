'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientDiagnostic } from '@/lib/client-diagnostics';
import { internalValueLabel } from '@/lib/copy/labels';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type QueueItem = {
  id: string;
  queueType: 'verification' | 'privacy_reveal_exception' | 'correction_revocation' | 'pilot_ops';
  status: 'open' | 'in_progress' | 'resolved' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  linkedEntityType: string;
  linkedEntityId: string;
  summary: string;
  metadata: Record<string, unknown>;
  detail?: {
    privacyScope: 'admin_minimum_necessary';
    recordKind: string;
    operatorSummary: string;
    fields: Array<{
      label: string;
      value: string;
      tone?: 'default' | 'warning' | 'danger' | 'success';
    }>;
    flags: string[];
    checklist: string[];
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

type QueueGroup = {
  id: QueueItem['queueType'];
  label: string;
  description: string;
  items: QueueItem[];
  openCount: number;
};

type QueueResponse = {
  queues: QueueGroup[];
  stats: {
    total: number;
    open: number;
  };
};

type QueueId = QueueGroup['id'];
type QueueStatus = QueueItem['status'];
type StatusFilter = 'active' | 'all' | QueueStatus;
type PriorityFilter = 'all' | 'high_urgent' | QueueItem['priority'];
type QueueAction = {
  id: string;
  label: string;
  nextStatus: QueueStatus;
  variant: 'default' | 'destructive' | 'outline' | 'ghost';
  uploadReviewAction?: 'approve' | 'reject';
  confirmationMessage?: string;
  successMessage?: string;
};
type ConfirmingQueueAction = {
  item: QueueItem;
  action: QueueAction;
  note: string;
};

const PRIORITY_BADGE_CLASS: Record<QueueItem['priority'], string> = {
  low: 'border-slate-300 text-slate-700 bg-slate-50',
  normal: 'border-proofound-stone text-proofound-charcoal bg-japandi-bg',
  high: 'border-amber-300 text-amber-900 bg-amber-50',
  urgent: 'border-red-300 text-red-900 bg-red-50',
};

const STATUS_BADGE_CLASS: Record<QueueItem['status'], string> = {
  open: 'border-blue-300 text-blue-900 bg-blue-50',
  in_progress: 'border-amber-300 text-amber-900 bg-amber-50',
  resolved: 'border-emerald-300 text-emerald-900 bg-emerald-50',
  cancelled: 'border-slate-300 text-slate-700 bg-slate-100',
};

const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'active', label: 'Active only' },
  { value: 'all', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_FILTER_OPTIONS: Array<{ value: PriorityFilter; label: string }> = [
  { value: 'all', label: 'All priorities' },
  { value: 'high_urgent', label: 'High or urgent' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

const REPO_DOC_BASE_URL = 'https://github.com/gother111/proofound-platform/blob/master';
const OPERATIONS_QUEUE_LOAD_RETRY_MESSAGE =
  'Operations queues could not be loaded. Refresh the queues before taking review action.';
const OPERATIONS_QUEUE_UPDATE_RETRY_MESSAGE =
  'Queue item could not be updated. The item stayed in review; check the note and try again.';

const QUEUE_SOP_LINKS = {
  verification: {
    label: 'Verification review SOP',
    path: 'docs/internal-ops/verification-review-sop.md',
  },
  privacy_reveal_exception: {
    label: 'Reveal privacy dispute SOP',
    path: 'docs/internal-ops/reveal-privacy-dispute-sop.md',
  },
  correction_revocation: {
    label: 'Redaction and risky upload SOP',
    path: 'docs/internal-ops/redaction-risky-upload-sop.md',
  },
  pilot_ops: {
    label: 'Pilot assignment quality checklist',
    path: 'docs/internal-ops/assignment-quality-checklist.md',
  },
} satisfies Record<QueueId, { label: string; path: string }>;

const DISPLAY_METADATA_KEYS = new Set([
  'assignmentStatus',
  'candidateConsentStatus',
  'claimId',
  'claimLabel',
  'decisionId',
  'decisionState',
  'deletionStatus',
  'disputeState',
  'exportStatus',
  'fallbackSurface',
  'filenameReviewLabel',
  'freshnessState',
  'latestOperatorAction',
  'latestOperatorActionAt',
  'metadataStatus',
  'monitoringStatus',
  'organizationConsentStatus',
  'organizationTrustPageStatus',
  'pendingParty',
  'privacyExceptionType',
  'publicPortfolioStatus',
  'revealStage',
  'reviewReasons',
  'safeForPublic',
  'schemaCompatibilityFallback',
  'safetyReason',
  'safetyStatus',
  'smokeStatus',
  'sourceSurface',
  'sensitivityReason',
  'recommendedRevealGate',
  'recommendedVisibility',
  'trustTier',
  'uploadKind',
  'uploadReviewAction',
  'attachStatus',
  'lifecycleState',
  'uploadedFileAttachStatus',
  'uploadedFileLifecycleState',
  'uploadedFileSafeForPublic',
  'verificationOutcome',
  'verificationStatus',
  'verdict',
  'workflowStatus',
]);

const METADATA_KEY_LABEL_OVERRIDES: Record<string, string> = {
  candidateConsentStatus: 'Proof-review participant consent status',
};

const METADATA_VALUE_LABEL_OVERRIDES: Record<string, Record<string, string>> = {
  pendingParty: {
    candidate: 'Proof-review participant',
  },
  revealStage: {
    candidate_consented: 'Proof-review participant consented',
  },
};

function getResponseStatus(response: Response) {
  return typeof response.status === 'number' ? response.status : 'unknown';
}

async function responseHasReturnedError(response: Response) {
  const payload = await response.json().catch(() => null);
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string' &&
      payload.error.trim().length > 0
  );
}

async function fetchQueueData() {
  const response = await apiFetch('/api/admin/internal-ops/queues');

  if (!response.ok) {
    dispatchClientDiagnostic('admin.operations_queues.load_returned_error', {
      status: getResponseStatus(response),
      hasReturnedError: await responseHasReturnedError(response),
    });
    throw new Error('operations_queues_load_request_failed');
  }

  return (await response.json()) as QueueResponse;
}

function formatQueueStatus(status: QueueItem['status']) {
  return internalValueLabel(status);
}

function formatQueueAge(createdAt: string) {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) {
    return 'Age unknown';
  }

  const ageMs = Date.now() - created;
  const ageHours = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60)));
  if (ageHours < 24) {
    return ageHours <= 1 ? 'Age under 1 hour' : `Age ${ageHours} hours`;
  }

  const ageDays = Math.floor(ageHours / 24);
  return ageDays === 1 ? 'Age 1 day' : `Age ${ageDays} days`;
}

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined) {
    return 'none';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value);
}

function formatMetadataKey(key: string) {
  return (
    METADATA_KEY_LABEL_OVERRIDES[key] ??
    internalValueLabel(key.replace(/([a-z0-9])([A-Z])/g, '$1_$2'))
  );
}

function formatMetadataDisplayValue(key: string, value: unknown) {
  if (typeof value === 'string') {
    return METADATA_VALUE_LABEL_OVERRIDES[key]?.[value] ?? formatMetadataValue(value);
  }

  return formatMetadataValue(value);
}

function formatPilotMetadataValue(key: string, value: string) {
  return METADATA_VALUE_LABEL_OVERRIDES[key]?.[value] ?? internalValueLabel(value);
}

function formatOptionalPilotMetadataValue(metadata: Record<string, unknown>, key: string) {
  const value = getMetadataString(metadata, key);
  return value ? formatPilotMetadataValue(key, value) : null;
}

function getDisplayMetadataEntries(metadata: Record<string, unknown>) {
  return Object.entries(metadata).filter(([key]) => DISPLAY_METADATA_KEYS.has(key));
}

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function requiresOperatorNote(currentStatus: QueueStatus, nextStatus: QueueStatus) {
  return (
    nextStatus === 'resolved' ||
    nextStatus === 'cancelled' ||
    (nextStatus === 'open' && (currentStatus === 'resolved' || currentStatus === 'cancelled'))
  );
}

function getPilotCorridorFields(item: QueueItem) {
  if (item.queueType !== 'pilot_ops') {
    return [];
  }

  return [
    ['Assignment', formatOptionalPilotMetadataValue(item.metadata, 'assignmentStatus')],
    ['Org trust', formatOptionalPilotMetadataValue(item.metadata, 'trustTier')],
    ['Trust page', formatOptionalPilotMetadataValue(item.metadata, 'organizationTrustPageStatus')],
    ['Reveal', formatOptionalPilotMetadataValue(item.metadata, 'revealStage')],
    [
      'Proof-review participant consent',
      formatOptionalPilotMetadataValue(item.metadata, 'candidateConsentStatus'),
    ],
    ['Decision', formatOptionalPilotMetadataValue(item.metadata, 'decisionState')],
    ['Decision record', getMetadataString(item.metadata, 'decisionId')],
    ['Engagement', formatOptionalPilotMetadataValue(item.metadata, 'workflowStatus')],
    ['Pending party', formatOptionalPilotMetadataValue(item.metadata, 'pendingParty')],
  ]
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .slice(0, 8);
}

function shouldShowQueueItem(
  item: QueueItem,
  statusFilter: StatusFilter,
  priorityFilter: PriorityFilter
) {
  const statusMatches =
    statusFilter === 'all' ||
    (statusFilter === 'active'
      ? item.status === 'open' || item.status === 'in_progress'
      : item.status === statusFilter);
  const priorityMatches =
    priorityFilter === 'all' ||
    (priorityFilter === 'high_urgent'
      ? item.priority === 'high' || item.priority === 'urgent'
      : item.priority === priorityFilter);

  return statusMatches && priorityMatches;
}

function getQueueActions(item: QueueItem) {
  if (item.linkedEntityType === 'uploaded_file') {
    const uploadReviewActions: QueueAction[] = [
      {
        id: 'approve_upload',
        label: 'Approve private evidence',
        nextStatus: 'resolved',
        variant: 'default',
        uploadReviewAction: 'approve',
        confirmationMessage:
          'Approve this upload for private Proof Pack evidence? Raw filenames and storage paths must stay out of notes.',
        successMessage: 'Upload approved for private evidence.',
      },
      {
        id: 'reject_upload',
        label: 'Reject upload',
        nextStatus: 'resolved',
        variant: 'destructive',
        uploadReviewAction: 'reject',
        confirmationMessage:
          'Reject this upload and keep it out of the Proof Pack corridor? Add the privacy or safety reason in the operator note.',
        successMessage: 'Upload rejected and held out of the Proof Pack corridor.',
      },
    ];

    switch (item.status) {
      case 'open':
        return [
          {
            id: 'start_review',
            label: 'Start review',
            nextStatus: 'in_progress',
            variant: 'outline',
          },
          ...uploadReviewActions,
        ] satisfies QueueAction[];
      case 'in_progress':
        return uploadReviewActions;
      case 'resolved':
      case 'cancelled':
        return [
          {
            id: 'reopen',
            label: 'Reopen',
            nextStatus: 'open',
            variant: 'outline',
            confirmationMessage:
              'Reopen this upload review item? Keep the operator note factual and free of raw file details.',
          },
        ] satisfies QueueAction[];
      default:
        return [];
    }
  }

  switch (item.status) {
    case 'open':
      return [
        {
          id: 'start_review',
          label: 'Start review',
          nextStatus: 'in_progress',
          variant: 'outline',
        },
        {
          id: 'resolve',
          label: 'Resolve',
          nextStatus: 'resolved',
          variant: 'default',
          confirmationMessage:
            'Resolve this queue item? Confirm the note captures only minimum necessary operational context.',
        },
        {
          id: 'cancel',
          label: 'Cancel',
          nextStatus: 'cancelled',
          variant: 'ghost',
          confirmationMessage:
            'Cancel this queue item? Confirm the note explains why it no longer belongs in active launch handling.',
        },
      ] satisfies QueueAction[];
    case 'in_progress':
      return [
        {
          id: 'resolve',
          label: 'Resolve',
          nextStatus: 'resolved',
          variant: 'default',
          confirmationMessage:
            'Resolve this queue item? Confirm the note captures only minimum necessary operational context.',
        },
        {
          id: 'cancel',
          label: 'Cancel',
          nextStatus: 'cancelled',
          variant: 'ghost',
          confirmationMessage:
            'Cancel this queue item? Confirm the note explains why it no longer belongs in active launch handling.',
        },
      ] satisfies QueueAction[];
    case 'resolved':
    case 'cancelled':
      return [
        {
          id: 'reopen',
          label: 'Reopen',
          nextStatus: 'open',
          variant: 'outline',
          confirmationMessage:
            'Reopen this queue item? Confirm the note explains the launch-safe reason for renewed review.',
        },
      ] satisfies QueueAction[];
    default:
      return [];
  }
}

export function AdminVerificationDashboard() {
  const [data, setData] = useState<QueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<QueueId>('verification');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<ConfirmingQueueAction | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadQueue = async () => {
      try {
        setLoading(true);
        const nextData = await fetchQueueData();
        if (mounted) {
          setData(nextData);
        }
      } catch (error) {
        dispatchClientDiagnostic('admin.operations_queues.load_failed', {
          errorName: error instanceof Error ? error.name : typeof error,
          error: error instanceof Error ? error.message : 'unknown',
        });
        if (mounted) {
          toast.error(OPERATIONS_QUEUE_LOAD_RETRY_MESSAGE);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadQueue();

    return () => {
      mounted = false;
    };
  }, []);

  const queueIds = useMemo(
    () =>
      (data?.queues.map((queue) => queue.id) as QueueId[] | undefined) ?? [
        'verification',
        'privacy_reveal_exception',
        'correction_revocation',
        'pilot_ops',
      ],
    [data]
  );

  useEffect(() => {
    if (!queueIds.includes(selectedTab)) {
      setSelectedTab((queueIds[0] ?? 'verification') as QueueId);
    }
  }, [queueIds, selectedTab]);

  const submitQueueAction = async (item: QueueItem, action: QueueAction, note: string) => {
    const nextStatus = action.nextStatus;

    try {
      setPendingAction(`${item.id}:${action.id}`);
      const response = await apiFetch(`/api/admin/internal-ops/queues/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: nextStatus,
          ...(action.uploadReviewAction ? { uploadReviewAction: action.uploadReviewAction } : {}),
          note: note || undefined,
        }),
      });

      if (!response.ok) {
        dispatchClientDiagnostic('admin.operations_queues.update_returned_error', {
          itemId: item.id,
          action: action.id,
          nextStatus,
          status: getResponseStatus(response),
          hasReturnedError: await responseHasReturnedError(response),
        });
        throw new Error('operations_queue_update_request_failed');
      }

      const nextData = await fetchQueueData();
      setData(nextData);
      setNotes((current) => ({
        ...current,
        [item.id]: '',
      }));
      toast.success(
        action.successMessage ?? `Queue item moved to ${formatQueueStatus(nextStatus)}.`
      );
      return true;
    } catch (error) {
      dispatchClientDiagnostic('admin.operations_queues.update_failed', {
        errorName: error instanceof Error ? error.name : typeof error,
        error: error instanceof Error ? error.message : 'unknown',
      });
      toast.error(OPERATIONS_QUEUE_UPDATE_RETRY_MESSAGE);
      return false;
    } finally {
      setPendingAction(null);
    }
  };

  const handleQueueAction = async (item: QueueItem, action: QueueAction) => {
    const nextStatus = action.nextStatus;
    const note = notes[item.id]?.trim() ?? '';

    if (requiresOperatorNote(item.status, nextStatus) && !note) {
      toast.error('Add an operator note before resolving, cancelling, or reopening this item.');
      return;
    }

    if (action.confirmationMessage) {
      setConfirmingAction({ item, action, note });
      return;
    }

    await submitQueueAction(item, action, note);
  };

  const confirmingActionKey = confirmingAction
    ? `${confirmingAction.item.id}:${confirmingAction.action.id}`
    : null;

  const handleConfirmQueueAction = async () => {
    if (!confirmingAction) {
      return;
    }

    const succeeded = await submitQueueAction(
      confirmingAction.item,
      confirmingAction.action,
      confirmingAction.note
    );
    if (succeeded) {
      setConfirmingAction(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-14">
          <Loader2 className="h-5 w-5 animate-spin text-proofound-forest" />
          <p className="text-muted-foreground">Loading operations queues...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-14 text-amber-900">
          <AlertCircle className="h-5 w-5" />
          <p>Operations queue data could not be loaded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Queue coverage</CardDescription>
            <CardTitle className="text-2xl">{data.stats.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Total operations items across verification, privacy, risky-upload, and pilot review.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Open or in progress</CardDescription>
            <CardTitle className="text-2xl">{data.stats.open}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Active items still inside the launch-critical proof, privacy, and correction corridor.
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as QueueId)}>
        <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 md:grid-cols-4">
          {data.queues.map((queue) => (
            <TabsTrigger
              key={queue.id}
              value={queue.id}
              className="flex flex-col items-start gap-1 rounded-lg border border-proofound-stone bg-white px-4 py-3 text-left data-[state=active]:border-proofound-forest data-[state=active]:bg-[#F3F8F5]"
            >
              <span className="text-sm font-semibold">{queue.label}</span>
              <span className="text-xs text-muted-foreground">{queue.openCount} open</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {data.queues.map((queue) => (
          <TabsContent key={queue.id} value={queue.id} className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <ShieldCheck className="h-5 w-5 text-proofound-forest" />
                      {queue.label}
                    </CardTitle>
                    <CardDescription className="mt-1">{queue.description}</CardDescription>
                  </div>
                  <a
                    href={`${REPO_DOC_BASE_URL}/${QUEUE_SOP_LINKS[queue.id].path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-md border border-proofound-stone bg-white px-3 py-2 text-sm font-medium text-proofound-forest hover:bg-[#F3F8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={`${QUEUE_SOP_LINKS[queue.id].label} (${QUEUE_SOP_LINKS[queue.id].path})`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{QUEUE_SOP_LINKS[queue.id].label}</span>
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid gap-3 rounded-lg border border-proofound-stone/70 bg-[#FBFAF6] p-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </span>
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {STATUS_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Priority
                    </span>
                    <select
                      value={priorityFilter}
                      onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {PRIORITY_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {queue.items.filter((item) =>
                  shouldShowQueueItem(item, statusFilter, priorityFilter)
                ).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-proofound-stone/80 bg-japandi-bg px-4 py-8 text-center text-sm text-muted-foreground">
                    No items match the current filters.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queue.items
                      .filter((item) => shouldShowQueueItem(item, statusFilter, priorityFilter))
                      .map((item) => {
                        const actions = getQueueActions(item);
                        const requiresNote = actions.some((action) =>
                          requiresOperatorNote(item.status, action.nextStatus)
                        );
                        const detail = item.detail;
                        const pilotCorridorFields = getPilotCorridorFields(item);
                        const displayMetadataEntries = getDisplayMetadataEntries(item.metadata);

                        return (
                          <div
                            key={item.id}
                            className="overflow-hidden rounded-xl border border-proofound-stone/80 bg-white p-4 shadow-sm"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className={PRIORITY_BADGE_CLASS[item.priority]}>
                                    {internalValueLabel(item.priority)}
                                  </Badge>
                                  <Badge className={STATUS_BADGE_CLASS[item.status]}>
                                    {formatQueueStatus(item.status)}
                                  </Badge>
                                  <Badge variant="outline">
                                    {internalValueLabel(item.linkedEntityType)}
                                  </Badge>
                                  <Badge variant="outline">{formatQueueAge(item.createdAt)}</Badge>
                                </div>
                                <p className="break-words text-sm font-medium text-foreground">
                                  {item.summary}
                                </p>
                                <p className="break-all text-xs text-muted-foreground">
                                  Related record: {item.linkedEntityId}
                                </p>
                                {item.resolvedAt && (
                                  <p className="text-xs text-muted-foreground">
                                    Last closed {new Date(item.resolvedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                                <Clock3 className="h-4 w-4" />
                                Updated {new Date(item.updatedAt).toLocaleString()}
                              </div>
                            </div>

                            {detail && (
                              <div className="mt-4 rounded-lg border border-proofound-stone/70 bg-[#FBFAF6] p-3">
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Minimum necessary context
                                  </p>
                                  <p className="text-sm text-foreground">
                                    {detail.operatorSummary}
                                  </p>
                                </div>

                                {detail.fields.length > 0 && (
                                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                                    {detail.fields.map((field) => (
                                      <div
                                        key={`${item.id}:${field.label}`}
                                        className="min-w-0 text-sm"
                                      >
                                        <span className="font-medium text-foreground">
                                          {field.label}:
                                        </span>{' '}
                                        <span className="break-words text-muted-foreground">
                                          {field.value}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {detail.flags.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {detail.flags.map((flag) => (
                                      <Badge key={`${item.id}:flag:${flag}`} variant="outline">
                                        {internalValueLabel(flag)}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {detail.checklist.length > 0 && (
                                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                                    {detail.checklist.map((entry) => (
                                      <li key={`${item.id}:checklist:${entry}`}>{entry}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}

                            {pilotCorridorFields.length > 0 && (
                              <div className="mt-4 rounded-lg border border-proofound-stone/70 bg-white p-3">
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Pilot corridor
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Read-only workflow state for stuck handoff support.
                                  </p>
                                </div>
                                <div className="mt-3 grid gap-2 md:grid-cols-2">
                                  {pilotCorridorFields.map(([label, value]) => (
                                    <div key={`${item.id}:pilot:${label}`} className="text-sm">
                                      <span className="font-medium text-foreground">{label}:</span>{' '}
                                      <span className="break-words text-muted-foreground">
                                        {value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-4 space-y-3 rounded-lg border border-proofound-stone/70 bg-[#FBFAF6] p-3">
                              <div className="space-y-2">
                                <label
                                  htmlFor={`operator-note-${item.id}`}
                                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                >
                                  Operator note
                                </label>
                                <Textarea
                                  id={`operator-note-${item.id}`}
                                  value={notes[item.id] ?? ''}
                                  onChange={(event) =>
                                    setNotes((current) => ({
                                      ...current,
                                      [item.id]: event.target.value,
                                    }))
                                  }
                                  placeholder={
                                    requiresNote
                                      ? 'Required before resolve, cancel, or reopen.'
                                      : 'Optional note for manual handling context.'
                                  }
                                  className="min-h-[96px] text-sm"
                                />
                              </div>

                              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                {actions.map((action) => (
                                  <Button
                                    key={action.id}
                                    type="button"
                                    variant={action.variant}
                                    size="sm"
                                    leftIcon={
                                      action.uploadReviewAction === 'approve' ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                      ) : action.uploadReviewAction === 'reject' ? (
                                        <XCircle className="h-4 w-4" />
                                      ) : undefined
                                    }
                                    loading={pendingAction === `${item.id}:${action.id}`}
                                    onClick={() => handleQueueAction(item, action)}
                                    className="w-full sm:w-auto"
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {displayMetadataEntries.length > 0 && (
                              <div className="mt-4 rounded-lg bg-[#F7F6F1] p-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Audit context
                                </p>
                                <div className="grid gap-2 md:grid-cols-2">
                                  {displayMetadataEntries.map(([key, value]) => (
                                    <div key={key} className="min-w-0 text-sm">
                                      <span className="font-medium text-foreground">
                                        {formatMetadataKey(key)}:
                                      </span>{' '}
                                      <span className="break-words text-muted-foreground">
                                        {formatMetadataDisplayValue(key, value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      <AlertDialog
        open={Boolean(confirmingAction)}
        onOpenChange={(open) => {
          if (!open && !pendingAction) {
            setConfirmingAction(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmingAction?.action.label} queue item?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>{confirmingAction?.action.confirmationMessage}</p>
                {confirmingAction && (
                  <div className="rounded-lg border border-proofound-stone/70 bg-[#FBFAF6] p-3 text-left text-sm text-foreground">
                    <p className="font-medium">{confirmingAction.item.summary}</p>
                    <p className="mt-2 break-all text-xs text-muted-foreground">
                      Related record: {confirmingAction.item.linkedEntityId}
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Operator note
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                      {confirmingAction.note || 'No operator note added.'}
                    </p>
                  </div>
                )}
                <p>
                  Confirming will update this launch-critical queue item. Keep details minimum
                  necessary and leave private evidence out of the note.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingAction === confirmingActionKey}>
              Keep in review
            </AlertDialogCancel>
            <Button
              type="button"
              variant={confirmingAction?.action.variant ?? 'default'}
              loading={pendingAction === confirmingActionKey}
              disabled={pendingAction === confirmingActionKey}
              onClick={() => void handleConfirmQueueAction()}
            >
              {confirmingAction
                ? `Confirm ${confirmingAction.action.label.toLowerCase()}`
                : 'Confirm action'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
