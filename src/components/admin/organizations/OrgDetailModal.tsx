'use client';

import { useState } from 'react';
import { Organization } from '@/db/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Building2,
  Globe,
  Calendar,
  MapPin,
  Users,
  Briefcase,
  CheckCircle,
  XCircle,
  Target,
  Shield,
  BadgeCheck,
  Loader2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/fetch';

interface OrgDetailModalProps {
  org: Organization | null;
  open: boolean;
  onClose: () => void;
  onOrgUpdated?: () => void;
}

export function OrgDetailModal({ org, open, onClose, onOrgUpdated }: OrgDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);

  if (!org) return null;

  const getInitials = (name: string | null) => {
    if (!name) return 'O';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSizeBadge = (size: string | null) => {
    if (!size) return <Badge variant="outline">Unknown</Badge>;

    const colors: Record<string, string> = {
      '1-10': 'bg-blue-100 text-blue-800',
      '11-50': 'bg-green-100 text-green-800',
      '51-200': 'bg-purple-100 text-purple-800',
      '201-500': 'bg-orange-100 text-orange-800',
      '501-1000': 'bg-red-100 text-red-800',
      '1000+': 'bg-pink-100 text-pink-800',
    };

    return (
      <Badge variant="outline" className={colors[size] || ''}>
        {size} employees
      </Badge>
    );
  };

  const handleToggleVerification = async () => {
    setIsUpdating(true);
    try {
      const response = await apiFetch(`/api/admin/organizations/${org.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !org.verified }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update verification status');
      }

      toast.success(org.verified ? 'Verification removed' : 'Organization verified');
      setShowVerifyDialog(false);
      onOrgUpdated?.();
    } catch (error) {
      console.error('Failed to update verification:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update verification');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={org.logoUrl || undefined}
                  alt={org.displayName || 'Organization'}
                />
                <AvatarFallback className="bg-proofound-forest text-white">
                  {getInitials(org.displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-xl">{org.displayName || 'No Name'}</span>
                {org.slug && (
                  <p className="text-sm text-muted-foreground font-normal">/{org.slug}</p>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>Organization details and management</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Admin Actions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-sm text-amber-800 uppercase tracking-wide flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin Actions
              </h3>

              <div className="flex gap-4">
                {/* Verification Toggle */}
                <Button
                  variant={org.verified ? 'outline' : 'default'}
                  onClick={() => setShowVerifyDialog(true)}
                  disabled={isUpdating}
                  className={org.verified ? '' : 'bg-green-600 hover:bg-green-700'}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BadgeCheck className="h-4 w-4 mr-2" />
                  )}
                  {org.verified ? 'Remove Verification' : 'Verify Organization'}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Basic Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">ID: {org.id.slice(0, 8)}...</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {getSizeBadge(org.organizationSize)}
                </div>

                {org.industry && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{org.industry}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Created: {org.createdAt ? format(new Date(org.createdAt), 'PPP') : 'N/A'}
                  </span>
                </div>

                {Array.isArray(org.locations) && org.locations.length > 0 && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{org.locations.filter(Boolean).join(', ')}</span>
                  </div>
                )}

                {org.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate"
                    >
                      {org.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {org.tagline && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm italic text-muted-foreground">{org.tagline}</p>
              </div>
            )}

            <Separator />

            {/* Mission & Vision */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                About
              </h3>

              {org.mission && (
                <div className="bg-proofound-success-tint p-3 rounded-lg border border-proofound-forest/20">
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-proofound-forest mt-0.5" />
                    <div>
                      <p className="text-xs text-proofound-forest font-medium mb-1">Mission</p>
                      <p className="text-sm">{org.mission}</p>
                    </div>
                  </div>
                </div>
              )}

              {org.vision && (
                <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Vision</p>
                  <p className="text-sm">{org.vision}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Status & Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Status & Settings
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  {org.verified ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <span className="text-sm">Verified: {org.verified ? 'Yes' : 'No'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Type: {org.type ?? 'N/A'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Legal Name: {org.legalName || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Values & Culture */}
            {Array.isArray(org.values) && org.values.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Core Values
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {org.values.map((value, index) => {
                      const label =
                        typeof value === 'string'
                          ? value
                          : value && typeof value === 'object' && 'label' in value
                            ? String((value as any).label)
                            : null;

                      if (!label) return null;

                      return (
                        <Badge key={index} variant="outline" className="text-xs">
                          {label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Confirmation Dialog */}
      <AlertDialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {org.verified ? 'Remove Verification' : 'Verify Organization'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {org.verified
                ? `Are you sure you want to remove the verification badge from ${org.displayName}? This will indicate the organization is no longer verified.`
                : `Are you sure you want to verify ${org.displayName}? This will add a verification badge indicating the organization has been reviewed.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleVerification}
              disabled={isUpdating}
              className={
                org.verified
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-green-600 hover:bg-green-700'
              }
            >
              {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {org.verified ? 'Remove Verification' : 'Verify'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
