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
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Organization } from '@/db/schema';
import { OrgDetailModal } from './OrgDetailModal';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';

interface OrgsResponse {
  organizations: Organization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function OrganizationsTable() {
  const [data, setData] = useState<OrgsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: debouncedSearch,
      });
      const res = await apiFetch(`/api/admin/organizations?${params}`);

      if (!res.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const handleViewOrg = (org: Organization) => {
    setSelectedOrg(org);
    setModalOpen(true);
  };

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
    if (!size) return <Badge variant="outline">N/A</Badge>;
    return <Badge variant="secondary">{size}</Badge>;
  };

  const getVerificationBadge = (org: Organization) => {
    // TODO: Add verification status to organization schema
    /*
    if (org.verified) {
      return (
        <Badge className="bg-green-600 hover:bg-green-700 gap-1">
          <CheckCircle className="h-3 w-3" />
          Verified
        </Badge>
      );
    }
    */
    return (
      <Badge variant="outline" className="gap-1">
        <XCircle className="h-3 w-3" />
        Unverified
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchOrgs} disabled={loading}>
            <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">Organization</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  Loading organizations...
                </TableCell>
              </TableRow>
            ) : data?.organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              data?.organizations.map((org) => (
                <TableRow key={org.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={org.logoUrl || undefined}
                          alt={org.displayName || 'Organization'}
                        />
                        <AvatarFallback className="bg-[#1C4D3A] text-white text-xs">
                          {getInitials(org.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{org.displayName || 'No Name'}</p>
                        <p className="text-sm text-muted-foreground truncate">/{org.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {org.industry ? (
                      <Badge variant="outline">{org.industry}</Badge>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{getSizeBadge(org.organizationSize)}</TableCell>
                  <TableCell>{getVerificationBadge(org)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {org.createdAt ? format(new Date(org.createdAt), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewOrg(org)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {org.website && (
                          <DropdownMenuItem onClick={() => window.open(org.website!, '_blank')}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit Website
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(org.id);
                            toast.success('Organization ID copied to clipboard');
                          }}
                        >
                          Copy Org ID
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
            {data.pagination.total} organizations
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

      {/* Organization Detail Modal */}
      <OrgDetailModal
        org={selectedOrg}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onOrgUpdated={() => {
          fetchOrgs();
          setModalOpen(false);
        }}
      />
    </div>
  );
}
