'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, ChevronLeft, ChevronRight, Loader2, Eye, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Profile } from '@/db/schema';
import { UserDetailModal } from './UserDetailModal';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';

type AdminProfile = Profile & {
  onboardingCompleted?: boolean | null;
  profileVisibility?: string | null;
  matchingEnabled?: boolean | null;
};

interface UsersResponse {
  users: AdminProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function UsersTable() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search change
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: debouncedSearch,
      });
      const res = await apiFetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleViewUser = (user: AdminProfile) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-purple-600 hover:bg-purple-700">Super Admin</Badge>;
      case 'platform_admin':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Platform Admin</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  const getStatusBadge = (user: AdminProfile) => {
    if (user.deleted) {
      return <Badge variant="destructive">Deleted</Badge>;
    }
    if (!user.onboardingCompleted) {
      return <Badge variant="secondary">Pending</Badge>;
    }
    return <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  Loading users...
                </TableCell>
              </TableRow>
            ) : data?.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              data?.users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={user.avatarUrl || undefined}
                          alt={user.displayName || 'User'}
                        />
                        <AvatarFallback className="bg-[#1C4D3A] text-white text-xs">
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{user.displayName || 'No Name'}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.handle ? `@${user.handle}` : user.id.slice(0, 8) + '...'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.platformRole)}</TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewUser(user)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(user.id);
                            toast.success('User ID copied to clipboard');
                          }}
                        >
                          Copy User ID
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{' '}
            {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
            {data.pagination.total} users
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm text-muted-foreground px-2">
              Page {page} of {data.pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page >= data.pagination.totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUserUpdated={() => {
          fetchUsers();
          setModalOpen(false);
        }}
      />
    </div>
  );
}
