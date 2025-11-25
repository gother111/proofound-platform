'use client';

import { useState } from 'react';
import { Profile } from '@/db/schema';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  User,
  Calendar,
  MapPin,
  Briefcase,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  UserCheck,
  Loader2,
} from 'lucide-react';

interface UserDetailModalProps {
  user: Profile | null;
  open: boolean;
  onClose: () => void;
  onUserUpdated?: () => void;
}

export function UserDetailModal({ user, open, onClose, onUserUpdated }: UserDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);

  if (!user) return null;

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'super_admin':
        return 'default';
      case 'platform_admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (newRole === user.platformRole) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole === 'user' ? null : newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update role');
      }

      toast.success(`Role updated to ${newRole}`);
      onUserUpdated?.();
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSuspendUser = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspended: !user.deleted }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user status');
      }

      toast.success(user.deleted ? 'User reactivated' : 'User suspended');
      setShowSuspendDialog(false);
      onUserUpdated?.();
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user status');
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
                <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || 'User'} />
                <AvatarFallback className="bg-[#1C4D3A] text-white">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-xl">{user.displayName || 'No Name'}</span>
                {user.handle && (
                  <p className="text-sm text-muted-foreground font-normal">@{user.handle}</p>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>User profile details and account management</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Admin Actions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-sm text-amber-800 uppercase tracking-wide flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin Actions
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Role Change */}
                <div className="space-y-2">
                  <label htmlFor="role-select" className="text-sm font-medium">
                    Change Role
                  </label>
                  <Select
                    value={user.platformRole || 'user'}
                    onValueChange={handleRoleChange}
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="role-select">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="platform_admin">Platform Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Suspend/Reactivate */}
                <div className="space-y-2">
                  <label htmlFor="account-status-button" className="text-sm font-medium">
                    Account Status
                  </label>
                  <Button
                    id="account-status-button"
                    variant={user.deleted ? 'default' : 'destructive'}
                    className="w-full"
                    onClick={() => setShowSuspendDialog(true)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : user.deleted ? (
                      <UserCheck className="h-4 w-4 mr-2" />
                    ) : (
                      <Ban className="h-4 w-4 mr-2" />
                    )}
                    {user.deleted ? 'Reactivate User' : 'Suspend User'}
                  </Button>
                </div>
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
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">ID: {user.id.slice(0, 8)}...</span>
                </div>

                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={getRoleBadgeVariant(user.platformRole)}>
                    {user.platformRole || 'User'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Joined: {user.createdAt ? format(new Date(user.createdAt), 'PPP') : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Last active: {user.updatedAt ? format(new Date(user.updatedAt), 'PPP') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Profile Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Profile Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {user.headline && (
                  <div className="col-span-2 flex items-start gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{user.headline}</span>
                  </div>
                )}

                {user.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.location}</span>
                  </div>
                )}

                {user.yearsExperience !== null && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.yearsExperience} years experience</span>
                  </div>
                )}
              </div>

              {user.bio && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">{user.bio}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Account Status */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Account Status
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  {user.onboardingCompleted ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <span className="text-sm">
                    Onboarding: {user.onboardingCompleted ? 'Complete' : 'Incomplete'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {user.deleted ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className="text-sm">Status: {user.deleted ? 'Suspended' : 'Active'}</span>
                </div>

                <div className="flex items-center gap-2">
                  {user.profileVisibility === 'public' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <span className="text-sm">Visibility: {user.profileVisibility || 'private'}</span>
                </div>

                <div className="flex items-center gap-2">
                  {user.matchingEnabled ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <span className="text-sm">
                    Matching: {user.matchingEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Preferences */}
            {(user.workPreferences || user.desiredRoles) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Preferences
                  </h3>

                  {user.desiredRoles &&
                    Array.isArray(user.desiredRoles) &&
                    user.desiredRoles.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Desired Roles:</p>
                        <div className="flex flex-wrap gap-1">
                          {(user.desiredRoles as string[]).map((role) => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                  {user.workPreferences && typeof user.workPreferences === 'object' && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        {JSON.stringify(user.workPreferences, null, 2)}
                      </p>
                    </div>
                  )}
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

      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{user.deleted ? 'Reactivate User' : 'Suspend User'}</AlertDialogTitle>
            <AlertDialogDescription>
              {user.deleted
                ? `Are you sure you want to reactivate ${user.displayName || 'this user'}? They will regain access to the platform.`
                : `Are you sure you want to suspend ${user.displayName || 'this user'}? They will lose access to the platform until reactivated.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendUser}
              disabled={isUpdating}
              className={
                user.deleted
                  ? ''
                  : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              }
            >
              {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {user.deleted ? 'Reactivate' : 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
