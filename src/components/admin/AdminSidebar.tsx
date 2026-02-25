'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Shield,
  Activity,
  Scale,
  BadgeCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminSidebarProps {
  adminEmail?: string;
  adminRole?: string;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  mobile?: boolean;
}

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Overview & metrics',
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage users',
  },
  {
    title: 'Organizations',
    href: '/admin/organizations',
    icon: Building2,
    description: 'Manage organizations',
  },
  {
    title: 'Verification',
    href: '/admin/verification',
    icon: BadgeCheck,
    description: 'LinkedIn verification queue',
  },
  {
    title: 'Performance',
    href: '/admin/performance',
    icon: Activity,
    description: 'SLA & monitoring',
  },
  {
    title: 'Fairness',
    href: '/admin/fairness/notes',
    icon: Scale,
    description: 'Fairness notes & analysis',
  },
  {
    title: 'Audit Log',
    href: '/admin/audit',
    icon: FileText,
    description: 'Admin actions log',
  },
];

export function AdminSidebar({
  adminEmail,
  adminRole,
  collapsed = false,
  setCollapsed,
  mobile = false,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <aside
      className={cn(
        'bg-[#2D3330] text-white transition-all duration-300 flex flex-col h-full',
        mobile ? 'w-full' : 'fixed left-0 top-0 z-40 h-screen border-r border-white/10',
        !mobile && (collapsed ? 'w-16' : 'w-64')
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4 shrink-0">
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#1C4D3A] fill-current text-green-400" />
            <span className="font-semibold text-lg tracking-tight">Admin</span>
          </div>
        )}
        {!mobile && setCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-white/70 hover:text-white hover:bg-white/10 ml-auto"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-11 transition-all duration-200 group',
                active
                  ? 'bg-[#1C4D3A] text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
              title={collapsed && !mobile ? item.title : undefined}
            >
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  active ? 'text-white' : 'text-white/70 group-hover:text-white'
                )}
              />
              {(!collapsed || mobile) && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer with admin info */}
      <div className="border-t border-white/10 p-4 shrink-0">
        {!collapsed || mobile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="truncate text-sm font-medium text-white/90">
                {adminEmail || 'Admin'}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] px-1.5 py-0 h-5',
                  adminRole === 'super_admin'
                    ? 'border-purple-400 text-purple-300'
                    : 'border-blue-400 text-blue-300'
                )}
              >
                {adminRole === 'super_admin' ? 'Super' : 'Admin'}
              </Badge>
            </div>
            <Link
              href="/app/i/home"
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors min-h-11"
            >
              <LogOut className="h-4 w-4" />
              Back to App
            </Link>
          </div>
        ) : (
          <Link
            href="/app/i/home"
            className="flex justify-center text-white/70 hover:text-white transition-colors"
            title="Back to App"
          >
            <LogOut className="h-5 w-5" />
          </Link>
        )}
      </div>
    </aside>
  );
}
