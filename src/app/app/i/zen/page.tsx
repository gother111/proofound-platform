'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Download, LockKeyhole, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { CheckInDialog } from '@/components/zen/CheckInDialog';
import { PrivacyBanner } from '@/components/zen/PrivacyBanner';
import { ReflectionDialog } from '@/components/zen/ReflectionDialog';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/fetch';
import { deleteZenData, exportZenData, setWellbeingOptIn } from '@/lib/wellbeing/client';

export const dynamic = 'force-dynamic';

type OptInState = {
  optedIn: boolean;
  privacyBannerAcknowledged: boolean;
  privacyBoundary?: string;
};

type CheckInEntry = {
  id: string;
  stressLevel: number;
  controlLevel: number;
  milestoneType?: string | null;
  createdAt: string;
};

type ReflectionEntry = {
  id: string;
  reflectionText: string;
  milestoneType?: string | null;
  linkedCheckinId?: string | null;
  createdAt: string;
};

type MilestonePrompt = {
  type: 'rejection' | 'interview' | 'offer' | 'withdrawal' | 'no_show';
  occurredAt: string;
  sourceEvent: string;
};

function milestoneLabel(value?: string | null) {
  switch (value) {
    case 'rejection':
      return 'Rejection';
    case 'interview':
      return 'Interview';
    case 'offer':
      return 'Offer';
    case 'withdrawal':
      return 'Withdrawal';
    case 'no_show':
      return 'No-show';
    default:
      return 'Milestone';
  }
}

export default function PrivateCheckInsPage() {
  const [optInState, setOptInState] = useState<OptInState | null>(null);
  const [checkins, setCheckins] = useState<CheckInEntry[]>([]);
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [milestones, setMilestones] = useState<MilestonePrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showReflectionDialog, setShowReflectionDialog] = useState(false);
  const [defaultMilestone, setDefaultMilestone] = useState<MilestonePrompt['type'] | undefined>();
  const [busyAction, setBusyAction] = useState<'export' | 'delete' | null>(null);

  async function loadZenState() {
    setLoading(true);
    try {
      const optInResponse = await apiFetch('/api/wellbeing/opt-in');
      if (!optInResponse.ok) {
        throw new Error('Failed to load private check-in status');
      }
      const optIn = (await optInResponse.json()) as OptInState;
      setOptInState(optIn);

      if (optIn.optedIn) {
        const [checkinResponse, reflectionResponse, milestoneResponse] = await Promise.all([
          apiFetch('/api/wellbeing/checkin?limit=12'),
          apiFetch('/api/wellbeing/reflections?limit=12'),
          apiFetch('/api/wellbeing/milestones?days=21'),
        ]);

        if (checkinResponse.ok) {
          const data = await checkinResponse.json();
          setCheckins(data.checkins || []);
        }
        if (reflectionResponse.ok) {
          const data = await reflectionResponse.json();
          setReflections(data.reflections || []);
        }
        if (milestoneResponse.ok) {
          const data = await milestoneResponse.json();
          setMilestones(data.milestones || []);
        }
      } else {
        setCheckins([]);
        setReflections([]);
        setMilestones([]);
      }
    } catch (error) {
      console.error('zen.page.load.failed', error);
      toast.error('Failed to load private check-ins');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadZenState();
  }, []);

  const recentEntries = [
    ...checkins.map((entry) => ({
      id: `checkin-${entry.id}`,
      type: 'checkin' as const,
      createdAt: entry.createdAt,
      title: 'Private check-in',
      subtitle: `Stress ${entry.stressLevel}/5 • Control ${entry.controlLevel}/5`,
      milestoneType: entry.milestoneType,
      body: null as string | null,
    })),
    ...reflections.map((entry) => ({
      id: `reflection-${entry.id}`,
      type: 'reflection' as const,
      createdAt: entry.createdAt,
      title: 'Private reflection',
      subtitle: entry.milestoneType ? milestoneLabel(entry.milestoneType) : 'General reflection',
      milestoneType: entry.milestoneType,
      body: entry.reflectionText,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  async function handleOptIn() {
    const response = await setWellbeingOptIn({
      optedIn: true,
      privacyBannerAcknowledged: true,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to enable private check-ins');
    }

    toast.success('Private check-ins enabled');
    await loadZenState();
  }

  async function handleExport() {
    setBusyAction('export');
    try {
      const response = await exportZenData('json');
      if (!response.ok) {
        throw new Error('Failed to export Zen data');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proofound-zen-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Zen export ready');
    } catch (error) {
      console.error('zen.export.failed', error);
      toast.error('Failed to export Zen data');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      'Delete all Zen check-ins and reflections? This cannot be undone.'
    );
    if (!confirmed) return;

    setBusyAction('delete');
    try {
      const response = await deleteZenData();
      if (!response.ok) {
        throw new Error('Failed to delete Zen data');
      }

      toast.success('Zen data deleted');
      await loadZenState();
    } catch (error) {
      console.error('zen.delete.failed', error);
      toast.error('Failed to delete Zen data');
    } finally {
      setBusyAction(null);
    }
  }

  if (loading || !optInState) {
    return (
      <AppSurface>
        <div className="mx-auto max-w-3xl py-12 text-center text-sm text-muted-foreground">
          Loading private check-ins...
        </div>
      </AppSurface>
    );
  }

  return (
    <AppSurface>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 py-6">
        <div className="space-y-2">
          <h1 className="font-serif text-3xl text-foreground">Private check-ins</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            An optional private space for brief check-ins and milestone reflections. This area is
            never used for matching, ranking, reveal, or org analytics.
          </p>
        </div>

        {!optInState.optedIn ? (
          <PrivacyBanner onOptIn={handleOptIn} />
        ) : (
          <>
            <Card className="border-proofound-stone/60 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <LockKeyhole className="h-4 w-4 text-proofound-forest" />
                    Private boundary
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Zen data stays private to you. It is not copied into matching, fairness, reveal,
                    org analytics, or public portfolio APIs.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        setDefaultMilestone(undefined);
                        setShowCheckInDialog(true);
                      }}
                      className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                    >
                      Record private check-in
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDefaultMilestone(undefined);
                        setShowReflectionDialog(true);
                      }}
                    >
                      Add private reflection
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:min-w-[180px]">
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={busyAction === 'export'}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {busyAction === 'export' ? 'Exporting...' : 'Export private data'}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/5"
                    onClick={handleDelete}
                    disabled={busyAction === 'delete'}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {busyAction === 'delete' ? 'Deleting...' : 'Delete private data'}
                  </Button>
                </div>
              </div>
            </Card>

            {milestones.length > 0 && (
              <Card className="border-proofound-forest/20 bg-proofound-forest/5 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <ShieldAlert className="h-4 w-4 text-proofound-forest" />
                      Private milestone prompt
                    </div>
                    <p className="text-sm text-muted-foreground">
                      A recent work-search milestone was detected. If it would help, you can add a
                      private reflection. Nothing is stored unless you submit it.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDefaultMilestone(milestones[0].type);
                      setShowReflectionDialog(true);
                    }}
                  >
                    Reflect on {milestoneLabel(milestones[0].type).toLowerCase()}
                  </Button>
                </div>
              </Card>
            )}

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Recent private entries</h2>
                <p className="text-xs text-muted-foreground">
                  {checkins.length} check-ins • {reflections.length} reflections
                </p>
              </div>
              {recentEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No entries yet. This space stays quiet until you choose to use it.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentEntries.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-border/60 p-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{entry.title}</p>
                          <p className="text-xs text-muted-foreground">{entry.subtitle}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {entry.body && (
                        <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                          {entry.body}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>

      <CheckInDialog
        open={showCheckInDialog}
        onOpenChange={setShowCheckInDialog}
        onSuccess={loadZenState}
        defaultMilestone={defaultMilestone}
      />
      <ReflectionDialog
        open={showReflectionDialog}
        onOpenChange={setShowReflectionDialog}
        onSuccess={loadZenState}
        defaultMilestone={defaultMilestone}
      />
    </AppSurface>
  );
}
