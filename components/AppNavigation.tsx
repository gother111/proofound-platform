"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  Home,
  Users,
  UserCircle,
  MessageSquare,
  Briefcase,
  ShieldCheck,
  Heart,
  Settings,
  LogOut,
  Menu,
  X,
  Building2
} from 'lucide-react';

interface AppNavigationProps {
  user: any; // Supabase user
  profile: any; // User profile
}

export function AppNavigation({ user, profile }: AppNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Don't show navigation on auth pages or landing page
  const hideNav = pathname === '/' || pathname?.startsWith('/login') || pathname?.startsWith('/signup') || pathname?.startsWith('/verify');
  
  if (hideNav || !user) {
    return null;
  }

  const isOrganization = profile?.account_type === 'organization';

  const mainNavigation = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Matches', href: '/matches', icon: Users },
    { name: 'Messages', href: '/conversations', icon: MessageSquare },
    { name: 'Profile', href: '/profile', icon: UserCircle },
  ];

  const secondaryNavigation = [
    ...(isOrganization ? [
      { name: 'Organization', href: '/organization', icon: Building2 },
      { name: 'Assignments', href: '/assignments/new', icon: Briefcase },
    ] : [
      { name: 'Expertise Atlas', href: '/expertise', icon: ShieldCheck },
      { name: 'Proofs', href: '/profile/proofs', icon: ShieldCheck },
    ]),
    { name: 'Zen Hub', href: '/zen', icon: Heart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ backgroundColor: '#FDFCFA', borderColor: '#E8E6DD' }}>
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1C4D3A' }}>
              <span className="text-white font-display font-bold text-lg">P</span>
            </div>
            <span className="font-display font-semibold text-xl hidden sm:inline" style={{ color: '#2D3330' }}>
              Proofound
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#1C4D3A] text-white"
                      : "text-[#6B6760] hover:bg-[#E8E6DD] hover:text-[#2D3330]"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Secondary Nav (Desktop) */}
            <div className="hidden lg:flex items-center gap-1">
              {secondaryNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname?.startsWith(item.href);
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive
                        ? "text-[#1C4D3A] bg-[#1C4D3A10]"
                        : "text-[#6B6760] hover:bg-[#E8E6DD]"
                    )}
                    title={item.name}
                  >
                    <Icon className="w-4 h-4" />
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="hidden md:flex items-center gap-3 pl-3 border-l" style={{ borderColor: '#E8E6DD' }}>
              <Link href="/profile" className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback style={{ backgroundColor: '#7A9278', color: 'white' }}>
                    {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden lg:inline" style={{ color: '#2D3330' }}>
                  {profile?.full_name || 'User'}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-[#6B6760] hover:text-[#2D3330]"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t" style={{ backgroundColor: '#FDFCFA', borderColor: '#E8E6DD' }}>
          <div className="px-6 py-4 space-y-2">
            {/* Main Navigation */}
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#1C4D3A] text-white"
                      : "text-[#6B6760] hover:bg-[#E8E6DD]"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="h-px my-3" style={{ backgroundColor: '#E8E6DD' }} />

            {/* Secondary Navigation */}
            {secondaryNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                    isActive
                      ? "text-[#1C4D3A] bg-[#1C4D3A10]"
                      : "text-[#6B6760] hover:bg-[#E8E6DD]"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="h-px my-3" style={{ backgroundColor: '#E8E6DD' }} />

            {/* User Info */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback style={{ backgroundColor: '#7A9278', color: 'white' }}>
                    {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#2D3330' }}>
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs" style={{ color: '#6B6760' }}>
                    {profile?.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  handleSignOut();
                  setIsMobileMenuOpen(false);
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

