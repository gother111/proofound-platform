'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch } from '@/lib/api/fetch';
import { internalValueLabel } from '@/lib/copy/labels';
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
type QueueAction = {
  id: string;
  label: string;
  nextStatus: QueueStatus;
  variant: 'default' | 'destructive' | 'outline' | 'ghost';
  uploadReviewAction?: 'approve' | 'reject';
  confirmationMessage?: string;
  successMessage?: string;
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

async function fetchQueueData() {
  const response = await apiFetch('/api/admin/internal-ops/queues');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to load operations queues');
  }

  return (await response.json()) as QueueResponse;
}

function formatQueueStatus(status: QueueItem['status']) {
  return internalValueLabel(status);
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

function requiresOperatorNote(currentStatus: QueueStatus, nextStatus: QueueStatus) {
  return (
    nextStatus === 'resolved' ||
    nextStatus === 'cancelled' ||
    (nextStatus === 'open' && (currentStatus === 'resolved' || currentStatus === 'cancelled'))
  );
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
          'Approve this upload for private proof record evidence? Raw filenames and storage paths must stay out of notes.',
        successMessage: 'Upload approved for private evidence.',
      },
      {
        id: 'reject_upload',
        label: 'Reject upload',
        nextStatus: 'resolved',
        variant: 'destructive',
        uploadReviewAction: 'reject',
        confirmationMessage:
          'Reject this upload and keep it out of the proof record flow? Add the privacy or safety reason in the operator note.',
        successMessage: 'Upload rejected and held out of the proof record flow.',
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
          { id: 'reopen', label: 'Reopen', nextStatus: 'open', variant: 'outline' },
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
        { id: 'resolve', label: 'Resolve', nextStatus: 'resolved', variant: 'default' },
        { id: 'cancel', label: 'Cancel', nextStatus: 'cancelled', variant: 'ghost' },
      ] satisfies QueueAction[];
    case 'in_progress':
      return [
        { id: 'resolve', label: 'Resolve', nextStatus: 'resolved', variant: 'default' },
        { id: 'cancel', label: 'Cancel', nextStatus: 'cancelled', variant: 'ghost' },
      ] satisfies QueueAction[];
    case 'resolved':
    case 'cancelled':
      return [
        { id: 'reopen', label: 'Reopen', nextStatus: 'open', variant: 'outline' },
      ] satisfies QueueAction[];
    default:
      return [];
  }
}

export function AdminVerificationDashboard() {
  const [data, setData] = useState<QueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<QueueId>('verification');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);

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
        console.error('Failed to load operations queues:', error);
        if (mounted) {
          toast.error(error instanceof Error ? error.message : 'Failed to load operations queues');
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

  const handleQueueAction = async (item: QueueItem, action: QueueAction) => {
    const nextStatus = action.nextStatus;
    const note = notes[item.id]?.trim() ?? '';

    if (requiresOperatorNote(item.status, nextStatus) && !note) {
      toast.error('Add an operator note before resolving, cancelling, or reopening this item.');
      return;
    }

    if (
      action.confirmationMessage &&
      typeof window !== 'undefined' &&
      typeof window.confirm === 'function' &&
      !window.confirm(action.confirmationMessage)
    ) {
      return;
    }

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
        const error = await response.json();
        throw new Error(error.error || 'Failed to update queue item');
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
    } catch (error) {
      console.error('Failed to update operations queue item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update queue item');
    } finally {
      setPendingAction(null);
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
            Active items still inside the launch-critical proof, privacy, and correction flow.
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
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShieldCheck className="h-5 w-5 text-proofound-forest" />
                  {queue.label}
                </CardTitle>
                <CardDescription>{queue.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {queue.items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-proofound-stone/80 bg-japandi-bg px-4 py-8 text-center text-sm text-muted-foreground">
                    No items are currently in this queue.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queue.items.map((item) => {
                      const actions = getQueueActions(item);
                      const requiresNote = actions.some((action) =>
                        requiresOperatorNote(item.status, action.nextStatus)
                      );
                      const detail = item.detail;

                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-proofound-stone/80 bg-white p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className={PRIORITY_BADGE_CLASS[item.priority]}>
                                  {item.priority}
                                </Badge>
                                <Badge className={STATUS_BADGE_CLASS[item.status]}>
                                  {formatQueueStatus(item.status)}
                                </Badge>
                                <Badge variant="outline">
                                  {internalValueLabel(item.linkedEntityType)}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium text-foreground">{item.summary}</p>
                              <p className="text-xs text-muted-foreground">
                                Related record: {item.linkedEntityId}
                              </p>
                              {item.resolvedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Last closed {new Date(item.resolvedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                                <p className="text-sm text-foreground">{detail.operatorSummary}</p>
                              </div>

                              {detail.fields.length > 0 && (
                                <div className="mt-3 grid gap-2 md:grid-cols-2">
                                  {detail.fields.map((field) => (
                                    <div key={`${item.id}:${field.label}`} className="text-sm">
                                      <span className="font-medium text-foreground">
                                        {field.label}:
                                      </span>{' '}
                                      <span className="text-muted-foreground">{field.value}</span>
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

                            <div className="flex flex-wrap gap-2">
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
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {Object.keys(item.metadata).length > 0 && (
                            <div className="mt-4 rounded-lg bg-[#F7F6F1] p-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Audit context
                              </p>
                              <div className="grid gap-2 md:grid-cols-2">
                                {Object.entries(item.metadata).map(([key, value]) => (
                                  <div key={key} className="text-sm">
                                    <span className="font-medium text-foreground">
                                      {internalValueLabel(key)}:
                                    </span>{' '}
                                    <span className="text-muted-foreground">
                                      {formatMetadataValue(value)}
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
    </div>
  );
}
