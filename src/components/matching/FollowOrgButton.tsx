'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Heart } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type FollowOrgButtonProps = {
  orgSlug: string;
  orgName?: string;
  variant?: 'icon' | 'button';
};

export function FollowOrgButton({
  orgSlug,
  orgName = 'this org',
  variant = 'button',
}: FollowOrgButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/organizations/${orgSlug}/follow`);
        if (!res.ok) throw new Error('Failed to load follow status');
        const data = await res.json();
        if (!mounted) return;
        setIsFollowing(data.following);
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStatus();
    return () => {
      mounted = false;
    };
  }, [orgSlug]);

  const toggleFollow = async () => {
    try {
      setLoading(true);
      if (isFollowing) {
        const res = await fetch(`/api/organizations/${orgSlug}/follow`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to unfollow');
        setIsFollowing(false);
        toast.success(`Unfollowed ${orgName}`);
      } else {
        const res = await fetch(`/api/organizations/${orgSlug}/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notifyNewRoles: true }),
        });
        if (!res.ok) throw new Error('Failed to follow');
        setIsFollowing(true);
        toast.success(`Following ${orgName} — you'll get alerts for new roles`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to update follow status');
    } finally {
      setLoading(false);
    }
  };

  const icon = isFollowing ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />;
  const label = isFollowing ? 'Following' : 'Follow org';

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFollow}
              disabled={loading}
              aria-label={label}
            >
              {isFollowing ? (
                <Heart className="h-4 w-4 text-rose-500" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isFollowing ? 'Unfollow organization' : 'Get alerted for new roles'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant={isFollowing ? 'secondary' : 'outline'}
      onClick={toggleFollow}
      disabled={loading}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  );
}
