'use client';

/**
 * TeamRolesCard Widget
 *
 * Displays organization team members with roles
 * Part of the org dashboard (PRD O8)
 *
 * Features:
 * - Shows team members with avatars and roles
 * - Role badges with icons
 * - Quick stats summary
 * - Invite new members action
 */

import { Users, Crown, Shield, User, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/fetch';
import { ORG_ROLE_LABELS } from '@/lib/authz';
import Link from 'next/link';

interface TeamRolesCardProps {
  orgSlug?: string;
  orgId?: string;
  canManageSettings?: boolean;
  initialData?: any;
  onVisibilityChange?: (visible: boolean) => void;
}

// Type definitions
interface TeamMember {
  userId: string;
  role: 'org_owner' | 'org_manager' | 'org_reviewer';
  status: string;
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

interface TeamStats {
  total: number;
  byRole: {
    org_owner: number;
    org_manager: number;
    org_reviewer: number;
  };
}

// Role configuration
const roleConfig = {
  org_owner: { label: ORG_ROLE_LABELS.org_owner, icon: Crown, color: '#F59E0B', bg: '#FEF3C7' },
  org_manager: {
    label: ORG_ROLE_LABELS.org_manager,
    icon: Shield,
    color: '#1C4D3A',
    bg: '#D8EDE4',
  },
  org_reviewer: {
    label: ORG_ROLE_LABELS.org_reviewer,
    icon: User,
    color: '#3B82F6',
    bg: '#DBEAFE',
  },
};

// Get initials from name
function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function TeamRolesCard({
  orgSlug,
  orgId,
  canManageSettings = false,
  initialData,
  onVisibilityChange,
}: TeamRolesCardProps) {
  const [members, setMembers] = useState<TeamMember[]>(() => {
    if (initialData?.members) return initialData.members.slice(0, 5);
    return [];
  });
  const [stats, setStats] = useState<TeamStats | null>(initialData?.stats || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch team members from API
  useEffect(() => {
    if (initialData) {
      setMembers((initialData.members || []).slice(0, 5));
      setStats(initialData.stats);
      setIsLoading(false);
      return;
    }

    async function fetchTeam() {
      if (!orgId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await apiFetch(`/api/organizations/${orgId}/team`);

        if (!response.ok) {
          throw new Error('Failed to fetch team');
        }

        const data = await response.json();
        setMembers((data.members || []).slice(0, 5)); // Show top 5 members
        setStats(data.stats);
      } catch (err) {
        console.error('Error fetching team:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeam();
  }, [orgId, initialData]);

  useEffect(() => {
    if (isLoading) return;
    if (!orgId) {
      onVisibilityChange?.(true);
      return;
    }

    const hasVisibleContent = error ? true : members.length > 0;
    onVisibilityChange?.(hasVisibleContent);
  }, [error, isLoading, members.length, onVisibilityChange, orgId]);

  // If no orgId provided, show individual placeholder
  if (!orgId) {
    return (
      <Card variant="bento" className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Team
          </h5>
        </div>
        <div className="text-center py-6">
          <Users className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
          <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
            Build your team.
          </p>
          <Button
            size="sm"
            className="h-7 text-xs"
            style={{
              backgroundColor: isHovered ? '#2D5F4A' : '#1C4D3A',
              color: '#F7F6F1',
              transition: 'background-color 200ms',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            Add members
          </Button>
        </div>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card variant="bento" className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Team
          </h5>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1C4D3A' }} />
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card variant="bento" className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Team
          </h5>
        </div>
        <div className="text-center py-4">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#DC2626' }} />
          <p className="text-xs" style={{ color: '#6B6760' }}>
            {error}
          </p>
        </div>
      </Card>
    );
  }

  // Empty state
  if (members.length === 0) {
    return (
      <Card variant="bento" className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Team
          </h5>
        </div>
        <div className="text-center py-6">
          <Users className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
          <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
            Add team members to collaborate on your organization.
          </p>
          <Link
            href={canManageSettings ? `/app/o/${orgSlug}/settings/team` : `/app/o/${orgSlug}/team`}
          >
            <Button
              size="sm"
              className="h-7 text-xs"
              style={{
                backgroundColor: isHovered ? '#2D5F4A' : '#1C4D3A',
                color: '#F7F6F1',
                transition: 'background-color 200ms',
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <UserPlus className="w-3 h-3 mr-1" />
              {canManageSettings ? 'Invite members' : 'View team'}
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Team list view
  return (
    <Card variant="bento" className="p-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Team
          </h5>
          {stats && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: '#D8EDE4', color: '#1C4D3A' }}
            >
              {stats.total} members
            </span>
          )}
        </div>
        <Link
          href={canManageSettings ? `/app/o/${orgSlug}/settings/team` : `/app/o/${orgSlug}/team`}
          className="text-xs hover:underline"
          style={{ color: '#1C4D3A' }}
        >
          {canManageSettings ? 'Manage' : 'View'}
        </Link>
      </div>

      {/* Members list */}
      <div className="space-y-2.5">
        {members.map((member) => {
          const config = roleConfig[member.role];
          const RoleIcon = config.icon;

          return (
            <div key={member.userId} className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={member.avatarUrl || undefined} alt={member.displayName || ''} />
                <AvatarFallback
                  style={{ backgroundColor: '#E8E6DD', color: '#2D3330', fontSize: '11px' }}
                >
                  {getInitials(member.displayName || member.handle)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#2D3330' }}>
                  {member.displayName || member.handle || 'Unnamed'}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 flex-shrink-0 flex items-center gap-1"
                style={{ backgroundColor: config.bg, color: config.color }}
              >
                <RoleIcon className="w-2.5 h-2.5" />
                {config.label}
              </Badge>
            </div>
          );
        })}
      </div>

      {/* Footer with stats */}
      {stats && (
        <div
          className="mt-4 pt-3 border-t flex items-center justify-between"
          style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
        >
          <div className="flex items-center gap-2">
            {/* Avatar stack for remaining members */}
            {stats.total > 5 && (
              <span className="text-xs" style={{ color: '#6B6760' }}>
                +{stats.total - 5} more
              </span>
            )}
          </div>
          {canManageSettings && (
            <Link href={`/app/o/${orgSlug}/settings/team`}>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                style={{ color: '#1C4D3A' }}
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Invite
              </Button>
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
