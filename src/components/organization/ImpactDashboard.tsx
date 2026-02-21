'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImpactEntryForm } from './ImpactEntryForm';
import { ImpactMetricsChart } from './ImpactMetricsChart';
import { EvidencePackGenerator } from './EvidencePackGenerator';
import { Plus, Target, BarChart3, FileText, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ImpactMetric {
  name: string;
  value: string;
  unit: string;
}

interface ImpactEntry {
  id?: string;
  title: string;
  description: string;
  metrics: ImpactMetric[];
  beneficiaries?: string;
  timeframe: string;
  artifacts?: string[];
  createdAt?: string;
}

interface ImpactDashboardProps {
  orgId: string;
  orgName: string;
  canEdit?: boolean;
}

export function ImpactDashboard({ orgId, orgName, canEdit = true }: ImpactDashboardProps) {
  const [entries, setEntries] = useState<ImpactEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ImpactEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchImpactEntries = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/organizations/${orgId}/impact`);
      if (!response.ok) {
        throw new Error('Failed to fetch impact entries');
      }
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Error fetching impact:', error);
      toast.error('Failed to load impact entries');
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchImpactEntries();
  }, [fetchImpactEntries]);

  const handleSaveEntry = async (entry: ImpactEntry) => {
    try {
      const url = entry.id
        ? `/api/organizations/${orgId}/impact/${entry.id}`
        : `/api/organizations/${orgId}/impact`;

      const method = entry.id ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error('Failed to save entry');
      }

      toast.success(entry.id ? 'Impact entry updated' : 'Impact entry created');
      await fetchImpactEntries();
      setShowEntryForm(false);
      setEditingEntry(null);
    } catch (error) {
      toast.error('Failed to save impact entry');
      throw error;
    }
  };

  const handleEdit = (entry: ImpactEntry) => {
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiFetch(`/api/organizations/${orgId}/impact/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      toast.success('Impact entry deleted');
      await fetchImpactEntries();
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete impact entry');
    }
  };

  const isEmpty = entries.length === 0;

  if (isLoading) {
    return (
      <Card className="border-black/5 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-12">
          <div className="text-center">
            <p className="text-muted-foreground">Loading impact data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-black/5 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground flex items-center gap-2">
                <Target className="h-5 w-5" />
                Impact Dashboard
              </CardTitle>
              <CardDescription className="mt-1">
                Track and showcase your organization&apos;s measurable impact
              </CardDescription>
            </div>
            {canEdit && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingEntry(null);
                  setShowEntryForm(true);
                }}
                className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Impact
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isEmpty && canEdit ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-proofound-forest/10 to-proofound-sage/10 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-proofound-forest/60" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No impact entries yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Start documenting your organization&apos;s impact by adding measurable outcomes,
                metrics, and success stories.
              </p>
              <Button
                onClick={() => setShowEntryForm(true)}
                className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Impact Entry
              </Button>
            </div>
          ) : isEmpty && !canEdit ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No impact data available</p>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                <TabsTrigger value="overview">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="entries">
                  <Target className="h-4 w-4 mr-2" />
                  Entries
                </TabsTrigger>
                <TabsTrigger value="export">
                  <FileText className="h-4 w-4 mr-2" />
                  Export
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <ImpactMetricsChart entries={entries} />
              </TabsContent>

              <TabsContent value="entries" className="mt-0 space-y-4">
                {entries.map((entry) => (
                  <Card
                    key={entry.id}
                    className="border-proofound-stone dark:border-border hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{entry.title}</CardTitle>
                          <CardDescription className="mt-1">{entry.timeframe}</CardDescription>
                        </div>
                        {canEdit && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(entry)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => entry.id && setDeleteConfirm(entry.id)}
                                className="text-red-600 focus:text-red-600"
                                disabled={!entry.id}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm">{entry.description}</p>
                      {entry.beneficiaries && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Beneficiaries:</strong> {entry.beneficiaries}
                        </p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {entry.metrics.map((metric, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-muted/30 border border-muted-foreground/10"
                          >
                            <p className="text-xs text-muted-foreground mb-1">{metric.name}</p>
                            <p className="text-lg font-bold">
                              {metric.value}{' '}
                              <span className="text-sm font-normal">{metric.unit}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="export" className="mt-0">
                <EvidencePackGenerator
                  orgId={orgId}
                  orgName={orgName}
                  hasImpactData={entries.length > 0}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Entry Form Dialog */}
      <ImpactEntryForm
        open={showEntryForm}
        onOpenChange={(open) => {
          setShowEntryForm(open);
          if (!open) setEditingEntry(null);
        }}
        entry={editingEntry}
        onSave={handleSaveEntry}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this impact entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The entry will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
