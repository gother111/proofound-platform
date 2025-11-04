'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PartnershipCard } from './PartnershipCard';
import { PartnershipForm } from './PartnershipForm';
import { Plus, Handshake, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
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

interface OrganizationPartnership {
  id: string;
  partnerName: string;
  partnerType: 'company' | 'ngo' | 'government' | 'academic' | 'network' | 'other';
  partnershipScope: string;
  impactCreated: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'suspended';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PartnershipsManagerProps {
  orgId: string;
  canEdit?: boolean;
}

export function PartnershipsManager({ orgId, canEdit = true }: PartnershipsManagerProps) {
  const [partnerships, setPartnerships] = useState<OrganizationPartnership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPartnershipForm, setShowPartnershipForm] = useState(false);
  const [editingPartnership, setEditingPartnership] = useState<OrganizationPartnership | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchPartnerships();
  }, [orgId]);

  const fetchPartnerships = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/partnerships`);
      if (!response.ok) {
        throw new Error('Failed to fetch partnerships');
      }
      const data = await response.json();
      setPartnerships(data.partnerships || []);
    } catch (error) {
      console.error('Error fetching partnerships:', error);
      toast.error('Failed to load partnerships');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePartnership = async (partnership: Omit<OrganizationPartnership, 'id' | 'isVerified' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    try {
      const url = partnership.id
        ? `/api/organizations/${orgId}/partnerships/${partnership.id}`
        : `/api/organizations/${orgId}/partnerships`;
      
      const method = partnership.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnership),
      });

      if (!response.ok) {
        throw new Error('Failed to save partnership');
      }

      toast.success(partnership.id ? 'Partnership updated' : 'Partnership created');
      await fetchPartnerships();
      setShowPartnershipForm(false);
      setEditingPartnership(null);
    } catch (error) {
      toast.error('Failed to save partnership');
      throw error;
    }
  };

  const handleEdit = (partnership: OrganizationPartnership) => {
    setEditingPartnership(partnership);
    setShowPartnershipForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/partnerships/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete partnership');
      }

      toast.success('Partnership deleted');
      await fetchPartnerships();
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete partnership');
    }
  };

  // Filter partnerships by status and type
  const filteredPartnerships = partnerships.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType = typeFilter === 'all' || p.partnerType === typeFilter;
    return matchesStatus && matchesType;
  });

  const isEmpty = partnerships.length === 0;

  if (isLoading) {
    return (
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardContent className="p-12">
          <div className="text-center">
            <p className="text-muted-foreground">Loading partnerships...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground flex items-center gap-2">
                <Handshake className="h-5 w-5" />
                Partnerships
              </CardTitle>
              <CardDescription className="mt-1">
                Showcase collaborations with other organizations and the impact created together
              </CardDescription>
            </div>
            {canEdit && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingPartnership(null);
                  setShowPartnershipForm(true);
                }}
                className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Partnership
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isEmpty && canEdit ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-proofound-sage/10 to-proofound-forest/10 flex items-center justify-center mx-auto mb-4">
                <Handshake className="w-8 h-8 text-proofound-sage/60" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No partnerships yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Document your collaborations with other organizations to showcase ecosystem engagement
                and collective impact.
              </p>
              <Button
                onClick={() => setShowPartnershipForm(true)}
                className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Partnership
              </Button>
            </div>
          ) : isEmpty && !canEdit ? (
            <div className="text-center py-12">
              <Handshake className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No partnerships available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label htmlFor="status-filter" className="text-sm font-medium">
                    Status:
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="type-filter" className="text-sm font-medium">
                    Type:
                  </label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger id="type-filter" className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="ngo">NGO</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredPartnerships.length} of {partnerships.length} partnerships
                </div>
              </div>

              {/* Partnerships Grid */}
              {filteredPartnerships.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No partnerships match the selected filters
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredPartnerships.map((partnership) => (
                    <PartnershipCard
                      key={partnership.id}
                      partnership={partnership}
                      canEdit={canEdit}
                      onEdit={handleEdit}
                      onDelete={(id) => setDeleteConfirm(id)}
                    />
                  ))}
                </div>
              )}

              {/* Info Banner */}
              {partnerships.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-300">
                    <p className="font-medium mb-1">Partnership visibility</p>
                    <p className="text-blue-700 dark:text-blue-400">
                      Partnerships demonstrate your organization&apos;s ecosystem engagement and can help
                      build credibility with candidates.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partnership Form Dialog */}
      <PartnershipForm
        open={showPartnershipForm}
        onOpenChange={(open) => {
          setShowPartnershipForm(open);
          if (!open) setEditingPartnership(null);
        }}
        partnership={editingPartnership}
        onSave={handleSavePartnership}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this partnership?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The partnership will be permanently removed.
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
