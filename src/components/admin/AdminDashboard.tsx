'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Building2, Handshake, FileText, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminUser } from '@/lib/auth/admin';
import { AdminGrowthChart } from './analytics/AdminGrowthChart';
import { FairnessNoteDashboard } from '../analytics/FairnessNoteDashboard';

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
      const response = await fetch('/api/admin/analytics/overview');

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
          <Activity className="h-8 w-8 text-[#6B6760] animate-spin mx-auto mb-2" />
          <p className="text-[#6B6760]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B6760]">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B6760]">Total Users</p>
                <p className="text-2xl font-bold text-[#2D3330]">{overview.users.total.toLocaleString()}</p>
                <p className="text-xs text-[#9B9891] mt-1">
                  +{overview.users.thisMonth} this month
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B6760]">Organizations</p>
                <p className="text-2xl font-bold text-[#2D3330]">{overview.organizations.total.toLocaleString()}</p>
                <p className="text-xs text-[#9B9891] mt-1">
                  {overview.organizations.active} active
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B6760]">Matches</p>
                <p className="text-2xl font-bold text-[#2D3330]">{overview.matches.total.toLocaleString()}</p>
                <p className="text-xs text-[#9B9891] mt-1">
                  +{overview.matches.thisMonth} this month
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Handshake className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B6760]">Contracts Signed</p>
                <p className="text-2xl font-bold text-[#2D3330]">{overview.contracts.total.toLocaleString()}</p>
                <p className="text-xs text-[#9B9891] mt-1">
                  +{overview.contracts.thisMonth} this month
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <FileText className="h-6 w-6 text-amber-600" />
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
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E6DD]">
                <span className="text-sm text-[#6B6760]">Active Users (7d)</span>
                <span className="text-lg font-semibold text-[#2D3330]">
                  {overview.users.activeLastWeek.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E6DD]">
                <span className="text-sm text-[#6B6760]">Active Assignments</span>
                <span className="text-lg font-semibold text-[#2D3330]">
                  {overview.assignments.active.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B6760]">Conversion Rate</span>
                <span className="text-lg font-semibold text-[#2D3330]">
                  {overview.matches.total > 0
                    ? ((overview.contracts.total / overview.matches.total) * 100).toFixed(1)
                    : '0'}%
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
              <button className="w-full text-left p-3 rounded-lg border border-[#E8E6DD] hover:bg-[#F5F4F0] transition-colors">
                <p className="font-medium text-sm text-[#2D3330]">View All Users</p>
                <p className="text-xs text-[#9B9891]">Manage user accounts and permissions</p>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-[#E8E6DD] hover:bg-[#F5F4F0] transition-colors">
                <p className="font-medium text-sm text-[#2D3330]">View Organizations</p>
                <p className="text-xs text-[#9B9891]">Browse and manage organizations</p>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-[#E8E6DD] hover:bg-[#F5F4F0] transition-colors">
                <p className="font-medium text-sm text-[#2D3330]">Audit Log</p>
                <p className="text-xs text-[#9B9891]">Review admin actions and changes</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Chart */}
      <AdminGrowthChart />

      {/* Fairness Monitoring */}
      {adminUser.platformRole === 'super_admin' && (
        <div>
          <h2 className="text-xl font-semibold text-[#2D3330] mb-4">Fairness Monitoring</h2>
          <FairnessNoteDashboard />
        </div>
      )}
    </div>
  );
}
