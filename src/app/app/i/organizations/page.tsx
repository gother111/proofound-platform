'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Search, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OrganizationFollowButton } from '@/components/organization/OrganizationFollowButton';
import { cn } from '@/lib/utils';

type OrgRecord = {
  id: string;
  slug: string;
  displayName: string;
  tagline?: string | null;
  logoUrl?: string | null;
  industry?: string | null;
  impactArea?: string | null;
  causes?: string[] | null;
  values?: Record<string, any> | null;
};

type FollowedOrg = OrgRecord & { notifyNewRoles: boolean };

export const dynamic = 'force-dynamic';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrgRecord[]>([]);
  const [following, setFollowing] = useState<FollowedOrg[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [orgRes, followRes] = await Promise.all([
        fetch('/api/organizations', { cache: 'no-store' }),
        fetch('/api/organizations/following', { cache: 'no-store' }),
      ]);

      if (orgRes.ok) {
        const data = await orgRes.json();
        const mapped: OrgRecord[] = (data.organizations || []).map((org: any) => ({
          id: org.id,
          slug: org.slug,
          displayName: org.display_name,
          tagline: org.tagline,
          logoUrl: org.logo_url,
          industry: org.industry,
          impactArea: org.impact_area,
          causes: org.causes,
          values: org.values,
        }));
        setOrganizations(mapped);
      }

      if (followRes.ok) {
        const data = await followRes.json();
        const mapped: FollowedOrg[] = (data.items || []).map((item: any) => ({
          id: item.orgId,
          slug: item.slug,
          displayName: item.displayName,
          tagline: item.tagline,
          logoUrl: item.logoUrl,
          industry: item.industry,
          impactArea: item.impactArea,
          causes: item.causes,
          values: item.values,
          notifyNewRoles: item.notifyNewRoles,
        }));
        setFollowing(mapped);
      }
    } finally {
      setLoading(false);
    }
  }

  const followedSlugSet = useMemo(() => new Set(following.map((org) => org.slug)), [following]);

  const filtered = useMemo(() => {
    const list = activeTab === 'all' ? organizations : following;
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((org) => {
      return (
        org.displayName.toLowerCase().includes(term) ||
        org.tagline?.toLowerCase().includes(term) ||
        org.industry?.toLowerCase().includes(term) ||
        org.impactArea?.toLowerCase().includes(term) ||
        (org.causes || []).some((c) => c.toLowerCase().includes(term))
      );
    });
  }, [activeTab, organizations, following, search]);

  return (
    <div className="p-6 space-y-6 bg-[#F7F6F1] min-h-screen">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#2D3330]">Organizations</h1>
          <p className="text-sm text-[#6B6760]">
            Follow organizations to get alerts when they post new assignments and track their
            values.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'all' ? 'default' : 'secondary'}
            onClick={() => setActiveTab('all')}
          >
            Browse all
          </Button>
          <Button
            variant={activeTab === 'saved' ? 'default' : 'secondary'}
            onClick={() => setActiveTab('saved')}
          >
            Saved
            <Badge variant="secondary" className="ml-2">
              {following.length}
            </Badge>
          </Button>
        </div>
      </header>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#6B6760]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mission, industry, or cause"
            className="pl-9 bg-white"
          />
        </div>
        <Button variant="ghost" onClick={() => void loadData()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-36 animate-pulse bg-white" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center bg-white">
          <Sparkles className="w-8 h-8 mx-auto text-[#6B6760]" />
          <p className="mt-3 text-[#2D3330] font-medium">No organizations match your search</p>
          <p className="text-sm text-[#6B6760]">Try a different keyword or clear the filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((org) => (
            <Card key={org.id} className="p-5 bg-white space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={org.logoUrl || undefined} alt={org.displayName} />
                  <AvatarFallback className="bg-[#1C4D3A] text-white text-sm">
                    {org.displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Link href={`/app/i/organizations/${org.slug}`} className="hover:underline">
                    <p className="font-semibold text-[#2D3330] truncate">{org.displayName}</p>
                  </Link>
                  {org.tagline && (
                    <p className="text-sm text-[#6B6760] line-clamp-2">{org.tagline}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {org.industry && <Badge variant="outline">{org.industry}</Badge>}
                    {org.impactArea && (
                      <Badge variant="secondary" className="bg-[#EEF1EA] text-[#1C4D3A]">
                        {org.impactArea}
                      </Badge>
                    )}
                    {(org.causes || []).slice(0, 2).map((cause) => (
                      <Badge key={cause} variant="outline" className="text-xs">
                        {cause}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <OrganizationFollowButton
                  slug={org.slug}
                  orgName={org.displayName}
                  initialFollowing={followedSlugSet.has(org.slug)}
                  initialNotifyNewRoles={
                    following.find((f) => f.slug === org.slug)?.notifyNewRoles ?? true
                  }
                  className="flex-1"
                  compact
                />
                <Link href={`/app/i/organizations/${org.slug}`}>
                  <Button variant="outline" className="gap-2">
                    <Building2 className="w-4 h-4" />
                    View profile
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
