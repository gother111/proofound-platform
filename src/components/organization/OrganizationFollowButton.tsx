'use client';

import { useEffect, useState } from 'react';
import { Bookmark, Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface OrganizationFollowButtonProps {
  slug: string;
  orgName?: string;
  initialFollowing?: boolean;
  initialNotifyNewRoles?: boolean;
  initialFollowerCount?: number;
  className?: string;
  compact?: boolean;
}

/**
 * Follow/Save control for organizations.
 * - Toggles follow/unfollow
 * - Optional alert toggle for new roles
 * - Shows follower count when available
 */
export function OrganizationFollowButton({
  slug,
  orgName,
  initialFollowing,
  initialNotifyNewRoles = true,
  initialFollowerCount = 0,
  className,
  compact = false,
}: OrganizationFollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing ?? false);
  const [notifyNewRoles, setNotifyNewRoles] = useState(initialNotifyNewRoles);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(false);

  // Load follow state on first render if not provided
  useEffect(() => {
    if (initialFollowing === undefined) {
      void fetchState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function fetchState() {
    try {
      const res = await fetch(`/api/organizations/${slug}/follow`);
      if (!res.ok) return;
      const data = await res.json();
      setFollowing(Boolean(data.following));
      setNotifyNewRoles(data.notifyNewRoles ?? true);
      if (typeof data.followerCount === 'number') {
        setFollowerCount(data.followerCount);
      }
    } catch (error) {
      console.error('Failed to load follow state', error);
    }
  }

  async function toggleFollow() {
    setLoading(true);
    try {
      if (following) {
        const res = await fetch(`/api/organizations/${slug}/follow`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Unable to unfollow');
        const data = await res.json();
        setFollowing(false);
        setFollowerCount(data.followerCount ?? 0);
        toast.success(`Unfollowed ${orgName ?? 'organization'}`);
      } else {
        const res = await fetch(`/api/organizations/${slug}/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notifyNewRoles }),
        });
        if (!res.ok) throw new Error('Unable to follow');
        const data = await res.json();
        setFollowing(true);
        setNotifyNewRoles(data.notifyNewRoles ?? true);
        setFollowerCount(data.followerCount ?? followerCount);
        toast.success(`Saved ${orgName ?? 'organization'}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Could not update follow state');
    } finally {
      setLoading(false);
    }
  }

  async function updateNotify(newValue: boolean) {
    setNotifyNewRoles(newValue);

    // If not following yet, just stage the preference locally
    if (!following) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/organizations/${slug}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifyNewRoles: newValue }),
      });

      if (!res.ok) throw new Error('Unable to update alerts');
      const data = await res.json();
      setNotifyNewRoles(data.notifyNewRoles ?? newValue);
      if (typeof data.followerCount === 'number') {
        setFollowerCount(data.followerCount);
      }
    } catch (error) {
      console.error(error);
      toast.error('Could not update alerts');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Button
        variant={following ? 'secondary' : 'default'}
        onClick={toggleFollow}
        disabled={loading}
        className={cn('gap-2', compact && 'h-9 px-3')}
      >
        {following ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        {following ? 'Following' : 'Follow'}
      </Button>

      <div className="flex items-center gap-2">
        <Switch
          id={`notify-${slug}`}
          checked={notifyNewRoles}
          onCheckedChange={(value) => void updateNotify(value)}
          disabled={loading}
        />
        <Label htmlFor={`notify-${slug}`} className="text-sm text-muted-foreground">
          Alerts for new roles
        </Label>
      </div>

      {!compact && (
        <span className="text-sm text-muted-foreground">
          {followerCount.toLocaleString()} follower{followerCount === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}
