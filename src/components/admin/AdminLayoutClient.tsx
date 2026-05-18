'use client';

import { useState, ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { cn } from '@/lib/utils';
import type { AdminUser } from '@/lib/auth/admin';

interface AdminLayoutClientProps {
  children: ReactNode;
  adminUser: AdminUser;
}

export function AdminLayoutClient({ children, adminUser }: AdminLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-japandi-bg">
      {/* Desktop admin navigation */}
      <div className="hidden md:block">
        <AdminSidebar
          adminEmail={adminUser.email}
          adminRole={adminUser.platformRole || undefined}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>

      {/* Main Content Wrapper */}
      <div
        className={cn(
          'transition-all duration-300 min-h-screen flex flex-col',
          collapsed ? 'pl-16' : 'pl-0 md:pl-64'
        )}
      >
        <AdminHeader adminEmail={adminUser.email} adminRole={adminUser.platformRole || undefined} />

        <main className="flex-1 px-4 py-5 sm:px-5 md:px-6">{children}</main>
      </div>
    </div>
  );
}
