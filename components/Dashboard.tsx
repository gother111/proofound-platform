"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import {
  Home,
  User,
  FolderKanban,
  Users,
  Shield,
  Briefcase,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Target,
  CheckCircle2,
  Clock,
  Building2,
  Sparkles,
  TrendingUp,
  FileCheck,
  Calendar,
  MapPin,
  MessageCircle,
} from 'lucide-react';

interface DashboardProps {
  profile: any;
  matches: any[];
  assignments: any[];
  notifications: any[];
}

type Persona = 'individual' | 'organization';

export function Dashboard({ profile, matches = [], assignments = [], notifications = [] }: DashboardProps) {
  const router = useRouter();
  const [navCollapsed, setNavCollapsed] = useState(true);
  const [showUpdateCard, setShowUpdateCard] = useState(notifications.length > 0);
  const [displayNotifications, setDisplayNotifications] = useState(notifications);
  
  const persona: Persona = profile?.account_type || 'individual';

  // Rotating "While you were away" titles
  const awayTitles = [
    "While you were away making impact",
    "While you were out doing real-world things",
    "Meanwhile, the internet was busy…"
  ];
  const [awayTitleIndex] = useState(Math.floor(Math.random() * awayTitles.length));

  const handleNotificationAction = (notification: any) => {
    if (notification.route) {
      router.push(notification.route);
    }
  };

  const handleDismissNotification = (id: string) => {
    setDisplayNotifications(displayNotifications.filter(n => n.id !== id));
    if (displayNotifications.length <= 1) {
      setShowUpdateCard(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ backgroundColor: '#F7F6F1' }}>
      {/* Top Bar */}
      <header 
        className="sticky top-0 z-50 border-b flex-shrink-0"
        style={{ 
          backgroundColor: '#FDFCFA',
          borderColor: 'rgba(232, 230, 221, 0.6)'
        }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1C4D3A] to-[#5C8B89] flex items-center justify-center">
                <span className="text-white text-xs font-semibold">P</span>
              </div>
              <span className="font-semibold text-sm" style={{ color: '#2D3330' }}>Proofound</span>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <h2 className="text-base" style={{ color: '#2D3330' }}>Dashboard</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border w-64"
              style={{ 
                backgroundColor: 'white',
                borderColor: 'rgba(232, 230, 221, 0.6)'
              }}
            >
              <Search className="w-3.5 h-3.5" style={{ color: '#6B6760' }} />
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: '#2D3330' }}
              />
            </div>

            {/* Avatar */}
            <Avatar className="w-7 h-7">
              <AvatarFallback style={{ backgroundColor: '#1C4D3A', color: '#F7F6F1', fontSize: '0.7rem' }}>
                {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Nav */}
        <aside 
          className={`border-r transition-all duration-300 flex-shrink-0 ${
            navCollapsed ? 'w-14' : 'w-52'
          }`}
          style={{ 
            backgroundColor: '#FDFCFA',
            borderColor: 'rgba(232, 230, 221, 0.6)' 
          }}
        >
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 py-3">
              <nav className="space-y-0.5 px-2">
                {[
                  { icon: Home, label: 'Dashboard', active: true, route: '/home' },
                  { icon: User, label: 'Profile', active: false, route: '/profile' },
                  { icon: Users, label: 'Matching', active: false, route: '/matches' },
                  { icon: Shield, label: 'Verifications', active: false, route: '/profile/proofs' },
                  { icon: MessageCircle, label: 'Messages', active: false, route: '/conversations' },
                  { icon: Settings, label: 'Settings', active: false, route: '/settings' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => router.push(item.route)}
                    className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg transition-colors group relative hover:bg-[#E8E6DD]/50 ${
                      item.active ? 'font-medium' : ''
                    }`}
                    style={{
                      backgroundColor: item.active ? '#1C4D3A' : 'transparent',
                      color: item.active ? '#F7F6F1' : '#2D3330',
                    }}
                    title={navCollapsed ? item.label : ''}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!navCollapsed && <span className="text-sm">{item.label}</span>}
                    
                    {/* Tooltip for collapsed state */}
                    {navCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 rounded bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {item.label}
                      </div>
                    )}
                  </button>
                ))}
              </nav>
            </ScrollArea>

            {/* Toggle Button */}
            <div className="p-2 border-t" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNavCollapsed(!navCollapsed)}
                className="w-full justify-center"
              >
                {navCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Persona Badge */}
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline"
                className="gap-1.5 px-3 py-1"
                style={{ 
                  borderColor: persona === 'individual' ? '#7A9278' : '#C76B4A',
                  color: persona === 'individual' ? '#7A9278' : '#C76B4A'
                }}
              >
                {persona === 'individual' ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                <span className="text-xs font-medium capitalize">{persona}</span>
              </Badge>
            </div>

            {/* While You Were Away Card */}
            {showUpdateCard && displayNotifications.length > 0 && (
              <Card className="relative overflow-hidden" style={{ borderColor: '#E8E6DD' }}>
                <div 
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #1C4D3A 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}
                />
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-display font-semibold mb-1" style={{ color: '#2D3330' }}>
                        {awayTitles[awayTitleIndex]}
                      </h3>
                      <p className="text-sm" style={{ color: '#6B6760' }}>
                        Here's what happened
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowUpdateCard(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {displayNotifications.slice(0, 3).map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start justify-between p-3 rounded-lg"
                        style={{ backgroundColor: '#FDFCFA' }}
                      >
                        <div className="flex-1">
                          <p className="text-sm" style={{ color: '#2D3330' }}>
                            {notification.text}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          {notification.route && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleNotificationAction(notification)}
                              className="text-xs"
                            >
                              {notification.action}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDismissNotification(notification.id)}
                            className="text-muted-foreground"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Dashboard Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Profile Completion */}
              {profile?.profile_completion_percentage < 100 && (
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5" style={{ color: '#1C4D3A' }} />
                      <h3 className="font-display font-semibold" style={{ color: '#2D3330' }}>
                        Profile Completion
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: '#6B6760' }}>Progress</span>
                      <span className="font-semibold" style={{ color: '#2D3330' }}>
                        {profile.profile_completion_percentage}%
                      </span>
                    </div>
                    <Progress value={profile.profile_completion_percentage} />
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/profile')}
                    >
                      Complete Profile
                    </Button>
                  </div>
                </Card>
              )}

              {/* Matches */}
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" style={{ color: '#7A9278' }} />
                    <h3 className="font-display font-semibold" style={{ color: '#2D3330' }}>
                      Matches
                    </h3>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-3xl font-display font-bold" style={{ color: '#1C4D3A' }}>
                    {matches.length}
                  </div>
                  <p className="text-sm" style={{ color: '#6B6760' }}>
                    New opportunities
                  </p>
                  {matches.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/matches')}
                    >
                      View Matches
                    </Button>
                  )}
                </div>
              </Card>

              {/* Verifications */}
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" style={{ color: '#5C8B89' }} />
                    <h3 className="font-display font-semibold" style={{ color: '#2D3330' }}>
                      Verifications
                    </h3>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-3xl font-display font-bold" style={{ color: '#1C4D3A' }}>
                    {profile?.proofs_count || 0}
                  </div>
                  <p className="text-sm" style={{ color: '#6B6760' }}>
                    Verified proofs
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/profile/proofs')}
                  >
                    Manage Proofs
                  </Button>
                </div>
              </Card>

              {/* Assignments (Organization only) */}
              {persona === 'organization' && (
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5" style={{ color: '#C76B4A' }} />
                      <h3 className="font-display font-semibold" style={{ color: '#2D3330' }}>
                        Assignments
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-display font-bold" style={{ color: '#1C4D3A' }}>
                      {assignments.length}
                    </div>
                    <p className="text-sm" style={{ color: '#6B6760' }}>
                      Active assignments
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/assignments/new')}
                    >
                      Post Assignment
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

