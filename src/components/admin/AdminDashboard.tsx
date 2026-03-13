'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Users,
  Building2,
  Handshake,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdminUser } from '@/lib/auth/admin';
import { apiFetch } from '@/lib/api/fetch';
import {
  INTERNAL_OPS_HREF,
  INTERNAL_OPS_AUDIT_HREF,
  INTERNAL_OPS_VERIFICATION_HREF,
} from '@/lib/launch/surface-policy';
import { AdminGrowthChart } from './analytics/AdminGrowthChart';
import { FairnessNoteDashboard } from '../analytics/FairnessNoteDashboard';
import { MetricsDashboard } from '../metrics/MetricsDashboard';
import { safeToLocaleString, safePercentage } from '@/lib/utils/data-validation';

interface AdminDashboardProps {
  adminUser: AdminUser;
}

interface OverviewData {
  users: {
    total: number;
    thisMonth: number;
    activeLastWeek: number;
  };
  organizations: {
    total: number;
    active: number;
  };
  matches: {
    total: number;
    thisMonth: number;
  };
  contracts: {
    total: number;
    thisMonth: number;
  };
  assignments: {
    active: number;
  };
}

export function AdminDashboard({ adminUser }: AdminDashboardProps) {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      const response = await apiFetch('/api/admin/analytics/overview');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load overview');
      }

      const data = await response.json();
      setOverview(data.data);
    } catch (error) {
      console.error('Failed to load admin overview:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="h-8 w-8 text-muted-foreground animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden transition-all hover:shadow-md border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {safeToLocaleString(overview.users.total)}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-green-600 font-medium bg-green-100 px-1.5 py-0.5 rounded-full">
                    +{safeToLocaleString(overview.users.thisMonth)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">this month</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all hover:shadow-md border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Organizations</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {safeToLocaleString(overview.organizations.total)}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-muted-foreground">
                    {safeToLocaleString(overview.organizations.active)} active
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all hover:shadow-md border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Matches</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {safeToLocaleString(overview.matches.total)}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-purple-600 font-medium bg-purple-100 px-1.5 py-0.5 rounded-full">
                    +{safeToLocaleString(overview.matches.thisMonth)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">this month</span>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <Handshake className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all hover:shadow-md border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contracts Signed</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {safeToLocaleString(overview.contracts.total)}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-amber-600 font-medium bg-amber-100 px-1.5 py-0.5 rounded-full">
                    +{safeToLocaleString(overview.contracts.thisMonth)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">this month</span>
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-proofound-stone">
                <span className="text-sm text-muted-foreground">Active Users (7d)</span>
                <span className="text-lg font-semibold text-foreground">
                  {safeToLocaleString(overview.users.activeLastWeek)}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-proofound-stone">
                <span className="text-sm text-muted-foreground">Active Assignments</span>
                <span className="text-lg font-semibold text-foreground">
                  {safeToLocaleString(overview.assignments.active)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="text-lg font-semibold text-foreground">
                  {safePercentage(overview.contracts.total, overview.matches.total)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                href={INTERNAL_OPS_VERIFICATION_HREF}
                className="block w-full text-left p-3 rounded-lg border border-proofound-stone hover:bg-japandi-bg transition-colors"
              >
                <p className="font-medium text-sm text-foreground">Verification Queue</p>
                <p className="text-xs text-muted-foreground">
                  Review pending trust checks inside the launch corridor
                </p>
              </Link>
              <Link
                href={INTERNAL_OPS_AUDIT_HREF}
                className="block w-full text-left p-3 rounded-lg border border-proofound-stone hover:bg-japandi-bg transition-colors"
              >
                <p className="font-medium text-sm text-foreground">Audit Log</p>
                <p className="text-xs text-muted-foreground">
                  Review internal actions and dispute-support traces
                </p>
              </Link>
              <Link
                href={INTERNAL_OPS_HREF}
                className="block w-full text-left p-3 rounded-lg border border-proofound-stone hover:bg-japandi-bg transition-colors"
              >
                <p className="font-medium text-sm text-foreground">Internal Ops Hub</p>
                <p className="text-xs text-muted-foreground">
                  Return to the preserved launch-ops overview surface
                </p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Core Metrics Dashboard */}
      <MetricsDashboard />

      {/* Growth Chart */}
      <AdminGrowthChart />

      {/* Fairness Monitoring */}
      {adminUser.platformRole === 'super_admin' && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Fairness Monitoring</h2>
          <FairnessNoteDashboard />
        </div>
      )}
    </div>
  );
}
