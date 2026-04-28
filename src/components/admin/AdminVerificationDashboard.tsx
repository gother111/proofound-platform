'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock3, Loader2, ShieldCheck } from 'lucide-react';
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
  switch (item.status) {
    case 'open':
      return [
        { label: 'Start review', nextStatus: 'in_progress' as const, variant: 'outline' as const },
        { label: 'Resolve', nextStatus: 'resolved' as const, variant: 'default' as const },
        { label: 'Cancel', nextStatus: 'cancelled' as const, variant: 'ghost' as const },
      ];
    case 'in_progress':
      return [
        { label: 'Resolve', nextStatus: 'resolved' as const, variant: 'default' as const },
        { label: 'Cancel', nextStatus: 'cancelled' as const, variant: 'ghost' as const },
      ];
    case 'resolved':
    case 'cancelled':
      return [{ label: 'Reopen', nextStatus: 'open' as const, variant: 'outline' as const }];
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

  const handleQueueAction = async (item: QueueItem, nextStatus: QueueStatus) => {
    const note = notes[item.id]?.trim() ?? '';

    if (requiresOperatorNote(item.status, nextStatus) && !note) {
      toast.error('Add an operator note before resolving, cancelling, or reopening this item.');
      return;
    }

    try {
      setPendingAction(`${item.id}:${nextStatus}`);
      const response = await apiFetch(`/api/admin/internal-ops/queues/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: nextStatus,
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
      toast.success(`Queue item moved to ${formatQueueStatus(nextStatus)}.`);
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
                                  key={action.nextStatus}
                                  type="button"
                                  variant={action.variant}
                                  size="sm"
                                  loading={pendingAction === `${item.id}:${action.nextStatus}`}
                                  onClick={() => handleQueueAction(item, action.nextStatus)}
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
