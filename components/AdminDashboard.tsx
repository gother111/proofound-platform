"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  BarChart3,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Search,
  Download,
  Activity,
  Eye,
  FileText,
  Clock,
  Ban,
  ShieldAlert,
  RefreshCw,
  MoreVertical
} from 'lucide-react';

type AdminView = 'overview' | 'moderation' | 'analytics' | 'users';

interface AdminDashboardProps {
  reports: any[];
  stats: {
    totalUsers: number;
    totalReports: number;
    pendingReports: number;
    totalMatches: number;
  };
}

export function AdminDashboard({ reports, stats }: AdminDashboardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [currentView, setCurrentView] = useState<AdminView>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter reports by search
  const filteredReports = reports.filter(report => {
    const searchLower = searchQuery.toLowerCase();
    return (
      report.reason?.toLowerCase().includes(searchLower) ||
      report.reporter?.full_name?.toLowerCase().includes(searchLower) ||
      report.reported_content_type?.toLowerCase().includes(searchLower)
    );
  });

  const handleModerateReport = async (reportId: string, action: 'approve' | 'reject') => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          moderation_status: action === 'approve' ? 'resolved' : 'dismissed',
          moderated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;
      
      // Refresh the page
      router.refresh();
    } catch (error) {
      console.error('Error moderating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'moderation', label: 'Moderation Queue', icon: Eye },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      {/* Admin Header */}
      <header 
        className="sticky top-0 z-50 border-b"
        style={{ 
          backgroundColor: '#FDFCFA',
          borderColor: 'rgba(232, 230, 221, 0.6)'
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1C4D3A' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-semibold" style={{ color: '#2D3330' }}>
                Admin Dashboard
              </h1>
              <p className="text-xs" style={{ color: '#6B6760' }}>
                Platform Control Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.refresh()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" style={{ backgroundColor: '#1C4D3A', color: 'white' }}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <Card className="mb-6">
          <div className="flex gap-1 p-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentView(id as AdminView)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm transition-all ${
                  currentView === id
                    ? 'bg-[#1C4D3A] text-white'
                    : 'text-[#6B6760] hover:bg-[#E8E6DD]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Overview */}
        {currentView === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-[#7A9278]/10">
                    <Users className="w-5 h-5" style={{ color: '#7A9278' }} />
                  </div>
                  <span className="text-sm" style={{ color: '#6B6760' }}>Total Users</span>
                </div>
                <div className="text-3xl font-display font-bold" style={{ color: '#2D3330' }}>
                  {stats.totalUsers.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: '#7A9278' }}>
                  <TrendingUp className="w-3 h-3" />
                  <span>+12% this month</span>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-[#5C8B89]/10">
                    <Activity className="w-5 h-5" style={{ color: '#5C8B89' }} />
                  </div>
                  <span className="text-sm" style={{ color: '#6B6760' }}>Total Matches</span>
                </div>
                <div className="text-3xl font-display font-bold" style={{ color: '#2D3330' }}>
                  {stats.totalMatches.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: '#5C8B89' }}>
                  <TrendingUp className="w-3 h-3" />
                  <span>+8% this week</span>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-[#C76B4A]/10">
                    <ShieldAlert className="w-5 h-5" style={{ color: '#C76B4A' }} />
                  </div>
                  <span className="text-sm" style={{ color: '#6B6760' }}>Pending Reports</span>
                </div>
                <div className="text-3xl font-display font-bold" style={{ color: '#2D3330' }}>
                  {stats.pendingReports}
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: '#C76B4A' }}>
                  <AlertTriangle className="w-3 h-3" />
                  <span>Needs attention</span>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-[#D4A574]/10">
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#D4A574' }} />
                  </div>
                  <span className="text-sm" style={{ color: '#6B6760' }}>Total Reports</span>
                </div>
                <div className="text-3xl font-display font-bold" style={{ color: '#2D3330' }}>
                  {stats.totalReports}
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: '#6B6760' }}>
                  <Clock className="w-3 h-3" />
                  <span>All time</span>
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <h2 className="text-xl font-display font-semibold mb-4" style={{ color: '#2D3330' }}>
                Recent Activity
              </h2>
              <div className="space-y-3">
                {reports.slice(0, 5).map((report, index) => (
                  <div key={report.id || index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F7F6F1' }}>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-[#7A9278] text-white text-xs">
                          {report.reporter?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#2D3330' }}>
                          {report.reporter?.full_name || 'User'} reported {report.reported_content_type}
                        </p>
                        <p className="text-xs" style={{ color: '#6B6760' }}>
                          {new Date(report.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {report.moderation_status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Moderation Queue */}
        {currentView === 'moderation' && (
          <div className="space-y-6">
            {/* Search */}
            <Card className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6760' }} />
                <Input
                  placeholder="Search reports by reason, reporter, or content type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </Card>

            {/* Reports List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-semibold" style={{ color: '#2D3330' }}>
                  Moderation Queue
                </h2>
                <Badge variant="outline" className="text-sm">
                  {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
                </Badge>
              </div>

              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <Card key={report.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-[#C76B4A] text-white">
                            {report.reporter?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold mb-1" style={{ color: '#2D3330' }}>
                            Report from {report.reporter?.full_name || 'Unknown User'}
                          </h3>
                          <p className="text-sm mb-2" style={{ color: '#6B6760' }}>
                            {new Date(report.created_at).toLocaleString()}
                          </p>
                          <div className="flex gap-2 mb-3">
                            <Badge variant="outline">{report.reported_content_type}</Badge>
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: report.moderation_status === 'pending' ? '#C76B4A' : '#7A9278',
                                color: report.moderation_status === 'pending' ? '#C76B4A' : '#7A9278'
                              }}
                            >
                              {report.moderation_status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold mb-1" style={{ color: '#2D3330' }}>
                          Reason
                        </h4>
                        <p className="text-sm" style={{ color: '#6B6760' }}>
                          {report.reason || 'No reason provided'}
                        </p>
                      </div>

                      {report.details && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1" style={{ color: '#2D3330' }}>
                            Details
                          </h4>
                          <p className="text-sm" style={{ color: '#6B6760' }}>
                            {report.details}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-semibold mb-1" style={{ color: '#2D3330' }}>
                          Reported Content ID
                        </h4>
                        <p className="text-sm font-mono" style={{ color: '#6B6760' }}>
                          {report.reported_content_id}
                        </p>
                      </div>
                    </div>

                    {report.moderation_status === 'pending' && (
                      <>
                        <Separator className="my-4" />
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleModerateReport(report.id, 'approve')}
                            disabled={isLoading}
                            className="bg-[#1C4D3A] hover:bg-[#1C4D3A]/90 text-white"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Take Action
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleModerateReport(report.id, 'reject')}
                            disabled={isLoading}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Dismiss
                          </Button>
                          <Button variant="ghost">
                            <Eye className="w-4 h-4 mr-2" />
                            View Content
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                ))
              ) : (
                <Card className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#E8E6DD' }} />
                  <h3 className="text-xl font-display font-semibold mb-2" style={{ color: '#2D3330' }}>
                    All Clear!
                  </h3>
                  <p className="text-sm" style={{ color: '#6B6760' }}>
                    {searchQuery 
                      ? 'No reports match your search'
                      : 'No reports to review at this time'}
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Analytics & Users (Placeholder) */}
        {(currentView === 'analytics' || currentView === 'users') && (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: '#E8E6DD' }} />
            <h3 className="text-xl font-display font-semibold mb-2" style={{ color: '#2D3330' }}>
              Coming Soon
            </h3>
            <p className="text-sm" style={{ color: '#6B6760' }}>
              {currentView === 'analytics' ? 'Advanced analytics' : 'User management'} features are under development
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

